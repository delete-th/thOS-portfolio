"use client";

// Entry point → Boot → Login → Desktop.
//
// This currently renders a small manual test harness for the window
// system instead of the real app: two "desktop icon" stand-in buttons
// open windows via useWindowManager (opening an already-open id
// focuses/restores it rather than duplicating it), plus a taskbar
// stand-in for minimized windows. Replaced as the boot sequence, login
// screen, and real desktop land (see thOS-portfolio-spec.md § Build
// order).

import { AnimatePresence } from "framer-motion";
import { Window } from "@/components/desktop/Window";
import { useWindowManager, type OpenWindowOptions } from "@/hooks/useWindowManager";

const DEMO_ICONS: OpenWindowOptions[] = [
  {
    id: "about",
    title: "about_me.txt - Notepad",
    position: { x: 120, y: 100 },
    size: { width: 420, height: 280 },
    minWidth: 260,
    minHeight: 180,
  },
  {
    id: "projects",
    title: "Projects",
    position: { x: 480, y: 180 },
    size: { width: 460, height: 320 },
    minWidth: 320,
    minHeight: 220,
  },
];

export default function Home() {
  const wm = useWindowManager();

  const visibleWindows = wm.windows.filter((w) => !w.isMinimized);
  const minimizedWindows = wm.windows.filter((w) => w.isMinimized);

  return (
    <main className="relative flex-1 overflow-hidden bg-teal-700">
      <div className="absolute top-4 left-4 z-[9999] flex gap-2">
        {DEMO_ICONS.map((icon) => (
          <button key={icon.id} onClick={() => wm.openWindow(icon)}>
            Open &ldquo;{icon.title}&rdquo;
          </button>
        ))}
      </div>

      <AnimatePresence>
        {visibleWindows.map((w) => (
          <Window
            key={w.id}
            id={w.id}
            title={w.title}
            icon={w.icon}
            position={w.position}
            size={w.size}
            zIndex={w.zIndex}
            isFocused={w.isFocused}
            isMaximized={w.isMaximized}
            minWidth={w.minWidth}
            minHeight={w.minHeight}
            onFocus={wm.focusWindow}
            onMove={wm.moveWindow}
            onResize={wm.resizeWindow}
            onClose={wm.closeWindow}
            onMinimize={wm.minimizeWindow}
            onToggleMaximize={wm.toggleMaximize}
          >
            <p>
              Window manager scaffold — open the same icon twice to see it
              focus/restore instead of duplicating.
            </p>
          </Window>
        ))}
      </AnimatePresence>

      {minimizedWindows.length > 0 ? (
        <div className="absolute bottom-4 right-4 flex gap-2">
          {minimizedWindows.map((w) => (
            <button key={w.id} onClick={() => wm.restoreWindow(w.id)}>
              {w.title}
            </button>
          ))}
        </div>
      ) : null}
    </main>
  );
}
