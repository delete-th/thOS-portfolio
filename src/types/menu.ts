/**
 * A single dropdown entry. Most entries are decorative-only (per spec:
 * "visually present but non-functional... for authenticity") — the
 * only real behavior is `closesWindow`, wired up by whoever renders
 * the MenuBar (see components/ui/MenuBar.tsx + its `onAction` prop).
 */
export interface MenuAction {
  type: "action";
  label: string;
  /** Shown right-aligned, display-only — not actually bound to a key handler. */
  shortcut?: string;
  /** Decorative items that don't do anything render grayed-out. */
  disabled?: boolean;
  /** Renders a trailing "▶" — visual-only, no real nested flyout. */
  hasSubmenu?: boolean;
  /** The one real action: closes the window this menu bar belongs to. */
  closesWindow?: boolean;
}

export interface MenuSeparator {
  type: "separator";
}

export type MenuEntry = MenuAction | MenuSeparator;

export interface MenuBarMenu {
  /** Top-level label: "File", "Edit", "View", ... */
  label: string;
  items: MenuEntry[];
}
