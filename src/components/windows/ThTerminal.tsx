"use client";

import { useEffect, useRef, useState } from "react";
import { TerminalOutput, type TerminalHistoryEntry } from "./TerminalOutput";
import { TerminalInput } from "./TerminalInput";
import { TERMINAL_COMMANDS } from "@/data/terminal-commands";
import { resolveCommand } from "@/lib/terminalCommands";

const HELP_OUTPUT = [
  "  Available commands:",
  ...TERMINAL_COMMANDS.map((c) => `    ${c.command.padEnd(15)} ${c.description}`),
  "    help            Show this help message",
  "    clear           Clear the terminal",
].join("\n");

/**
 * thTerminal: the sec-theme counterpart to thExplorer/AskTh — same
 * "discover things about Thea" concept, through CLI commands instead
 * of a search engine. No menu bar per spec (classic Command Prompt
 * didn't have one — same reasoning System Properties has none, see
 * data/window-menus.ts). Output is plain text only — no buttons or
 * other interactive UI inside the scrollback, a real command prompt
 * doesn't have those.
 *
 * TerminalOutput and the live TerminalInput render inside one shared
 * scrollable container (not TerminalInput pinned separately below it)
 * so the input prompt is the last line of the same continuous flow —
 * exactly like a real terminal, not a fixed toolbar element.
 *
 * Unlike thExplorer's deliberate "chrome is themed, page content is
 * fixed" split, there's nothing to split here — a real black-background
 * green-text terminal *is* the sec theme's own dark/hacker palette, so
 * this renders the same regardless of which theme is active (thTerminal
 * only ever appears on sec in practice, since Desktop only shows one of
 * thExplorer/thTerminal at a time — see lib/activeDesktopIcons.ts).
 *
 * Takes no props — Desktop.tsx's WINDOW_CONTENT map calls every entry
 * uniformly as `<Content wm={wm} />` (ThExplorer's entry still needs
 * `wm`), and a component that simply declares no parameters is still a
 * valid target for that call; ThTerminal just ignores the extra arg.
 */
export function ThTerminal() {
  const [history, setHistory] = useState<TerminalHistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Direct DOM scroll, not React state — keeps the live input line
    // (the last thing in this flow) in view whenever the scrollback
    // grows, same as a real terminal auto-following new output.
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [history]);

  const runCommand = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed) setCommandHistory((prev) => [...prev, trimmed]);

    if (!trimmed) {
      setHistory((prev) => [...prev, { command: "", output: "" }]);
      return;
    }

    const lower = trimmed.toLowerCase();
    if (lower === "clear") {
      setHistory([]);
      return;
    }
    if (lower === "help") {
      setHistory((prev) => [...prev, { command: trimmed, output: HELP_OUTPUT }]);
      return;
    }

    const matched = resolveCommand(trimmed);
    if (matched) {
      setHistory((prev) => [...prev, { command: trimmed, output: matched.output }]);
    } else {
      setHistory((prev) => [
        ...prev,
        {
          command: trimmed,
          output: `  '${trimmed}' is not recognized as an internal or external command.\n  Type 'help' to see available commands.`,
        },
      ]);
    }
  };

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ background: "#0c0c0c", color: "#33ff33", fontFamily: "var(--font-terminal)", fontSize: 14 }}
    >
      <div className="flex-1 overflow-auto p-2">
        <TerminalOutput history={history} />
        {/* Not autoFocus — same reasoning as AskThHomepage's SearchBar:
            auto-focusing on mount would permanently suppress the idle
            command-hint animation before a visitor ever saw it. */}
        <TerminalInput commandHistory={commandHistory} onSubmit={runCommand} />
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
