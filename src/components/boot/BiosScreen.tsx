"use client";

import { useEffect, useState } from "react";

export interface BiosScreenProps {
  /** Called once every line has finished revealing (plus a short pause). */
  onDone: () => void;
}

const MEMORY_LINE = "__MEMORY__";
const MEMORY_TARGET_KB = 65536;

const LINES: string[] = [
  "thOS BIOS 4.51PG, An Energy Star Ally",
  "Copyright (C) 2026, thOS Systems, Inc.",
  "",
  "CPU: delete-th Neural Core @ 3.80GHz",
  MEMORY_LINE,
  "",
  "Detecting IDE drives...",
  "  Primary Master .......... THOS-PORTFOLIO-SSD",
  "  Primary Slave ........... None",
  "",
  "Keyboard .................. 104-Key Detected",
  "Mouse ...................... PS/2 Compatible Mouse Detected",
];

const LINE_DELAY_MS = 130;
const HOLD_AFTER_MS = 500;

/**
 * Fake BIOS POST screen: lines reveal one at a time, with a rapid
 * memory-count-up animation on its line, classic-BIOS style. Skipping
 * is handled by the parent (BootSequence) via a global key/click
 * listener, not here — this component only knows how to finish itself.
 */
export function BiosScreen({ onDone }: BiosScreenProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [memoryKb, setMemoryKb] = useState(0);

  useEffect(() => {
    if (visibleLines >= LINES.length) {
      const timeout = setTimeout(onDone, HOLD_AFTER_MS);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => setVisibleLines((n) => n + 1), LINE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [visibleLines, onDone]);

  useEffect(() => {
    const memoryLineIndex = LINES.indexOf(MEMORY_LINE);
    if (visibleLines <= memoryLineIndex || memoryKb >= MEMORY_TARGET_KB) return;
    const id = setInterval(() => {
      setMemoryKb((kb) => Math.min(MEMORY_TARGET_KB, kb + 4096));
    }, 16);
    return () => clearInterval(id);
  }, [visibleLines, memoryKb]);

  return (
    <div
      className="flex flex-1 flex-col bg-black p-6 text-[#c0c0c0]"
      style={{ fontFamily: "var(--font-terminal)" }}
    >
      <div aria-hidden="true" className="whitespace-pre text-sm leading-relaxed">
        {LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i}>
            {line === MEMORY_LINE
              ? `Memory Test: ${String(memoryKb).padStart(5, "0")}K OK`
              : line}
          </div>
        ))}
        {visibleLines < LINES.length ? <span className="animate-pulse">_</span> : null}
      </div>
    </div>
  );
}
