import { TERMINAL_COMMANDS } from "@/data/terminal-commands";
import type { TerminalCommand } from "@/types/terminal";

/** Exact (case-insensitive) match against a command's canonical form or any alias. */
export function resolveCommand(raw: string): TerminalCommand | undefined {
  const q = raw.trim().toLowerCase();
  return TERMINAL_COMMANDS.find(
    (c) => c.command.toLowerCase() === q || c.aliases?.some((a) => a.toLowerCase() === q),
  );
}
