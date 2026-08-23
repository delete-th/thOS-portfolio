import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored pdf.js worker build output (copied verbatim from
    // pdfjs-dist for ResumeViewer — see its own comment) — minified,
    // not authored here, not meant to be linted.
    "public/pdf.worker.min.mjs",
    // Scratch verification scripts/screenshots — not part of the app.
    "scratch/**",
  ]),
]);

export default eslintConfig;
