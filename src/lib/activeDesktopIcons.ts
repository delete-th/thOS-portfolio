import type { DesktopIconConfig } from "@/types/desktop";
import type { ThemeName } from "@/hooks/useTheme";
import desktopIconsData from "@/data/desktop-config.json";

const ALL_ICONS = desktopIconsData as DesktopIconConfig[];

/**
 * The desktop icon set for `theme` — everything except whichever of
 * thExplorer (dev) / thTerminal (sec) doesn't match the active
 * profile. Both entries live in desktop-config.json at the same
 * position, which is what makes them mutually exclusive. Called by
 * both Desktop (icon rendering) and StartMenu (Programs submenu +
 * Documents), so the two can never disagree about which one is
 * "currently on the desktop."
 */
export function getActiveDesktopIcons(theme: ThemeName): DesktopIconConfig[] {
  const excludedId = theme === "dev" ? "thterminal" : "thexplorer";
  return ALL_ICONS.filter((icon) => icon.id !== excludedId);
}
