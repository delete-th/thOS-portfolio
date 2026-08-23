"use client";

import { useEffect, useState } from "react";
import { BiosScreen } from "./BiosScreen";
import { LoadingScreen } from "./LoadingScreen";

export interface BootSequenceProps {
  /** Called when the sequence finishes naturally, or is skipped. */
  onComplete: () => void;
}

type Phase = "bios" | "loading";

/**
 * BIOS POST screen → thOS loading bar, ~3-5s total per the spec.
 * Always plays on every visit (no "already seen it" persistence — see
 * useTheme.ts for the same reasoning). Any keypress or click skips
 * straight to the end, which doubles as the accessibility escape hatch
 * the spec calls for and as the user-gesture browser autoplay policies
 * require before the (not-yet-built) sound system can play anything.
 */
export function BootSequence({ onComplete }: BootSequenceProps) {
  const [phase, setPhase] = useState<Phase>("bios");

  useEffect(() => {
    const skip = () => onComplete();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [onComplete]);

  return (
    <main className="relative flex flex-1 flex-col bg-black">
      <span className="sr-only">
        Loading thOS — a portfolio site for Thea, a software developer and security engineer.
      </span>

      {phase === "bios" ? (
        <BiosScreen onDone={() => setPhase("loading")} />
      ) : (
        <LoadingScreen onDone={onComplete} />
      )}

      <button
        type="button"
        onClick={onComplete}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 border-0 bg-transparent text-xs text-[#808080] shadow-none"
        style={{ fontFamily: "var(--font-terminal)" }}
      >
        Press any key or click to skip
      </button>
    </main>
  );
}
