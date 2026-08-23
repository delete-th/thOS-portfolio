"use client";

import { useState } from "react";
import { TASKBAR_SURFACE } from "@/lib/win98Panel";

export interface ThExplorerNavBarProps {
  address: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onHome: () => void;
  onRefresh: () => void;
  onSubmitAddress: (value: string) => void;
}

/**
 * IE5/6-style toolbar: Back/Forward/Home/Refresh + an editable address
 * bar + Go. This is browser *chrome* (part of the thOS-native window,
 * like every other window's title bar), so — unlike the AskTh page
 * content it sits above — it uses the themed --thos-taskbar-bg surface
 * and reskins with the active profile, same as the Taskbar itself.
 */
export function ThExplorerNavBar({
  address,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onHome,
  onRefresh,
  onSubmitAddress,
}: ThExplorerNavBarProps) {
  const [addressValue, setAddressValue] = useState(address);
  // Tracks the last `address` prop we synced from, so a real prop
  // change (back/forward/home/clicking a result) updates the input,
  // without fighting the user while they're actively typing/editing
  // it. React's own recommended "adjust state during render" pattern
  // for derived-from-props state — not a useEffect, since setState
  // there would only run *after* a render with stale text had already
  // painted, and trip the set-state-in-effect lint rule besides.
  const [syncedAddress, setSyncedAddress] = useState(address);
  if (address !== syncedAddress) {
    setSyncedAddress(address);
    setAddressValue(address);
  }

  const submit = () => onSubmitAddress(addressValue);

  return (
    <div
      className="flex h-10 shrink-0 items-center gap-1 border-b border-[var(--button-shadow)] px-1"
      style={{ background: TASKBAR_SURFACE }}
    >
      <NavButton icon="/icons/nav-back.svg" label="Back" onClick={onBack} disabled={!canGoBack} />
      <NavButton
        icon="/icons/nav-forward.svg"
        label="Forward"
        onClick={onForward}
        disabled={!canGoForward}
      />
      <NavButton icon="/icons/nav-home.png" label="Home" onClick={onHome} />
      <NavButton icon="/icons/nav-refresh.svg" label="Refresh" onClick={onRefresh} />

      <span
        className="ml-1 shrink-0 text-[13px]"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        Address:
      </span>
      <input
        type="text"
        value={addressValue}
        onChange={(e) => setAddressValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        className="min-w-0 flex-1 text-[13px]"
        style={{ fontFamily: "var(--font-ui)" }}
      />
      <button
        type="button"
        onClick={submit}
        className="min-h-0 min-w-0 shrink-0 px-3 text-[13px]"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        Go
      </button>
    </div>
  );
}

function NavButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 min-h-0 min-w-0 shrink-0 items-center justify-center p-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI chrome icon */}
      <img src={icon} alt="" width={16} height={16} style={{ opacity: disabled ? 0.35 : 1 }} />
    </button>
  );
}
