/** Which theme's folder a project shows up in — dev's "Projects", or sec's "secure_vault". */
export type ProjectTheme = "dev" | "sec";

export interface ProjectLink {
  label: string;
  url: string;
}

/**
 * One project, as shown in ProjectExplorer (dev) / SecureVault (sec)
 * and its own ProjectDetail window. Sourced from real GitHub repos +
 * Thea's own resume — see data/projects.ts for where each field came
 * from per project.
 */
export interface Project {
  /** Slug used in both the folder icon and its detail window's id (`project-detail-${id}`). */
  id: string;
  name: string;
  theme: ProjectTheme;
  role: string;
  /** e.g. "Jan – May 2026" — omitted for projects with no fixed timeframe. */
  period?: string;
  status?: "In Progress";
  summary: string;
  highlights: string[];
  tech: string[];
  links: ProjectLink[];
  /** Folder icon shown in the explorer/vault grid. */
  icon: string;
}
