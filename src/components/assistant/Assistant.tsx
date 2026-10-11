"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { getAssistantScript, type AssistantTopic } from "@/data/assistant-script";
import sprites from "@/data/assistant-sprites.json";
import type { ThemeName } from "@/hooks/useTheme";
import type { useWindowManager } from "@/hooks/useWindowManager";
import { getActiveDesktopIcons } from "@/lib/activeDesktopIcons";
import { openDesktopWindow } from "@/lib/openDesktopWindow";
import { playSound } from "@/lib/sound-manager";
import { OPAQUE_PANEL_CLASS, OPAQUE_PANEL_STYLE } from "@/lib/win98Panel";
import type { DesktopIconConfig } from "@/types/desktop";

const { drag } = sprites;

type Mode =
  | "idle"
  | "glint"
  | "adjusting"
  | "surprised"
  | "pondering"
  | "talking"
  | "happy"
  // The "Ask me about…" menu: chatting, then (left alone) waiting for a choice.
  | "offering"
  | "waiting"
  // Being picked up, carried around and dropped:
  | "pickup"
  | "carried"
  | "struggle"
  | "falling"
  | "landing"
  | "sitting"
  | "settle";

/** Which atlas and row the frames come from: seated, or the taller carried sheet. */
type Row =
  | { sheet: "seated"; row: keyof typeof sprites.rows }
  | { sheet: "carried"; row: keyof typeof drag.rows };

type Sequence = Row & {
  /** Frame indices within that row, in play order. */
  frames: number[];
  frameMs: number;
  loop: boolean;
};

// Deliberately few frames at a slow rate — this is meant to read as
// choppy 90s sprite animation, not smooth motion.
const SEQUENCES: Record<Mode, Sequence> = {
  idle: {
    sheet: "seated",
    row: "idle",
    frames: [0, 1, 0, 2],
    frameMs: 280,
    loop: true,
  },
  // Holds the idle pose while the glint (drawn in code below) crosses
  // the lenses — one "frame" per glint position.
  glint: {
    sheet: "seated",
    row: "idle",
    frames: [0, 0, 0, 0],
    frameMs: 110,
    loop: false,
  },
  // The other idle fidget: a finger to the bridge of his glasses, a
  // push, and back to the keys.
  adjusting: {
    sheet: "seated",
    row: "glasses",
    frames: [0, 1, 2, 2, 1, 0],
    frameMs: 220,
    loop: false,
  },
  surprised: {
    sheet: "seated",
    row: "surprised",
    frames: [0, 1, 1],
    frameMs: 300,
    loop: false,
  },
  // A beat of thought before he speaks: hand to chin, then a "?".
  pondering: {
    sheet: "seated",
    row: "pondering",
    frames: [1, 2, 2],
    frameMs: 300,
    loop: false,
  },
  talking: {
    sheet: "seated",
    row: "talking",
    frames: [0, 1, 2, 1],
    frameMs: 180,
    loop: true,
  },
  happy: {
    sheet: "seated",
    row: "happy",
    frames: [0, 1, 2, 1, 2],
    frameMs: 240,
    loop: false,
  },
  // With the menu open he chats away ("ask me about…") — until it's
  // sat untouched for a while, when he goes back to thinking, hand on
  // chin, with now and then a "?".
  offering: {
    sheet: "seated",
    row: "talking",
    frames: [0, 1, 2, 1],
    frameMs: 180,
    loop: true,
  },
  waiting: {
    sheet: "seated",
    row: "pondering",
    frames: [1, 1, 1, 2, 2],
    frameMs: 420,
    loop: true,
  },

  // Startled for a beat as he's lifted, then the carried pose, which
  // holds (no clock) until something else happens.
  pickup: {
    sheet: "carried",
    row: "pickup",
    frames: [0],
    frameMs: 150,
    loop: false,
  },
  carried: {
    sheet: "carried",
    row: "pickup",
    frames: [1],
    frameMs: 0,
    loop: false,
  },
  // Kicking, once he's been dangled in one spot for too long.
  struggle: {
    sheet: "carried",
    row: "struggle",
    frames: [0, 1, 2, 1],
    frameMs: 150,
    loop: true,
  },
  // Stepped by how far through the drop he is, not by the clock.
  falling: {
    sheet: "carried",
    row: "fall",
    frames: [0, 1, 2, 3],
    frameMs: 0,
    loop: false,
  },
  // The landing: held in the crouch while the stars circle (those and
  // the squash are CSS), then he lowers himself, crosses his legs and
  // opens the laptop, and — after a beat in the base pose — carries
  // on typing.
  landing: {
    sheet: "carried",
    row: "fall",
    frames: [3],
    frameMs: 500,
    loop: false,
  },
  sitting: {
    sheet: "seated",
    row: "sitdown",
    frames: [0, 1, 2],
    frameMs: 120,
    loop: false,
  },
  settle: {
    sheet: "seated",
    row: "base",
    frames: [0],
    frameMs: 350,
    loop: false,
  },
};

// Modes with no frame clock: they end on a pointer event, or when the
// fall reaches the floor.
const UNCLOCKED: ReadonlySet<Mode> = new Set<Mode>(["carried", "falling"]);
// In the cursor's grip.
const HELD: ReadonlySet<Mode> = new Set<Mode>(["pickup", "carried", "struggle"]);
// Drawn from the carried sheet, positioned by the head rather than the floor.
const AIRBORNE: ReadonlySet<Mode> = new Set<Mode>([...HELD, "falling", "landing"]);
// From pickup until he's seated and typing again — clicks and presses
// are ignored for the duration.
const BUSY: ReadonlySet<Mode> = new Set<Mode>([...AIRBORNE, "sitting", "settle"]);

// The one place that decides where he sits: the bottom row of the art
// (sprites.floorY, measured from the frames themselves rather than
// the image box) goes this many pixels below the taskbar's top edge,
// so he reads as sitting on it instead of hovering above it. Every
// seated animation shares that floor row, and the drop lands on it.
const TASKBAR_HEIGHT_PX = 40; // Taskbar.tsx's h-10
const FLOOR_OVERLAP_PX = 2;
const SEAT_BOTTOM_PX = TASKBAR_HEIGHT_PX - FLOOR_OVERLAP_PX - (sprites.cellHeight - sprites.floorY);

