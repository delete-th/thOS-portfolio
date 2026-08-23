export interface RetroMessageBoxProps {
  icon?: string;
  title: string;
  message: string;
  onOk: () => void;
}

/**
 * A classic Win98 message box (icon + text + OK button), rendered as a
 * child dialog *inside* whatever window's content area calls it (an
 * absolutely-positioned overlay within that window, not a page-global
 * modal) — matches how a real Win98 app pops a message box as a child
 * of its parent window. Reuses real `.window`/`.title-bar` chrome, so
 * it automatically themes correctly wherever it's used.
 */
export function RetroMessageBox({ icon = "/icons/mail.png", title, message, onOk }: RetroMessageBoxProps) {
  return (
    <div
      className="absolute inset-0 z-[300] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.35)" }}
    >
      <div className="window" style={{ width: 280 }}>
        <div className="title-bar">
          <div className="title-bar-text">{title}</div>
          <div className="title-bar-controls">
            <button type="button" aria-label="Close" onClick={onOk} />
          </div>
        </div>
        <div className="window-body flex flex-col items-center gap-3 p-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size UI icon */}
          <img src={icon} alt="" width={32} height={32} />
          <p className="text-sm">{message}</p>
          <button type="button" className="default" onClick={onOk} style={{ minWidth: 75 }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
