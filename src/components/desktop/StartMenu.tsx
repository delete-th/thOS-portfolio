"use client";

import { useState, type CSSProperties } from "react";
import type { useWindowManager } from "@/hooks/useWindowManager";
import type { DesktopIconConfig } from "@/types/desktop";
import desktopIconsData from "@/data/desktop-config.json";
import { OPAQUE_PANEL_STYLE } from "@/lib/win98Panel";

const ALL_ICONS = desktopIconsData as DesktopIconConfig[];
const DOCUMENTS_ICON = ALL_ICONS.find((icon) => icon.id === "projects");
// Everything openable except Projects (promoted to "Documents") and the
// Recycle Bin (not a program).
const PROGRAM_ICONS = ALL_ICONS.filter(
  (icon) => icon.id !== "projects" && icon.id !== "recycle-bin",
);

export interface StartMenuProps {
  /** Shared with Desktop/Taskbar so opening an item here behaves identically. */
  wm: ReturnType<typeof useWindowManager>;
  onClose: () => void;
  onShutDown: () => void;
}

const MENU_ITEM_CLASS =
  "flex w-full min-w-0 min-h-0 items-center gap-2 border-0 bg-transparent px-2 py-1.5 text-left shadow-none hover:bg-[var(--dialog-blue)] hover:text-white";

const ITEM_TEXT_STYLE: CSSProperties = { fontFamily: "var(--font-ui)", fontSize: 14 };

/**
 * Classic Windows 98 Start menu: navy "thOS" sidebar, Documents /
 * Settings / Programs (click-to-expand submenu, not hover) / Shut
 * Down. Closes on outside click or Escape — handled by the parent
 * Taskbar (which owns the open/closed state and wraps both the Start
 * button and this menu in one click-outside boundary; see Taskbar.tsx).
 * This was explicitly deferred to "Future Enhancements" in the
 * original spec, now built per direct request.
 */
export function StartMenu({ wm, onClose, onShutDown }: StartMenuProps) {
  const [isProgramsOpen, setIsProgramsOpen] = useState(false);

  const openAndClose = (icon: DesktopIconConfig) => {
    wm.openWindow({
      id: icon.id,
      title: icon.window.title,
      icon: icon.icon,
      size: icon.window.size,
      minWidth: icon.window.minWidth,
      minHeight: icon.window.minHeight,
    });
    onClose();
  };

  const openSettings = () => {
    wm.openWindow({
      id: "settings",
      title: "Settings",
      icon: "/icons/settings.png",
      size: { width: 320, height: 180 },
      minWidth: 260,
      minHeight: 140,
    });
    onClose();
  };

  return (
    <div className="absolute bottom-full left-0 z-[500] mb-0.5 flex w-56" style={OPAQUE_PANEL_STYLE}>
      {/* The iconic vertical navy sidebar */}
      <div
        className="flex w-6 shrink-0 items-end justify-center pb-2"
        style={{ background: "linear-gradient(to top, #000080, #1084d0)" }}
      >
        <span
          className="whitespace-nowrap text-lg font-bold tracking-widest text-[#c0c0c0]"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontFamily: "var(--font-ui)",
          }}
        >
          thOS
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-1">
        {DOCUMENTS_ICON ? (
          <button
            type="button"
            className={MENU_ITEM_CLASS}
            onClick={() => openAndClose(DOCUMENTS_ICON)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
            <img src={DOCUMENTS_ICON.icon} alt="" width={16} height={16} />
            <span style={ITEM_TEXT_STYLE}>Documents</span>
          </button>
        ) : null}

        <button type="button" className={MENU_ITEM_CLASS} onClick={openSettings}>
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
          <img src="/icons/settings.png" alt="" width={16} height={16} />
          <span style={ITEM_TEXT_STYLE}>Settings</span>
        </button>

        <div className="relative">
          <button
            type="button"
            className={MENU_ITEM_CLASS}
            aria-expanded={isProgramsOpen}
            onClick={() => setIsProgramsOpen((open) => !open)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
            <img src="/icons/folder.png" alt="" width={16} height={16} />
            <span className="flex-1" style={ITEM_TEXT_STYLE}>
              Programs
            </span>
            <span aria-hidden="true">▶</span>
          </button>

          {isProgramsOpen ? (
            <div className="absolute bottom-0 left-full ml-0.5 w-52" style={OPAQUE_PANEL_STYLE}>
              <div className="flex flex-col py-1">
                {PROGRAM_ICONS.map((icon) => (
                  <button
                    key={icon.id}
                    type="button"
                    className={MENU_ITEM_CLASS}
                    onClick={() => openAndClose(icon)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
                    <img src={icon.icon} alt="" width={16} height={16} />
                    <span className="truncate" style={ITEM_TEXT_STYLE}>
                      {icon.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div
          className="mx-2 my-1 h-px shrink-0"
          style={{ boxShadow: "var(--border-sunken-outer), var(--border-sunken-inner)" }}
        />

        <button
          type="button"
          className={MENU_ITEM_CLASS}
          onClick={() => {
            onClose();
            onShutDown();
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
          <img src="/icons/shutdown.png" alt="" width={16} height={16} />
          <span style={ITEM_TEXT_STYLE}>Shut Down&hellip;</span>
        </button>
      </div>
    </div>
  );
}
