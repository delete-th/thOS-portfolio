"use client";

import type { ExplorerNode } from "@/types/explorer";

export interface FolderTreeProps {
  node: ExplorerNode;
  depth: number;
  selectedId: string;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelect: (node: ExplorerNode) => void;
}

/**
 * One recursive level of the left-panel folder tree — expand/collapse
 * arrow and the folder label are two sibling buttons (not one nested
 * inside the other, which would be invalid/unreliable interactive
 * nesting), each indented by `depth`.
 */
export function FolderTree({ node, depth, selectedId, expandedIds, onToggleExpand, onSelect }: FolderTreeProps) {
  const hasChildren = Boolean(node.children?.length) || node.isLiveDesktop;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div className="flex items-center" style={{ paddingLeft: depth * 16 }}>
        <button
          type="button"
          onClick={() => onToggleExpand(node.id)}
          disabled={!hasChildren}
          aria-label={isExpanded ? "Collapse" : "Expand"}
          className="flex h-4 w-4 min-w-0 min-h-0 shrink-0 items-center justify-center border-0 bg-transparent p-0 text-[10px] shadow-none"
          style={{ visibility: hasChildren ? "visible" : "hidden" }}
        >
          {isExpanded ? "▼" : "▶"}
        </button>
        <button
          type="button"
          onClick={() => onSelect(node)}
          className="flex min-w-0 flex-1 items-center gap-1.5 border-0 bg-transparent px-1 py-0.5 text-left text-[13px] shadow-none"
          style={{
            fontFamily: "var(--font-ui)",
            ...(isSelected
              ? { background: "var(--thos-menu-hover-bg)", color: "var(--thos-menu-hover-fg)" }
              : null),
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
          <img src={node.icon} alt="" width={16} height={16} className="shrink-0" />
          <span className="truncate">{node.label}</span>
        </button>
      </div>

      {hasChildren && isExpanded && node.children ? (
        <div>
          {node.children.map((child) => (
            <FolderTree
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
