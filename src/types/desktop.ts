import type { WindowSize } from "./window";

/** Which corner a desktop icon's position is measured from. */
export type DesktopIconAnchor = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface DesktopIconWindowConfig {
  title: string;
  size: WindowSize;
  minWidth?: number;
  minHeight?: number;
}

/**
 * One curated desktop icon, as stored in data/desktop-config.json.
 * Position is anchor + pixel offset (not a raw x/y) so placements like
 * "Recycle Bin in the bottom-right corner" stay put as the viewport
 * resizes, without any JS measurement.
 */
export interface DesktopIconConfig {
  id: string;
  label: string;
  /** Path under /public, e.g. "/icons/folder.svg". */
  icon: string;
  anchor: DesktopIconAnchor;
  offsetX: number;
  offsetY: number;
  /** Shown in the placeholder window body until the real content component lands. */
  description: string;
  window: DesktopIconWindowConfig;
}
