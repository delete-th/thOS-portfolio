"use client";

import { type CSSProperties, type ReactNode, useMemo } from "react";
import { motion } from "framer-motion";
import { useDraggable } from "@/hooks/useDraggable";
import { useResizable, type ResizeDirection } from "@/hooks/useResizable";
import type { WindowPosition, WindowSize } from "@/types/window";

export interface WindowProps {
  id: string;
  title: string;
  /** Path to a 16x16 icon shown in the title bar. */
  icon?: string;
  position: WindowPosition;
  size: WindowSize;
  zIndex: number;
  isFocused?: boolean;
  isMaximized?: boolean;
  minWidth?: number;
  minHeight?: number;
  /**
   * Fractional (0-1) transform origin for the open/close animation — pass
   * the desktop icon's position so the window scales up from where it was
   * launched. Defaults to the window's own center.
   */
  originX?: number;
  originY?: number;
  onFocus?: (id: string) => void;
  onClose?: (id: string) => void;
  onMinimize?: (id: string) => void;
  onToggleMaximize?: (id: string) => void;
  onMove: (id: string, position: WindowPosition) => void;
  onResize: (id: string, size: WindowSize, position: WindowPosition) => void;
  /** Optional File/Edit/View/... menu bar, rendered flush below the title bar. */
  menuBar?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const RESIZE_HANDLES: { direction: ResizeDirection; style: CSSProperties }[] = [
  { direction: "n", style: { top: -3, left: 8, right: 8, height: 6, cursor: "ns-resize" } },
  { direction: "s", style: { bottom: -3, left: 8, right: 8, height: 6, cursor: "ns-resize" } },
  { direction: "e", style: { top: 8, bottom: 8, right: -3, width: 6, cursor: "ew-resize" } },
  { direction: "w", style: { top: 8, bottom: 8, left: -3, width: 6, cursor: "ew-resize" } },
  { direction: "ne", style: { top: -3, right: -3, width: 10, height: 10, cursor: "nesw-resize" } },
  { direction: "nw", style: { top: -3, left: -3, width: 10, height: 10, cursor: "nwse-resize" } },
  { direction: "se", style: { bottom: -3, right: -3, width: 10, height: 10, cursor: "nwse-resize" } },
  { direction: "sw", style: { bottom: -3, left: -3, width: 10, height: 10, cursor: "nesw-resize" } },
];

/**
 * A draggable, resizable, 98.css-styled window. Fully controlled — it
 * renders the position/size/focus/maximize state it's given and reports
 * user intent back up via callbacks, rather than owning that state
 * itself. The window manager hook (next build step) is what will own
 * a `WindowState[]` and wire multiple `<Window>`s together with
 * z-index stacking, minimize-to-taskbar, etc.
 *
 * Only mount this component while the window should be visible — a
 * window being "minimized" or "closed" is the parent choosing not to
 * render it (wrap the list in `<AnimatePresence>` to get the close
 * animation on unmount).
 */
export function Window({
  id,
  title,
  icon,
  position,
  size,
  zIndex,
  isFocused = false,
  isMaximized = false,
  minWidth = 240,
  minHeight = 160,
  originX = 0.5,
  originY = 0.5,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onMove,
  onResize,
  menuBar,
  children,
  className,
}: WindowProps) {
  const { dragHandleProps } = useDraggable({
    position,
    size,
    onMove: (next) => onMove(id, next),
    disabled: isMaximized,
  });

  const { getHandleProps } = useResizable({
    position,
    size,
    onResize: (nextSize, nextPosition) => onResize(id, nextSize, nextPosition),
    minWidth,
    minHeight,
    disabled: isMaximized,
  });

  const positionStyle: CSSProperties = useMemo(
    () =>
      isMaximized
        ? { top: 0, left: 0, width: "100%", height: "100%" }
        : {
            top: position.y,
            left: position.x,
            width: size.width,
            height: size.height,
          },
    [isMaximized, position.x, position.y, size.width, size.height],
  );

  return (
    <motion.div
      role="dialog"
      aria-label={title}
      className={`window absolute flex flex-col ${className ?? ""}`}
      style={{
        ...positionStyle,
        zIndex,
        transformOrigin: `${originX * 100}% ${originY * 100}%`,
      }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onPointerDownCapture={() => onFocus?.(id)}
    >
      <div
        className={`title-bar shrink-0 ${isFocused ? "" : "inactive"}`}
        {...dragHandleProps}
        style={{ touchAction: "none" }}
      >
        <div className="title-bar-text flex items-center gap-1">
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element -- fixed 16x16 UI chrome icon, not content
            <img src={icon} alt="" width={16} height={16} />
          ) : null}
          {title}
        </div>
        <div className="title-bar-controls">
          {onMinimize ? (
            <button aria-label="Minimize" onClick={() => onMinimize(id)} />
          ) : null}
          {onToggleMaximize ? (
            <button
              aria-label={isMaximized ? "Restore" : "Maximize"}
              onClick={() => onToggleMaximize(id)}
            />
          ) : null}
          {onClose ? <button aria-label="Close" onClick={() => onClose(id)} /> : null}
        </div>
      </div>

      {menuBar}

      <div className="window-body grow overflow-auto m-0">{children}</div>

      {!isMaximized &&
        RESIZE_HANDLES.map(({ direction, style }) => (
          <div
            key={direction}
            className="absolute"
            style={{ ...style, touchAction: "none" }}
            {...getHandleProps(direction)}
          />
        ))}
    </motion.div>
  );
}
