/** Screen position of a window's top-left corner, in pixels. */
export interface WindowPosition {
  x: number;
  y: number;
}

/** A window's outer dimensions, in pixels. */
export interface WindowSize {
  width: number;
  height: number;
}

/**
 * Full state for one open window, as tracked by the window manager
 * (useWindowManager, added in the next build step). The Window component
 * itself is controlled — it renders this state and reports user intent
 * (move/resize/focus/close/...) back up via callback props rather than
 * owning the state itself.
 */
export interface WindowState {
  id: string;
  title: string;
  /** Path to a small icon shown in the title bar / taskbar button. */
  icon?: string;
  position: WindowPosition;
  size: WindowSize;
  /** Position/size to restore to when un-maximizing. */
  restorePosition?: WindowPosition;
  restoreSize?: WindowSize;
  zIndex: number;
  isFocused: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  minWidth?: number;
  minHeight?: number;
}
