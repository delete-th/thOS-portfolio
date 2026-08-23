"use client";

import type { CSSProperties } from "react";
import { AnimatePresence } from "framer-motion";
import { Window } from "./Window";
import { DesktopIcon } from "./DesktopIcon";
import { MenuBar } from "@/components/ui/MenuBar";
import type { useWindowManager } from "@/hooks/useWindowManager";
import type { DesktopIconConfig } from "@/types/desktop";
import type { MenuAction } from "@/types/menu";
import desktopIconsData from "@/data/desktop-config.json";
import { WINDOW_MENUS } from "@/data/window-menus";

const DESKTOP_ICONS = desktopIconsData as DesktopIconConfig[];

export interface DesktopProps {
  /**
   * The shared window-manager instance. Owned by a component above
   * Desktop (not Desktop itself) so Taskbar can render buttons for the
   * same window list and share focus/minimize/restore behavior with it.
   */
  wm: ReturnType<typeof useWindowManager>;
  icons?: DesktopIconConfig[];
  className?: string;
}

function anchorStyle(icon: DesktopIconConfig): CSSProperties {
  const style: CSSProperties = {};
  switch (icon.anchor) {
    case "top-left":
      style.top = icon.offsetY;
      style.left = icon.offsetX;
      break;
    case "top-right":
      style.top = icon.offsetY;
      style.right = icon.offsetX;
      break;
    case "bottom-left":
      style.bottom = icon.offsetY;
      style.left = icon.offsetX;
      break;
    case "bottom-right":
      style.bottom = icon.offsetY;
      style.right = icon.offsetX;
      break;
  }
  return style;
}

/**
 * The desktop surface: themed wallpaper, curated (non-grid) icons, and
 * the layer of open windows. Icon positions come from
 * data/desktop-config.json — adding/moving/removing a desktop icon is a
 * data edit, not a component change.
 *
 * Doesn't take a `theme` prop — `useTheme` (see hooks/useTheme.ts) sets
 * `data-thos-theme` on `<html>`, which every `--thos-*` token in
 * styles/themes/*.css and styles/chrome-theme.css is scoped to. That
 * covers Desktop's own background here *and* the Taskbar/Window chrome
 * that live outside Desktop's subtree, which a locally-set attribute
 * on this div never could.
 */
export function Desktop({ wm, icons = DESKTOP_ICONS, className }: DesktopProps) {
  const visibleWindows = wm.windows.filter((w) => !w.isMinimized);

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className ?? ""}`}
      style={{
        backgroundColor: "var(--thos-desktop-bg)",
        backgroundImage: "var(--thos-desktop-wallpaper, none)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        // The wallpaper source images are genuinely low-res (480x360) —
        // this is what keeps the upscale crisp/blocky instead of blurry.
        imageRendering: "pixelated",
      }}
    >
      {icons.map((icon) => (
        <DesktopIcon
          key={icon.id}
          label={icon.label}
          icon={icon.icon}
          style={anchorStyle(icon)}
          onOpen={() =>
            wm.openWindow({
              id: icon.id,
              title: icon.window.title,
              icon: icon.icon,
              size: icon.window.size,
              minWidth: icon.window.minWidth,
              minHeight: icon.window.minHeight,
            })
          }
        />
      ))}

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
            menuBar={
              WINDOW_MENUS[w.id] ? (
                <MenuBar
                  menus={WINDOW_MENUS[w.id]}
                  onAction={(item: MenuAction) => {
                    if (item.closesWindow) wm.closeWindow(w.id);
                  }}
                />
              ) : undefined
            }
          >
            <WindowPlaceholderContent
              description={icons.find((i) => i.id === w.id)?.description}
            />
          </Window>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Stand-in body for every content window until AboutMe/ProjectExplorer/
 * SystemProperties/ResumeViewer/EmailClient land in their own build
 * steps — this is what makes Desktop testable/demoable on its own.
 */
function WindowPlaceholderContent({ description }: { description?: string }) {
  return (
    <p style={{ fontFamily: "var(--thos-content-font, var(--font-ui))" }}>
      {description ?? "Coming soon."}
    </p>
  );
}