// His shadow: a flat pixel ellipse on the floor line. Off the floor it
// stays down there underneath him, shrinking and fading with height.
const SHADOW_WIDTH_PX = 66;
const SHADOW_HEIGHT_PX = 5;
const SHADOW_OPACITY = 0.3;
const SHADOW_MIN_SCALE = 0.4;
const SHADOW_MIN_OPACITY = 0.1;
const SHADOW_FADE_HEIGHT_PX = 400;
// How close (in art pixels) the pointer has to be to an opaque pixel
// of him to count as on him — a little slack, so the gaps between an
// arm and his body aren't dead spots.
const HIT_SLOP_PX = 2;

// How long the menu can sit untouched before he stops chatting and
// starts pondering.
const MENU_IDLE_MS = 4000;
// The thinking beat comes before every 3rd or 4th new bubble, picked
// at random each time — often enough to notice, never twice running.
const PONDER_EVERY = [3, 4] as const;

// One press, three outcomes. Moving this far before LONG_PRESS_MS is
// up makes it a drag; staying put that long makes it a long-press,
// which opens the menu; letting go before either is a tap. A finger
// can't hold as still as a mouse, so touch gets more slack before a
// press counts as having moved.
const LONG_PRESS_MS = 450;
const DRAG_THRESHOLD_PX = 4;
const TOUCH_DRAG_THRESHOLD_PX = 10;
// The ring of dots that fills in around the pointer during a press,
// to show that holding does something: how many, and how far out.
const HOLD_RING_DOTS = 8;
const HOLD_RING_RADIUS_PX = 11;
// Dangled without moving for this long, he starts kicking.
const STRUGGLE_AFTER_MS = 2000;
// The twinkle that goes with the stars comes a moment after the thud
// of the landing, so the two don't land on top of each other.
const DIZZY_SOUND_DELAY_MS = 140;
// The swing while carried: he hangs from the top of his head like a
// pendulum, tilting against the pointer's horizontal speed and
// springing back upright (with a little overshoot) when it stops.
const TILT_DEG_PER_PX_MS = 14;
const MAX_TILT_DEG = 16;
const TILT_STIFFNESS = 170;
const TILT_DAMPING = 11;
// The drop: duration grows with the square root of the distance, as a
// real fall's would, within limits that keep all four frames visible.
const FALL_MS_PER_SQRT_PX = 28;
const MIN_FALL_MS = 280;
const MAX_FALL_MS = 750;
// Where the grabbing hand's hotspot (its fingertip) is drawn relative
// to the top-centre of his head: up and to the left, so it's the palm
// that closes over his hair. With the fingertip itself on his head,
// the rest of the hand would hang down over his face.
const GRIP_OFFSET = { x: -8, y: -24 };
// Left to type, he fidgets every so often: usually a glint across his
// glasses, and every few fidgets he pushes them up instead.
const FIDGET_MIN_DELAY_MS = 8000;
const FIDGET_MAX_DELAY_MS = 12000;
const ADJUST_EVERY = 3;
// Speech stays up long enough to read: a base, plus time per character.
const BUBBLE_BASE_MS = 3000;
const BUBBLE_MS_PER_CHAR = 55;
// Closer to the left edge than this and the speech bubble, which
// normally extends to his left, opens to his right instead.
const BUBBLE_FLIP_BELOW_PX = 130;

// Where the 3-pixel diagonal streak sits at each step of the glint:
// which lens, and how far across it — left lens first, then right.
const GLINT_STEPS = [
  { lens: 0, offset: 0 },
  { lens: 0, offset: 2 },
  { lens: 1, offset: 0 },
  { lens: 1, offset: 2 },
];

// Where he was last dropped (the seated sprite's left edge, in
// viewport pixels), or null while he's still in his starting corner.
// Module-level so it outlives a remount — crossing the mobile
// breakpoint and back swaps the whole tree — but, like everything
// else in thOS, not a reload.
let savedSeatX: number | null = null;
// Likewise: the greeting is for the first tap of the session only.
let hasGreeted = false;

/** What's open above his head besides a plain speech bubble. */
type Panel =
  | { kind: "menu" }
  // Explaining a topic, one page per bubble; the last page offers to open it.
  | { kind: "topic"; topic: AssistantTopic; page: number };

interface State {
  mode: Mode;
  /** Position within SEQUENCES[mode].frames. */
  step: number;
  /** The line currently in the speech bubble. */
  bubble: string | null;
  /** What's waiting for its lead-in reaction (surprised, pondering) to finish. */
  pending: { bubble: string } | { panel: Panel } | null;
  panel: Panel | null;
}

type Action =
  | { type: "tick" }
  | { type: "tap"; line: string; isGreeting: boolean; ponder: boolean }
  | { type: "openMenu" }
  | { type: "closePanel" }
  | { type: "chooseTopic"; topic: AssistantTopic; ponder: boolean }
  | { type: "nextPage"; ponder: boolean }
  | { type: "menuIdle" }
  | { type: "menuActive" }
  | { type: "opened"; line: string }
  | { type: "glint" }
  | { type: "adjust" }
  | { type: "bubbleTimeout" }
  | { type: "dragStart" }
  | { type: "dragMove" }
  | { type: "dragStill" }
  | { type: "drop"; animate: boolean }
  | { type: "fallFrame"; step: number }
  | { type: "land" };

