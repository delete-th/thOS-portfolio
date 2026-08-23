"use client";

import { useEffect, useRef, useState } from "react";
import { SearchAutocomplete } from "./SearchAutocomplete";
import { useTypingPlaceholder } from "@/hooks/useTypingPlaceholder";
import type { SearchSuggestion } from "@/types/browser";

export interface SearchBarProps {
  initialValue?: string;
  autoFocus?: boolean;
  onSubmit: (query: string) => void;
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
  /** "large" — homepage's centered hero bar. "compact" — results page's top bar. */
  size?: "large" | "compact";
}

// Module-level constant — useTypingPlaceholder restarts its loop if
// given a new array identity every render, so this must not be an
// inline literal inside the component.
const HINT_PHRASES = [
  "who is...",
  "what projects...",
  "how to contact...",
  "where has...",
  "what tech stack...",
];

/**
 * The text input + Search button + autocomplete dropdown, shared by
 * AskThHomepage and AskThResults (not in the spec's component list as
 * its own file, but both pages need the identical input/dropdown/
 * click-outside wiring — one shared component beats duplicating that
 * logic twice).
 */
export function SearchBar({
  initialValue = "",
  autoFocus,
  onSubmit,
  onSelectSuggestion,
  size = "large",
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  // Separate from `isOpen` (which also stays true while clicking a
  // dropdown item, so that click isn't lost to a premature blur) —
  // this one drives only the typing-hint animation, per spec's real
  // focus/blur semantics.
  const [isFocused, setIsFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const showHint = !isFocused && value.length === 0;
  const animatedHint = useTypingPlaceholder(HINT_PHRASES, showHint);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  const submit = () => {
    setIsOpen(false);
    onSubmit(value);
  };

  const isLarge = size === "large";
  const fontSize = isLarge ? 16 : 13;

  return (
    <div
      ref={rootRef}
      className={`relative flex items-center gap-2 ${isLarge ? "w-full max-w-md" : "flex-1"}`}
    >
      <div className="relative min-w-0 flex-1">
        <input
          type="text"
          value={value}
          autoFocus={autoFocus}
          placeholder=""
          onChange={(e) => {
            setValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setIsFocused(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") setIsOpen(false);
          }}
          className="w-full"
          style={{ fontFamily: "var(--font-ui)", fontSize }}
        />
        {showHint ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center overflow-hidden pl-[5px]"
            style={{ fontFamily: "var(--font-ui)", fontSize, color: "#888888" }}
          >
            <span className="truncate">{animatedHint}</span>
            <span className="blink-cursor">|</span>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={submit}
        className="shrink-0 text-[13px]"
        style={{ fontFamily: "var(--font-ui)" }}
      >
        Search
      </button>

      {isOpen ? (
        <SearchAutocomplete
          query={value}
          onSelect={(suggestion) => {
            setIsOpen(false);
            onSelectSuggestion(suggestion);
          }}
        />
      ) : null}
    </div>
  );
}
