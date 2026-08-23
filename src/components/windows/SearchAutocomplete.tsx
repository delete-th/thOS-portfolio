"use client";

import { filterSuggestions } from "@/lib/searchSuggestions";
import type { SearchSuggestion } from "@/types/browser";

export interface SearchAutocompleteProps {
  query: string;
  onSelect: (suggestion: SearchSuggestion) => void;
}

const MAX_SUGGESTIONS = 5;

/**
 * The dropdown of matching phrases below the search input. Clicking one
 * goes straight to its content page (skipping the results page) — see
 * ThExplorer.tsx's onSelectSuggestion. Opaque white + Win98 raised
 * border per spec; fixed colors, not theme tokens, since this is part
 * of the "fake website" AskTh renders (see ThExplorer.tsx's top
 * comment for why the browser's page content doesn't reskin per theme).
 */
export function SearchAutocomplete({ query, onSelect }: SearchAutocompleteProps) {
  const matches = filterSuggestions(query, MAX_SUGGESTIONS);
  if (matches.length === 0) return null;

  return (
    <div
      className="absolute left-0 top-full z-[50] mt-0.5 w-full"
      style={{
        background: "#ffffff",
        color: "#000000",
        boxShadow: "var(--border-raised-outer), var(--border-raised-inner)",
      }}
    >
      {matches.map((suggestion) => (
        <button
          key={suggestion.id}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="flex w-full min-w-0 min-h-0 items-center gap-2 border-0 bg-transparent px-2 py-1.5 text-left text-[13px] shadow-none hover:bg-[#000080] hover:text-white"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
          <img src="/icons/search-small.png" alt="" width={14} height={14} className="shrink-0" />
          <span>
            <HighlightMatch text={suggestion.phrase} query={query} />
          </span>
        </button>
      ))}
    </div>
  );
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;

  const index = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (index === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <strong>{text.slice(index, index + trimmed.length)}</strong>
      {text.slice(index + trimmed.length)}
    </>
  );
}
