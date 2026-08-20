import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating "N" dev-mode indicator is Next.js's own devtool overlay
  // (dev only — never appears in a production build), not app UI. It sat
  // right next to the Start button and got mistaken for a leftover
  // debug element, so it's turned off here for a clean dev view.
  devIndicators: false,
};

export default nextConfig;
