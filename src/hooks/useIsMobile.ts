"use client";

import { useSyncExternalStore } from "react";

// Matches Tailwind's `max-md:` variant (anything below its 768px `md`
// breakpoint), so the JS switch here and any `max-md:` utility agree
// on what "mobile" means.
const MOBILE_QUERY = "(max-width: 767px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

// The page is statically prerendered with no viewport to measure, so
// the server (and the hydration pass matching it) always renders the
// desktop experience; a phone swaps to the mobile layout as soon as
// the real answer is readable.
function getServerSnapshot() {
  return false;
}

/**
 * Whether the viewport is phone-sized — live, so rotating a device or
 * resizing a browser window across the breakpoint switches layouts.
 */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
