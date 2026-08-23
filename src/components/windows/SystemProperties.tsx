"use client";

import { useState } from "react";

type Tab = "general" | "credits";

/**
 * Windows System Properties dialog — two tabs, "General" (thOS + tech
 * stack) and "Credits" (asset attributions), per direct request. No
 * other tabs (Skills/Hardware, etc. were considered and dropped —
 * Skills content belongs to its own future build step, not here).
 *
 * Uses 98.css's real tab markup (menu[role=tablist] + li[role=tab] +
 * .window[role=tabpanel]) rather than custom-built tabs, and real
 * <fieldset><legend> groupboxes for the sunken/etched section borders
 * — both are genuine 98.css features, not something built from
 * scratch. (Groupbox borders draw via svg-load(), which only resolves
 * because of the 98-icon-fixes.css patch from an earlier round.)
 */
export function SystemProperties() {
  const [tab, setTab] = useState<Tab>("general");

  return (
    <div className="flex h-full flex-col p-2">
      <menu role="tablist">
        <li role="tab" aria-selected={tab === "general"}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setTab("general");
            }}
          >
            General
          </a>
        </li>
        <li role="tab" aria-selected={tab === "credits"}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setTab("credits");
            }}
          >
            Credits
          </a>
        </li>
      </menu>

      <div className="window flex-1 overflow-auto" role="tabpanel">
        <div className="window-body flex flex-col gap-3 p-3 text-sm">
          {tab === "general" ? <GeneralTab /> : <CreditsTab />}
        </div>
      </div>
    </div>
  );
}

function GeneralTab() {
  return (
    <>
      <fieldset>
        <legend>System</legend>
        <div className="flex flex-col items-center gap-1 py-2 text-center">
          <p className="text-lg font-bold">thOS</p>
          <p>Version 1.0.0</p>
          <p className="mt-2">Built by Thea</p>
          <p>A retro OS-themed portfolio</p>
        </div>
      </fieldset>

      <fieldset>
        <legend>Tech Stack</legend>
        <table className="w-full">
          <tbody>
            <TechRow label="Framework" value="Next.js 16 (App Router)" />
            <TechRow label="Language" value="TypeScript" />
            <TechRow label="Styling" value="98.css + Tailwind CSS" />
            <TechRow label="Animations" value="Framer Motion" />
            <TechRow label="Font" value="W95FA (SIL Open Font)" />
            <TechRow label="Audio" value="Howler.js" />
            <TechRow label="Deployment" value="Vercel" />
          </tbody>
        </table>
      </fieldset>
    </>
  );
}

function TechRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="whitespace-nowrap py-0.5 pr-4 font-bold">{label}:</td>
      <td className="py-0.5">{value}</td>
    </tr>
  );
}

function CreditsTab() {
  return (
    <>
      <fieldset>
        <legend>Icons</legend>
        <p>Win98 icons — alexh/vintage-icons (MIT)</p>
        <p>Bug glyph (sec login icon) — Pixelarticons, halfmage (MIT)</p>
      </fieldset>

      <fieldset>
        <legend>Fonts</legend>
        <p>W95FA — Alina Sava (SIL Open Font License)</p>
      </fieldset>

      <fieldset>
        <legend>Styling</legend>
        <p>98.css — Jordan Scales (MIT)</p>
      </fieldset>

      <fieldset>
        <legend>Sound Effects</legend>
        <p>Sound system not yet implemented.</p>
      </fieldset>

      <fieldset>
        <legend>Wallpaper</legend>
        <p>Attribution pending.</p>
      </fieldset>

      <fieldset>
        <legend>Inspiration</legend>
        <p>Desktop Explorer (horror game)</p>
        <p>Windows 95/98/XP UI design</p>
      </fieldset>
    </>
  );
}
