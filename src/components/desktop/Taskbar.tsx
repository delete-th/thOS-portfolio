"use client";

import { StartButton } from "./StartButton";
import { SystemTray } from "./SystemTray";
import type { useWindowManager } from "@/hooks/useWindowManager";
import type { DesktopIconConfig } from "@/types/desktop";
import desktopIconsData from "@/data/desktop-config.json";

const QUICK_LAUNCH_ICONS = desktopIconsData as DesktopIconConfig[];

const DIVIDER_STYLE = {
  boxShadow: "var(--border-sunken-outer), var(--border-sunken-inner)",
};

export interface TaskbarProps {
  /** Shared with Desktop so window buttons stay in sync with what's open. */
  wm: ReturnType<typeof useWindowManager>;
  className?: string;
}

/**
 * Full taskbar: Start button, quick-launch shortcuts, one button per
 * open window (minimized or not — that's how you get them back), and
 * the system tray.
 */
export function Taskbar({ wm, className }: TaskbarProps) {
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
      className={`flex h-9 shrink-0 items-center gap-2 px-1 ${className ?? ""}`}
      style={{
        background: "var(--surface)",
        boxShadow: "var(--border-raised-outer), var(--border-raised-inner)",
      }}
    >
      <StartButton />

      <div className="h-6 w-0.5 shrink-0" style={DIVIDER_STYLE} />

      <div className="flex shrink-0 items-center gap-1">
        {QUICK_LAUNCH_ICONS.map((icon) => (
          <button
            key={icon.id}
            type="button"
            onClick={() =>
              wm.openWindow({
                id: icon.id,
                title: icon.window.title,
                icon: icon.icon,
                size: icon.window.size,
                minWidth: icon.window.minWidth,
                minHeight: icon.window.minHeight,
              })
            }
            title={icon.label}
            aria-label={`Open ${icon.label}`}
            className="flex h-7 w-7 items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI chrome icon */}
            <img src={icon.icon} alt="" width={16} height={16} draggable={false} />
          </button>
        ))}
      </div>

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
              className="flex h-7 min-w-0 max-w-[200px] flex-1 items-center gap-1.5 overflow-hidden px-2 text-left text-xs"
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
