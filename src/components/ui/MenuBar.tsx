"use client";

import { useEffect, useRef, useState } from "react";
import type { MenuAction, MenuBarMenu } from "@/types/menu";
import { OPAQUE_PANEL_STYLE } from "@/lib/win98Panel";

export interface MenuBarProps {
  menus: MenuBarMenu[];
  /** Called for every non-disabled item clicked, decorative or not. */
  onAction?: (item: MenuAction) => void;
}

const TOP_ITEM_CLASS =
  "min-w-0 min-h-0 border-0 bg-transparent px-2 py-0.5 text-[14px] shadow-none hover:bg-[var(--dialog-blue)] hover:text-white";

/**
 * A classic Win95/98 application menu bar: File/Edit/View/... across
 * the top, click to open a dropdown, click another top-level item to
 * switch to it, click outside or Escape to close. Almost every entry
 * is decorative (spec: "visually present but non-functional... for
 * authenticity") — only entries with `closesWindow` actually do
 * anything, via `onAction`.
 *
 * Outside-click detection uses a document-level pointerdown listener
 * rather than a full-screen backdrop `<div>` — a backdrop would need to
 * sit *below* this bar's own buttons but *above* everything else, and
 * getting that stacking right inside a Window that Framer Motion
 * applies a transform to (which changes the containing block for
 * `position: fixed` descendants) turned out to be fragile in practice.
 * A listener has no such stacking dependency.
 */
export function MenuBar({ menus, onAction }: MenuBarProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openIndex === null) return;

    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenIndex(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openIndex]);

  return (
    <div
      ref={rootRef}
      className="relative flex h-6 shrink-0 items-center border-b"
      style={{ background: "var(--surface)", borderColor: "var(--button-shadow)" }}
    >
      {menus.map((menu, index) => (
        <div key={menu.label} className="relative">
          <button
            type="button"
            className={`${TOP_ITEM_CLASS} ${
              openIndex === index ? "bg-[var(--dialog-blue)] text-white" : ""
            }`}
            onClick={() => setOpenIndex((current) => (current === index ? null : index))}
          >
            {menu.label}
          </button>

          {openIndex === index ? (
            <div
              className="absolute left-0 top-full z-[200] min-w-[180px] py-0.5"
              style={OPAQUE_PANEL_STYLE}
            >
              {menu.items.map((item, itemIndex) =>
                item.type === "separator" ? (
                  <div
                    key={itemIndex}
                    className="mx-1 my-1 h-px"
                    style={{ boxShadow: "var(--border-sunken-outer)" }}
                  />
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                      onAction?.(item);
                      setOpenIndex(null);
                    }}
                    className={`flex w-full min-w-0 min-h-0 items-center justify-between gap-6 border-0 bg-transparent px-2 py-1 text-left text-[13px] shadow-none ${
                      item.disabled
                        ? "text-[var(--button-shadow)]"
                        : "hover:bg-[var(--dialog-blue)] hover:text-white"
                    }`}
                  >
                    <span>
                      {item.label}
                      {item.hasSubmenu ? " ▶" : ""}
                    </span>
                    {item.shortcut ? (
                      <span className="text-xs opacity-80">{item.shortcut}</span>
                    ) : null}
                  </button>
                ),
              )}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
