"use client";

import { useEffect } from "react";

export interface FullscreenTooltipProps {
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 5000;

/**
 * A one-time, self-dismissing Win98 balloon-tooltip pointing new
 * visitors at Full Screen mode. The parent (page.tsx) mounts this only
 * once per boot — no localStorage, per spec; a page reload (Shut Down
 * → reboot) is a fresh "session" and shows it again, same reasoning as
 * the boot sequence itself always playing.
 */
export function FullscreenTooltip({ onDismiss }: FullscreenTooltipProps) {
  useEffect(() => {
    const id = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <div
      role="status"
      onClick={onDismiss}
      className="fixed bottom-14 left-1/2 z-[9998] -translate-x-1/2 cursor-pointer px-3 py-2 text-sm"
      style={{
        background: "#ffffe1",
        border: "1px solid #000000",
        color: "#000000",
        fontFamily: "var(--font-ui)",
        boxShadow: "2px 2px 4px rgba(0,0,0,0.3)",
      }}
    >
      💡 Tip: Press F11 or use Start Menu → Full Screen for the best experience
    </div>
  );
}
