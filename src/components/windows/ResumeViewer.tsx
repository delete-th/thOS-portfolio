"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// react-pdf renders via pdf.js, which does its parsing off the main
// thread in a worker — it needs a real URL to that worker script, not
// a bundler import (pdf.js loads it with its own `importScripts`/
// `new Worker(url)`, outside webpack/Turbopack's module graph). The
// matching version's build output is copied to public/ as a static
// asset for exactly this — see the file for which pdfjs-dist version.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const RESUME_PATH = "/resume.pdf";
const MIN_SCALE = 0.6;
const MAX_SCALE = 2.2;
const SCALE_STEP = 0.2;

/**
 * resume.pdf's viewer — the "resume" window id's real content, per
 * desktop-config.json's own comment naming this as the pending piece.
 * No resume.pdf has been uploaded yet (see RESUME_PATH), so the honest
 * default state is the "not uploaded" placeholder below, not a
 * fabricated document — dropping a real file at public/resume.pdf is
 * the only thing needed to make this render for real, nothing here
 * has to change.
 *
 * Renders pages to plain <canvas> only (renderTextLayer/
 * renderAnnotationLayer off) — a resume viewer doesn't need selectable
 * text or clickable links, and skipping both avoids pulling in
 * react-pdf's TextLayer.css/AnnotationLayer.css for a feature this
 * window doesn't use.
 */
export function ResumeViewer() {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");

  return (
    <div className="flex h-full flex-col" style={{ fontFamily: "var(--font-ui)" }}>
      <Toolbar
        status={status}
        pageNumber={pageNumber}
        numPages={numPages}
        scale={scale}
        onPrevPage={() => setPageNumber((p) => Math.max(1, p - 1))}
        onNextPage={() => setPageNumber((p) => Math.min(numPages ?? p, p + 1))}
        onZoomOut={() => setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)))}
        onZoomIn={() => setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)))}
        onResetZoom={() => setScale(1)}
      />

      <div
        className="flex flex-1 items-start justify-center overflow-auto p-4"
        style={{ background: "var(--thos-field-bg, #808080)" }}
      >
        {status === "missing" ? (
          <MissingResumeNotice />
        ) : (
          <div className="bg-white shadow-md" style={{ lineHeight: 0 }}>
            <Document
              file={RESUME_PATH}
              onLoadSuccess={({ numPages: n }) => {
                setNumPages(n);
                setStatus("ready");
              }}
              onLoadError={() => setStatus("missing")}
              loading={<LoadingNotice />}
              error={<MissingResumeNotice />}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}

function Toolbar({
  status,
  pageNumber,
  numPages,
  scale,
  onPrevPage,
  onNextPage,
  onZoomOut,
  onZoomIn,
  onResetZoom,
}: {
  status: "loading" | "ready" | "missing";
  pageNumber: number;
  numPages: number | null;
  scale: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onResetZoom: () => void;
}) {
  const isReady = status === "ready" && numPages !== null;
  return (
    <div
      className="flex h-9 shrink-0 items-center gap-1 border-b border-[var(--button-shadow)] px-1"
      style={{ background: "var(--thos-taskbar-bg, #c0c0c0)" }}
    >
      <ToolbarButton label="Previous Page" onClick={onPrevPage} disabled={!isReady || pageNumber <= 1}>
        &lsaquo;
      </ToolbarButton>
      <span className="shrink-0 px-1 text-[13px]">
        {isReady ? `Page ${pageNumber} of ${numPages}` : " "}
      </span>
      <ToolbarButton
        label="Next Page"
        onClick={onNextPage}
        disabled={!isReady || (numPages !== null && pageNumber >= numPages)}
      >
        &rsaquo;
      </ToolbarButton>

      <div className="mx-1 h-6 w-px shrink-0" style={{ background: "var(--button-shadow)" }} />

      <ToolbarButton label="Zoom Out" onClick={onZoomOut} disabled={!isReady}>
        &minus;
      </ToolbarButton>
      <button
        type="button"
        onClick={onResetZoom}
        disabled={!isReady}
        title="Actual Size"
        className="min-h-0 min-w-0 shrink-0 px-2 text-[13px]"
      >
        {Math.round(scale * 100)}%
      </button>
      <ToolbarButton label="Zoom In" onClick={onZoomIn} disabled={!isReady}>
        +
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 min-h-0 min-w-0 shrink-0 items-center justify-center p-0 text-base leading-none"
    >
      {children}
    </button>
  );
}

function LoadingNotice() {
  return (
    <p className="p-6 text-sm text-black" style={{ fontFamily: "var(--font-ui)" }}>
      Loading resume.pdf&hellip;
    </p>
  );
}

function MissingResumeNotice() {
  return (
    <div
      className="flex max-w-xs flex-col items-center gap-3 bg-white p-8 text-center shadow-md"
      style={{ color: "#000000" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
      <img src="/icons/document.png" alt="" width={32} height={32} style={{ imageRendering: "pixelated" }} />
      <p className="text-sm font-bold">resume.pdf not found</p>
      <p className="text-sm">Thea hasn&apos;t uploaded a resume yet — check back soon!</p>
    </div>
  );
}
