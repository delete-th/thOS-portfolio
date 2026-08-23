export interface TerminalCommandAction {
  label: string;
  /** Opens this desktop-config.json window id via the shared window manager. */
  openWindowId: string;
}

/**
 * One thTerminal command and its canned output. `command` is the
 * canonical form shown in `help`; `aliases` are other exact strings
 * that resolve to the same entry (e.g. "dir projects" for "ls
 * projects"). Matching is exact (case-insensitive), not fuzzy — these
 * are commands the user types, not a search query.
 */
export interface TerminalCommand {
  command: string;
  aliases?: string[];
  description: string;
  /** Rendered as literal lines — no HTML, unlike AskTh's content pages. */
  output: string;
  /** Optional CTA buttons, e.g. "Open in File Explorer" -> the Projects window. */
  actions?: TerminalCommandAction[];
}