const INITIAL_STATE: State = {
  mode: "idle",
  step: 0,
  bubble: null,
  pending: null,
  panel: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "tick": {
      const sequence = SEQUENCES[state.mode];
      if (state.step + 1 < sequence.frames.length) return { ...state, step: state.step + 1 };
      if (sequence.loop) return { ...state, step: 0 };

      // A one-shot sequence just finished — what comes next:
      switch (state.mode) {
        case "surprised":
        case "pondering":
          if (state.pending && "panel" in state.pending) {
            return {
              ...state,
              mode: "talking",
              step: 0,
              panel: state.pending.panel,
              pending: null,
            };
          }
          return {
            ...state,
            mode: "talking",
            step: 0,
            bubble: state.pending?.bubble ?? null,
            pending: null,
          };
        case "happy":
          return { ...state, mode: state.bubble ? "talking" : "idle", step: 0 };
        case "glint":
        case "adjusting":
        case "settle":
          return { ...state, mode: "idle", step: 0 };
        case "pickup":
          return { ...state, mode: "carried", step: 0 };
        case "landing":
          return { ...state, mode: "sitting", step: 0 };
        case "sitting":
          return { ...state, mode: "settle", step: 0 };
        default:
          return state;
      }
    }

    case "tap":
      // (Mid-thought, he finishes the thought first.)
      if (BUSY.has(state.mode) || state.panel || state.mode === "pondering") return state;
      // The first tap of the session startles him into the greeting;
      // every one after gets a quick one-liner, sometimes after a
      // moment's thought.
      if (action.isGreeting || action.ponder) {
        return {
          ...state,
          mode: action.isGreeting ? "surprised" : "pondering",
          step: 0,
          bubble: null,
          pending: { bubble: action.line },
        };
      }
      return {
        ...state,
        mode: "talking",
        step: 0,
        bubble: action.line,
        pending: null,
      };

    case "openMenu":
      if (BUSY.has(state.mode) || state.mode === "pondering") return state;
      return {
        ...state,
        mode: "offering",
        step: 0,
        bubble: null,
        pending: null,
        panel: { kind: "menu" },
      };

    case "closePanel":
      return state.panel ? { ...state, mode: "idle", step: 0, panel: null } : state;

    case "menuIdle":
      return state.mode === "offering" ? { ...state, mode: "waiting", step: 0 } : state;

    case "menuActive":
      return state.mode === "waiting" ? { ...state, mode: "offering", step: 0 } : state;

    // An option picked from the menu: he thinks about it, then answers.
    case "chooseTopic": {
      if (state.panel?.kind !== "menu") return state;
      const panel: Panel = { kind: "topic", topic: action.topic, page: 0 };
      return action.ponder
        ? { ...state, mode: "pondering", step: 0, bubble: null, panel: null, pending: { panel } }
        : { ...state, mode: "talking", step: 0, bubble: null, panel, pending: null };
    }

    case "nextPage": {
      const { panel } = state;
      if (panel?.kind !== "topic" || panel.page + 1 >= panel.topic.pages.length) return state;
      const next: Panel = { ...panel, page: panel.page + 1 };
      // The bubble comes down while he thinks, and back up with the next page.
      return action.ponder
        ? { ...state, mode: "pondering", step: 0, panel: null, pending: { panel: next } }
        : { ...state, panel: next };
    }

    // "Open it" was pressed: a cheer as the window appears.
    case "opened":
      if (BUSY.has(state.mode)) return state;
      return {
        ...state,
        mode: "happy",
        step: 0,
        bubble: action.line,
        pending: null,
        panel: null,
      };

    case "glint":
      return state.mode === "idle" ? { ...state, mode: "glint", step: 0 } : state;

    case "adjust":
      return state.mode === "idle" ? { ...state, mode: "adjusting", step: 0 } : state;

    case "bubbleTimeout":
      return state.mode === "talking" && !state.panel
        ? { ...state, mode: "idle", step: 0, bubble: null }
        : { ...state, bubble: null };

    // Whatever he was in the middle of saying goes when he's lifted.
    case "dragStart":
      if (BUSY.has(state.mode)) return state;
      return {
        ...state,
        mode: "pickup",
        step: 0,
        bubble: null,
        pending: null,
        panel: null,
      };

    case "dragMove":
      return state.mode === "struggle" ? { ...state, mode: "carried", step: 0 } : state;

    case "dragStill":
      return state.mode === "carried" ? { ...state, mode: "struggle", step: 0 } : state;

    case "drop":
      if (!HELD.has(state.mode)) return state;
      // Without the animation (reduced motion) he's simply seated again.
      return { ...state, mode: action.animate ? "falling" : "settle", step: 0 };

    case "fallFrame":
      return state.mode === "falling" && state.step !== action.step
        ? { ...state, step: action.step }
        : state;

    case "land":
      return state.mode === "falling" ? { ...state, mode: "landing", step: 0 } : state;
  }
}

/** Where the top-centre of his head is while airborne (viewport pixels), and his swing. */
interface Flight {
  x: number;
  y: number;
  tilt: number;
  /** The floor line below him, for the shadow. */
  floorY: number;
  /** False under reduced motion: the shadow keeps its full size. */
  scaleShadow: boolean;
}

/** Which cell of which atlas is on screen — what the pointer is hit-tested against. */
interface Cell {
  sheet: "seated" | "carried";
  row: number;
  frame: number;
}

/** An atlas's alpha channel, for telling his pixels from the empty space around them. */
interface AlphaMap {
  width: number;
  height: number;
  alpha: Uint8Array;
}

function loadAlphaMap(src: string, onLoad: (map: AlphaMap) => void) {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const alpha = new Uint8Array(canvas.width * canvas.height);
    for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
    onLoad({ width: canvas.width, height: canvas.height, alpha });
  };
  image.src = src;
}

