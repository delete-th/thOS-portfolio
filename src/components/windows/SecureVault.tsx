"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { VaultDecryptAnimation } from "./VaultDecryptAnimation";
import type { useWindowManager } from "@/hooks/useWindowManager";
import type { DesktopIconConfig } from "@/types/desktop";
import desktopIconsData from "@/data/desktop-config.json";

const ALL_ICONS = desktopIconsData as DesktopIconConfig[];
const AUTHENTICATING_TITLE = "secure_vault — Authenticating...";
const UNLOCKED_TITLE = "secure_vault — C:\\Users\\Thea\\Vault";

// Same three files the decrypt animation "decrypts" — carried over here
// (minus .enc) as a visual continuation of what the user just watched,
// not asserted as real distinct project titles. See the description
// line below, sourced from the real "projects" icon config, for the
// honest "not built yet" signal.
const DECRYPTED_FOLDERS = ["project_01", "project_02", "project_03"];

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
            <VaultContents />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VaultContents() {
  const projectsDescription = ALL_ICONS.find((icon) => icon.id === "projects")?.description;

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
        {DECRYPTED_FOLDERS.map((name) => (
          <div key={name} className="flex w-20 flex-col items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
            <img
              src="/icons/folder-green.svg"
              alt=""
              width={40}
              height={40}
              style={{ imageRendering: "pixelated" }}
            />
            <span className="text-center text-xs" style={{ fontFamily: "var(--font-ui)" }}>
              {name}
            </span>
          </div>
        ))}
      </div>

      <p className="text-sm" style={{ fontFamily: "var(--font-ui)" }}>
        {projectsDescription ?? "Vault contents coming soon."}
      </p>
    </div>
  );
}
