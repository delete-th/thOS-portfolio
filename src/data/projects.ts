import type { Project } from "@/types/project";

/**
 * Real project data — one list, filtered by theme where it's shown
 * (see PROJECTS_BY_THEME below), same split as
 * lib/activeDesktopIcons.ts's THEME_SWAPPED_PAIRS: dev's "Projects"
 * folder and sec's "secure_vault" are the same conceptual folder, just
 * differently skinned, so they show different halves of one list
 * rather than needing two.
 *
 * Sourced from github.com/delete-th's real repos (READMEs, on each
 * repo's `develop` branch where one exists, per direct instruction —
 * that's where most of the actual code/docs live) plus Thea's own
 * resume for role/period on the ones it covers. Nothing here is
 * invented — a project with no confirmed role/period just omits that
 * field rather than guessing one.
 */
export const PROJECTS: Project[] = [
  // --- sec theme: secure_vault ---
  {
    id: "scure",
    name: "Scure",
    theme: "sec",
    role: "Team Leader & Back-end Developer",
    period: "Jan – May 2026",
    summary:
      "A mobile-first URL security scanner — paste a link, scan a QR code, or point the camera at text containing one, and Scure runs it through multiple threat-intel engines plus an AI risk analysis for a plain-English clean / suspicious / malicious verdict.",
    highlights: [
      "Built a React Native (Expo) mobile app scanning URLs via camera, QR, or manual input, with on-device OCR and barcode detection.",
      "Engineered the Node.js/Express backend combining VirusTotal, Google Safe Browsing, URLScan.io, and Gemini/Groq AI script analysis into one consolidated risk score.",
      "Playwright-based headless-browser pass (premium tier) detects dynamically injected ad scripts and popups mid-scan.",
      "Supabase/PostgreSQL-backed blocklist seeded from URLhaus and auto-synced from prior malicious scans, including non-bypassable government-banned URLs (e.g. CSA Singapore).",
      "Led a 4-person team; `develop` is the backend integration branch with CI auto-deploy to Railway.",
    ],
    tech: [
      "React Native",
      "Expo",
      "Node.js",
      "Express",
      "PostgreSQL",
      "Supabase",
      "Playwright",
      "Gemini AI",
      "Groq",
      "JWT",
    ],
    links: [
      { label: "GitHub", url: "https://github.com/scure-weblinkscanner/scure-repo" },
      { label: "Live App", url: "https://scure.up.railway.app" },
    ],
    icon: "/icons/folder-green.svg",
  },
  {
    id: "shield",
    name: "S.H.I.E.L.D",
    theme: "sec",
    role: "Developer",
    summary:
      "Streamlined Handling of Incidents, Emergencies, and Logistics Dispatch — an AI-powered push-to-talk walkie-talkie that triages security officers' spoken patrol reports in real time, cutting cognitive load in the field.",
    highlights: [
      "Officer speaks → WebSocket audio stream → Whisper speech-to-text → Mistral (via Ollama) triage → ElevenLabs text-to-speech response, end to end.",
      "Triage output is a structured priority/action/category/summary schema, e.g. \"Dispatch backup to Gate B immediately.\"",
      "Runs the LLM fully on-premise via Ollama + Mistral 7B — no per-request API cost, swappable for llama3.2/gemma2/etc.",
      "FastAPI backend with Redis caching and a Supabase (Postgres) store for officers/tasks/incidents.",
    ],
    tech: ["React", "Vite", "Tailwind", "FastAPI", "Whisper", "Ollama", "Mistral", "ElevenLabs", "Redis", "Supabase"],
    links: [{ label: "GitHub", url: "https://github.com/delete-th/S.H.I.E.L.D" }],
    icon: "/icons/folder-green.svg",
  },
  {
    id: "ioc-enricher",
    name: "ioc-enricher",
    theme: "sec",
    role: "Developer",
    summary:
      "A CLI tool that enriches IPs, domains, and file hashes against VirusTotal, AbuseIPDB, and Shodan in one pass, outputting JSON, Markdown, or DOCX reports — built for faster IOC triage during investigations.",
    highlights: [
      "Single command enriches a batch of indicators across all three threat-intel sources at once.",
      "Report output in three formats (JSON / Markdown / DOCX) for feeding into different downstream workflows.",
    ],
    tech: ["Python", "VirusTotal API", "AbuseIPDB API", "Shodan API"],
    links: [{ label: "GitHub", url: "https://github.com/delete-th/ioc-enricher" }],
    icon: "/icons/folder-green.svg",
  },

  // --- dev theme: Projects ---
  {
    id: "policylens",
    name: "PolicyLens",
    theme: "dev",
    role: "Contributor — project scaffolding, drift-report UI, deployment config",
    status: "In Progress",
    summary:
      "Policy drift detection: upload a new policy version and get an inline diff plus a re-check of every already-uploaded contract against it, as a single risk-scored drift report.",
    highlights: [
      "RAG-based clause retrieval over a Supabase/Postgres + pgvector store (match_policy_clauses / match_contract_clauses).",
      "FastAPI backend on Azure AI Foundry; React (Vite) frontend talks only to the backend API, never Supabase directly.",
      "By the repo's own README, the frontend currently runs on mocked data — wiring it to the live backend is the next step.",
    ],
    tech: ["Python", "FastAPI", "React", "Vite", "Supabase", "pgvector", "Azure AI Foundry"],
    links: [{ label: "GitHub", url: "https://github.com/Tanishqa24xx/policylens" }],
    icon: "/icons/folder.png",
  },
  {
    id: "helpout-reachout",
    name: "Reach Out, Help Out",
    theme: "dev",
    role: "Team Leader & Full Stack Developer",
    period: "Oct – Nov 2025",
    summary:
      "A full-stack web app matching CSR volunteers with Persons-in-Need, built for a university group project (CSIT314 — \"CTRL+S Our Grades\") to streamline outreach and cut manual matching effort for organisations.",
    highlights: [
      "Built with object-oriented PHP and MySQL, end to end.",
      "Led a 2-person team through weekly Agile Scrum sprints and client feedback sessions, from design through deployment.",
    ],
    tech: ["PHP", "MySQL", "OOP"],
    links: [{ label: "GitHub", url: "https://github.com/delete-th/helpout-reachout" }],
    icon: "/icons/folder.png",
  },
  {
    id: "stemulate-lms",
    name: "stemulate-lms",
    theme: "dev",
    role: "Developer",
    status: "In Progress",
    summary:
      "A full-stack LMS built for a Philippine tutoring center — real-time scratchboard quizzes, encrypted file distribution, a fillable test engine with solution-photo submission, GCash payments, and a parent progress portal.",
    highlights: [
      "Next.js + TypeScript frontend, Supabase/Postgres backend, plus a dedicated Node.js service for file encryption.",
      "GCash payments via PayMongo; Gemini/Groq wired in for AI-assisted features.",
      "Actively in development — the current build lives across feature branches, not yet merged to a finished main.",
    ],
    tech: ["Next.js", "TypeScript", "Tailwind", "Supabase", "Node.js", "PayMongo", "Gemini AI", "Groq"],
    links: [{ label: "GitHub", url: "https://github.com/delete-th/stemulate-lms" }],
    icon: "/icons/folder.png",
  },
];

export function getProjectsByTheme(theme: "dev" | "sec"): Project[] {
  return PROJECTS.filter((p) => p.theme === theme);
}

export function getProjectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