/** Everything about the press in progress that the pointer handlers and animation loop share. */
interface Press {
  pointerId: number;
  startX: number;
  startY: number;
  isTouch: boolean;
  dragging: boolean;
  /** Held still long enough to open the menu; the rest of the press is ignored. */
  longPressed: boolean;
  /** The floor line he sits on, in viewport pixels. */
  floorY: number;
  /** Where the pointer wants his head to be (already kept in bounds). */
  x: number;
  y: number;
  /** Smoothed horizontal pointer speed, px/ms. */
  velocity: number;
  lastMoveAt: number;
  tilt: number;
  tiltVelocity: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export interface AssistantProps {
  /** Which profile's desktop this is — it decides the menu's topics and some wording. */
  theme: ThemeName;
  /** The shared window manager, for the menu's "Open it" button. */
  wm: ReturnType<typeof useWindowManager>;
}

/**
 * The desktop assistant — thOS's answer to Clippy and the Windows
 * search dog: a small pixel-art character who sits above the taskbar,
 * typing away, and explains what the visitor can do here.
 *
 * One press on them has three outcomes (lines in data/assistant-script.ts):
 * - Tap: the first of the session startles them into introducing
 *   themselves; every one after gets a short random quip.
 * - Press and hold: the "Ask me about…" menu — one entry per desktop
 *   item, which they think about for a moment, explain in a bubble or
 *   two, and offer to open.
 *   Enter or Space on them does the same, for the keyboard.
 * - Drag: picks them up by the head. They swing as they're carried,
 *   kick if dangled in one place, and drop to the floor wherever
 *   they're let go — and stay there.
 *
 * Left alone, they type, with an occasional glint across the glasses
 * or a push of them back up the nose.
 *
 * What they're doing is one reducer stepping through SEQUENCES frame by
 * frame; the art is two pre-aligned atlases (see
 * scripts/process-assistant-sprites.mjs), so switching animation is
 * only ever a background-position change. Where they are while off
 * the floor is separate state, driven by pointer events and
 * requestAnimationFrame.
 */
export function Assistant({ theme, wm }: AssistantProps) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  // Where a press in progress started, relative to his sprite — the
  // centre of the ring that fills while it's held. Null once the press
  // has ended or turned into a drag or the menu.
  const [holdPoint, setHoldPoint] = useState<{ x: number; y: number } | null>(null);
  const [seatX, setSeatX] = useState(() => savedSeatX);
  const [flight, setFlight] = useState<Flight | null>(null);
  // Whether the pointer is over him rather than the empty parts of
  // his sprite's box. True until the first mouse move says otherwise,
  // so touch — which has no hover to test with — can still press him.
  const [isOver, setIsOver] = useState(true);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const press = useRef<Press | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stillTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dizzyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrame = useRef(0);
  // Set when a press turned into a long-press or a drag, so the click
  // event the browser fires on release isn't also treated as a tap.
  const wasHold = useRef(false);
  const lastQuip = useRef(-1);
  // New bubbles left before the next one gets a thinking beat first.
  const bubblesUntilPonder = useRef<number>(PONDER_EVERY[0]);
  const fidgets = useRef(0);
  const menuIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const script = useMemo(() => getAssistantScript(theme), [theme]);
  // Menu topics paired with their desktop icon (for the 16px picture
  // and for opening it) — minus any whose icon isn't on this desktop.
  const topics = useMemo(() => {
    const icons = getActiveDesktopIcons(theme);
    return script.topics.flatMap((topic) => {
      const icon = icons.find((candidate) => candidate.id === topic.iconId);
      return icon ? [{ topic, icon }] : [];
    });
  }, [script, theme]);
  const alphaMaps = useRef<Partial<Record<Cell["sheet"], AlphaMap>>>({});
  const cell = useRef<Cell>({ sheet: "seated", row: 0, frame: 0 });

  const sequence = SEQUENCES[state.mode];
  const hasClock = !UNCLOCKED.has(state.mode);

  // The frame clock.
  useEffect(() => {
    if (!hasClock) return;
    const id = setTimeout(() => dispatch({ type: "tick" }), sequence.frameMs);
    return () => clearTimeout(id);
  }, [state.mode, state.step, sequence.frameMs, hasClock]);

  // An occasional fidget, re-armed every time they settle back to idle.
  useEffect(() => {
    if (state.mode !== "idle") return;
    const delay = FIDGET_MIN_DELAY_MS + Math.random() * (FIDGET_MAX_DELAY_MS - FIDGET_MIN_DELAY_MS);
    const id = setTimeout(() => {
      fidgets.current += 1;
      dispatch({ type: fidgets.current % ADJUST_EVERY === 0 ? "adjust" : "glint" });
    }, delay);
    return () => clearTimeout(id);
  }, [state.mode]);

  // The menu's idle countdown starts as it opens and dies with it.
  const isMenuOpen = state.panel?.kind === "menu";
  useEffect(() => {
    if (!isMenuOpen || prefersReducedMotion()) return;
    menuIdleTimer.current = setTimeout(() => dispatch({ type: "menuIdle" }), MENU_IDLE_MS);
    return () => {
      if (menuIdleTimer.current) clearTimeout(menuIdleTimer.current);
      menuIdleTimer.current = null;
    };
  }, [isMenuOpen]);

