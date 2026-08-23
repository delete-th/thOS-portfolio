"use client";

import { useFullscreen } from "@/hooks/useFullscreen";

/**
 * A small floating fullscreen toggle, fixed to the top-right corner —
 * replaces the old Start Menu → Full Screen entry (that's a menu you
 * have to open just to toggle a display mode you want reachable in one
 * click). Sits just below the CRT overlay's z-index (see crt.css) so
 * the scanline/vignette effect still reads over this icon too — that
 * overlay is pointer-events:none anyway, so it never blocks the click.
 */
export function FullscreenToggle() {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      title="Toggle Fullscreen (F11)"
      className="fixed flex min-h-0 min-w-0 items-center justify-center border-0 bg-transparent p-0 shadow-none transition-opacity duration-150 hover:opacity-100"
      style={{
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        zIndex: 99998,
        opacity: 0.4,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI chrome icon */}
      <img
        src={isFullscreen ? "/icons/fullscreen-exit.svg" : "/icons/fullscreen.svg"}
        alt=""
        width={16}
        height={16}
        style={{ imageRendering: "pixelated" }}
      />
    </button>
  );
}
