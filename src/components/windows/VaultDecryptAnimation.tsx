"use client";

import { useEffect, useState } from "react";

export interface VaultDecryptAnimationProps {
  /**
   * Skip straight to a brief "ACCESS GRANTED" flash instead of the
   * full ~3s sequence — used when the vault's already been unlocked
   * earlier this session (see SecureVault.tsx).
   */
  quick?: boolean;
  onComplete: () => void;
}

const AUTH_LINES = [
  "[ACCESS RESTRICTED]",
  "",
  "Verifying credentials...",
  "User: Thea",
  "Clearance: Level 5",
];
const LINE_INTERVAL_MS = 200;
const PROGRESS_DURATION_MS = 1500;
const BAR_WIDTH = 20;

const DECRYPT_FILES = ["project_01.enc", "project_02.enc", "project_03.enc"];
const FILE_INTERVAL_MS = 300;
const CHECKMARK_DELAY_MS = 150;
const QUICK_FLASH_MS = 500;

type Phase = "authenticating" | "decrypting";

/**
 * The ~3s "authenticating → decrypting" terminal sequence played the
 * first time secure_vault opens each session (see SecureVault.tsx for
 * why "each session" needs to survive minimize/close — this component
 * itself is stateless about that, it just always plays once per mount
 * and reports back via onComplete). `quick` swaps the whole sequence
 * for a 0.5s "ACCESS GRANTED" reminder instead, for subsequent opens.
 */
export function VaultDecryptAnimation({ quick, onComplete }: VaultDecryptAnimationProps) {
  const [phase, setPhase] = useState<Phase>("authenticating");
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visibleFiles, setVisibleFiles] = useState(0);
  const [checkedFiles, setCheckedFiles] = useState(0);

  // Quick reminder flash for subsequent opens — a completely separate,
  // much simpler timeline from the full sequence below.
  useEffect(() => {
    if (!quick) return;
    const id = setTimeout(onComplete, QUICK_FLASH_MS);
    return () => clearTimeout(id);
  }, [quick, onComplete]);

  // Phase 1 — line-by-line reveal.
  useEffect(() => {
    if (quick || phase !== "authenticating" || visibleLines >= AUTH_LINES.length) return;
    const id = setTimeout(() => setVisibleLines((n) => n + 1), LINE_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [quick, phase, visibleLines]);

  // Phase 1 — progress bar, 0 → 100 over PROGRESS_DURATION_MS, then
  // advances to phase 2. Runs concurrently with the line reveal above
  // (not after it) — by the time the "Status:" line itself becomes
  // visible (once all AUTH_LINES are revealed), the bar is already
  // partway through, same as the spec's own "48%" mid-animation example.
  useEffect(() => {
    if (quick || phase !== "authenticating") return;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const next = Math.min(1, elapsed / PROGRESS_DURATION_MS);
      setProgress(next);
      if (next < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setPhase("decrypting");
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [quick, phase]);

  // Phase 2 — files decrypt one by one, each showing its checkmark a
  // moment after its filename appears.
  useEffect(() => {
    if (quick || phase !== "decrypting") return;
    if (visibleFiles < DECRYPT_FILES.length) {
      const id = setTimeout(() => setVisibleFiles((n) => n + 1), FILE_INTERVAL_MS);
      return () => clearTimeout(id);
    }
    if (checkedFiles < visibleFiles) {
      const id = setTimeout(() => setCheckedFiles((n) => n + 1), CHECKMARK_DELAY_MS);
      return () => clearTimeout(id);
    }
    if (checkedFiles === DECRYPT_FILES.length) {
      const id = setTimeout(onComplete, CHECKMARK_DELAY_MS);
      return () => clearTimeout(id);
    }
  }, [quick, phase, visibleFiles, checkedFiles, onComplete]);

  if (quick) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ fontFamily: "var(--font-terminal)", fontSize: 16 }}
      >
        <span style={{ color: "#33ff33", fontWeight: "bold" }}>ACCESS GRANTED</span>
      </div>
    );
  }

  const filledSegments = Math.round(progress * BAR_WIDTH);
  const bar = "█".repeat(filledSegments) + "░".repeat(BAR_WIDTH - filledSegments);
  const percent = Math.round(progress * 100);

  return (
    <div
      className="h-full whitespace-pre-wrap p-4"
      style={{ fontFamily: "var(--font-terminal)", fontSize: 14, color: "#00ff00" }}
    >
      {AUTH_LINES.slice(0, visibleLines).map((line, i) => (
        <div key={i}>{line}</div>
      ))}

      {visibleLines >= AUTH_LINES.length ? (
        <div>
          Status: {bar} {percent}%
        </div>
      ) : null}

      {phase === "decrypting" ? (
        <>
          <div>&nbsp;</div>
          <div style={{ color: "#33ff33", fontWeight: "bold" }}>ACCESS GRANTED</div>
          <div>Decrypting vault contents...</div>
          <div>&nbsp;</div>
          {DECRYPT_FILES.slice(0, visibleFiles).map((file, i) => (
            <div key={file}>
              &gt; {file} {i < checkedFiles ? <span style={{ color: "#33ff33" }}>&#10003; decrypted</span> : null}
            </div>
          ))}
        </>
      ) : null}
    </div>
  );
}