  // Anything open above him closes on a click elsewhere or Escape,
  // like any other menu on this desktop.
  const hasPanel = state.panel !== null;
  useEffect(() => {
    if (!hasPanel) return;
    const onPointerDown = (e: PointerEvent) => {
      if (e.target instanceof Node && rootRef.current?.contains(e.target)) return;
      dispatch({ type: "closePanel" });
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Focus was in the panel that's about to vanish; hand it back.
      if (rootRef.current?.contains(document.activeElement)) buttonRef.current?.focus();
      dispatch({ type: "closePanel" });
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [hasPanel]);

  useEffect(() => {
    if (!state.bubble) return;
    const id = setTimeout(
      () => dispatch({ type: "bubbleTimeout" }),
      BUBBLE_BASE_MS + state.bubble.length * BUBBLE_MS_PER_CHAR,
    );
    return () => clearTimeout(id);
  }, [state.bubble]);

  // His sprite is a rectangle but he isn't, and that rectangle sits
  // over desktop icons and the edge of the taskbar. So the sprite only
  // takes pointer events while the pointer is over his actual pixels;
  // everywhere else in the box, clicks fall through to what's behind.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || press.current) return;
      const button = buttonRef.current;
      const map = alphaMaps.current[cell.current.sheet];
      if (!button || !map) return;

      const { sheet, row, frame } = cell.current;
      const { cellWidth, cellHeight } = sheet === "carried" ? drag : sprites;
      const rect = button.getBoundingClientRect();
      const x = Math.floor(e.clientX - rect.left);
      const y = Math.floor(e.clientY - rect.top);

      let over = false;
      for (let dy = -HIT_SLOP_PX; dy <= HIT_SLOP_PX && !over; dy++) {
        for (let dx = -HIT_SLOP_PX; dx <= HIT_SLOP_PX && !over; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (px < 0 || py < 0 || px >= cellWidth || py >= cellHeight) continue;
          over = map.alpha[(row * cellHeight + py) * map.width + frame * cellWidth + px] > 0;
        }
      }
      setIsOver(over);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    // Fetched up front so the first pickup doesn't flash an empty
    // frame — and read back for the hit-testing above.
    loadAlphaMap(sprites.src, (map) => (alphaMaps.current.seated = map));
    loadAlphaMap(drag.src, (map) => (alphaMaps.current.carried = map));

    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (stillTimer.current) clearTimeout(stillTimer.current);
      if (dizzyTimer.current) clearTimeout(dizzyTimer.current);
      cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  const clearHoldTimer = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  const armStillTimer = () => {
    if (stillTimer.current) clearTimeout(stillTimer.current);
    stillTimer.current = setTimeout(() => dispatch({ type: "dragStill" }), STRUGGLE_AFTER_MS);
  };

  /** Points the head at the pointer, kept where he can still land on screen. */
  const aim = (p: Press, clientX: number, clientY: number) => {
    const [headX] = sprites.head;
    p.x = clamp(clientX, headX, window.innerWidth - (sprites.cellWidth - headX));
    // No higher than the hand holding him can stay on screen; no lower
    // than his feet touching the floor.
    p.y = clamp(clientY, -GRIP_OFFSET.y, p.floorY - drag.carriedHeight);
  };

  const beginDrag = (clientX: number, clientY: number) => {
    const p = press.current;
    const button = buttonRef.current;
    if (!p || p.dragging || p.longPressed || !button) return;

    clearHoldTimer();
    setHoldPoint(null);
    wasHold.current = true;
    p.dragging = true;
    // Read while he's still seated: the bottom of the button is the floor.
    p.floorY = button.getBoundingClientRect().bottom - (sprites.cellHeight - sprites.floorY);
    p.lastMoveAt = performance.now();
    aim(p, clientX, clientY);

    const reduced = prefersReducedMotion();
    const { floorY } = p;
    dispatch({ type: "dragStart" });
    playSound("pickup");
    setFlight({ x: p.x, y: p.y, tilt: 0, floorY, scaleShadow: !reduced });
    armStillTimer();

    let last = performance.now();
    const swing = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.032);
      last = now;
      // No new pointer events means the pointer has stopped, not that
      // it's still travelling at its last measured speed.
      if (now - p.lastMoveAt > 50) p.velocity *= 0.8;

      if (!reduced) {
        const target = clamp(p.velocity * TILT_DEG_PER_PX_MS, -MAX_TILT_DEG, MAX_TILT_DEG);
        p.tiltVelocity += ((target - p.tilt) * TILT_STIFFNESS - p.tiltVelocity * TILT_DAMPING) * dt;
        p.tilt += p.tiltVelocity * dt;
      }

      const next = {
        x: p.x,
        y: p.y,
        tilt: Math.round(p.tilt * 10) / 10,
        floorY,
        scaleShadow: !reduced,
      };
      setFlight((current) =>
        current && current.x === next.x && current.y === next.y && current.tilt === next.tilt
          ? current
          : next,
      );
      animationFrame.current = requestAnimationFrame(swing);
    };
    animationFrame.current = requestAnimationFrame(swing);
  };

