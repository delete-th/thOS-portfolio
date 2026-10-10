"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { MailMe } from "@/components/windows/MailMe";
import { ProjectDetail } from "@/components/windows/ProjectDetail";
import { SystemProperties } from "@/components/windows/SystemProperties";
import { getProjectsByTheme } from "@/data/projects";
import { useSound } from "@/hooks/useSound";
import type { ThemeName } from "@/hooks/useTheme";
import { getSuggestionBySlug } from "@/lib/searchSuggestions";
import { TASKBAR_SURFACE, TASKBAR_TEXT_STYLE } from "@/lib/win98Panel";

// Same reason as Desktop.tsx's own dynamic import — pdf.js can't be
// evaluated during the server prerender pass.
const ResumeViewer = dynamic(
  () => import("@/components/windows/ResumeViewer").then((m) => m.ResumeViewer),
  { ssr: false },
);

// Small enough that a full Letter/A4 page fits a phone's width without
// sideways scrolling; the viewer's own zoom buttons go up from there.
const RESUME_INITIAL_SCALE = 0.5;

const RAISED = "var(--border-raised-outer), var(--border-raised-inner)";
const SUNKEN = "var(--border-sunken-outer), var(--border-sunken-inner)";

const PROFILES: { theme: ThemeName; username: string; subtitle: string }[] = [
  { theme: "dev", username: "delete-th_dev", subtitle: "Software Development" },
  { theme: "sec", username: "delete-th_sec", subtitle: "Security Engineering" },
];

const NAV_LINKS = [
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "resume", label: "Resume" },
  { id: "contact", label: "Contact" },
  { id: "system", label: "System" },
];

export interface MobileLayoutProps {
  theme: ThemeName;
  onSelectTheme: (theme: ThemeName) => void;
}

/**
 * The phone-sized version of thOS: no boot sequence, login screen,
 * desktop, or draggable windows — per the spec, the same content as
 * one scrollable page of retro-styled cards instead. Each card is a
 * real 98.css `.window` (title bar and all) holding the *same* content
 * component the matching desktop window uses, so the two layouts can't
 * drift apart and both themes apply here for free.
 *
 * Picking a profile is a toggle in the header rather than a login
 * step, and switches which projects are listed exactly like it does on
 * the desktop (dev's "Projects" vs sec's "secure_vault").
 */
export function MobileLayout({ theme, onSelectTheme }: MobileLayoutProps) {
  const { isMuted, toggleMute } = useSound();
  const about = getSuggestionBySlug("who-is-thea");
  const projects = getProjectsByTheme(theme);

  return (
    <main className="flex flex-1 flex-col" style={{ backgroundColor: "var(--thos-desktop-bg)" }}>
      <header
        className="sticky top-0 z-10 flex flex-col gap-1.5 p-1.5"
        style={{ backgroundColor: TASKBAR_SURFACE, boxShadow: RAISED }}
      >
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size branding logo */}
          <img src="/icons/thos-logo.svg" alt="" width={24} height={24} />
          <div className="flex min-w-0 flex-1 flex-col leading-tight" style={TASKBAR_TEXT_STYLE}>
            <h1 className="text-base font-bold">thOS</h1>
            <p className="truncate text-xs">Thea &mdash; software developer &amp; security engineer</p>
          </div>
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={isMuted}
            aria-label={isMuted ? "Unmute sound effects" : "Mute sound effects"}
            className="flex h-7 w-7 min-h-0 min-w-0 shrink-0 items-center justify-center p-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI chrome icon */}
            <img
              src={isMuted ? "/icons/volume-muted.png" : "/icons/volume-on.png"}
              alt=""
              width={16}
              height={16}
            />
          </button>
        </div>

        <div className="flex gap-1" role="group" aria-label="Profile">
          {PROFILES.map((profile) => {
            const isActive = profile.theme === theme;
            return (
              <button
                key={profile.theme}
                type="button"
                onClick={() => onSelectTheme(profile.theme)}
                aria-pressed={isActive}
                aria-label={`${profile.username} — ${profile.subtitle} profile`}
                className="min-w-0 flex-1 truncate px-1 text-[13px]"
                style={{
                  backgroundColor: TASKBAR_SURFACE,
                  ...TASKBAR_TEXT_STYLE,
                  ...(isActive ? { boxShadow: SUNKEN, fontWeight: "bold" } : null),
                }}
              >
                {profile.username}
              </button>
            );
          })}
        </div>

        <nav aria-label="Sections" className="flex gap-1 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="shrink-0 grow px-2 py-1 text-center text-[13px] no-underline"
              style={{ ...TASKBAR_TEXT_STYLE, boxShadow: RAISED }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      <div className="flex flex-col gap-4 p-3">
        <Card id="about" title="about_me.txt" icon="/icons/notepad.png">
          <div
            className="p-3 text-sm leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0"
            style={{ fontFamily: "var(--thos-content-font, var(--font-ui))" }}
            // Hand-authored in data/browser-content.ts, never user
            // input — same source and same reasoning as AskThContentPage.
            dangerouslySetInnerHTML={{ __html: about?.content.body ?? "" }}
          />
        </Card>

        <Card
          id="projects"
          title={theme === "dev" ? "Projects" : "secure_vault"}
          icon={theme === "dev" ? "/icons/folder.png" : "/icons/vault-unlocked.svg"}
        >
          {projects.map((project, index) => (
            <div
              key={project.id}
              className={index > 0 ? "border-t" : undefined}
              style={{ borderColor: "var(--button-shadow)" }}
            >
              <ProjectDetail project={project} />
            </div>
          ))}
        </Card>

        <Card id="resume" title="resume.pdf" icon="/icons/document.png">
          <div className="h-[70vh]">
            <ResumeViewer initialScale={RESUME_INITIAL_SCALE} />
          </div>
        </Card>

        <Card id="contact" title="MailMe" icon="/icons/mail.png">
          {/* Fixed height: MailMe's message box flexes to fill whatever
              its window gives it, and a card has no height of its own. */}
          <div className="h-[420px]">
            <MailMe />
          </div>
        </Card>

        <Card id="system" title="System Properties" icon="/icons/computer.png">
          <SystemProperties />
        </Card>
      </div>

      <footer className="px-4 pb-6 pt-1 text-center text-xs text-white/80">
        This is the pocket edition. Visit on a larger screen for the full thOS desktop &mdash;
        boot sequence, windows, terminal and all.
      </footer>
    </main>
  );
}

function Card({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    // scroll-mt clears the sticky header when a nav link jumps here.
    <section id={id} aria-labelledby={`${id}-title`} className="window scroll-mt-32">
      <div className="title-bar">
        <h2 id={`${id}-title`} className="title-bar-text flex items-center gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed 16x16 UI chrome icon */}
          <img src={icon} alt="" width={16} height={16} />
          {title}
        </h2>
      </div>
      <div className="window-body m-0">{children}</div>
    </section>
  );
}
