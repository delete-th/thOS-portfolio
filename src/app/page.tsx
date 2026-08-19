"use client";

// Entry point → Boot → Login → Desktop.
//
// This currently renders a small manual test harness for the Window
// component instead of the real app: drag title bars, resize from any
// edge/corner, focus-to-front, minimize/maximize/close. It gets replaced
// as the window manager, boot sequence, login screen, and desktop land
// (see thOS-portfolio-spec.md § Build order).

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Window } from "@/components/desktop/Window";
import type { WindowPosition, WindowSize, WindowState } from "@/types/window";

const INITIAL_WINDOWS: WindowState[] = [
  {
    id: "about",
    title: "about_me.txt - Notepad",
    position: { x: 120, y: 100 },
    size: { width: 420, height: 280 },
    zIndex: 1,
    isFocused: true,
    isMinimized: false,
    isMaximized: false,
    minWidth: 260,
    minHeight: 180,
  },
  {
    id: "projects",
    title: "Projects",
    position: { x: 480, y: 180 },
    size: { width: 460, height: 320 },
    zIndex: 2,
    isFocused: false,
    isMinimized: false,
    isMaximized: false,
    minWidth: 320,
    minHeight: 220,
  },
];

export default function Home() {
  const [windows, setWindows] = useState<WindowState[]>(INITIAL_WINDOWS);
  const [topZ, setTopZ] = useState(2);

  const focus = (id: string) => {
    const next = topZ + 1;
    setTopZ(next);
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, isFocused: true, zIndex: next }
          : { ...w, isFocused: false },
      ),
    );
  };

  const move = (id: string, position: WindowPosition) =>
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, position } : w)));

  const resize = (id: string, size: WindowSize, position: WindowPosition) =>
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, size, position } : w)),
    );

  const close = (id: string) =>
    setWindows((prev) => prev.filter((w) => w.id !== id));

  const minimize = (id: string) =>
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)),
    );

  const restore = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: false } : w)),
    );
    focus(id);
  };

  const toggleMaximize = (id: string) =>
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)),
    );

  const minimizedWindows = windows.filter((w) => w.isMinimized);

  return (
    <main className="relative flex-1 overflow-hidden bg-teal-700">
      <AnimatePresence>
        {windows
          .filter((w) => !w.isMinimized)
          .map((w) => (
            <Window
              key={w.id}
              id={w.id}
              title={w.title}
              position={w.position}
              size={w.size}
              zIndex={w.zIndex}
              isFocused={w.isFocused}
              isMaximized={w.isMaximized}
              minWidth={w.minWidth}
              minHeight={w.minHeight}
              onFocus={focus}
              onMove={move}
              onResize={resize}
              onClose={close}
              onMinimize={minimize}
              onToggleMaximize={toggleMaximize}
            >
              <p>
                Window component scaffold — drag the title bar, resize from
                any edge or corner, click to focus, minimize / maximize /
                close.
              </p>
            </Window>
          ))}
      </AnimatePresence>

      {minimizedWindows.length > 0 ? (
        <div className="absolute bottom-4 left-4 flex gap-2">
          {minimizedWindows.map((w) => (
            <button key={w.id} onClick={() => restore(w.id)}>
              {w.title}
            </button>
          ))}
        </div>
      ) : null}
    </main>
  );
}
