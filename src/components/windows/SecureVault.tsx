"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { VaultDecryptAnimation } from "./VaultDecryptAnimation";
import { getProjectsByTheme } from "@/data/projects";
import type { useWindowManager } from "@/hooks/useWindowManager";

const AUTHENTICATING_TITLE = "secure_vault — Authenticating...";
const UNLOCKED_TITLE = "secure_vault — C:\\Users\\Thea\\Vault";

const SEC_PROJECTS = getProjectsByTheme("sec");

export interface SecureVaultProps {
  id: string;
  wm: ReturnType<typeof useWindowManager>;
  /** Lifted to Desktop.tsx — survives this window minimizing/closing within the session. See Desktop.tsx. */
  isUnlocked: boolean;
  onUnlock: () => void;
}

/**
 * The sec-theme replacement for the Projects folder: a locked vault
 * that plays a decryption animation (VaultDecryptAnimation) before
 * revealing the same project contents Projects would show, styled
 * dark/green instead of the standard gray. `isUnlocked` is owned by
 * Desktop.tsx, not this component — a closed/reopened (or even
 * minimized/restored) window remounts its content fresh, which would
 * otherwise replay the animation every time; see Desktop.tsx's comment
 * on why that state has to live above this component's own lifecycle.
 */
export function SecureVault({ id, wm, isUnlocked, onUnlock }: SecureVaultProps) {
  const [animationDone, setAnimationDone] = useState(isUnlocked);

  useEffect(() => {
    wm.setWindowTitle(id, animationDone ? UNLOCKED_TITLE : AUTHENTICATING_TITLE);
  }, [animationDone, id, wm]);

  const handleComplete = () => {
    onUnlock();
    setAnimationDone(true);
  };

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: "#0c0c0c" }}>
      <AnimatePresence mode="wait">
        {!animationDone ? (
          <motion.div
            key="animation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <VaultDecryptAnimation quick={isUnlocked} onComplete={handleComplete} />
          </motion.div>
        ) : (
          <motion.div
            key="contents"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <VaultContents wm={wm} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VaultContents({ wm }: { wm: ReturnType<typeof useWindowManager> }) {
  return (
    <div className="flex h-full flex-col gap-4 p-4" style={{ background: "#1a1a1a", color: "#33ff33" }}>
      <div
        className="flex items-center gap-2 border-b pb-2"
        style={{ borderColor: "#2a4a2f", fontFamily: "var(--font-ui)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
        <img src="/icons/folder-green.svg" alt="" width={20} height={20} style={{ imageRendering: "pixelated" }} />
        <span className="text-sm">C:\Users\Thea\Vault</span>
      </div>

      <div className="flex flex-wrap gap-6">
        {SEC_PROJECTS.map((project) => (
          <button
            key={project.id}
            type="button"
            onDoubleClick={() =>
              wm.openWindow({
                id: `project-detail-${project.id}`,
                title: project.name,
                icon: project.icon,
                size: { width: 480, height: 460 },
                minWidth: 360,
                minHeight: 320,
              })
            }
            className="flex w-20 min-w-0 min-h-0 flex-col items-center gap-1 border-0 bg-transparent p-1 text-center shadow-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
            <img
              src={project.icon}
              alt=""
              width={40}
              height={40}
              style={{ imageRendering: "pixelated" }}
            />
            {/* 98.css's button rule sets color:transparent + a fixed-dark
                text-shadow (see chrome-theme.css's note on the same trick
                elsewhere) — inherited by this span since it's un-styled,
                invisible against the vault's near-black background unless
                overridden explicitly. */}
            <span
              className="text-center text-xs"
              style={{ fontFamily: "var(--font-ui)", color: "#33ff33", textShadow: "none" }}
            >
              {project.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
