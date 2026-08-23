"use client";

import { useState } from "react";
import { ThExplorerNavBar } from "./ThExplorerNavBar";
import { AskThHomepage } from "./AskThHomepage";
import { AskThResults } from "./AskThResults";
import { AskThContentPage } from "./AskThContentPage";
import { getSuggestionBySlug } from "@/lib/searchSuggestions";
import type { useWindowManager } from "@/hooks/useWindowManager";
import type { SearchSuggestion } from "@/types/browser";

export interface ThExplorerProps {
  wm: ReturnType<typeof useWindowManager>;
}

type BrowserView =
  | { type: "home" }
  | { type: "search"; query: string }
  | { type: "content"; slug: string };

const HOME_VIEW: BrowserView = { type: "home" };

/**
 * thExplorer: a fake IE5/6 browser window running AskTh, a fake search
 * engine, entirely inside the window (no real navigation/routing —
 * `history`/`index` below is a self-contained in-memory browser
 * history, separate from the real one).
 *
 * Deliberate split in what's theme-reactive: ThExplorerNavBar is
 * window *chrome* — like every other window's title bar, it reskins
 * with the active dev/sec profile. Everything AskTh renders below it
 * (AskThHomepage/Results/ContentPage, SearchAutocomplete) is the *page*
 * a browser happens to be displaying — fixed white/navy/blue-link 2000s-
 * web colors regardless of theme, the same way a real website doesn't
 * change color scheme based on your OS theme. That split is also why
 * those page components hardcode hex colors instead of --thos-* tokens.
 */
export function ThExplorer({ wm }: ThExplorerProps) {
  const [history, setHistory] = useState<BrowserView[]>([HOME_VIEW]);
  const [index, setIndex] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const current = history[index];
  const canGoBack = index > 0;
  const canGoForward = index < history.length - 1;

  const navigate = (view: BrowserView) => {
    setHistory((prev) => [...prev.slice(0, index + 1), view]);
    setIndex((i) => i + 1);
  };

  const goBack = () => canGoBack && setIndex((i) => i - 1);
  const goForward = () => canGoForward && setIndex((i) => i + 1);
  const goHome = () => navigate(HOME_VIEW);
  // Decorative per spec — "reloads" the current view without touching
  // history, by remounting the content area.
  const refresh = () => setRefreshKey((k) => k + 1);

  const handleSubmitSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate({ type: "search", query: trimmed });
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    navigate({ type: "content", slug: suggestion.slug });
  };

  const handleSubmitAddress = (raw: string) => {
    const parsed = parseAddress(raw);
    if (parsed) navigate(parsed);
  };

  return (
    <div className="flex h-full flex-col">
      <ThExplorerNavBar
        address={addressFor(current)}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={goBack}
        onForward={goForward}
        onHome={goHome}
        onRefresh={refresh}
        onSubmitAddress={handleSubmitAddress}
      />

      <div key={refreshKey} className="flex-1 overflow-hidden">
        {current.type === "home" ? (
          <AskThHomepage
            onSubmitSearch={handleSubmitSearch}
            onSelectSuggestion={handleSelectSuggestion}
          />
        ) : current.type === "search" ? (
          <AskThResults
            query={current.query}
            onSubmitSearch={handleSubmitSearch}
            onSelectResult={handleSelectSuggestion}
          />
        ) : (
          <AskThContentPage slug={current.slug} wm={wm} />
        )}
      </div>
    </div>
  );
}

function addressFor(view: BrowserView): string {
  switch (view.type) {
    case "home":
      return "askth.com";
    case "search":
      return `askth.com/search?q=${encodeQuery(view.query)}`;
    case "content":
      return `askth.com/results/${view.slug}`;
  }
}

function encodeQuery(query: string): string {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean).join("+");
}

/**
 * Best-effort parse of whatever the user typed/edited into the address
 * bar, back into a BrowserView — this is flavor, not a real router.
 * Anything unrecognized is silently ignored (no error state) rather
 * than guessing.
 */
function parseAddress(raw: string): BrowserView | null {
  const value = raw.trim().toLowerCase().replace(/^https?:\/\//, "");

  if (!value || value === "askth.com" || value === "askth.com/") {
    return { type: "home" };
  }

  const resultsMatch = value.match(/^askth\.com\/results\/([a-z0-9-]+)\/?$/);
  if (resultsMatch) {
    const slug = resultsMatch[1];
    return getSuggestionBySlug(slug) ? { type: "content", slug } : null;
  }

  const searchMatch = value.match(/^askth\.com\/search\?q=(.+)$/);
  if (searchMatch) {
    const query = decodeURIComponent(searchMatch[1]).replace(/\+/g, " ");
    return query.trim() ? { type: "search", query: query.trim() } : { type: "home" };
  }

  return null;
}
