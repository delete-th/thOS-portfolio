export type SearchCategory = "who" | "what" | "how" | "where";

export interface SearchSuggestionAction {
  label: string;
  /** Opens this desktop-config.json window id via the shared window manager. */
  openWindowId: string;
}

/**
 * One AskTh autocomplete phrase, its search-results snippet, and the
 * content page it opens to. `slug` is what shows up in the fake address
 * bar (askth.com/results/<slug>) and is what URL-parsing on the address
 * bar itself resolves back to a page.
 */
export interface SearchSuggestion {
  id: string;
  phrase: string;
  category: SearchCategory;
  slug: string;
  /** 1-2 line snippet shown under the title on the search results page. */
  resultDescription: string;
  content: {
    title: string;
    /** Rendered with dangerouslySetInnerHTML — keep this hand-authored, not user input. */
    body: string;
    /** Optional CTA buttons, e.g. "Open in File Explorer" -> the Projects window. */
    actions?: SearchSuggestionAction[];
  };
}
