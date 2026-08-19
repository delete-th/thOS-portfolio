"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WindowPosition, WindowSize } from "@/types/window";

export type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface UseResizableOptions {
  position: WindowPosition;
  size: WindowSize;
  onResize: (size: WindowSize, position: WindowPosition) => void;
  minWidth?: number;
  minHeight?: number;
  disabled?: boolean;
}

interface ResizeOrigin {
  pointerX: number;
  pointerY: number;
  size: WindowSize;
  position: WindowPosition;
  direction: ResizeDirection;
}

/**
 * Resize-from-edge/corner behavior for a window. Call `getHandleProps(dir)`
 * for each of the 8 resize handles and spread the result onto that
 * handle's element.
 *
 * Like useDraggable, this tracks the drag with window-level
 * pointermove/pointerup listeners rather than setPointerCapture.
 */
export function useResizable({
  position,
  size,
  onResize,
  minWidth = 240,
  minHeight = 160,
  disabled = false,
}: UseResizableOptions) {
  const [activeDirection, setActiveDirection] = useState<ResizeDirection | null>(
    null,
  );
  const origin = useRef<ResizeOrigin | null>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!origin.current) return;

      const deltaX = e.clientX - origin.current.pointerX;
      const deltaY = e.clientY - origin.current.pointerY;
      const dir = origin.current.direction;

      let width = origin.current.size.width;
      let height = origin.current.size.height;
      let x = origin.current.position.x;
      let y = origin.current.position.y;

      if (dir.includes("e")) width = origin.current.size.width + deltaX;
      if (dir.includes("s")) height = origin.current.size.height + deltaY;
      if (dir.includes("w")) {
        width = origin.current.size.width - deltaX;
        x = origin.current.position.x + deltaX;
      }
      if (dir.includes("n")) {
        height = origin.current.size.height - deltaY;
        y = origin.current.position.y + deltaY;
      }

      // Clamp to the minimum, keeping the *opposite* edge anchored in place.
      if (width < minWidth) {
        if (dir.includes("w")) x -= minWidth - width;
        width = minWidth;
      }
      if (height < minHeight) {
        if (dir.includes("n")) y -= minHeight - height;
        height = minHeight;
      }

      onResize({ width, height }, { x, y });
    },
    [onResize, minWidth, minHeight],
  );

  const endResize = useCallback(() => {
    origin.current = null;
    setActiveDirection(null);
  }, []);

  useEffect(() => {
    if (!activeDirection) return;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endResize);
    window.addEventListener("pointercancel", endResize);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endResize);
      window.removeEventListener("pointercancel", endResize);
    };
  }, [activeDirection, onPointerMove, endResize]);

  const getHandleProps = useCallback(
    (direction: ResizeDirection) => ({
      onPointerDown: (e: React.PointerEvent) => {
        if (disabled || e.button !== 0) return;
        e.stopPropagation();
        origin.current = {
          pointerX: e.clientX,
          pointerY: e.clientY,
          size,
          position,
          direction,
        };
        setActiveDirection(direction);
      },
    }),
    [disabled, size, position],
  );

  return { getHandleProps, isResizing: activeDirection !== null, activeDirection };
}
