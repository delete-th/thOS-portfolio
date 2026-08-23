import type { MenuBarMenu } from "@/types/menu";

/**
 * Menu bar contents per window id — matches classic Windows 95/98
 * application menus for each program. Almost everything here is
 * decorative (`disabled: true`); only Exit/Close (`closesWindow: true`)
 * does anything. System Properties intentionally has no entry here —
 * the real Win98 dialog didn't have a menu bar either, just tabs and
 * OK/Cancel/Apply.
 */
export const WINDOW_MENUS: Record<string, MenuBarMenu[]> = {
  // Back/Forward/Home *do* work, but only from ThExplorerNavBar's own
  // toolbar buttons — these menu entries stay decorative like every
  // other menu bar in the app, per spec ("All decorative/non-functional
  // except Close").
  thexplorer: [
    {
      label: "File",
      items: [
        { type: "action", label: "New Window", disabled: true },
        { type: "separator" },
        { type: "action", label: "Print", shortcut: "Ctrl+P", disabled: true },
        { type: "separator" },
        { type: "action", label: "Close", closesWindow: true },
      ],
    },
    {
      label: "Edit",
      items: [
        { type: "action", label: "Cut", shortcut: "Ctrl+X", disabled: true },
        { type: "action", label: "Copy", shortcut: "Ctrl+C", disabled: true },
        { type: "action", label: "Paste", shortcut: "Ctrl+V", disabled: true },
        { type: "separator" },
        { type: "action", label: "Select All", shortcut: "Ctrl+A", disabled: true },
      ],
    },
    {
      label: "View",
      items: [
        { type: "action", label: "Toolbar", disabled: true },
        { type: "action", label: "Status Bar", disabled: true },
        { type: "separator" },
        { type: "action", label: "Text Size", hasSubmenu: true, disabled: true },
        { type: "separator" },
        { type: "action", label: "Source", disabled: true },
      ],
    },
    {
      label: "Go",
      items: [
        { type: "action", label: "Back", disabled: true },
        { type: "action", label: "Forward", disabled: true },
        { type: "action", label: "Home Page", disabled: true },
      ],
    },
    {
      label: "Help",
      items: [
        { type: "action", label: "Help Topics", disabled: true },
        { type: "separator" },
        { type: "action", label: "About thExplorer", disabled: true },
      ],
    },
  ],

  projects: [
    {
      label: "File",
      items: [
        { type: "action", label: "New", hasSubmenu: true, disabled: true },
        { type: "separator" },
        { type: "action", label: "Delete", disabled: true },
        { type: "action", label: "Rename", disabled: true },
        { type: "action", label: "Properties", disabled: true },
        { type: "separator" },
        { type: "action", label: "Close", closesWindow: true },
      ],
    },
    {
      label: "Edit",
      items: [
        { type: "action", label: "Undo", shortcut: "Ctrl+Z", disabled: true },
        { type: "separator" },
        { type: "action", label: "Cut", shortcut: "Ctrl+X", disabled: true },
        { type: "action", label: "Copy", shortcut: "Ctrl+C", disabled: true },
        { type: "action", label: "Paste", shortcut: "Ctrl+V", disabled: true },
        { type: "separator" },
        { type: "action", label: "Select All", shortcut: "Ctrl+A", disabled: true },
        { type: "action", label: "Invert Selection", disabled: true },
      ],
    },
    {
      label: "View",
      items: [
        { type: "action", label: "Large Icons", disabled: true },
        { type: "action", label: "Small Icons", disabled: true },
        { type: "action", label: "List", disabled: true },
        { type: "action", label: "Details", disabled: true },
        { type: "separator" },
        { type: "action", label: "Arrange Icons", hasSubmenu: true, disabled: true },
        { type: "separator" },
        { type: "action", label: "Refresh", shortcut: "F5", disabled: true },
      ],
    },
    {
      label: "Help",
      items: [
        { type: "action", label: "Help Topics", disabled: true },
        { type: "separator" },
        { type: "action", label: "About thOS", disabled: true },
      ],
    },
  ],

  resume: [
    {
      label: "File",
      items: [
        { type: "action", label: "Open...", disabled: true },
        { type: "separator" },
        { type: "action", label: "Page Setup...", disabled: true },
        { type: "action", label: "Print", shortcut: "Ctrl+P", disabled: true },
        { type: "separator" },
        { type: "action", label: "Exit", closesWindow: true },
      ],
    },
    {
      label: "View",
      items: [
        { type: "action", label: "Zoom In", shortcut: "Ctrl++", disabled: true },
        { type: "action", label: "Zoom Out", shortcut: "Ctrl+-", disabled: true },
        { type: "separator" },
        { type: "action", label: "Actual Size", disabled: true },
      ],
    },
    {
      label: "Help",
      items: [
        { type: "action", label: "Help Topics", disabled: true },
        { type: "separator" },
        { type: "action", label: "About Document Viewer", disabled: true },
      ],
    },
  ],

  contact: [
    {
      label: "File",
      items: [
        { type: "action", label: "New Mail", shortcut: "Ctrl+N", disabled: true },
        { type: "separator" },
        { type: "action", label: "Save", shortcut: "Ctrl+S", disabled: true },
        { type: "separator" },
        { type: "action", label: "Print", shortcut: "Ctrl+P", disabled: true },
        { type: "separator" },
        { type: "action", label: "Exit", closesWindow: true },
      ],
    },
    {
      label: "Edit",
      items: [
        { type: "action", label: "Undo", shortcut: "Ctrl+Z", disabled: true },
        { type: "separator" },
        { type: "action", label: "Cut", shortcut: "Ctrl+X", disabled: true },
        { type: "action", label: "Copy", shortcut: "Ctrl+C", disabled: true },
        { type: "action", label: "Paste", shortcut: "Ctrl+V", disabled: true },
        { type: "action", label: "Select All", shortcut: "Ctrl+A", disabled: true },
      ],
    },
    {
      label: "View",
      items: [
        { type: "action", label: "Toolbar", disabled: true },
        { type: "action", label: "Status Bar", disabled: true },
        { type: "separator" },
        { type: "action", label: "Font Size", hasSubmenu: true, disabled: true },
      ],
    },
    {
      label: "Tools",
      items: [
        { type: "action", label: "Address Book", disabled: true },
        { type: "separator" },
        { type: "action", label: "Accounts...", disabled: true },
      ],
    },
    {
      label: "Help",
      items: [
        { type: "action", label: "Help Topics", disabled: true },
        { type: "separator" },
        { type: "action", label: "About thOS Mail", disabled: true },
      ],
    },
  ],
};
