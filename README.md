# thOS-portfolio

A retro Windows 95/2000-style OS simulator portfolio — built with Next.js, TypeScript, 98.css & Framer Motion.

The entire site *is* the operating system: visitors boot up a desktop, pick a user profile (`delete-th_dev` or `delete-th_sec`), and browse work through a faithful late-90s file-explorer interface.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · [98.css](https://jdan.github.io/98.css/) · Framer Motion · Howler.js · react-pdf

## Project structure

```
src/
├── app/                # Routes, layout, global styles
├── components/
│   ├── boot/            # BIOS + loading screen
│   ├── login/            # Dual-profile login screen
│   ├── desktop/           # Desktop, taskbar, window manager UI
│   ├── windows/            # Content windows (About, Projects, Skills, Resume, Contact)
│   ├── effects/             # CRT overlay, glitch transitions
│   ├── mobile/               # Simplified responsive fallback
│   └── ui/                    # Shared retro dialog/toast primitives
├── data/                # projects.json, skills.json, desktop-config.json
├── hooks/               # Window manager, theme, drag/resize, sound
├── lib/                 # PDF parsing, sound manager
├── styles/              # Fonts, CRT effect, per-theme overrides
└── types/               # Shared TypeScript types
```

Built incrementally, one finished component per commit — see commit history for the build order (window system → theming → boot/login → content windows → sound/effects → mobile → SEO).

Full spec: `thOS-portfolio-spec.md` (gitignored, private planning doc).

## Asset credits

Desktop icons (`public/icons/{folder,notepad,computer,document,mail,recycle-bin}.png`) are extracted Windows 98 icon resources from [alexh/vintage-icons](https://github.com/alexh/vintage-icons) (MIT, per that repo's README). `thos-logo.svg` is an original placeholder.
