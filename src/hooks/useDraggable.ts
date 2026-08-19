"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WindowPosition, WindowSize } from "@/types/window";

interface UseDraggableOptions {
  position: WindowPosition;
  size: WindowSize;
  onMove: (position: WindowPosition) => void;
  onDragStart?: () => void;
  disabled?: boolean;
  /** Minimum px of the window that must stay reachable within the viewport. */
  edgeMargin?: number;
}

interface DragOrigin {
  pointerX: number;
  pointerY: number;
  windowX: number;
  windowY: number;
}

/**
 * Drag-to-move behavior for a window's title bar. Spread the returned
 * `dragHandleProps` onto the title bar element.
 *
 * Tracks the drag with window-level pointermove/pointerup listeners
 * (added only while dragging) rather than relying on
 * setPointerCapture, which several automated input pipelines (and a
 * few older touch browsers) don't retarget reliably.
 */
export function useDraggable({
  position,
  size,
  onMove,
  onDragStart,
  disabled = false,
  edgeMargin = 40,
}: UseDraggableOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const origin = useRef<DragOrigin | null>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!origin.current) return;

      const deltaX = e.clientX - origin.current.pointerX;
      const deltaY = e.clientY - origin.current.pointerY;

      const viewportWidth =
        typeof window !== "undefined" ? window.innerWidth : Infinity;
      const viewportHeight =
        typeof window !== "undefined" ? window.innerHeight : Infinity;

      const minX = -(size.width - edgeMargin);
      const maxX = viewportWidth - edgeMargin;
      const minY = 0;
      const maxY = viewportHeight - edgeMargin;

      onMove({
        x: clamp(origin.current.windowX + deltaX, minX, maxX),
        y: clamp(origin.current.windowY + deltaY, minY, maxY),
      });
    },
    [onMove, size.width, edgeMargin],
  );

  const endDrag = useCallback(() => {
    origin.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [isDragging, onPointerMove, endDrag]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;
      origin.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        windowX: position.x,
        windowY: position.y,
      };
      setIsDragging(true);
      onDragStart?.();
    },
    [disabled, position.x, position.y, onDragStart],
  );

  return {
    isDragging,
    dragHandleProps: { onPointerDown },
  };
}

function clamp(value: number, min: number, max: number): number {
  // min can exceed max for very small viewports/windows; fall back to min.
  return Math.min(Math.max(value, min), Math.max(min, max));
}
