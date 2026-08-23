import type { MenuBarMenu } from "@/types/menu";

/**
 * Menu bar contents per window id — matches classic Windows 95/98/XP
 * application menus for each program. Almost everything here is
 * decorative (`disabled: true`); only Exit/Close (`closesWindow: true`)
 * does anything. System Properties intentionally has no entry here —
 * the real Win98 dialog didn't have a menu bar either, just tabs and
 * OK/Cancel/Apply.
 *
 * "projects", "secure-vault", and "my-computer" all share the same
 * File Explorer menu (fileExplorerMenus) — they're all Explorer
 * windows, just showing different folders.
 */

const fileExplorerMenus: MenuBarMenu[] = [
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
      { type: "action", label: "Toolbars", hasSubmenu: true, disabled: true },
      { type: "action", label: "Status Bar", disabled: true },
      { type: "action", label: "Explorer Bar", hasSubmenu: true, disabled: true },
      { type: "separator" },
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
    label: "Go",
    items: [
      { type: "action", label: "Back", disabled: true },
      { type: "action", label: "Forward", disabled: true },
      { type: "separator" },
      { type: "action", label: "Home Page", disabled: true },
    ],
  },
  {
    label: "Favorites",
    items: [{ type: "action", label: "(empty)", disabled: true }],
  },
  {
    label: "Tools",
    items: [
      { type: "action", label: "Find", hasSubmenu: true, disabled: true },
      { type: "separator" },
      { type: "action", label: "Map Network Drive...", disabled: true },
      { type: "action", label: "Disconnect Network Drive...", disabled: true },
      { type: "separator" },
      { type: "action", label: "Folder Options...", disabled: true },
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
];

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

  projects: fileExplorerMenus,
  "secure-vault": fileExplorerMenus,
  "my-computer": fileExplorerMenus,

  // Not currently opened by anything (about_me.txt / Notepad was
  // superseded by thExplorer+AskTh) — kept ready for whenever a
  // generic text-file viewer lands, e.g. double-clicking a .txt in My
  // Computer.
  notepad: [
    {
      label: "File",
      items: [
        { type: "action", label: "New", disabled: true },
        { type: "action", label: "Open...", disabled: true },
        { type: "action", label: "Save", disabled: true },
        { type: "action", label: "Save As...", disabled: true },
        { type: "separator" },
        { type: "action", label: "Page Setup...", disabled: true },
        { type: "action", label: "Print...", shortcut: "Ctrl+P", disabled: true },
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
        { type: "action", label: "Delete", shortcut: "Del", disabled: true },
        { type: "separator" },
        { type: "action", label: "Find...", shortcut: "Ctrl+F", disabled: true },
        { type: "action", label: "Find Next", shortcut: "F3", disabled: true },
        { type: "action", label: "Replace...", shortcut: "Ctrl+H", disabled: true },
        { type: "action", label: "Go To...", shortcut: "Ctrl+G", disabled: true },
        { type: "separator" },
        { type: "action", label: "Select All", shortcut: "Ctrl+A", disabled: true },
        { type: "action", label: "Time/Date", shortcut: "F5", disabled: true },
      ],
    },
    {
      label: "Format",
      items: [
        { type: "action", label: "Word Wrap", disabled: true },
        { type: "action", label: "Font...", disabled: true },
      ],
    },
    {
      label: "View",
      items: [{ type: "action", label: "Status Bar", disabled: true }],
    },
    {
      label: "Help",
      items: [
        { type: "action", label: "Help Topics", disabled: true },
        { type: "separator" },
        { type: "action", label: "About Notepad", disabled: true },
      ],
    },
  ],

  resume: [
    {
      label: "File",
      items: [
        { type: "action", label: "Open...", disabled: true },
        { type: "separator" },
        { type: "action", label: "Print...", shortcut: "Ctrl+P", disabled: true },
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
        { type: "action", label: "Fit Width", disabled: true },
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

  // "contact" is MailMe's window id (kept as-is — only the displayed
  // label/title/About text changed to "MailMe", see desktop-config.json
  // and MailMe.tsx) so nothing else that already references this id
  // needs to change.
  contact: [
    {
      label: "File",
      items: [
        { type: "action", label: "New", hasSubmenu: true, disabled: true },
        { type: "separator" },
        { type: "action", label: "Save", shortcut: "Ctrl+S", disabled: true },
        { type: "separator" },
        { type: "action", label: "Print...", shortcut: "Ctrl+P", disabled: true },
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
      ],
    },
    {
      label: "Tools",
      items: [
        { type: "action", label: "Address Book...", disabled: true },
        { type: "separator" },
        { type: "action", label: "Accounts...", disabled: true },
      ],
    },
    {
      label: "Help",
      items: [
        { type: "action", label: "Help Topics", disabled: true },
        { type: "separator" },
        { type: "action", label: "About MailMe", disabled: true },
      ],
    },
  ],
};
