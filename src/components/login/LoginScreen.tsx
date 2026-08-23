"use client";

import type { ThemeName } from "@/hooks/useTheme";

export interface LoginScreenProps {
  /** Called the moment a profile tile is clicked — no password, per spec. */
  onSelectProfile: (theme: ThemeName) => void;
}

interface ProfileOption {
  theme: ThemeName;
  username: string;
  subtitle: string;
  icon: string;
}

const PROFILES: ProfileOption[] = [
  {
    theme: "dev",
    username: "delete-th_dev",
    subtitle: "Software Development",
    icon: "/icons/user-dev.png",
  },
  {
    theme: "sec",
    username: "delete-th_sec",
    subtitle: "Security Engineering",
    icon: "/icons/bug-sec.svg",
  },
];

/**
 * Windows XP/2000-era welcome screen: pick an account, no password.
 * Deliberately theme-neutral (a navy/teal gradient, not either profile's
 * own colors) since no profile is chosen yet — same reasoning as the
 * boot LoadingScreen. Picking a tile is what finally gives `useTheme`
 * a real caller; see page.tsx.
 */
export function LoginScreen({ onSelectProfile }: LoginScreenProps) {
  return (
    <main
      className="flex flex-1 flex-col items-center justify-center gap-10"
      style={{ background: "linear-gradient(160deg, #001a4d 0%, #003d66 55%, #005c66 100%)" }}
    >
      <div className="flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size branding logo */}
        <img
          src="/icons/thos-logo.svg"
          alt=""
          width={40}
          height={40}
          style={{ imageRendering: "pixelated" }}
        />
        <span
          className="text-3xl font-bold tracking-widest text-white"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          thOS
        </span>
      </div>

      <div className="flex flex-col items-center gap-6">
        <p className="text-lg text-white" style={{ fontFamily: "var(--font-ui)" }}>
          To begin, click your user name
        </p>

        <div className="flex flex-col gap-2">
          {PROFILES.map((profile) => (
            <button
              key={profile.theme}
              type="button"
              onClick={() => onSelectProfile(profile.theme)}
              aria-label={`Log in as ${profile.username} — ${profile.subtitle} profile`}
              className="group flex min-w-0 min-h-0 items-center gap-4 border border-transparent bg-transparent px-4 py-3 text-left shadow-none hover:border-white/30 hover:bg-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
              <img
                src={profile.icon}
                alt=""
                width={48}
                height={48}
                className="transition-transform group-hover:scale-110"
                style={
                  // Sec's icon is a flat green glyph on transparent, not a
                  // shaded raster like dev's — the glow is what keeps it
                  // from reading as flat/thin against dev's fuller icon.
                  // (image-rendering: pixelated is already covered by the
                  // blanket img[src^="/icons/"] rule in globals.css.)
                  profile.theme === "sec"
                    ? { filter: "drop-shadow(0 0 3px rgba(0, 255, 0, 0.4))" }
                    : undefined
                }
              />
              <div className="flex flex-col">
                <span
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: "var(--font-ui)" }}
                >
                  {profile.username}
                </span>
                <span className="text-sm text-white/70" style={{ fontFamily: "var(--font-ui)" }}>
                  {profile.subtitle}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/50" style={{ fontFamily: "var(--font-ui)" }}>
        Portfolio of Thea &mdash; software developer &amp; security engineer
      </p>
    </main>
  );
}
