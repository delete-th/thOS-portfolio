"use client";

import { useState, useSyncExternalStore } from "react";

// useSyncExternalStore requires getSnapshot to return the *same* value
// between calls until the store actually changes — Date.now() changing
// every millisecond violates that and makes React think the snapshot
// is unstable (throws "getSnapshot should be cached"). So the "current"
// time is cached here and only advanced when the interval actually
// ticks, not read live on every getSnapshot call.
let cachedTimeMs = Date.now();

function subscribeToClock(onTick: () => void) {
  const id = setInterval(() => {
    cachedTimeMs = Date.now();
    onTick();
  }, 1000 * 60);
  return () => clearInterval(id);
}

function getClientTime() {
  return cachedTimeMs;
}

// Server and first-paint snapshot — real time is swapped in as soon as
// the client subscribes, so this never causes a hydration mismatch.
function getServerTime() {
  return 0;
}

/**
 * Clock + mute toggle + a decorative network icon.
 *
 * The mute toggle is local, visual-only state for now — there's no
 * sound system to actually mute yet (that's its own later build step).
 * It's structured as isMuted/onToggleMute-shaped so wiring it to a real
 * useSound() hook later is a matter of lifting this state up, not
 * rewriting the component.
 */
export function SystemTray() {
  const nowMs = useSyncExternalStore(subscribeToClock, getClientTime, getServerTime);
  const [isMuted, setIsMuted] = useState(false);

  const timeLabel =
    nowMs > 0
      ? new Date(nowMs).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "--:--";

  return (
    <div
      className="flex h-[26px] shrink-0 items-center gap-1.5 px-2"
      style={{
        background: "var(--button-face)",
        boxShadow: "var(--border-sunken-outer), var(--border-sunken-inner)",
      }}
    >
      <button
        type="button"
        onClick={() => setIsMuted((muted) => !muted)}
        aria-pressed={isMuted}
        aria-label={isMuted ? "Unmute sound effects" : "Mute sound effects"}
        title={isMuted ? "Sound: muted" : "Sound: on"}
        className="flex h-4 w-4 min-w-0 min-h-0 items-center justify-center border-0 bg-transparent p-0 shadow-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI chrome icon */}
        <img
          src={isMuted ? "/icons/volume-muted.png" : "/icons/volume-on.png"}
          alt=""
          width={16}
          height={16}
        />
      </button>

      {/* Decorative only — no live network status to report. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI chrome icon */}
      <img src="/icons/network.png" alt="" width={16} height={16} title="Network" />

      <span
        className="text-xs tabular-nums"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        {timeLabel}
      </span>
    </div>
  );
}
