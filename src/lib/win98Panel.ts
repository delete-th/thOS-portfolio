import type { CSSProperties } from "react";

/**
 * Fully opaque Win98 popup-panel chrome — solid #c0c0c0, no
 * transparency/blur, outer 2px raised border + inset highlight/shadow
 * for the double-bevel look. Shared by every floating panel (Start
 * menu, its Programs submenu, and every program window's menu-bar
 * dropdowns) so they all read as solid panels sitting on top of the
 * desktop, never see-through, and so the look only needs to change in
 * one place.
 */
/**
 * The exact Windows 98/2000 "3D Objects" default color — a warm
 * beige-gray, not pure #c0c0c0. Used for the taskbar itself, the Start
 * button, and taskbar window buttons; everything else (dialogs, the
 * Start menu panel, menu-bar dropdowns) stays classic #c0c0c0.
 */
export const TASKBAR_SURFACE = "#d4d0c8";

export const OPAQUE_PANEL_STYLE: CSSProperties = {
  backgroundColor: "#c0c0c0",
  borderTop: "2px solid #ffffff",
  borderLeft: "2px solid #ffffff",
  borderBottom: "2px solid #808080",
  borderRight: "2px solid #808080",
  boxShadow: "inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #000000",
};
