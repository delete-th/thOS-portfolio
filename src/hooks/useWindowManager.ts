"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { WindowPosition, WindowSize, WindowState } from "@/types/window";

export interface OpenWindowOptions {
  id: string;
  title: string;
  icon?: string;
  position?: WindowPosition;
  size?: WindowSize;
  minWidth?: number;
  minHeight?: number;
}

const DEFAULT_POSITION: WindowPosition = { x: 120, y: 100 };
const DEFAULT_SIZE: WindowSize = { width: 420, height: 300 };
const CASCADE_STEP = 24;
const CASCADE_WRAP = 6;

/**
 * Owns the open-window list: z-index stacking, focus, minimize/restore,
 * maximize/restore, move, resize, retitle, open (single-instance per id
 * — opening an id that's already open focuses/restores it instead of
 * duplicating), and close.
 *
 * The Window component itself stays fully controlled and stateless; this
 * hook is what turns a handful of `<Window>`s into an actual multi-window
 * desktop. Desktop.tsx (next build step) calls `openWindow` from icon
 * clicks and Taskbar.tsx renders one button per entry in `windows`.
 */
export function useWindowManager() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const zCounter = useRef(0);

  const bringToFront = useCallback(
    (list: WindowState[], id: string): WindowState[] => {
      zCounter.current += 1;
      const zIndex = zCounter.current;
      return list.map((w) =>
        w.id === id ? { ...w, isFocused: true, zIndex } : { ...w, isFocused: false },
      );
    },
    [],
  );

  const focusWindow = useCallback(
    (id: string) => setWindows((prev) => bringToFront(prev, id)),
    [bringToFront],
  );

  const openWindow = useCallback(
    (options: OpenWindowOptions) => {
      setWindows((prev) => {
        const existing = prev.find((w) => w.id === options.id);
        if (existing) {
          return bringToFront(prev, options.id).map((w) =>
            w.id === options.id ? { ...w, isMinimized: false } : w,
          );
        }

        zCounter.current += 1;
        const cascadeIndex = prev.length % CASCADE_WRAP;
        const basePosition = options.position ?? DEFAULT_POSITION;
        const position = options.position ?? {
          x: basePosition.x + cascadeIndex * CASCADE_STEP,
          y: basePosition.y + cascadeIndex * CASCADE_STEP,
        };

        const newWindow: WindowState = {
          id: options.id,
          title: options.title,
          icon: options.icon,
          position,
          size: options.size ?? DEFAULT_SIZE,
          zIndex: zCounter.current,
          isFocused: true,
          isMinimized: false,
          isMaximized: false,
          minWidth: options.minWidth,
          minHeight: options.minHeight,
        };

        return [...prev.map((w) => ({ ...w, isFocused: false })), newWindow];
      });
    },
    [bringToFront],
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true, isFocused: false } : w)),
    );
  }, []);

  const restoreWindow = useCallback(
    (id: string) =>
      setWindows((prev) =>
        bringToFront(
          prev.map((w) => (w.id === id ? { ...w, isMinimized: false } : w)),
          id,
        ),
      ),
    [bringToFront],
  );

  const toggleMaximize = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (w.isMaximized) {
          return {
            ...w,
            isMaximized: false,
            position: w.restorePosition ?? w.position,
            size: w.restoreSize ?? w.size,
          };
        }
        return {
          ...w,
          isMaximized: true,
          restorePosition: w.position,
          restoreSize: w.size,
        };
      }),
    );
  }, []);

  const setWindowTitle = useCallback((id: string, title: string) => {
    setWindows((prev) => {
      const target = prev.find((w) => w.id === id);
      // Bail out with the *same* array reference when the title's
      // already correct — not just an optimization: `wm`'s own memo
      // (below) depends on `windows`, so a caller whose effect depends
      // on `wm` and unconditionally calls setWindowTitle on every
      // render (see SecureVault.tsx) would otherwise loop forever —
      // new windows array -> new `wm` -> effect refires -> new windows
      // array... React only skips the re-render when a state updater
      // returns the exact previous reference, which requires this
      // check to happen here, not in the caller.
      if (!target || target.title === title) return prev;
      return prev.map((w) => (w.id === id ? { ...w, title } : w));
    });
  }, []);

  const moveWindow = useCallback((id: string, position: WindowPosition) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, position } : w)));
  }, []);

  const resizeWindow = useCallback(
    (id: string, size: WindowSize, position: WindowPosition) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, size, position } : w)),
      );
    },
    [],
  );

  // Memoized so `wm` itself is referentially stable across renders
  // where `windows` hasn't changed (every function above is already
  // its own stable useCallback) — lets a consumer safely depend on
  // e.g. `wm.setWindowTitle` in an effect without ESLint flagging a
  // missing `wm` dependency (see SecureVault.tsx), and without that
  // dependency actually firing on every unrelated parent re-render.
  return useMemo(
    () => ({
      windows,
      openWindow,
      closeWindow,
      focusWindow,
      minimizeWindow,
      restoreWindow,
      toggleMaximize,
      moveWindow,
      resizeWindow,
      setWindowTitle,
    }),
    [
      windows,
      openWindow,
      closeWindow,
      focusWindow,
      minimizeWindow,
      restoreWindow,
      toggleMaximize,
      moveWindow,
      resizeWindow,
      setWindowTitle,
    ],
  );
}
