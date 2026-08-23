"use client";

import { useState } from "react";
import { TerminalTypingHint } from "./TerminalTypingHint";
import { useTypingPlaceholder } from "@/hooks/useTypingPlaceholder";
import { PROMPT } from "./TerminalOutput";

export interface TerminalInputProps {
  /** Previously entered commands, oldest first — Up/Down cycles through these. */
  commandHistory: string[];
  onSubmit: (command: string) => void;
  autoFocus?: boolean;
}

// Module-level constant — see SearchBar.tsx's HINT_PHRASES for why
// this can't be an inline literal.
const HINT_COMMANDS = ["whoami", "ls projects", "cat skills.txt", "history", "man contact", "ping thea.dev"];

/**
 * The live prompt line: "C:\Users\Thea> " + an actual <input> (real
 * keyboard handling, not a custom-drawn caret) + the idle typing-hint
 * overlay + Up/Down shell-style history recall.
 */
export function TerminalInput({ commandHistory, onSubmit, autoFocus }: TerminalInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  // null = editing fresh (not browsing history). Otherwise an index
  // into commandHistory, walked backward from the end on ArrowUp.
  const [historyCursor, setHistoryCursor] = useState<number | null>(null);

  const showHint = !isFocused && value.length === 0;
  const animatedHint = useTypingPlaceholder(HINT_COMMANDS, showHint);

  const submit = () => {
    onSubmit(value);
    setValue("");
    setHistoryCursor(null);
  };

  const recallOlder = () => {
    if (commandHistory.length === 0) return;
    const nextIndex = historyCursor === null ? commandHistory.length - 1 : Math.max(0, historyCursor - 1);
    setHistoryCursor(nextIndex);
    setValue(commandHistory[nextIndex]);
  };

  const recallNewer = () => {
    if (historyCursor === null) return;
    const nextIndex = historyCursor + 1;
    if (nextIndex >= commandHistory.length) {
      setHistoryCursor(null);
      setValue("");
    } else {
      setHistoryCursor(nextIndex);
      setValue(commandHistory[nextIndex]);
    }
  };

  return (
    <div className="relative flex items-center">
      <span className="shrink-0">{PROMPT}&nbsp;</span>
      <div className="relative min-w-0 flex-1">
        <input
          type="text"
          value={value}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setValue(e.target.value);
            setHistoryCursor(null);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              recallOlder();
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              recallNewer();
            }
          }}
          className="w-full border-0 bg-transparent p-0 text-inherit shadow-none outline-none"
          style={{ fontFamily: "var(--font-terminal)", fontSize: 14, color: "#33ff33" }}
        />
        {showHint ? (
          <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden">
            <TerminalTypingHint text={animatedHint} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
