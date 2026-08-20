"use client";

import { useState } from "react";
import { StartButton } from "./StartButton";
import { StartMenu } from "./StartMenu";
import { SystemTray } from "./SystemTray";
import type { useWindowManager } from "@/hooks/useWindowManager";

const DIVIDER_STYLE = {
  boxShadow: "var(--border-sunken-outer), var(--border-sunken-inner)",
};

export interface TaskbarProps {
  /** Shared with Desktop so window buttons stay in sync with what's open. */
  wm: ReturnType<typeof useWindowManager>;
  /** Wired to the Start menu's "Shut Down" item. */
  onShutDown: () => void;
  className?: string;
}

/**
 * Full taskbar: Start button (+ menu), one button per open window
 * (minimized or not — that's how you get them back), and the system
 * tray. Quick-launch icons were removed — they were redundant with the
 * desktop icons and are now also reachable via the Start menu's
 * Programs submenu.
 */
export function Taskbar({ wm, onShutDown, className }: TaskbarProps) {
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);

  const handleWindowButtonClick = (id: string) => {
    const w = wm.windows.find((win) => win.id === id);
    if (!w) return;
    if (w.isMinimized) {
      wm.restoreWindow(id);
    } else if (w.isFocused) {
      wm.minimizeWindow(id);
    } else {
      wm.focusWindow(id);
    }
  };

  return (
    <div
      className={`relative flex h-10 shrink-0 items-center gap-2 px-1 ${className ?? ""}`}
      style={{
        background: "var(--surface)",
        boxShadow: "var(--border-raised-outer), var(--border-raised-inner)",
      }}
    >
      <StartButton isOpen={isStartMenuOpen} onClick={() => setIsStartMenuOpen((o) => !o)} />

      {isStartMenuOpen ? (
        <StartMenu
          wm={wm}
          onClose={() => setIsStartMenuOpen(false)}
          onShutDown={onShutDown}
        />
      ) : null}

      <div className="h-6 w-0.5 shrink-0" style={DIVIDER_STYLE} />

      <div className="flex min-w-0 flex-1 items-center gap-1">
        {wm.windows.map((w) => {
          const isActive = w.isFocused && !w.isMinimized;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => handleWindowButtonClick(w.id)}
              aria-pressed={isActive}
              className="flex h-[22px] min-w-0 max-w-[200px] flex-1 items-center gap-1.5 overflow-hidden px-2 text-left text-xs"
              style={isActive ? DIVIDER_STYLE : undefined}
            >
              {w.icon ? (
                // eslint-disable-next-line @next/next/no-img-element -- fixed-size UI chrome icon
                <img src={w.icon} alt="" width={14} height={14} className="shrink-0" />
              ) : null}
              <span className="truncate" style={{ fontFamily: "var(--font-ui)" }}>
                {w.title}
              </span>
            </button>
          );
        })}
      </div>

      <SystemTray />
    </div>
  );
}
