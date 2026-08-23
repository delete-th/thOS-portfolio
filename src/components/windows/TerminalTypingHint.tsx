export interface TerminalTypingHintProps {
  text: string;
}

/**
 * The ghost-command overlay shown at the prompt while thTerminal is
 * idle — same green as real terminal text but dimmer, so it reads as
 * "suggestion," not "already typed," plus a block cursor instead of a
 * thin bar (more terminal-authentic per spec). The typing/backspacing
 * animation itself lives in useTypingPlaceholder — this just renders
 * whatever text that hook currently reports.
 */
export function TerminalTypingHint({ text }: TerminalTypingHintProps) {
  return (
    <span aria-hidden="true" style={{ color: "rgba(51, 255, 51, 0.5)" }}>
      {text}
      <span className="blink-cursor">█</span>
    </span>
  );
}
