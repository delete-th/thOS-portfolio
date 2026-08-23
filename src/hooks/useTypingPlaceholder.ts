"use client";

import { useEffect, useState } from "react";

export interface UseTypingPlaceholderOptions {
  typingSpeedMs?: number;
  backspaceSpeedMs?: number;
  pauseAfterTypedMs?: number;
  pauseBeforeNextMs?: number;
}

const DEFAULTS: Required<UseTypingPlaceholderOptions> = {
  typingSpeedMs: 80,
  backspaceSpeedMs: 40,
  pauseAfterTypedMs: 1500,
  pauseBeforeNextMs: 300,
};

/**
 * Drives a typewriter "type phrase → pause → backspace → next phrase"
 * loop, cycling through `phrases` forever while `isActive` is true.
 * Shared by AskTh's search bar (SearchBar.tsx) and thTerminal's
 * command hints (TerminalTypingHint.tsx) — same timing engine, each
 * consumer just renders the returned text with its own styling/cursor
 * glyph.
 *
 * Pass a module-level constant array for `phrases`, not an inline
 * literal — a new array identity every render would restart the loop
 * on every render.
 *
 * Every setState call happens inside a setTimeout callback, never
 * directly in the effect body — the sanctioned "subscribe to an
 * external timer, setState in its callback" effect pattern (see the
 * react-hooks/set-state-in-effect rule), not the "synchronously derive
 * state from a prop" anti-pattern it flags.
 */
export function useTypingPlaceholder(
  phrases: string[],
  isActive: boolean,
  options: UseTypingPlaceholderOptions = {},
): string {
  const { typingSpeedMs, backspaceSpeedMs, pauseAfterTypedMs, pauseBeforeNextMs } = {
    ...DEFAULTS,
    ...options,
  };
  const [animatedText, setAnimatedText] = useState("");

  useEffect(() => {
    if (!isActive || phrases.length === 0) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let phraseIndex = 0;

    const typePhrase = (charIndex: number) => {
      const phrase = phrases[phraseIndex];
      setAnimatedText(phrase.slice(0, charIndex));
      timeoutId =
        charIndex < phrase.length
          ? setTimeout(() => typePhrase(charIndex + 1), typingSpeedMs)
          : setTimeout(() => backspacePhrase(phrase.length), pauseAfterTypedMs);
    };

    const backspacePhrase = (charIndex: number) => {
      const phrase = phrases[phraseIndex];
      setAnimatedText(phrase.slice(0, charIndex));
      if (charIndex > 0) {
        timeoutId = setTimeout(() => backspacePhrase(charIndex - 1), backspaceSpeedMs);
      } else {
        phraseIndex = (phraseIndex + 1) % phrases.length;
        timeoutId = setTimeout(() => typePhrase(0), pauseBeforeNextMs);
      }
    };

    timeoutId = setTimeout(() => typePhrase(0), 0);

    return () => clearTimeout(timeoutId);
  }, [isActive, phrases, typingSpeedMs, backspaceSpeedMs, pauseAfterTypedMs, pauseBeforeNextMs]);

  return animatedText;
}
