"use client";

import { useEffect, useState } from "react";

export type ThemeName = "dev" | "sec";

/**
 * Owns the active dev/sec theme and keeps `data-thos-theme` in sync on
 * `<html>` — every `--thos-*` custom property in
 * src/styles/themes/*.css is scoped to that attribute, so this single
 * attribute is what switches the whole chrome (window/taskbar colors,
 * menu highlight colors, wallpaper) between profiles at once.
 *
 * No persistence on purpose: which theme is active is meant to be
 * decided by which profile the visitor picks at login (the next build
 * step), not remembered across visits — re-picking a profile each
 * visit is part of the "log in" framing from the spec.
 */
export function useTheme(initialTheme: ThemeName = "dev") {
  const [theme, setTheme] = useState<ThemeName>(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-thos-theme", theme);
  }, [theme]);

  return { theme, setTheme };
}
