"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Tracks whether the whole page is in the browser's real Fullscreen
 * API mode, and exposes a toggle. `fullscreenchange` covers every way
 * fullscreen can end that isn't our own toggle call — Escape, browser
 * chrome, etc. — so `isFullscreen` never goes stale.
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen not supported, or denied without a user gesture —
        // nothing to recover from here, just stay windowed.
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}
