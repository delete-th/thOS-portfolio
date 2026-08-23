"use client";

import { useState, type ReactNode } from "react";
import { RetroMessageBox } from "@/components/ui/RetroMessageBox";
import type { useWindowManager } from "@/hooks/useWindowManager";

export interface MailMeProps {
  id: string;
  wm: ReturnType<typeof useWindowManager>;
}

const TO_ADDRESS = "thea@placeholder.com";

/**
 * MailMe — Outlook Express-style compose window (the app formerly
 * called "email_client.exe" — window id stays "contact", only the
 * displayed name changed, see desktop-config.json).
 *
 * No real EmailJS/Formspree credentials exist for this project, so
 * Send takes the spec's own offered fallback: a retro "Message Sent"
 * dialog instead of an actual network call. Swapping in a real send
 * later is a matter of replacing handleSend's body — the form/UI
 * doesn't need to change.
 */
export function MailMe({ id, wm }: MailMeProps) {
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [cc, setCc] = useState("");
  const [body, setBody] = useState("");
  const [dialog, setDialog] = useState<"sent" | "draft-saved" | null>(null);

  const handleSend = () => setDialog("sent");
  const handleSaveDraft = () => setDialog("draft-saved");
  const handleCancel = () => wm.closeWindow(id);

  return (
    <div className="relative flex h-full flex-col p-2" style={{ fontFamily: "var(--font-ui)" }}>
      <HeaderRow label="To:">
        <input type="text" value={TO_ADDRESS} readOnly className="w-full opacity-70" />
      </HeaderRow>
      <HeaderRow label="From:">
        <input
          type="text"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="your@email.com"
          className="w-full"
        />
      </HeaderRow>
      <HeaderRow label="Subject:">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full"
        />
      </HeaderRow>
      <HeaderRow label="Cc:">
        <input type="text" value={cc} onChange={(e) => setCc(e.target.value)} className="w-full" />
      </HeaderRow>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="mt-2 min-h-0 flex-1 resize-none"
        style={{ fontFamily: "var(--font-ui)" }}
      />

      <div className="mt-2 flex justify-center gap-2">
        <button type="button" className="default" onClick={handleSend}>
          Send
        </button>
        <button type="button" onClick={handleSaveDraft}>
          Save Draft
        </button>
        <button type="button" onClick={handleCancel}>
          Cancel
        </button>
      </div>

      {dialog === "sent" ? (
        <RetroMessageBox
          title="MailMe"
          message="Message Sent Successfully!"
          onOk={() => setDialog(null)}
        />
      ) : null}
      {dialog === "draft-saved" ? (
        <RetroMessageBox title="MailMe" message="Draft saved." onOk={() => setDialog(null)} />
      ) : null}
    </div>
  );
}

function HeaderRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b py-1" style={{ borderColor: "var(--button-shadow)" }}>
      <span className="w-16 shrink-0 text-right text-[13px] font-bold">{label}</span>
      {children}
    </div>
  );
}
