"use client";

// Entry point → Boot → Login → Desktop.
//
// The window manager instance lives here (not inside Desktop or
// Taskbar) so both can share it and stay in sync. Replaced as the boot
// sequence and login screen land (see thOS-portfolio-spec.md § Build
// order).

import { useState } from "react";
import { Desktop } from "@/components/desktop/Desktop";
import { Taskbar } from "@/components/desktop/Taskbar";
import { useWindowManager } from "@/hooks/useWindowManager";

// How long the shutdown message shows before resetting.
const SHUTDOWN_DURATION_MS = 1600;

export default function Home() {
  const wm = useWindowManager();
  const [isShuttingDown, setIsShuttingDown] = useState(false);

  const handleShutDown = () => {
    setIsShuttingDown(true);
    // Stand-in until the Login screen exists (it's the next build
    // step): reloading resets to a fresh desktop, which is the closest
    // approximation of "back to login" available today. Swap this for
    // real navigation to the login screen once that's built.
    setTimeout(() => window.location.reload(), SHUTDOWN_DURATION_MS);
  };

  if (isShuttingDown) {
    return (
      <main className="flex flex-1 items-center justify-center bg-black">
        <p style={{ fontFamily: "var(--font-terminal)", color: "#fff", fontSize: 20 }}>
          thOS is shutting down&hellip;
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <Desktop theme="dev" wm={wm} className="flex-1" />
      <Taskbar wm={wm} onShutDown={handleShutDown} />
    </main>
  );
}
