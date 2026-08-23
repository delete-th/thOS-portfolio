import type { SearchSuggestion } from "@/types/browser";

/**
 * The 9 AskTh autocomplete phrases and the content pages behind them.
 * All content is placeholder — Thea fills this in later. Editing a
 * phrase, snippet, or body is a data edit here, not a component change
 * (see components/windows/ThExplorer.tsx and its AskTh* subcomponents).
 */
export const SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  {
    id: "who-is-thea",
    phrase: "Who is Thea?",
    category: "who",
    slug: "who-is-thea",
    resultDescription: "Learn about Thea — software developer and security engineer...",
    content: {
      title: "Who is Thea?",
      body: `
        <p>Hi, I'm Thea — a software developer and security engineer
        passionate about building secure, user-friendly applications.</p>
        <p>I like building things that work, and figuring out how the
        things other people built can be made to not work — in the
        "found the vulnerability before somebody worse did" sense, not
        the arson sense.</p>
        <p>This site — thOS — is one of those "build it because it's
        fun" projects. You're using it right now.</p>
      `,
    },
  },
  {
    id: "who-works-with",
    phrase: "Who does Thea work with?",
    category: "who",
    slug: "who-thea-works-with",
    resultDescription: "Teams, collaborators, and the open source communities Thea is part of...",
    content: {
      title: "Who does Thea work with?",
      body: `
        <p>[Placeholder] Thea collaborates with cross-functional
        product and engineering teams, and contributes to open source
        projects in the security tooling space.</p>
        <p>Details on specific teams, companies, and collaborators go
        here.</p>
      `,
    },
  },
  {
    id: "what-projects",
    phrase: "What projects has Thea built?",
    category: "what",
    slug: "what-projects",
    resultDescription:
      "Explore Thea's portfolio of software development and security engineering projects...",
    content: {
      title: "What projects has Thea built?",
      body: `
        <p>[Placeholder] A mix of full-stack web apps, backend
        services, and security tooling — including this portfolio
        itself.</p>
        <p>The full list, with descriptions, tech stacks, and links,
        lives in the Projects folder on the desktop.</p>
      `,
      actions: [{ label: "Open in File Explorer", openWindowId: "projects" }],
    },
  },
  {
    id: "what-tech-stack",
    phrase: "What tech stack does Thea use?",
    category: "what",
    slug: "what-tech-stack",
    resultDescription: "Languages, frameworks, tools, and security technologies Thea works with...",
    content: {
      title: "What tech stack does Thea use?",
      body: `
        <p>[Placeholder] TypeScript, React, and Node.js for most
        day-to-day development, plus a security-focused toolkit for
        the other half of the job.</p>
        <p>The full breakdown — languages, frameworks, tools, and
        security software — lives in System Properties on the
        desktop.</p>
      `,
      actions: [{ label: "Open System Properties", openWindowId: "system-properties" }],
    },
  },
  {
    id: "what-is-thos",
    phrase: "What is thOS?",
    category: "what",
    slug: "what-is-thos",
    resultDescription: "thOS is the operating system you're using right now! Built by Thea...",
    content: {
      title: "What is thOS?",
      body: `
        <p>thOS is a retro operating-system-themed portfolio website
        built by Thea using Next.js, TypeScript, and 98.css.</p>
        <p>You're using it right now! The desktop, the windows, this
        browser, even this search engine — it's all part of the same
        fake OS.</p>
      `,
    },
  },
  {
    id: "how-to-contact",
    phrase: "How to contact Thea",
    category: "how",
    slug: "how-to-contact-thea",
    resultDescription: "Email, GitHub, LinkedIn, and other ways to reach Thea...",
    content: {
      title: "How to contact Thea",
      body: `
        <p>[Placeholder] The fastest way to reach Thea is the email
        client on the desktop — or find her on GitHub and LinkedIn.</p>
      `,
      actions: [{ label: "Open Email Client", openWindowId: "contact" }],
    },
  },
  {
    id: "how-got-into-tech",
    phrase: "How did Thea get into tech?",
    category: "how",
    slug: "how-thea-got-into-tech",
    resultDescription: "The origin story — how Thea's path into software and security started...",
    content: {
      title: "How did Thea get into tech?",
      body: `
        <p>[Placeholder] Origin story goes here — the first line of
        code, the first CTF, whatever the real version of this is.</p>
      `,
    },
  },
  {
    id: "where-worked",
    phrase: "Where has Thea worked?",
    category: "where",
    slug: "where-thea-worked",
    resultDescription: "Thea's work experience and career history...",
    content: {
      title: "Where has Thea worked?",
      body: `
        <p>[Placeholder] Roles, companies, and career history go
        here.</p>
      `,
    },
  },
  {
    id: "where-to-find",
    phrase: "Where to find Thea online",
    category: "where",
    slug: "where-to-find-thea-online",
    resultDescription: "GitHub, LinkedIn, email, and other places to find Thea online...",
    content: {
      title: "Where to find Thea online",
      body: `
        <p>[Placeholder social links]</p>
        <p><a href="#" style="color:#0000EE;text-decoration:underline;">GitHub</a></p>
        <p><a href="#" style="color:#0000EE;text-decoration:underline;">LinkedIn</a></p>
        <p><a href="#" style="color:#0000EE;text-decoration:underline;">Email</a></p>
      `,
    },
  },
];
