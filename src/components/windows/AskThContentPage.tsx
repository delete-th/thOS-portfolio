"use client";

import { getSuggestionBySlug } from "@/lib/searchSuggestions";
import { openDesktopWindow } from "@/lib/openDesktopWindow";
import type { useWindowManager } from "@/hooks/useWindowManager";
import type { DesktopIconConfig } from "@/types/desktop";
import desktopIconsData from "@/data/desktop-config.json";

const ALL_ICONS = desktopIconsData as DesktopIconConfig[];

export interface AskThContentPageProps {
  slug: string;
  /** Needed for CTA buttons like "Open in File Explorer" — opens a real desktop window. */
  wm: ReturnType<typeof useWindowManager>;
}

/**
 * One AskTh article — navy header bar + body HTML (hand-authored in
 * browser-content.ts, never user input) + optional CTA buttons. Fixed
 * palette, not theme tokens — see ThExplorer.tsx's top comment.
 */
export function AskThContentPage({ slug, wm }: AskThContentPageProps) {
  const suggestion = getSuggestionBySlug(slug);

  if (!suggestion) {
    return (
      <div className="flex h-full items-center justify-center bg-white text-black">
        <p style={{ fontFamily: "var(--font-ui)" }}>
          The page at askth.com/results/{slug} cannot be found.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-white text-black">
      <div className="px-4 py-3" style={{ background: "#000080" }}>
        <h1 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-ui)" }}>
          {suggestion.content.title}
        </h1>
      </div>

      <div
        className="max-w-2xl px-4 py-4 text-sm leading-relaxed [&_p]:mb-3"
        style={{ fontFamily: "var(--font-ui)" }}
        dangerouslySetInnerHTML={{ __html: suggestion.content.body }}
      />

      {suggestion.content.actions?.length ? (
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {suggestion.content.actions.map((action) => {
            const icon = ALL_ICONS.find((i) => i.id === action.openWindowId);
            if (!icon) return null;
            return (
              <button
                key={action.openWindowId}
                type="button"
                onClick={() => openDesktopWindow(wm, icon)}
                className="text-[13px]"
                style={{ fontFamily: "var(--font-ui)" }}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
