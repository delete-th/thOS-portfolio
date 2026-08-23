"use client";

// Entry point → Boot → Login → Desktop.
//
// The window manager instance lives here (not inside Desktop or
// Taskbar) so both can share it and stay in sync.

import { useState } from "react";
import { BootSequence } from "@/components/boot/BootSequence";
import { LoginScreen } from "@/components/login/LoginScreen";
import { Desktop } from "@/components/desktop/Desktop";
import { Taskbar } from "@/components/desktop/Taskbar";
import { FullscreenTooltip } from "@/components/ui/FullscreenTooltip";
import { useWindowManager } from "@/hooks/useWindowManager";
import { useTheme, type ThemeName } from "@/hooks/useTheme";
import { getActiveDesktopIcons } from "@/lib/activeDesktopIcons";

type Phase = "boot" | "login" | "welcome" | "desktop" | "shutdown";

// How long the brief "Welcome, <user>..." / "thOS is shutting down..."
// transition screens hold before moving on.
const WELCOME_DURATION_MS = 700;
const SHUTDOWN_DURATION_MS = 1600;

export default function Home() {
  const [phase, setPhase] = useState<Phase>("boot");
  const wm = useWindowManager();
  const { theme, setTheme } = useTheme("dev");
  // Shown once when the desktop first appears each boot — no
  // localStorage per spec; a reload (Shut Down) is a fresh "session"
  // and shows it again, same reasoning the boot sequence itself uses.
  const [showFullscreenTip, setShowFullscreenTip] = useState(true);

  const handleSelectProfile = (selected: ThemeName) => {
    setTheme(selected);
    setPhase("welcome");
    setTimeout(() => setPhase("desktop"), WELCOME_DURATION_MS);
  };

  const handleShutDown = () => {
    setPhase("shutdown");
    // No login/desktop state is persisted anywhere, so a reload lands
    // back on "boot" naturally — the same full Boot → Login loop a real
    // reboot would give you.
    setTimeout(() => window.location.reload(), SHUTDOWN_DURATION_MS);
  };

  if (phase === "boot") {
    return <BootSequence onComplete={() => setPhase("login")} />;
  }

  if (phase === "login") {
    return <LoginScreen onSelectProfile={handleSelectProfile} />;
  }

  if (phase === "welcome") {
    return (
      <main className="flex flex-1 items-center justify-center bg-black">
        <p style={{ fontFamily: "var(--font-terminal)", color: "#fff", fontSize: 20 }}>
          Welcome, {theme === "dev" ? "delete-th_dev" : "delete-th_sec"}&hellip;
        </p>
      </main>
    );
  }

  if (phase === "shutdown") {
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
      <Desktop wm={wm} icons={getActiveDesktopIcons(theme)} className="flex-1" />
      <Taskbar wm={wm} theme={theme} onShutDown={handleShutDown} />
      {showFullscreenTip ? (
        <FullscreenTooltip onDismiss={() => setShowFullscreenTip(false)} />
      ) : null}
    </main>
  );
}
