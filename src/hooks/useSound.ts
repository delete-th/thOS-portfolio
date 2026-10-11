"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  isMuted,
  playSound,
  setMuted,
  stopSound,
  subscribeToMute,
} from "@/lib/sound-manager";
import type { WindowState } from "@/types/window";

function toggleMute() {
  const next = !isMuted();
  setMuted(next);
  // useUiClickSounds' listener already fired for this click while
  // still muted, so unmuting would otherwise be the one silent button.
  if (!next) playSound("click");
}

// Never muted on the server/first paint — matches the client's initial
// state, so no hydration mismatch.
function getServerMuted() {
  return false;
}

/**
 * Sound playback + the shared mute flag. The state lives in
 * lib/sound-manager.ts, not in whichever component calls this, so the
 * system tray's toggle and every `play()` call anywhere in the tree
 * stay in sync without threading props between them.
 */
export function useSound() {
  const muted = useSyncExternalStore(subscribeToMute, isMuted, getServerMuted);
  return { isMuted: muted, toggleMute, play: playSound, stop: stopSound };
}

const CLICKABLE_SELECTOR = "button:not(:disabled), a, [role='button']";
// For the rare button that makes its own noises and shouldn't click as
// well (the desktop assistant: a "click" fires when he's let go of).
const SILENT_SELECTOR = "[data-no-click-sound]";

/**
 * Plays the UI click for every button/link press, from one document
 * listener instead of a `play("click")` in each component's handler —
 * new buttons get the sound for free.
 */
export function useUiClickSounds() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const clicked = e.target.closest(CLICKABLE_SELECTOR);
      if (clicked && !clicked.matches(SILENT_SELECTOR)) playSound("click");
    };
    // Capture phase, so a handler that stops propagation can't silence it.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
}

/**
 * Plays open/close/minimize sounds by diffing the window list between
 * renders, rather than from inside useWindowManager's own callbacks —
 * that way every route to the same result (title-bar button, taskbar
 * button, Start menu, a window closing itself) sounds the same, and
 * re-opening an already-open window (which only refocuses it) stays
 * silent.
 */
export function useWindowSounds(windows: WindowState[]) {
  // id -> isMinimized, as of the last render.
  const previous = useRef(new Map<string, boolean>());

  useEffect(() => {
    const current = new Map(windows.map((w) => [w.id, w.isMinimized]));
    const before = previous.current;
    previous.current = current;

    let opened = false;
    let minimized = false;
    for (const [id, isMinimized] of current) {
      const wasMinimized = before.get(id);
      if (wasMinimized === undefined || (wasMinimized && !isMinimized)) opened = true;
      else if (!wasMinimized && isMinimized) minimized = true;
    }
    const closed = [...before.keys()].some((id) => !current.has(id));

    // One sound per change, even if several windows changed at once.
    if (opened) playSound("window-open");
    else if (closed) playSound("window-close");
    else if (minimized) playSound("minimize");
  }, [windows]);
}
