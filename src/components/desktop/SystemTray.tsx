"use client";

import { useState, useSyncExternalStore } from "react";

function subscribeToClock(onTick: () => void) {
  const id = setInterval(onTick, 1000 * 15);
  return () => clearInterval(id);
}

function getClientTime() {
  return Date.now();
}

// Server and first-paint snapshot — real time is swapped in as soon as
// the client subscribes, so this never causes a hydration mismatch.
function getServerTime() {
  return 0;
}

/**
 * Clock + mute toggle.
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
      className="flex h-7 shrink-0 items-center gap-2 px-2"
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
        className="flex h-4 w-4 items-center justify-center"
        style={{ background: "none", border: "none", boxShadow: "none", padding: 0 }}
      >
        <VolumeIcon muted={isMuted} />
      </button>
      <span className="text-xs tabular-nums" style={{ fontFamily: "var(--font-ui)" }}>
        {timeLabel}
      </span>
    </div>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden="true">
      <path d="M1 6h3l4-3v10l-4-3H1z" fill="currentColor" />
      {muted ? (
        <path
          d="M11 6l4 4M15 6l-4 4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M11 5.5c1.2 1 1.2 4 0 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
