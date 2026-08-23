"use client";

import { SearchBar } from "./SearchBar";
import { filterSuggestions } from "@/lib/searchSuggestions";
import type { SearchSuggestion } from "@/types/browser";

export interface AskThResultsProps {
  query: string;
  onSubmitSearch: (query: string) => void;
  onSelectResult: (suggestion: SearchSuggestion) => void;
}

/**
 * Early-2000s-search-engine results list — classic blue title / green
 * URL / gray snippet. Shown after Enter or "Search" (as opposed to
 * clicking a specific autocomplete suggestion, which skips straight to
 * that suggestion's content page). Fixed palette, not theme tokens —
 * see ThExplorer.tsx's top comment.
 */
export function AskThResults({ query, onSubmitSearch, onSelectResult }: AskThResultsProps) {
  const results = filterSuggestions(query);

  return (
    <div className="h-full overflow-auto bg-white p-4 text-black">
      <div className="mb-4 flex items-center gap-3 border-b border-gray-300 pb-3">
        <span className="shrink-0 text-lg font-bold" style={{ fontFamily: "var(--font-ui)", color: "#000080" }}>
          Ask<span style={{ color: "#1084d0" }}>Th</span>
        </span>
        <SearchBar
          key={query}
          initialValue={query}
          size="compact"
          onSubmit={onSubmitSearch}
          onSelectSuggestion={onSelectResult}
        />
      </div>

      <p className="mb-4 text-sm text-gray-600" style={{ fontFamily: "var(--font-ui)" }}>
        About {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
      </p>

      {results.length === 0 ? (
        <p className="text-sm text-gray-600" style={{ fontFamily: "var(--font-ui)" }}>
          No results found. Try a different search.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {results.map((result) => (
            <div key={result.id}>
              <button
                type="button"
                onClick={() => onSelectResult(result)}
                className="min-w-0 min-h-0 border-0 bg-transparent p-0 text-left text-base shadow-none"
                style={{ fontFamily: "var(--font-ui)", color: "#0000ee", textDecoration: "underline" }}
              >
                {result.phrase}
              </button>
              <div className="text-xs" style={{ fontFamily: "var(--font-ui)", color: "#006621" }}>
                askth.com/results/{result.slug}
              </div>
              <p className="mt-1 text-sm text-gray-800" style={{ fontFamily: "var(--font-ui)" }}>
                {result.resultDescription}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
