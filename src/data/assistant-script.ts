import type { ThemeName } from "@/hooks/useTheme";

/**
 * One "Ask me about…" menu entry: a question the visitor can pick, and
 * the desktop item the assistant then explains and offers to open.
 */
export interface AssistantTopic {
  /** The desktop icon it's about — an id from data/desktop-config.json. */
  iconId: string;
  /** The menu item, worded as the visitor's question. */
  label: string;
  /** The answer, one speech bubble per entry. Keep each under ~140 characters. */
  pages: string[];
}

export interface AssistantScript {
  /** Said once, on the first tap of the session. `**…**` renders bold. */
  greeting: string;
  /** One at random per tap after that. */
  quips: string[];
  /** The heading of the long-press menu. */
  menuTitle: string;
  topics: AssistantTopic[];
  /** The menu item that closes the menu. */
  dismissLabel: string;
  /** Said as a topic's window opens. */
  opened: string;
}

// The topics about the profile-specific half of each swapped pair of
// desktop icons — see lib/activeDesktopIcons.ts for why each profile
// only has one of each.
const PROFILE_TOPICS: Record<ThemeName, { discover: AssistantTopic; projects: AssistantTopic }> = {
  dev: {
    discover: {
      iconId: "thexplorer",
      label: "Take me browsing",
      pages: [
        "thExplorer is the web browser around here. Its home page is AskTh, a search engine that only knows about Thea.",
        "Type a question like \"Who is Thea?\" and it'll pull up a page about her.",
      ],
    },
    projects: {
      iconId: "projects",
      label: "Show me what Thea's built",
      pages: [
        "The Projects folder holds Thea's real work, pulled straight from her GitHub.",
        "Double-click any project in there to read what it does and how she built it.",
      ],
    },
  },
  sec: {
    discover: {
      iconId: "thterminal",
      label: "Take me to the terminal",
      pages: [
        "thTerminal is a command line that only knows about Thea. No mouse required.",
        "Type \"help\" and press Enter to see every command you can run.",
      ],
    },
    projects: {
      iconId: "secure-vault",
      label: "Show me what Thea's built",
      pages: [
        "secure_vault holds Thea's security projects. It's locked, so it has to decrypt itself first.",
        "Once it's open, double-click any project to read what it does and how she built it.",
      ],
    },
  },
};

/**
 * Everything the desktop assistant says (see
 * components/assistant/Assistant.tsx). Rewording a line, or adding or
 * cutting a quip or a menu topic, is an edit here — the component just
 * walks what it's given. A topic whose icon isn't on the active
 * profile's desktop is left out of the menu.
 */
export function getAssistantScript(theme: ThemeName): AssistantScript {
  const profile = PROFILE_TOPICS[theme];
  return {
    greeting:
      "Oh! Hi there 👋 I'm thea.exe, Thea's virtual alter ego, here to assist you, the user, in her thOS. **Hold me down** and I'll show you around, or just poke around yourself!",
    quips: [
      "Still here! Hold me down if you want a tour.",
      profile.projects.iconId === "projects"
        ? "Psst, try opening Projects. That's where the good stuff is."
        : "Psst, try opening secure_vault. That's where the good stuff is.",
      "I'd offer you coffee, but I only have a laptop.",
      "Did you know you can pick me up? Please don't drop me, though.",
      "thea.exe is responding. Hold me down for the list of things I know.",
      "Just typing. Looking busy is half the job. Hold me if you need anything.",
      "Lost? Press and hold on me and I'll point you somewhere good.",
    ],
    menuTitle: "Ask me about…",
    topics: [
      {
        iconId: "my-computer",
        label: "What's on this computer?",
        pages: [
          "This is thOS: Thea's portfolio, dressed up as an old desktop. Every icon on it opens something about her.",
          "Click an icon to open it. Windows drag by the title bar and resize from the edges, like the real thing.",
          "My Computer is the map. It lets you browse the whole thOS file system from one window.",
        ],
      },
      profile.discover,
      profile.projects,
      {
        iconId: "system-properties",
        label: "What's under the hood?",
        pages: [
          "System Properties is the spec sheet: which version of thOS this is, and the tech stack it's built on.",
          "It also credits the art and sounds. For Thea's own skills and background, her résumé is the place to look.",
        ],
      },
      {
        iconId: "resume",
        label: "Can I see her résumé?",
        pages: [
          "Of course. resume.pdf opens Thea's résumé right here on the desktop.",
          "The toolbar along the top flips the pages and zooms in and out.",
        ],
      },
      {
        iconId: "contact",
        label: "How do I reach Thea?",
        pages: ["MailMe is the mail program around here. It's where you write Thea a message."],
      },
      {
        iconId: "recycle-bin",
        label: "What's in the bin?",
        pages: [
          "Nothing! Thea says she never deletes anything. I say she just hasn't told me where she hides it.",
          "Go on, check for yourself.",
        ],
      },
    ],
    dismissLabel: "Never mind",
    opened: "There you go!",
  };
}
