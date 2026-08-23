"use client";

import { useState } from "react";
import { FolderTree } from "./FolderTree";
import {
  EXPLORER_TREE,
  ancestorIds,
  findParent,
  findNodeByPath,
  flattenTree,
} from "@/data/explorer-tree";
import { openDesktopWindow } from "@/lib/openDesktopWindow";
import { TASKBAR_SURFACE } from "@/lib/win98Panel";
import type { useWindowManager } from "@/hooks/useWindowManager";
import type { DesktopIconConfig } from "@/types/desktop";
import type { ExplorerNode } from "@/types/explorer";

export interface MyComputerProps {
  wm: ReturnType<typeof useWindowManager>;
  /**
   * The live, theme-filtered desktop icon list (same one Desktop.tsx
   * renders as actual desktop icons) — the Desktop tree node's
   * contents mirror this exactly, so My Computer never disagrees with
   * the real desktop about which of thExplorer/thTerminal or
   * Projects/secure_vault is currently present.
   */
  icons: DesktopIconConfig[];
}

/**
 * A full split-pane My Computer / Windows Explorer: folder tree on the
 * left, contents grid on the right, a working toolbar (Back/Forward/Up
 * + Search/Folders toggles, decorative) and an address bar that
 * accepts typed paths. Also what Start Menu's "Documents" now opens.
 */
export function MyComputer({ wm, icons }: MyComputerProps) {
  const [selectedId, setSelectedId] = useState("desktop-folder");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(ancestorIds(EXPLORER_TREE, "desktop-folder") ?? []),
  );
  const [history, setHistory] = useState<string[]>(["desktop-folder"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [addressValue, setAddressValue] = useState("");

  const flatNodes = flattenTree(EXPLORER_TREE);
  const selectedNode = flatNodes.find((n) => n.id === selectedId) ?? EXPLORER_TREE;

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const navigateTo = (node: ExplorerNode, { pushHistory = true } = {}) => {
    setSelectedId(node.id);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      for (const id of ancestorIds(EXPLORER_TREE, node.id) ?? []) next.add(id);
      return next;
    });
    if (pushHistory) {
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), node.id]);
      setHistoryIndex((i) => i + 1);
    }
  };

  const goBack = () => {
    if (!canGoBack) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    const node = flatNodes.find((n) => n.id === history[nextIndex]);
    if (node) navigateTo(node, { pushHistory: false });
  };

  const goForward = () => {
    if (!canGoForward) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    const node = flatNodes.find((n) => n.id === history[nextIndex]);
    if (node) navigateTo(node, { pushHistory: false });
  };

  const goUp = () => {
    const parent = findParent(EXPLORER_TREE, selectedId);
    if (parent) navigateTo(parent);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submitAddress = () => {
    const node = findNodeByPath(EXPLORER_TREE, addressValue);
    if (node) navigateTo(node);
  };

  const desktopItems = selectedNode.isLiveDesktop
    ? icons.map((icon) => ({
        key: icon.id,
        label: icon.label,
        iconSrc: icon.icon,
        onOpen: () => openDesktopWindow(wm, icon),
      }))
    : (selectedNode.children ?? []).map((child) => ({
        key: child.id,
        label: child.label,
        iconSrc: child.icon,
        onOpen: () => navigateTo(child),
      }));

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className="flex h-9 shrink-0 items-center gap-1 border-b border-[var(--button-shadow)] px-1"
        style={{ background: TASKBAR_SURFACE }}
      >
        <ToolbarButton icon="/icons/nav-back.svg" label="Back" onClick={goBack} disabled={!canGoBack} />
        <ToolbarButton
          icon="/icons/nav-forward.svg"
          label="Forward"
          onClick={goForward}
          disabled={!canGoForward}
        />
        <ToolbarButton icon="/icons/nav-up.svg" label="Up" onClick={goUp} disabled={!findParent(EXPLORER_TREE, selectedId)} />
        <div className="mx-1 h-6 w-px shrink-0" style={{ background: "var(--button-shadow)" }} />
        <ToolbarButton icon="/icons/search-small.png" label="Search" disabled />
        <ToolbarButton icon="/icons/folder.png" label="Folders" disabled />
        <div className="mx-1 h-6 w-px shrink-0" style={{ background: "var(--button-shadow)" }} />
        <span className="shrink-0 text-[13px]" style={{ fontFamily: "var(--font-ui)" }}>
          Address:
        </span>
        <input
          type="text"
          value={addressValue || selectedNode.path}
          onChange={(e) => setAddressValue(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitAddress();
          }}
          className="min-w-0 flex-1 text-[13px]"
          style={{ fontFamily: "var(--font-ui)" }}
        />
        <button
          type="button"
          onClick={submitAddress}
          className="min-h-0 min-w-0 shrink-0 px-3 text-[13px]"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          Go
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div
          className="w-[200px] shrink-0 overflow-auto border-r border-[var(--button-shadow)] py-1"
          style={{ background: "#ffffff", color: "#000000" }}
        >
          <FolderTree
            node={EXPLORER_TREE}
            depth={0}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onToggleExpand={toggleExpand}
            onSelect={(node) => navigateTo(node)}
          />
        </div>

        <div className="flex-1 overflow-auto p-3" style={{ background: "#ffffff", color: "#000000" }}>
          {desktopItems.length === 0 ? (
            <p className="text-sm" style={{ fontFamily: "var(--font-ui)" }}>
              This folder is empty.
            </p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {desktopItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onOpen}
                  className="flex w-20 min-w-0 min-h-0 flex-col items-center gap-1 border-0 bg-transparent p-1 text-center shadow-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
                  <img src={item.iconSrc} alt="" width={32} height={32} style={{ imageRendering: "pixelated" }} />
                  <span className="line-clamp-2 text-xs" style={{ fontFamily: "var(--font-ui)" }}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className="flex h-5 shrink-0 items-center px-2 text-[11px]"
        style={{ background: TASKBAR_SURFACE, borderTop: "1px solid var(--button-shadow)", fontFamily: "var(--font-ui)" }}
      >
        {desktopItems.length} object{desktopItems.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 min-h-0 min-w-0 shrink-0 items-center justify-center p-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI chrome icon */}
      <img src={icon} alt="" width={16} height={16} style={{ opacity: disabled ? 0.35 : 1 }} />
    </button>
  );
}
