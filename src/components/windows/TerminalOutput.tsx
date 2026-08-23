import { useEffect, useRef } from "react";

const HEADER = `thOS Security Terminal [Version 1.0.0]
(c) 2024 Thea. All rights reserved.`;

const PROMPT = "C:\\Users\\Thea>";

export interface TerminalHistoryEntry {
  command: string;
  output: string;
}

export interface TerminalOutputProps {
  history: TerminalHistoryEntry[];
}

/**
 * The scrollback buffer: the boot header (always shown at the top —
 * "clear" resets `history` to [], which is what makes the header
 * reappear "fresh" per spec, with no separate header-visibility state
 * needed), then one prompt+command+output block per executed command.
 * Auto-scrolls to the bottom whenever new output arrives.
 */
export function TerminalOutput({ history }: TerminalOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Direct DOM scroll, not React state — "update an external system
    // from the latest render," the effect pattern this rule expects.
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [history]);

  return (
    <div className="whitespace-pre-wrap break-words">
      <div>{HEADER}</div>
      <div>&nbsp;</div>

      {history.map((entry, i) => (
        <div key={i} className="mb-2">
          <div>
            {PROMPT} {entry.command}
          </div>
          <div>{entry.output}</div>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}

export { PROMPT };
