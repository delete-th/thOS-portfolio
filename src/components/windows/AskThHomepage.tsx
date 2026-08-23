"use client";

import { SearchBar } from "./SearchBar";
import type { SearchSuggestion } from "@/types/browser";

export interface AskThHomepageProps {
  onSubmitSearch: (query: string) => void;
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
}

/**
 * AskTh's default view — logo, big centered search bar, tagline. Fixed
 * white/navy palette regardless of theme; see ThExplorer.tsx's top
 * comment for why.
 */
export function AskThHomepage({ onSubmitSearch, onSelectSuggestion }: AskThHomepageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-white px-6 text-black">
      <div className="flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size logo asset */}
        <img
          src="/icons/search-logo.png"
          alt=""
          width={40}
          height={40}
          style={{ imageRendering: "pixelated" }}
        />
        <span className="text-4xl font-bold" style={{ fontFamily: "var(--font-ui)", color: "#000080" }}>
          Ask<span style={{ color: "#1084d0" }}>Th</span>
        </span>
      </div>

      {/* Not autoFocus — the idle typing-hint animation only shows
          while the bar is unfocused, so auto-focusing it on mount would
          permanently suppress the hint before a visitor ever saw it. */}
      <SearchBar size="large" onSubmit={onSubmitSearch} onSelectSuggestion={onSelectSuggestion} />

      <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-ui)" }}>
        Discover everything about Thea
      </p>
    </div>
  );
}
