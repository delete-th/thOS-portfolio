"use client";

import { getProjectsByTheme } from "@/data/projects";
import type { useWindowManager } from "@/hooks/useWindowManager";

export interface ProjectExplorerProps {
  wm: ReturnType<typeof useWindowManager>;
}

const DEV_PROJECTS = getProjectsByTheme("dev");

/**
 * The "Projects" window's real content (dev theme only — sec's
 * equivalent is SecureVault, which renders the same sec-tagged half of
 * data/projects.ts through its own vault-themed grid instead of this
 * component). A single-level icon grid, not a tree — there's no real
 * subfolder hierarchy to navigate, just this folder's contents, so it
 * skips the toolbar/address-bar chrome MyComputer needs for that.
 */
export function ProjectExplorer({ wm }: ProjectExplorerProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-3" style={{ background: "#ffffff", color: "#000000" }}>
        <div className="flex flex-wrap gap-4">
          {DEV_PROJECTS.map((project) => (
            <button
              key={project.id}
              type="button"
              onDoubleClick={() =>
                wm.openWindow({
                  id: `project-detail-${project.id}`,
                  title: project.name,
                  icon: project.icon,
                  size: { width: 480, height: 460 },
                  minWidth: 360,
                  minHeight: 320,
                })
              }
              className="flex w-24 min-w-0 min-h-0 flex-col items-center gap-1 border-0 bg-transparent p-1 text-center shadow-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
              <img
                src={project.icon}
                alt=""
                width={40}
                height={40}
                style={{ imageRendering: "pixelated" }}
              />
              <span className="line-clamp-2 text-xs" style={{ fontFamily: "var(--font-ui)" }}>
                {project.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="flex h-5 shrink-0 items-center px-2 text-[11px]"
        style={{
          background: "var(--thos-taskbar-bg, #c0c0c0)",
          borderTop: "1px solid var(--button-shadow)",
          fontFamily: "var(--font-ui)",
        }}
      >
        {DEV_PROJECTS.length} object{DEV_PROJECTS.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
