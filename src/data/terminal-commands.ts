import type { TerminalCommand } from "@/types/terminal";

/**
 * thTerminal's 6 real commands (the sec-theme counterpart to AskTh's 9
 * phrases). `help` and `clear` are handled directly in ThTerminal.tsx
 * instead of living here — `help` lists these entries dynamically (so
 * it can't drift out of sync), and `clear` wipes terminal state rather
 * than producing output. All content is placeholder — Thea fills this
 * in later. Editing a command's output is a data edit here, not a
 * component change (see components/windows/ThTerminal.tsx).
 */
export const TERMINAL_COMMANDS: TerminalCommand[] = [
  {
    command: "whoami",
    description: "Who is Thea?",
    output: `  Name:     Thea
  Role:     Software Developer & Security Engineer
  Status:   Available for opportunities

  [Placeholder bio content — Thea will fill in later]`,
  },
  {
    command: "ls projects",
    aliases: ["dir projects"],
    description: "View project portfolio",
    output: `  Directory of C:\\Users\\Thea\\Projects

  01/15/2024    <DIR>    project-one
  03/22/2024    <DIR>    project-two
  06/10/2024    <DIR>    project-three
  08/01/2024    <DIR>    thos-portfolio

  [Placeholder project listing]`,
  },
  {
    command: "cat skills.txt",
    aliases: ["type skills.txt"],
    description: "View technical skills",
    output: `  === TECHNICAL SKILLS ===

  Languages:    [placeholder]
  Frameworks:   [placeholder]
  Security:     [placeholder]
  Tools:        [placeholder]`,
  },
  {
    command: "history",
    description: "Career history",
    output: `  === CAREER HISTORY ===

  [placeholder work experience entries]`,
  },
  {
    command: "man contact",
    aliases: ["contact --help"],
    description: "Contact information",
    output: `  CONTACT(1)              Thea's Manual              CONTACT(1)

  NAME
      contact - reach out to Thea

  METHODS
      Email:      [placeholder]
      GitHub:     [placeholder]
      LinkedIn:   [placeholder]`,
  },
  {
    command: "ping thea.dev",
    description: "Find Thea online",
    output: `  Pinging thea.dev [127.0.0.1] with 32 bytes of data:
  Reply from 127.0.0.1: bytes=32 time<1ms TTL=128
  Reply from 127.0.0.1: bytes=32 time<1ms TTL=128

  Find Thea online:
      GitHub:     [placeholder]
      LinkedIn:   [placeholder]
      Portfolio:  You're already here! 😄`,
  },
];
