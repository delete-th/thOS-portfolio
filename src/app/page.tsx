"use client";

// Entry point → Boot → Login → Desktop.
//
// The window manager instance lives here (not inside Desktop or
// Taskbar) so both can share it and stay in sync. Replaced as the boot
// sequence and login screen land (see thOS-portfolio-spec.md § Build
// order).

import { Desktop } from "@/components/desktop/Desktop";
import { Taskbar } from "@/components/desktop/Taskbar";
import { useWindowManager } from "@/hooks/useWindowManager";

export default function Home() {
  const wm = useWindowManager();

  return (
    <main className="flex flex-1 flex-col">
      <Desktop theme="dev" wm={wm} className="flex-1" />
      <Taskbar wm={wm} />
    </main>
  );
}
