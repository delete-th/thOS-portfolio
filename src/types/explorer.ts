export interface ExplorerNode {
  id: string;
  label: string;
  icon: string;
  /** Shown in the address bar and matched against typed paths. */
  path: string;
  children?: ExplorerNode[];
  /**
   * True only for the "Desktop" node — its contents come from the
   * live, theme-filtered desktop icon list at render time (so it stays
   * in sync with thExplorer/thTerminal and secure_vault/Projects),
   * not from this static tree. See MyComputer.tsx.
   */
  isLiveDesktop?: boolean;
}
