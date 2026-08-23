import { SEARCH_SUGGESTIONS } from "@/data/browser-content";
import type { SearchSuggestion } from "@/types/browser";

/**
 * Matches AskTh's 9 phrases against `query` (case-insensitive, anywhere
 * in the phrase/category/snippet — not just a prefix match). Shared by
 * the autocomplete dropdown (capped via `limit`) and the search-results
 * page (uncapped) so both stay in sync with exactly one filtering rule.
 */
export function filterSuggestions(query: string, limit?: number): SearchSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const matches = SEARCH_SUGGESTIONS.filter(
    (s) =>
      s.phrase.toLowerCase().includes(q) ||
      s.category.includes(q) ||
      s.resultDescription.toLowerCase().includes(q),
  );

  return typeof limit === "number" ? matches.slice(0, limit) : matches;
}

export function getSuggestionBySlug(slug: string): SearchSuggestion | undefined {
  return SEARCH_SUGGESTIONS.find((s) => s.slug === slug);
}
