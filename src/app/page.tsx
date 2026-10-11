"use client";

// Entry point → Boot → Login → Desktop.
//
// The window manager instance lives here (not inside Desktop or
// Taskbar) so both can share it and stay in sync.

import { useEffect, useState } from "react";
import { BootSequence } from "@/components/boot/BootSequence";
import { LoginScreen } from "@/components/login/LoginScreen";
import { Desktop } from "@/components/desktop/Desktop";
import { DesktopBackdrop } from "@/components/desktop/DesktopBackdrop";
import { Taskbar } from "@/components/desktop/Taskbar";
import { FullscreenTooltip } from "@/components/ui/FullscreenTooltip";
import { Assistant } from "@/components/assistant/Assistant";
import { GlitchEffect } from "@/components/effects/GlitchEffect";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useWindowManager } from "@/hooks/useWindowManager";
import { useTheme, type ThemeName } from "@/hooks/useTheme";
import { useSound, useUiClickSounds, useWindowSounds } from "@/hooks/useSound";
import { getActiveDesktopIcons } from "@/lib/activeDesktopIcons";
import { preloadSounds } from "@/lib/sound-manager";

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
  const { play, stop } = useSound();
  const isMobile = useIsMobile();

  useUiClickSounds();
  useWindowSounds(wm.windows);

  // Only the chime is fetched up front — it's needed the moment boot
  // ends. Everything else loads once boot is over (see
  // handleBootComplete), per the spec's "loaded lazily after boot".
  useEffect(() => preloadSounds(["startup"]), []);

  // The fan/hum loop runs for exactly as long as the desktop is up.
  useEffect(() => {
    if (phase !== "desktop") return;
    play("ambient");
    return () => stop("ambient");
  }, [phase, play, stop]);

  const handleBootComplete = () => {
    // If the visitor skipped boot, that click/keypress is the gesture
    // autoplay policies need and the chime plays right away. If boot
    // ran out on its own there's been no gesture yet, and the chime
    // plays on their first click at the login screen instead.
    play("startup");
    preloadSounds();
    setPhase("login");
  };

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

  // Phones get the same content as one scrollable page instead of the
  // OS simulation — no boot, login, or window manager involved.
  if (isMobile) {
    return <MobileLayout theme={theme} onSelectTheme={setTheme} />;
  }

  if (phase === "boot") {
    return <BootSequence onComplete={handleBootComplete} />;
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
        <GlitchEffect key="shutdown" />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <Desktop
        wm={wm}
        icons={getActiveDesktopIcons(theme)}
        backdrop={<DesktopBackdrop theme={theme} />}
        className="flex-1"
      />
      <Taskbar wm={wm} theme={theme} onShutDown={handleShutDown} />
      <Assistant theme={theme} wm={wm} />
      {showFullscreenTip ? (
        <FullscreenTooltip onDismiss={() => setShowFullscreenTip(false)} />
      ) : null}
      {/* Plays once as the desktop appears, then unmounts itself. */}
      <GlitchEffect key="desktop" />
    </main>
  );
}
