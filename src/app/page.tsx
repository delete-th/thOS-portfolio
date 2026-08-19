"use client";

// Entry point → Boot → Login → Desktop.
//
// The window manager instance lives here (not inside Desktop) so the
// Taskbar, landing in the next build step, can share it and render a
// button per open window. Replaced as the boot sequence and login
// screen land (see thOS-portfolio-spec.md § Build order).

import { Desktop } from "@/components/desktop/Desktop";
import { useWindowManager } from "@/hooks/useWindowManager";

export default function Home() {
  const wm = useWindowManager();

  return (
    <main className="flex flex-1 flex-col">
      <Desktop theme="dev" wm={wm} className="flex-1" />
      {/* Taskbar lands here next, sharing `wm`. */}
    </main>
  );
}
