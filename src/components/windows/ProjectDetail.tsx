"use client";

import type { Project } from "@/types/project";

export interface ProjectDetailProps {
  project: Project;
}

/**
 * One project's detail window — opened by double-clicking its folder
 * in ProjectExplorer (dev) or SecureVault's decrypted contents (sec).
 * Both open the exact same window id shape (`project-detail-${id}`),
 * which Desktop.tsx dispatches to this component by looking the id up
 * in data/projects.ts — see its WindowContent function.
 */
export function ProjectDetail({ project }: ProjectDetailProps) {
  return (
    <div className="flex h-full flex-col gap-3 p-3 text-sm" style={{ fontFamily: "var(--font-ui)" }}>
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
        <img src={project.icon} alt="" width={32} height={32} style={{ imageRendering: "pixelated" }} />
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold">{project.name}</span>
            {project.status ? (
              <span
                className="px-1.5 py-0.5 text-xs font-bold"
                style={{ boxShadow: "var(--border-sunken-outer), var(--border-sunken-inner)" }}
              >
                {project.status}
              </span>
            ) : null}
          </div>
          <span className="text-xs opacity-80">
            {project.role}
            {project.period ? ` — ${project.period}` : ""}
          </span>
        </div>
      </div>

      <p>{project.summary}</p>

      {project.highlights.length > 0 ? (
        <fieldset>
          <legend>Highlights</legend>
          <ul className="list-disc pl-4">
            {project.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      <fieldset>
        <legend>Tech Stack</legend>
        <div className="flex flex-wrap gap-1.5 py-1">
          {project.tech.map((t) => (
            <span
              key={t}
              className="px-1.5 py-0.5 text-xs"
              style={{ boxShadow: "var(--border-raised-outer), var(--border-raised-inner)" }}
            >
              {t}
            </span>
          ))}
        </div>
      </fieldset>

      {project.links.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-2">
          {project.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-center text-sm no-underline"
              style={{
                color: "inherit",
                boxShadow: "var(--border-raised-outer), var(--border-raised-inner)",
              }}
            >
              {link.label} &rarr;
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
