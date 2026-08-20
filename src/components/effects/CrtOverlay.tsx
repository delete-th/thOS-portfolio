/**
 * Full-viewport scanline + vignette overlay. Purely decorative and
 * static (no state, no client JS needed) — `pointer-events: none` on
 * the CSS side is what makes it safe to render above everything
 * without blocking clicks. Mounted once in the root layout so it
 * covers the boot sequence, login screen, and desktop alike.
 */
export function CrtOverlay() {
  return <div className="crt-overlay" aria-hidden="true" />;
}
