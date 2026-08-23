"use client";

import type { CSSProperties } from "react";

export interface DesktopIconProps {
  label: string;
  icon: string;
  onOpen: () => void;
  style?: CSSProperties;
}

/**
 * A single desktop icon: image + label, absolutely positioned by the
 * parent (Desktop computes the position from desktop-config.json's
 * anchor/offset). Per the spec, a single click opens the window —
 * there's no separate "select" state to manage.
 *
 * No visible background/border on the icon itself — real Windows
 * desktop icons float directly on the wallpaper. The only chrome is a
 * navy highlight behind the *label text* while clicking/focusing —
 * never behind the icon image. 98.css styles every <button> with
 * raised 3D dialog-button chrome by default (it's meant for dialog
 * buttons); that's exactly wrong here, so it's reset explicitly below
 * via higher-specificity Tailwind utilities rather than relying on
 * 98.css's bare-element defaults.
 */
export function DesktopIcon({ label, icon, onOpen, style }: DesktopIconProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={style}
      className="group absolute flex w-24 min-w-0 min-h-0 flex-col items-center gap-1 border-0 bg-transparent p-1 shadow-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon asset, not content */}
      <img src={icon} alt="" width={48} height={48} draggable={false} />
      <span
        className="line-clamp-2 max-w-20 break-words rounded-[1px] px-1 text-center leading-tight text-white group-active:bg-[var(--thos-menu-hover-bg)] group-active:text-[var(--thos-menu-hover-fg)] group-focus-visible:bg-[var(--thos-menu-hover-bg)] group-focus-visible:text-[var(--thos-menu-hover-fg)]"
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 15,
          textShadow: "1px 1px 1px rgba(0,0,0,0.9)",
        }}
      >
        {label}
      </span>
    </button>
  );
}