  /** Lets go of him at the current spot: he falls to the floor below it and sits. */
  const drop = (p: Press) => {
    cancelAnimationFrame(animationFrame.current);
    if (stillTimer.current) clearTimeout(stillTimer.current);

    const nextSeatX = clamp(p.x - sprites.head[0], 0, window.innerWidth - sprites.cellWidth);
    savedSeatX = nextSeatX;
    setSeatX(nextSeatX);

    if (prefersReducedMotion()) {
      // No fall to wait for, and no stars: he's simply down.
      dispatch({ type: "drop", animate: false });
      playSound("land");
      return;
    }
    dispatch({ type: "drop", animate: true });

    const fromY = p.y;
    const distance = p.floorY - drag.landHeight - fromY;
    const duration = clamp(Math.sqrt(distance) * FALL_MS_PER_SQRT_PX, MIN_FALL_MS, MAX_FALL_MS);
    const frames = SEQUENCES.falling.frames.length;
    const startedAt = performance.now();
    let tilt = p.tilt;

    const fall = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      // Swings back to upright on the way down.
      tilt *= 0.8;
      setFlight({
        x: p.x,
        // Gravity: distance covered grows with the square of the time.
        y: Math.round(fromY + distance * progress * progress),
        tilt: progress === 1 ? 0 : Math.round(tilt * 10) / 10,
        floorY: p.floorY,
        scaleShadow: true,
      });
      dispatch({
        type: "fallFrame",
        step: Math.min(frames - 1, Math.floor(progress * frames)),
      });

      if (progress === 1) {
        dispatch({ type: "land" });
        playSound("land");
        dizzyTimer.current = setTimeout(() => playSound("dizzy"), DIZZY_SOUND_DELAY_MS);
      } else {
        animationFrame.current = requestAnimationFrame(fall);
      }
    };
    animationFrame.current = requestAnimationFrame(fall);
  };

  const endPress = () => {
    const p = press.current;
    press.current = null;
    clearHoldTimer();
    setHoldPoint(null);
    if (p?.dragging) drop(p);
  };

  const resetPonderCount = () => {
    const [min, max] = PONDER_EVERY;
    bubblesUntilPonder.current = min + Math.floor(Math.random() * (max - min + 1));
  };

  /** Called for each new bubble: whether this one gets the thinking beat. */
  const shouldPonder = () => {
    if (prefersReducedMotion()) return false;
    bubblesUntilPonder.current -= 1;
    if (bubblesUntilPonder.current > 0) return false;
    resetPonderCount();
    return true;
  };

  const chooseTopic = (topic: AssistantTopic) => {
    // Always a beat here — which also means the first bubbles of the
    // answer never get another one straight after.
    resetPonderCount();
    dispatch({ type: "chooseTopic", topic, ponder: !prefersReducedMotion() });
  };

  /** Something happened in the menu: he perks up, and the idle countdown starts over. */
  const noteMenuActivity = () => {
    if (menuIdleTimer.current) clearTimeout(menuIdleTimer.current);
    menuIdleTimer.current = null;
    dispatch({ type: "menuActive" });
    if (prefersReducedMotion()) return;
    menuIdleTimer.current = setTimeout(() => dispatch({ type: "menuIdle" }), MENU_IDLE_MS);
  };

  const closePanel = () => {
    buttonRef.current?.focus();
    dispatch({ type: "closePanel" });
  };

  const openTopic = (icon: DesktopIconConfig) => {
    openDesktopWindow(wm, icon);
    dispatch({ type: "opened", line: script.opened });
  };

  const tap = () => {
    // With something open above him, a tap on him is "go on" / "never
    // mind" rather than a new line.
    if (state.panel) {
      if (state.panel.kind === "topic") dispatch({ type: "nextPage", ponder: shouldPonder() });
      else dispatch({ type: "closePanel" });
      return;
    }
    if (!hasGreeted) {
      hasGreeted = true;
      dispatch({ type: "tap", line: script.greeting, isGreeting: true, ponder: false });
      return;
    }
    // Any quip but the one he said last time.
    let index = Math.floor(Math.random() * (script.quips.length - 1));
    if (index >= lastQuip.current && lastQuip.current >= 0) index += 1;
    lastQuip.current = index;
    dispatch({ type: "tap", line: script.quips[index], isGreeting: false, ponder: shouldPonder() });
  };

  const isBusy = BUSY.has(state.mode);
  const isAirborne = AIRBORNE.has(state.mode) && flight !== null;
  const isHeld = HELD.has(state.mode);

  const sheet = sequence.sheet === "carried" ? drag : sprites;
  const row =
    sequence.sheet === "carried" ? drag.rows[sequence.row].row : sprites.rows[sequence.row].row;
  const frame = sequence.frames[state.step];
  const isPressed = holdPoint !== null;
  const cursor = isPressed ? sprites.cursor.pressed : sprites.cursor.hover;
  const glint = state.mode === "glint" ? GLINT_STEPS[state.step] : null;
  const [anchorX, anchorY] = drag.anchor;

  useEffect(() => {
    cell.current = { sheet: sequence.sheet, row, frame };
  }, [sequence.sheet, row, frame]);

  // Seated, the stylesheet's bottom-right corner places him until he's
  // been dropped somewhere; airborne, he's placed by the top of his head.
  let position: React.CSSProperties = {};
  if (isAirborne) {
    position = {
      left: flight.x - anchorX,
      top: flight.y - anchorY,
      right: "auto",
      bottom: "auto",
    };
  } else if (seatX !== null) {
    // The clamp keeps him on screen if the window has shrunk since.
    position = {
      left: `clamp(0px, ${seatX}px, calc(100vw - ${sprites.cellWidth}px))`,
      right: "auto",
      bottom: SEAT_BOTTOM_PX,
    };
  } else {
    position = { bottom: SEAT_BOTTOM_PX };
  }

  // The shadow: centred on the floor line, so its lower half shows on
  // the taskbar beneath him. Under his crossed legs when seated; in
  // the air, straight below his head, smaller and fainter the higher
  // his feet are. It's back to full size at the moment he touches
  // down, since the fall ends with his feet exactly on that line.
  let shadowScale = 1;
  let shadowCenter = { x: sprites.centerX, y: sprites.floorY };
  if (isAirborne) {
    const height = Math.max(0, flight.floorY - flight.y - drag.landHeight);
    const lift = flight.scaleShadow ? Math.min(height / SHADOW_FADE_HEIGHT_PX, 1) : 0;
    shadowScale = 1 - lift;
    shadowCenter = { x: anchorX, y: flight.floorY - flight.y + anchorY };
  }

  let spriteMotion: React.CSSProperties = {};
  if (isAirborne) {
    spriteMotion =
      state.mode === "landing"
        ? // The squash pivots on his feet.
          { transformOrigin: `${anchorX}px ${anchorY + drag.landHeight}px` }
        : // The swing pivots on the top of his head, where he's held.
          {
            transformOrigin: `${anchorX}px ${anchorY}px`,
            transform: `rotate(${flight.tilt}deg)`,
          };
  }

  const className = [
    "assistant",
    seatX !== null && seatX < BUBBLE_FLIP_BELOW_PX ? "assistant--bubble-right" : "",
  ].join(" ");

  return (
    <div ref={rootRef} className={className} style={position}>
      {/* Always mounted, so screen readers announce each new line. */}
      <div className="assistant__bubble" role="status" hidden={!state.bubble}>
        {state.bubble ? <Line text={state.bubble} /> : null}
      </div>

      {state.panel?.kind === "menu" ? (
        <TopicMenu
          title={script.menuTitle}
          topics={topics}
          dismissLabel={script.dismissLabel}
          onChoose={chooseTopic}
          onActivity={noteMenuActivity}
          onDismiss={closePanel}
        />
      ) : null}

      {state.panel?.kind === "topic" ? (
        <TopicBubble
          panel={state.panel}
          onNext={() => dispatch({ type: "nextPage", ponder: shouldPonder() })}
          onOpen={() => {
            const { topic } = state.panel as Extract<Panel, { kind: "topic" }>;
            const match = topics.find((entry) => entry.topic === topic);
            buttonRef.current?.focus();
            if (match) openTopic(match.icon);
          }}
          onBack={() => dispatch({ type: "openMenu" })}
        />
      ) : null}

      <Shadow
        centerX={shadowCenter.x}
        centerY={shadowCenter.y}
        scale={SHADOW_MIN_SCALE + (1 - SHADOW_MIN_SCALE) * shadowScale}
        opacity={SHADOW_MIN_OPACITY + (SHADOW_OPACITY - SHADOW_MIN_OPACITY) * shadowScale}
      />

      <button
        ref={buttonRef}
        type="button"
        className={[
          "assistant__sprite",
          state.mode === "landing" ? "assistant__sprite--landing" : "",
          isPressed ? "assistant__sprite--pressed" : "",
        ].join(" ")}
        aria-label="thea.exe, the thOS assistant. Press and hold, or press Enter, to ask about this desktop."
        // He has his own sounds; a UI click on top (one fires when a
        // drag is let go) would only muddy them.
        data-no-click-sound=""
        aria-haspopup="menu"
        aria-expanded={state.panel?.kind === "menu"}
        style={{
          width: sheet.cellWidth,
          height: sheet.cellHeight,
          backgroundImage: `url(${sheet.src})`,
          backgroundPosition: `${-frame * sheet.cellWidth}px ${-row * sheet.cellHeight}px`,
          // While he's held the hand is drawn on top of him instead (below).
          cursor: isHeld
            ? "none"
            : `url(${cursor.src}) ${cursor.hotspot[0]} ${cursor.hotspot[1]}, pointer`,
          pointerEvents: isOver || isPressed || isHeld ? "auto" : "none",
          ...spriteMotion,
        }}
        onPointerDown={(e) => {
          if (e.button !== 0 || isBusy || press.current) return;
          const { clientX, clientY } = e;
          const rect = e.currentTarget.getBoundingClientRect();
          // Keeps the move and up events coming here once he (or the
          // pointer) has moved out from under the other.
          e.currentTarget.setPointerCapture(e.pointerId);
          wasHold.current = false;
          press.current = {
            pointerId: e.pointerId,
            startX: clientX,
            startY: clientY,
            isTouch: e.pointerType === "touch",
            dragging: false,
            longPressed: false,
            floorY: 0,
            x: clientX,
            y: clientY,
            velocity: 0,
            lastMoveAt: 0,
            tilt: 0,
            tiltVelocity: 0,
          };
          setHoldPoint({
            x: Math.round(clientX - rect.left),
            y: Math.round(clientY - rect.top),
          });
          holdTimer.current = setTimeout(() => {
            const p = press.current;
            if (!p || p.dragging) return;
            p.longPressed = true;
            wasHold.current = true;
            setHoldPoint(null);
            dispatch({ type: "openMenu" });
          }, LONG_PRESS_MS);
        }}
        onPointerMove={(e) => {
          const p = press.current;
          if (!p || e.pointerId !== p.pointerId || p.longPressed) return;

          if (!p.dragging) {
            const travelled = Math.hypot(e.clientX - p.startX, e.clientY - p.startY);
            if (travelled > (p.isTouch ? TOUCH_DRAG_THRESHOLD_PX : DRAG_THRESHOLD_PX)) {
              beginDrag(e.clientX, e.clientY);
            }
            return;
          }

          const now = performance.now();
          const previousX = p.x;
          aim(p, e.clientX, e.clientY);
          const elapsed = Math.max(now - p.lastMoveAt, 1);
          p.velocity += ((p.x - previousX) / elapsed - p.velocity) * 0.5;
          p.lastMoveAt = now;

          dispatch({ type: "dragMove" });
          armStillTimer();
        }}
        onPointerUp={endPress}
        onPointerCancel={endPress}
        onPointerLeave={() => {
          // Pointer capture stops this firing mid-press in practice;
          // either way, a drag only ends on release.
          if (!press.current?.dragging) endPress();
        }}
        // A long-press on touch would otherwise open the browser's menu.
        onContextMenu={(e) => e.preventDefault()}
        // The tap itself is the click event rather than pointerup, so
        // the keyboard gets one too — and since a key can't be held
        // the way a pointer can, there it goes straight to the menu.
        onClick={(e) => {
          if (wasHold.current) {
            wasHold.current = false;
            return;
          }
          if (e.detail === 0) dispatch({ type: state.panel ? "closePanel" : "openMenu" });
          else tap();
        }}
      >
        {glint ? <Glint lensIndex={glint.lens} offset={glint.offset} /> : null}
      </button>

      {holdPoint && !isBusy ? <HoldRing x={holdPoint.x} y={holdPoint.y} /> : null}

      {isHeld && isAirborne ? (
        <span
          className="assistant__hand"
          style={{
            left: anchorX + GRIP_OFFSET.x - sprites.cursor.pressed.hotspot[0],
            top: anchorY + GRIP_OFFSET.y - sprites.cursor.pressed.hotspot[1],
            backgroundImage: `url(${sprites.cursor.pressed.src})`,
          }}
        />
      ) : null}

      {state.mode === "landing" && isAirborne ? (
        <span className="assistant__stars" style={{ left: anchorX, top: anchorY }}>
          <span className="assistant__star" />
          <span className="assistant__star" />
        </span>
      ) : null}
    </div>
  );
}

