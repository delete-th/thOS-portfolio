"use client";

import { useEffect, useRef, useState } from "react";
import { StartButton } from "./StartButton";
import { StartMenu } from "./StartMenu";
import { SystemTray } from "./SystemTray";
import type { useWindowManager } from "@/hooks/useWindowManager";
import { TASKBAR_SURFACE } from "@/lib/win98Panel";

const DIVIDER_STYLE = {
  boxShadow: "var(--border-sunken-outer), var(--border-sunken-inner)",
};

export interface TaskbarProps {
  /** Shared with Desktop so window buttons stay in sync with what's open. */
  wm: ReturnType<typeof useWindowManager>;
  /** Wired to the Start menu's "Shut Down" item. */
  onShutDown: () => void;
  className?: string;
}

/**
 * Full taskbar: Start button (+ menu), one button per open window
 * (minimized or not — that's how you get them back), and the system
 * tray. Quick-launch icons were removed — they were redundant with the
 * desktop icons and are now also reachable via the Start menu's
 * Programs submenu.
 */
export function Taskbar({ wm, onShutDown, className }: TaskbarProps) {
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  // Wraps *both* the Start button and the menu, so a click on the
  // button itself counts as "inside" — otherwise the outside-click
  // listener below and the button's own toggle would fire on the same
  // click and cancel each other out (menu would never close).
  const startAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isStartMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (startAreaRef.current && !startAreaRef.current.contains(e.target as Node)) {
        setIsStartMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsStartMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isStartMenuOpen]);

  const handleWindowButtonClick = (id: string) => {
    const w = wm.windows.find((win) => win.id === id);
    if (!w) return;
    if (w.isMinimized) {
      wm.restoreWindow(id);
    } else if (w.isFocused) {
      wm.minimizeWindow(id);
    } else {
      wm.focusWindow(id);
    }
  };

  return (
    <div
      className={`flex h-10 shrink-0 items-center gap-2 px-1 ${className ?? ""}`}
      style={{
        backgroundColor: TASKBAR_SURFACE,
        boxShadow: "var(--border-raised-outer), var(--border-raised-inner)",
      }}
    >
      <div ref={startAreaRef} className="relative flex shrink-0 items-center">
        <StartButton isOpen={isStartMenuOpen} onClick={() => setIsStartMenuOpen((o) => !o)} />

        {isStartMenuOpen ? (
          <StartMenu
            wm={wm}
            onClose={() => setIsStartMenuOpen(false)}
            onShutDown={onShutDown}
          />
        ) : null}
      </div>

      <div className="h-6 w-0.5 shrink-0" style={DIVIDER_STYLE} />

      <div className="flex min-w-0 flex-1 items-center gap-1">
        {wm.windows.map((w) => {
          const isActive = w.isFocused && !w.isMinimized;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => handleWindowButtonClick(w.id)}
              aria-pressed={isActive}
              className="flex h-[22px] min-w-0 max-w-[200px] flex-1 items-center gap-1.5 overflow-hidden px-2 text-left text-[13px]"
              style={{ backgroundColor: TASKBAR_SURFACE, ...(isActive ? DIVIDER_STYLE : null) }}
            >
              {w.icon ? (
                // eslint-disable-next-line @next/next/no-img-element -- fixed-size UI chrome icon
                <img src={w.icon} alt="" width={14} height={14} className="shrink-0" />
              ) : null}
              <span className="truncate" style={{ fontFamily: "var(--font-ui)" }}>
                {w.title}
              </span>
            </button>
          );
        })}
      </div>

      <SystemTray />
    </div>
  );
}
