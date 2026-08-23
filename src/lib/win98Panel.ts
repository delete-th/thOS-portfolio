import type { CSSProperties } from "react";

/**
 * The taskbar's own surface color — dev's is the exact Windows
 * 98/2000 "3D Objects" beige (#d4d0c8, not pure #c0c0c0); sec's is a
 * near-black instead. Theme-reactive via the CSS custom property
 * (see styles/themes/*.css) rather than a fixed value, so it still
 * needs setting in exactly one place per theme. Used for the taskbar
 * itself, the Start button, and taskbar window buttons.
 */
export const TASKBAR_SURFACE = "var(--thos-taskbar-bg)";

/**
 * Fully opaque Win98 popup-panel chrome — no transparency/blur, outer
 * 2px raised border + inset highlight/shadow for the double-bevel
 * look. Shared by every floating panel (Start menu, its Programs
 * submenu, and every program window's menu-bar dropdowns) so they all
 * read as solid panels sitting on top of the desktop, never
 * see-through, and so the look only needs to change in one place.
 * Background/text color are theme-reactive (dev: classic #c0c0c0/
 * black; sec: dark/terminal-green) — the border/bevel colors stay
 * fixed across themes, a dark panel with a light 3D bevel still reads
 * fine and keeps this simpler.
 */
export const OPAQUE_PANEL_STYLE: CSSProperties = {
  backgroundColor: "var(--thos-panel-bg)",
  color: "var(--thos-panel-fg)",
  borderTop: "2px solid #ffffff",
  borderLeft: "2px solid #ffffff",
  borderBottom: "2px solid #808080",
  borderRight: "2px solid #808080",
  boxShadow: "inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #000000",
};
