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
 */
export function DesktopIcon({ label, icon, onOpen, style }: DesktopIconProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={style}
      className="absolute flex w-24 flex-col items-center gap-1 rounded-sm border border-transparent p-1 text-center hover:bg-white/10 focus:outline-none focus-visible:border-dotted focus-visible:border-white/80"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon asset, not content */}
      <img src={icon} alt="" width={40} height={40} draggable={false} />
      <span
        className="text-xs leading-tight text-white"
        style={{
          fontFamily: "var(--font-ui)",
          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
        }}
      >
        {label}
      </span>
    </button>
  );
}