/** A line of his, with `**…**` spans in bold. */
function Line({ text }: { text: string }) {
  return (
    <>{text.split("**").map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}</>
  );
}

interface TopicMenuProps {
  title: string;
  topics: { topic: AssistantTopic; icon: DesktopIconConfig }[];
  dismissLabel: string;
  onChoose: (topic: AssistantTopic) => void;
  /** The pointer moved over the menu, or a key was pressed in it. */
  onActivity: () => void;
  onDismiss: () => void;
}

/**
 * The long-press menu: a Win98 popup panel with a speech-bubble tail,
 * one item per thing he can explain. Focus moves in as it opens; the
 * arrow keys (and Home/End) walk the items, Enter picks one, and
 * Escape — handled by Assistant, along with clicks outside — closes it.
 */
function TopicMenu({
  title,
  topics,
  dismissLabel,
  onChoose,
  onActivity,
  onDismiss,
}: TopicMenuProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    onActivity();
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const current = items.indexOf(document.activeElement as HTMLElement);
    let next: number;
    if (e.key === "ArrowDown") next = (current + 1) % items.length;
    else if (e.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else return;
    e.preventDefault();
    items[next]?.focus();
  };

  return (
    <div className="assistant__menu" onPointerMove={onActivity}>
      <div className={`assistant__menu-panel ${OPAQUE_PANEL_CLASS}`} style={OPAQUE_PANEL_STYLE}>
        <div className="assistant__menu-title" id="assistant-menu-title">
          {title}
        </div>
        <div
          ref={listRef}
          role="menu"
          aria-labelledby="assistant-menu-title"
          className="assistant__menu-items"
          onKeyDown={onKeyDown}
        >
          {topics.map(({ topic, icon }) => (
            <button
              key={topic.iconId}
              type="button"
              role="menuitem"
              tabIndex={-1}
              className="assistant__menu-item"
              onClick={() => onChoose(topic)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 16px pixel-art icon, same as every other icon in thOS. */}
              <img src={icon.icon} alt="" width={16} height={16} />
              <span>{topic.label}</span>
            </button>
          ))}
          <div className="assistant__menu-separator" role="separator" />
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className="assistant__menu-item assistant__menu-item--plain"
            onClick={onDismiss}
          >
            <span>{dismissLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface TopicBubbleProps {
  panel: Extract<Panel, { kind: "topic" }>;
  onNext: () => void;
  onOpen: () => void;
  onBack: () => void;
}

/**
 * His answer to a menu topic: one page per bubble, advanced by its
 * Next button (which holds focus, so Enter does it) or a click
 * anywhere on the bubble. The last page swaps Next for the two ways
 * on from here: open the thing, or go back to the menu.
 */
function TopicBubble({ panel, onNext, onOpen, onBack }: TopicBubbleProps) {
  const { topic, page } = panel;
  const isLastPage = page === topic.pages.length - 1;
  const primaryRef = useRef<HTMLButtonElement>(null);

  // Next unmounts on the last page; keep focus on whatever replaced it.
  useEffect(() => {
    primaryRef.current?.focus();
  }, [isLastPage]);

  return (
    <div
      className="assistant__bubble assistant__bubble--topic"
      onClick={isLastPage ? undefined : onNext}
    >
      <p role="status">
        <Line text={topic.pages[page]} />
      </p>
      <div className="assistant__bubble-actions">
        {isLastPage ? (
          <>
            <button ref={primaryRef} type="button" onClick={onOpen}>
              Open it
            </button>
            <button type="button" onClick={onBack}>
              Ask something else
            </button>
          </>
        ) : (
          <button
            ref={primaryRef}
            type="button"
            onClick={(e) => {
              // The bubble's own click handler would advance a second page.
              e.stopPropagation();
              onNext();
            }}
          >
            Next &#9656;
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * The ring that fills in, dot by dot, around the pointer while a
 * press is held — timed (in assistant.css) to complete just as the
 * press becomes a long-press, and to stay hidden for a quick tap.
 */
function HoldRing({ x, y }: { x: number; y: number }) {
  return (
    <span className="assistant__hold-ring" aria-hidden="true" style={{ left: x, top: y }}>
      {Array.from({ length: HOLD_RING_DOTS }, (_, i) => {
        // Clockwise from twelve o'clock.
        const angle = (i / HOLD_RING_DOTS) * Math.PI * 2;
        return (
          <span
            key={i}
            style={{
              left: Math.round(Math.sin(angle) * HOLD_RING_RADIUS_PX) - 1,
              top: Math.round(-Math.cos(angle) * HOLD_RING_RADIUS_PX) - 1,
              animationDelay: `${Math.round(((i + 1) / HOLD_RING_DOTS) * (LONG_PRESS_MS - 90))}ms`,
            }}
          />
        );
      })}
    </span>
  );
}

/**
 * The shadow, as stacked 1px rows of a pixel ellipse — no border-radius
 * or blur, so its edge is stepped like the rest of the art. Two
 * opacity bands: the full ellipse, and a smaller one over its middle.
 * Resized in whole pixels rather than with a CSS scale, which would
 * smear those steps.
 */
function Shadow({
  centerX,
  centerY,
  scale,
  opacity,
}: {
  centerX: number;
  centerY: number;
  scale: number;
  opacity: number;
}) {
  const width = Math.round((SHADOW_WIDTH_PX * scale) / 2) * 2;
  const height = Math.max(2, Math.round(SHADOW_HEIGHT_PX * scale));

  const rows = [];
  for (const band of [1, 0.6]) {
    const bandHeight = Math.round(height * band);
    if (bandHeight < 1 || (band < 1 && height < 4)) continue;
    const top = Math.floor((height - bandHeight) / 2);
    for (let y = 0; y < bandHeight; y++) {
      // How far this row's centre is from the ellipse's, as -1..1.
      const offset = (y + 0.5 - bandHeight / 2) / (bandHeight / 2);
      const half = Math.max(1, Math.round((width * band * Math.sqrt(1 - offset * offset)) / 2));
      rows.push(
        <span
          key={`${band}-${y}`}
          // Two thirds from the outer band, the rest added by the inner.
          style={{
            left: width / 2 - half,
            top: top + y,
            width: half * 2,
            opacity: band === 1 ? (opacity * 2) / 3 : opacity / 3,
          }}
        />,
      );
    }
  }

  return (
    <span
      className="assistant__shadow"
      aria-hidden="true"
      style={{
        left: Math.round(centerX - width / 2),
        top: Math.round(centerY - height / 2),
        width,
        height,
      }}
    >
      {rows}
    </span>
  );
}

/** Both lenses dimmed, plus a 3-pixel diagonal streak inside one of them. */
function Glint({ lensIndex, offset }: { lensIndex: number; offset: number }) {
  const lens = sprites.lenses[lensIndex];
  return (
    <>
      {sprites.lenses.map((l) => (
        <span
          key={l.x}
          className="assistant__lens"
          style={{ left: l.x, top: l.y, width: l.width, height: l.height }}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="assistant__glint"
          style={{ left: lens.x + offset + 2 - i, top: lens.y + i }}
        />
      ))}
    </>
  );
}
