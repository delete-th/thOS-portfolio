"use client";

import { useState } from "react";

export interface GlitchEffectProps {
  /**
   * "screen" covers the whole viewport (phase transitions); "window"
   * fills its nearest positioned ancestor, for a burst confined to one
   * window.
   */
  variant?: "screen" | "window";
}

/**
 * A one-shot static/tearing burst — see styles/glitch.css for the
 * effect itself. Plays once on mount and then removes itself, so the
 * way to trigger it is to mount it (give it a `key` if it needs to
 * replay in the same spot). Purely decorative: `pointer-events: none`,
 * hidden from screen readers, and skipped entirely under
 * prefers-reduced-motion.
 */
export function GlitchEffect({ variant = "screen" }: GlitchEffectProps) {
  const [isDone, setIsDone] = useState(false);

  if (isDone) return null;

  return (
    <div
      className={`glitch glitch--${variant}`}
      aria-hidden="true"
      onAnimationEnd={(e) => {
        // The layers' own animations bubble up here too — only the
        // root's marks the end of the whole burst.
        if (e.target === e.currentTarget) setIsDone(true);
      }}
    >
      <div className="glitch__static" />
      <div className="glitch__bar" />
      <div className="glitch__bar" />
      <div className="glitch__bar" />
    </div>
  );
}
