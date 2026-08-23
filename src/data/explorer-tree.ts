import type { ExplorerNode } from "@/types/explorer";

/**
 * The static My Computer folder tree — everything except Desktop's
 * contents (see ExplorerNode.isLiveDesktop). Documents/Photos/Videos
 * are empty placeholders for now; add `children` to give them real
 * content later, no component changes needed.
 */
export const EXPLORER_TREE: ExplorerNode = {
  id: "my-computer-root",
  label: "My Computer",
  icon: "/icons/my-computer.png",
  path: "My Computer",
  children: [
    {
      id: "c-drive",
      label: "C:\\",
      icon: "/icons/folder.png",
      path: "C:\\",
      children: [
        {
          id: "users",
          label: "Users",
          icon: "/icons/folder.png",
          path: "C:\\Users",
          children: [
            {
              id: "thea",
              label: "Thea",
              icon: "/icons/folder.png",
              path: "C:\\Users\\Thea",
              children: [
                {
                  id: "desktop-folder",
                  label: "Desktop",
                  icon: "/icons/folder.png",
                  path: "C:\\Users\\Thea\\Desktop",
                  isLiveDesktop: true,
                },
                {
                  id: "documents-folder",
                  label: "Documents",
                  icon: "/icons/my-documents.png",
                  path: "C:\\Users\\Thea\\Documents",
                  children: [],
                },
                {
                  id: "photos-folder",
                  label: "Photos",
                  icon: "/icons/folder.png",
                  path: "C:\\Users\\Thea\\Photos",
                  children: [],
                },
                {
                  id: "videos-folder",
                  label: "Videos",
                  icon: "/icons/folder.png",
                  path: "C:\\Users\\Thea\\Videos",
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/** Every node in the tree, flattened, for id/path lookups. */
export function flattenTree(root: ExplorerNode): ExplorerNode[] {
  const out: ExplorerNode[] = [root];
  for (const child of root.children ?? []) {
    out.push(...flattenTree(child));
  }
  return out;
}

/** The chain of ancestor ids from the root down to (and including) `id` — used to auto-expand the tree to the selected node. */
export function ancestorIds(root: ExplorerNode, id: string, trail: string[] = []): string[] | null {
  const nextTrail = [...trail, root.id];
  if (root.id === id) return nextTrail;
  for (const child of root.children ?? []) {
    const found = ancestorIds(child, id, nextTrail);
    if (found) return found;
  }
  return null;
}

/** `id`'s parent node, or null for the root / an unknown id — used by the toolbar's "Up" button. */
export function findParent(root: ExplorerNode, id: string): ExplorerNode | null {
  for (const child of root.children ?? []) {
    if (child.id === id) return root;
    const found = findParent(child, id);
    if (found) return found;
  }
  return null;
}

/** Finds a node by exact path match (case-insensitive) — used by the address bar. */
export function findNodeByPath(root: ExplorerNode, path: string): ExplorerNode | null {
  const target = path.trim().toLowerCase().replace(/\\+$/, "");
  const match = flattenTree(root).find((n) => n.path.toLowerCase().replace(/\\+$/, "") === target);
  return match ?? null;
}
