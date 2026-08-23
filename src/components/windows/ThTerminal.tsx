"use client";

import { useState } from "react";
import { TerminalOutput, type TerminalHistoryEntry } from "./TerminalOutput";
import { TerminalInput } from "./TerminalInput";
import { TERMINAL_COMMANDS } from "@/data/terminal-commands";
import { resolveCommand } from "@/lib/terminalCommands";
import { openDesktopWindow } from "@/lib/openDesktopWindow";
import type { useWindowManager } from "@/hooks/useWindowManager";
import type { DesktopIconConfig } from "@/types/desktop";
import desktopIconsData from "@/data/desktop-config.json";

const ALL_ICONS = desktopIconsData as DesktopIconConfig[];

export interface ThTerminalProps {
  /** Needed for CTA buttons like "Open in File Explorer" — opens a real desktop window. */
  wm: ReturnType<typeof useWindowManager>;
}

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
 * data/window-menus.ts).
 *
 * Unlike thExplorer's deliberate "chrome is themed, page content is
 * fixed" split, there's nothing to split here — a real black-background
 * green-text terminal *is* the sec theme's own dark/hacker palette, so
 * this renders the same regardless of which theme is active (thTerminal
 * only ever appears on sec in practice, since Desktop only shows one of
 * thExplorer/thTerminal at a time — see lib/activeDesktopIcons.ts).
 */
export function ThTerminal({ wm }: ThTerminalProps) {
  const [history, setHistory] = useState<TerminalHistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

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

  // The most recently run command's actions (if any) render as real
  // buttons below the scrollback — same CTA mechanism as AskTh's
  // content pages, just surfaced differently since terminal output is
  // otherwise plain text.
  const lastCommand = history.length > 0 ? resolveCommand(history[history.length - 1].command) : undefined;

  return (
    <div
      className="flex h-full flex-col overflow-hidden p-2"
      style={{ background: "#0c0c0c", color: "#33ff33", fontFamily: "var(--font-terminal)", fontSize: 14 }}
    >
      <div className="flex-1 overflow-auto">
        <TerminalOutput history={history} />
      </div>

      {lastCommand?.actions?.length ? (
        <div className="flex flex-wrap gap-2 py-1">
          {lastCommand.actions.map((action) => {
            const icon = ALL_ICONS.find((i) => i.id === action.openWindowId);
            if (!icon) return null;
            return (
              <button
                key={action.openWindowId}
                type="button"
                onClick={() => openDesktopWindow(wm, icon)}
                className="text-[13px]"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Not autoFocus — same reasoning as AskThHomepage's SearchBar:
          auto-focusing on mount would permanently suppress the idle
          command-hint animation before a visitor ever saw it. */}
      <TerminalInput commandHistory={commandHistory} onSubmit={runCommand} />
    </div>
  );
}
