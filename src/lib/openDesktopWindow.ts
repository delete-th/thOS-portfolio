import type { useWindowManager } from "@/hooks/useWindowManager";
import type { DesktopIconConfig } from "@/types/desktop";

/**
 * Opens a window using exactly the title/icon/size a desktop icon
 * itself would use — the same call shape that used to be duplicated in
 * Desktop.tsx (icon click) and StartMenu.tsx (Documents/Programs
 * items). Now also used by AskThContentPage's "Open in File Explorer"
 * / "Open Email Client" CTAs, so all three routes to "open this window
 * as if its icon were clicked" stay in sync.
 */
export function openDesktopWindow(
  wm: ReturnType<typeof useWindowManager>,
  icon: DesktopIconConfig,
) {
  wm.openWindow({
    id: icon.id,
    title: icon.window.title,
    icon: icon.icon,
    size: icon.window.size,
    minWidth: icon.window.minWidth,
    minHeight: icon.window.minHeight,
  });
}
