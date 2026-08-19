"use client";

/**
 * Start button — visual only for the initial build (per spec: no
 * functional start menu yet, see "Future Enhancements"). It's a real
 * <button> so it still gets 98.css's native raised/pressed states for
 * click feedback; it just doesn't open anything.
 */
export function StartButton() {
  return (
    <button
      type="button"
      className="flex h-7 shrink-0 items-center gap-1.5 px-2 font-bold"
      style={{ fontFamily: "var(--font-ui)" }}
      title="Start (menu not implemented yet)"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI chrome icon */}
      <img src="/icons/thos-logo.svg" alt="" width={18} height={18} />
      <span>Start</span>
    </button>
  );
}
