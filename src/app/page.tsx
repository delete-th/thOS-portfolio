"use client";

// Entry point → Boot → Login → Desktop.
//
// The window manager instance lives here (not inside Desktop or
// Taskbar) so both can share it and stay in sync. Replaced as the
// login screen lands (see thOS-portfolio-spec.md § Build order).

import { useState } from "react";
import { BootSequence } from "@/components/boot/BootSequence";
import { Desktop } from "@/components/desktop/Desktop";
import { Taskbar } from "@/components/desktop/Taskbar";
import { useWindowManager } from "@/hooks/useWindowManager";
import { useTheme } from "@/hooks/useTheme";

// How long the shutdown message shows before resetting.
const SHUTDOWN_DURATION_MS = 1600;

export default function Home() {
  const [hasBooted, setHasBooted] = useState(false);
  const wm = useWindowManager();
  const { theme, setTheme } = useTheme("dev");
  const [isShuttingDown, setIsShuttingDown] = useState(false);

  const handleShutDown = () => {
    setIsShuttingDown(true);
    // Stand-in until the Login screen exists (it's the next build
    // step): reloading resets all the way back to the boot sequence —
    // a nice side effect of not persisting `hasBooted` — which is the
    // closest approximation of "back to login" available today. Swap
    // this for real navigation to the login screen once that's built.
    setTimeout(() => window.location.reload(), SHUTDOWN_DURATION_MS);
  };

  if (!hasBooted) {
    return <BootSequence onComplete={() => setHasBooted(true)} />;
  }

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
      <Desktop wm={wm} className="flex-1" />
      <Taskbar wm={wm} onShutDown={handleShutDown} />

      {/* Stand-in for the Login screen's profile picker (next build
          step) — that's what will actually call setTheme in the real
          app. Kept as a small demo-only toggle until then. */}
      <button
        type="button"
        onClick={() => setTheme(theme === "dev" ? "sec" : "dev")}
        className="fixed right-2 top-2 z-[9999] border border-white/40 bg-black/50 px-2 py-1 text-xs text-white"
      >
        theme: {theme} (click to switch)
      </button>
    </main>
  );
}
