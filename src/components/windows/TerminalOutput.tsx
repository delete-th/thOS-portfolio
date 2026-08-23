const HEADER = `thOS Security Terminal [Version 1.0.0]
(c) 2026 Thea. All rights reserved.`;

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
 * Purely presentational — ThTerminal.tsx renders this immediately
 * followed by the live TerminalInput line inside one shared scrollable
 * container, and owns the scroll-to-bottom behavior for that whole
 * flow (not just this component's own history), so the live prompt
 * behaves like a real terminal's: it's the last line of the same
 * scrolling text, not a UI element fixed to the window's bottom edge.
 */
export function TerminalOutput({ history }: TerminalOutputProps) {
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
    </div>
  );
}

export { PROMPT };
