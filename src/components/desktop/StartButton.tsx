"use client";

import { TASKBAR_SURFACE } from "@/lib/win98Panel";

export interface StartButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

/**
 * Start button. Toggles the Start menu (see StartMenu.tsx) and looks
 * pressed-in (sunken) while that menu is open, matching real Windows.
 */
export function StartButton({ isOpen, onClick }: StartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      className="flex h-[22px] min-w-[54px] shrink-0 items-center gap-1.5 px-2 text-[14px] font-bold"
      style={{
        backgroundColor: TASKBAR_SURFACE,
        ...(isOpen
          ? { boxShadow: "var(--border-sunken-outer), var(--border-sunken-inner)" }
          : null),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI chrome icon */}
      <img src="/icons/thos-logo.svg" alt="" width={18} height={18} />
      <span>Start</span>
    </button>
  );
}
