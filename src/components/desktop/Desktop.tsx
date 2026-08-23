"use client";

import { useState, type ComponentType, type CSSProperties } from "react";
import { AnimatePresence } from "framer-motion";
import { Window } from "./Window";
import { DesktopIcon } from "./DesktopIcon";
import { MenuBar } from "@/components/ui/MenuBar";
import { ThExplorer } from "@/components/windows/ThExplorer";
import { ThTerminal } from "@/components/windows/ThTerminal";
import { SecureVault } from "@/components/windows/SecureVault";
import { SystemProperties } from "@/components/windows/SystemProperties";
import { MailMe } from "@/components/windows/MailMe";
import { MyComputer } from "@/components/windows/MyComputer";
import { openDesktopWindow } from "@/lib/openDesktopWindow";
import type { useWindowManager } from "@/hooks/useWindowManager";
import type { DesktopIconConfig } from "@/types/desktop";
import type { MenuAction } from "@/types/menu";
import { WINDOW_MENUS } from "@/data/window-menus";

/** The shared prop surface every WINDOW_CONTENT entry is called with. */
interface WindowContentProps {
  wm: ReturnType<typeof useWindowManager>;
  id: string;
  /** The live, theme-filtered desktop icon list — see MyComputer.tsx for why it needs this. */
  icons: DesktopIconConfig[];
}

/**
 * Real content per window id, as each one lands in its own build step.
 * An id with no entry here still opens — Window/MenuBar chrome doesn't
 * depend on this — it just falls back to the generic placeholder body
 * below. Extend this map (not Desktop's JSX) as ProjectExplorer and
 * ResumeViewer get built. Every entry takes the shared
 * {wm, id, icons} — most ignore most of it (structurally fine, a
 * component can decline props it doesn't need), but `id` (MailMe
 * closing itself) and `icons` (MyComputer's Desktop node) are each
 * needed by more than one entry, so it's simpler to share the whole
 * surface than special-case each.
 *
 * secure_vault isn't in this map — it needs `isUnlocked`/`onUnlock`
 * beyond even this shared contract, so it's special-cased directly in
 * the render loop below instead of forcing that extra surface onto
 * every other entry here.
 */
const WINDOW_CONTENT: Record<string, ComponentType<WindowContentProps>> = {
  thexplorer: ThExplorer,
  thterminal: ThTerminal,
  "system-properties": SystemProperties,
  contact: MailMe,
  "my-computer": MyComputer,
};

export interface DesktopProps {
  /**
   * The shared window-manager instance. Owned by a component above
   * Desktop (not Desktop itself) so Taskbar can render buttons for the
   * same window list and share focus/minimize/restore behavior with it.
   */
  wm: ReturnType<typeof useWindowManager>;
  /**
   * Required, not defaulted — the caller (page.tsx) computes this via
   * getActiveDesktopIcons(theme) so thExplorer/thTerminal show the
   * right one for the active profile. Desktop itself stays unaware of
   * which theme is active (see the component doc comment below).
   */
  icons: DesktopIconConfig[];
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
 * Doesn't take a `theme` prop for its own *styling* — `useTheme` (see
 * hooks/useTheme.ts) sets `data-thos-theme` on `<html>`, which every
 * `--thos-*` token in styles/themes/*.css and styles/chrome-theme.css
 * is scoped to. That covers Desktop's own background here *and* the
 * Taskbar/Window chrome that live outside Desktop's subtree, which a
 * locally-set attribute on this div never could. `icons` is the one
 * place theme *does* reach Desktop — which of thExplorer/thTerminal
 * appears is a data/rendering decision CSS alone can't make, so the
 * caller resolves that via getActiveDesktopIcons(theme) before Desktop
 * ever sees it.
 */
export function Desktop({ wm, icons, className }: DesktopProps) {
  const visibleWindows = wm.windows.filter((w) => !w.isMinimized);
  // Lifted above secure_vault's own window — a window's content
  // subtree unmounts on both minimize AND close (see Window/Desktop's
  // AnimatePresence + closeWindow), which would otherwise replay the
  // decrypt animation on every reopen. Living here instead makes it
  // survive for as long as Desktop itself does — i.e. the whole login
  // session, resetting only on the next boot/login, same "session"
  // semantics as everything else that avoids localStorage in this app.
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);

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
          icon={
            icon.id === "secure-vault" && isVaultUnlocked
              ? "/icons/vault-unlocked.svg"
              : icon.icon
          }
          style={anchorStyle(icon)}
          onOpen={() => openDesktopWindow(wm, icon)}
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
            {w.id === "secure-vault" ? (
              <SecureVault
                id={w.id}
                wm={wm}
                isUnlocked={isVaultUnlocked}
                onUnlock={() => setIsVaultUnlocked(true)}
              />
            ) : (
              <WindowContent
                id={w.id}
                wm={wm}
                icons={icons}
                description={icons.find((i) => i.id === w.id)?.description}
              />
            )}
          </Window>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Renders the real content component for `id` if one's landed (see
 * WINDOW_CONTENT above); otherwise the same generic placeholder body
 * used since the Desktop build step, for whichever windows haven't
 * gotten their own component yet.
 */
function WindowContent({
  id,
  wm,
  icons,
  description,
}: WindowContentProps & { description?: string }) {
  const Content = WINDOW_CONTENT[id];
  if (Content) return <Content wm={wm} id={id} icons={icons} />;

  return (
    <p style={{ fontFamily: "var(--thos-content-font, var(--font-ui))" }}>
      {description ?? "Coming soon."}
    </p>
  );
}
