import type { Metadata } from "next";
import "./globals.css";
import { CrtOverlay } from "@/components/effects/CrtOverlay";
import { FullscreenToggle } from "@/components/ui/FullscreenToggle";

// Real title/description/OpenGraph tags land with the SEO build step.
// This is a placeholder so the tab doesn't say "Create Next App".
export const metadata: Metadata = {
  title: "thOS — Thea's Portfolio",
  description:
    "A retro Windows 95/2000-style OS simulation portfolio for Thea, a software developer and security engineer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        {children}
        <FullscreenToggle />
        <CrtOverlay />
      </body>
    </html>
  );
}
