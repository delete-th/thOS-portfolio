"use client";

import { useEffect, useState } from "react";

export interface LoadingScreenProps {
  /** Called once the bar finishes filling (plus a short pause). */
  onDone: () => void;
}

const DURATION_MS = 1600;
const HOLD_AFTER_MS = 300;
const SEGMENT_COUNT = 20;

/**
 * thOS branding + a segmented Win95/98-style boot progress bar.
 * Deliberately theme-neutral (98.css's own "dialog blue" rather than
 * the dev/sec accent) since the visitor hasn't picked a profile yet —
 * that happens on the login screen, the next build step.
 */
export function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const next = Math.min(1, elapsed / DURATION_MS);
      setProgress(next);
      if (next < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setTimeout(onDone, HOLD_AFTER_MS);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onDone]);

  const filledSegments = Math.round(progress * SEGMENT_COUNT);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-black">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size boot logo */}
        <img
          src="/icons/thos-logo.svg"
          alt=""
          width={40}
          height={40}
          style={{ imageRendering: "pixelated" }}
        />
        <span
          className="text-3xl font-bold tracking-widest text-white"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          thOS
        </span>
      </div>

      <div
        className="flex h-4 w-64 gap-[2px] border border-[#808080] p-[2px]"
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
          <div
            key={i}
            className="flex-1"
            style={{
              background: i < filledSegments ? "var(--dialog-blue-light, #1084d0)" : "transparent",
            }}
          />
        ))}
      </div>

      <p className="text-xs text-[#808080]" style={{ fontFamily: "var(--font-ui)" }}>
        Loading thOS&hellip;
      </p>
    </div>
  );
}
