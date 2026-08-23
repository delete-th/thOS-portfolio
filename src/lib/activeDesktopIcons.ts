import type { DesktopIconConfig } from "@/types/desktop";
import type { ThemeName } from "@/hooks/useTheme";
import desktopIconsData from "@/data/desktop-config.json";

const ALL_ICONS = desktopIconsData as DesktopIconConfig[];

/**
 * Desktop icon ids that only exist on one theme, paired with whichever
 * id replaces them on the other — both live in desktop-config.json at
 * the same position, which is what makes each pair mutually exclusive.
 * Add a row here for any future theme-swapped icon; nothing else needs
 * to change (Desktop and StartMenu both derive from this list rather
 * than hardcoding ids).
 */
const THEME_SWAPPED_PAIRS: { dev: string; sec: string }[] = [
  { dev: "thexplorer", sec: "thterminal" },
  { dev: "projects", sec: "secure-vault" },
];

/**
 * The desktop icon set for `theme` — everything except whichever half
 * of each THEME_SWAPPED_PAIRS row doesn't match the active profile.
 * Called by both Desktop (icon rendering) and StartMenu (Programs
 * submenu + Documents), so the two can never disagree about which
 * icons are "currently on the desktop."
 */
export function getActiveDesktopIcons(theme: ThemeName): DesktopIconConfig[] {
  const excludedIds = new Set(THEME_SWAPPED_PAIRS.map((pair) => pair[theme === "dev" ? "sec" : "dev"]));
  return ALL_ICONS.filter((icon) => !excludedIds.has(icon.id));
}
