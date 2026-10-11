"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SKY_MESSAGES, type SkyMessageList } from "@/config/skyMessages";
import backdrop from "@/data/backdrop.json";
import type { ThemeName } from "@/hooks/useTheme";
import { usePageVisible, usePrefersReducedMotion } from "@/hooks/usePageSignals";

// How far through each of config/skyMessages.ts's lists the sky has
// got. Module-level, so each list keeps its own place whatever gets
// remounted — and both start over from the first line on a page load.
const linesShown: Record<SkyMessageList, number> = { plane: 0, searchlight: 0 };

/** The next line of a list, in order, wrapping round after the last. */
function nextLine(list: SkyMessageList): string {
  const lines = SKY_MESSAGES[list];
  const line = lines[linesShown[list] % lines.length];
  linesShown[list] += 1;
  return line;
}

const PIXEL_FONT = '16px "W95FA"';

/** A length in wallpaper pixels, as CSS that scales with the stage (see backdrop.css). */
const u = (wallpaperPx: number) => `calc(var(--u) * ${wallpaperPx})`;
const percentX = (x: number) => `${(x / backdrop.width) * 100}%`;
const percentY = (y: number) => `${(y / backdrop.height) * 100}%`;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export interface DesktopBackdropProps {
  /** Which profile's sky this is: the plane's by day, the searchlight's by night. */
  theme: ThemeName;
}

/**
 * The living part of the wallpaper, drawn between it and the desktop
 * icons: clouds drifting across the sky on both profiles, and a plane
 * towing a banner every minute or so (dev) or a rooftop searchlight
 * projecting an emblem onto the side of a tower (sec), each with one
 * line after another from config/skyMessages.ts.
 *
 * Everything sits on a "stage" that covers the desktop exactly the way
 * the wallpaper image itself does (`background-size: cover`), and is
 * placed in the wallpaper's own pixel coordinates, so it stays lined
 * up with the picture at any window size. The art those coordinates
 * came from is cut out by scripts/process-backdrop.mjs.
 *
 * Pure decoration: hidden from assistive tech, never in the way of a
 * click, paused while the tab is in the background, and still under
 * prefers-reduced-motion: no drift or sweep, and the first line shown
 * once, standing, for a few seconds as the desktop appears.
 */
export function DesktopBackdrop({ theme }: DesktopBackdropProps) {
  const isVisible = usePageVisible();
  const reducedMotion = usePrefersReducedMotion();

  const className = [
    "backdrop",
    `backdrop--${theme}`,
    isVisible ? "" : "backdrop--paused",
    reducedMotion ? "backdrop--still" : "",
  ].join(" ");

  return (
    <div className={className} aria-hidden="true">
      <div className="backdrop__stage">
        <Clouds />
        {theme === "dev" ? (
          <Flyby reducedMotion={reducedMotion} />
        ) : (
          <>
            {/* The buildings again, over the clouds; the light plays on them. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- a layer of the wallpaper, sized by the stage. */}
            <img className="backdrop__skyline" src={backdrop.skyline} alt="" />
            <Searchlight isVisible={isVisible} reducedMotion={reducedMotion} />
            <div
              className="backdrop__lamp"
              style={{
                left: percentX(LAMP.x),
                top: percentY(LAMP.y),
                width: u(backdrop.searchlight.width * LAMP.scale),
                height: u(backdrop.searchlight.height * LAMP.scale),
                backgroundImage: `url(${backdrop.searchlight.src})`,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

// --- Clouds -------------------------------------------------------------

/**
 * The wallpaper's own clouds, each back where it was cut from, on a
 * few layers that slide rightwards at different speeds (the smaller,
 * "further" ones slower and fainter). Every layer holds its clouds
 * twice, a stage-width apart, so as one set drifts off the right edge
 * the other arrives from the left — three moving elements in total,
 * however many clouds there are.
 */
function Clouds() {
  return (
    <>
      {Array.from({ length: backdrop.cloudLayers }, (_, layer) => (
        <div key={layer} className={`backdrop__clouds backdrop__clouds--${layer}`}>
          {[0, -1].flatMap((copy) =>
            backdrop.clouds
              .filter((cloud) => cloud.layer === layer)
              .map((cloud) => (
                // eslint-disable-next-line @next/next/no-img-element -- pixel art, sized by the stage.
                <img
                  key={`${copy}${cloud.src}`}
                  src={cloud.src}
                  alt=""
                  style={{
                    left: `${(cloud.x / backdrop.width + copy) * 100}%`,
                    top: percentY(cloud.y),
                    width: percentX(cloud.width),
                  }}
                />
              )),
          )}
        </div>
      ))}
    </>
  );
}

// --- The plane and its banner (dev) --------------------------------------

// The first pass comes soon after the desktop appears, so a visitor
// who doesn't linger still sees it; after that, now and then.
const FIRST_FLYBY_MS = 7000;
// Under reduced motion there's no pass: the plane just hangs in the
// sky with the first line for this long, once.
const PARKED_MS = 8000;
const FLYBY_GAP_MS = [45000, 90000] as const;
// Art pixels are this many wallpaper pixels across. Small on purpose:
// it's a plane a long way off, not one buzzing the desktop.
const PLANE_SCALE = 2;
const BANNER_SCALE = 1;
const ROPE_LENGTH = 36;

const BANNER_PADDING_X = 8;
const BANNER_CLOTH_HEIGHT = 22;
const BANNER_FRAMES = 3;
// How many columns one ripple of the cloth spans.
const BANNER_WAVELENGTH = 30;
const BANNER_COLORS = {
  cloth: [255, 255, 255],
  ink: [32, 32, 72],
  outline: [24, 24, 40],
} as const;

interface BannerSprite {
  url: string;
  width: number;
  /** Of one frame. */
  height: number;
}

/** The pixels a line of text covers at the pixel font's native size, as a bitmap. */
function rasterizeText(text: string) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.font = PIXEL_FONT;
  const width = Math.ceil(context.measureText(text).width) + 2;
  const height = 16;
  canvas.width = width;
  canvas.height = height;
  // Setting the size reset the context.
  context.font = PIXEL_FONT;
  context.textBaseline = "middle";
  context.fillStyle = "#000";
  context.fillText(text, 1, height / 2 + 1);
  const { data } = context.getImageData(0, 0, width, height);
  const on = new Uint8Array(width * height);
  // Canvas text is anti-aliased; a threshold makes it pixel type again.
  for (let i = 0; i < on.length; i++) on[i] = data[i * 4 + 3] > 110 ? 1 : 0;
  return { width, height, on };
}

type Bitmap = NonNullable<ReturnType<typeof rasterizeText>>;

/**
 * A whole message as one bitmap: its text at the pixel font's native
 * size, with any " ✦ " in it replaced by the hand-drawn STAR below.
 */
function rasterizeMessage(message: string): Bitmap | null {
  const parts = message.split("✦").map((part) => rasterizeText(part.trim()));
  if (parts.some((part) => part === null)) return null;
  const texts = parts as Bitmap[];

  const gap = 6;
  const starWidth = STAR[0].length;
  const height = texts[0].height;
  const width =
    texts.reduce((sum, text) => sum + text.width, 0) + (texts.length - 1) * (starWidth + gap * 2);
  const on = new Uint8Array(width * height);

  let x = 0;
  texts.forEach((text, n) => {
    if (n > 0) {
      const top = Math.floor((height - STAR.length) / 2);
      STAR.forEach((row, sy) => {
        [...row].forEach((cell, sx) => {
          if (cell === "#") on[(top + sy) * width + x + gap + sx] = 1;
        });
      });
      x += starWidth + gap * 2;
    }
    for (let ty = 0; ty < text.height; ty++) {
      for (let tx = 0; tx < text.width; tx++) {
        if (text.on[ty * text.width + tx]) on[ty * width + x + tx] = 1;
      }
    }
    x += text.width;
  });
  return { width, height, on };
}

// The ✦ between the two halves of a message, drawn by hand — the
// pixel font has no such glyph, and a fallback font's would be smooth.
const STAR = [
  "....#....",
  "....#....",
  "...###...",
  "..#####..",
  "#########",
  "..#####..",
  "...###...",
  "....#....",
  "....#....",
];

/**
 * Draws a banner for one line — white cloth, dark outline, the
 * lettering — as a strip of frames, each with the cloth's ripple a
 * third of a wave further along. Every column of pixels rides up or
 * down a pixel as a whole, lettering included, which is all the "wave"
 * is. The cloth is cut to the line: its width is the measured text
 * plus the same padding at both ends.
 */
function drawBanner(message: string): BannerSprite | null {
  const text = rasterizeMessage(message);
  if (!text) return null;

  const width = text.width + BANNER_PADDING_X * 2;
  // The cloth, a pixel of outline and a pixel of ripple above and below.
  const frameHeight = BANNER_CLOTH_HEIGHT + 4;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = frameHeight * BANNER_FRAMES;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const image = context.createImageData(width, canvas.height);

  const put = (x: number, y: number, color: readonly number[]) => {
    if (x < 0 || x >= width || y < 0 || y >= canvas.height) return;
    image.data.set([...color, 255], (y * width + x) * 4);
  };

  for (let frame = 0; frame < BANNER_FRAMES; frame++) {
    const top = frame * frameHeight + 2;
    const ripple = (x: number) =>
      Math.round(Math.sin((x / BANNER_WAVELENGTH - frame / BANNER_FRAMES) * Math.PI * 2));

    for (let x = 1; x < width - 1; x++) {
      const dy = ripple(x);
      for (let y = 0; y < BANNER_CLOTH_HEIGHT; y++) put(x, top + dy + y, BANNER_COLORS.cloth);
    }

    const textTop = top + Math.floor((BANNER_CLOTH_HEIGHT - text.height) / 2);
    for (let y = 0; y < text.height; y++) {
      for (let x = 0; x < text.width; x++) {
        if (!text.on[y * text.width + x]) continue;
        const column = BANNER_PADDING_X + x;
        put(column, textTop + y + ripple(column), BANNER_COLORS.ink);
      }
    }

    // The outline: every empty pixel that touches cloth.
    const isFilled = (x: number, y: number) =>
      x >= 0 && x < width && y >= frame * frameHeight && y < (frame + 1) * frameHeight
        ? image.data[(y * width + x) * 4 + 3] > 0
        : false;
    const outline: [number, number][] = [];
    for (let y = frame * frameHeight; y < (frame + 1) * frameHeight; y++) {
      for (let x = 0; x < width; x++) {
        if (isFilled(x, y)) continue;
        if (isFilled(x - 1, y) || isFilled(x + 1, y) || isFilled(x, y - 1) || isFilled(x, y + 1)) {
          outline.push([x, y]);
        }
      }
    }
    for (const [x, y] of outline) put(x, y, BANNER_COLORS.outline);
  }

  context.putImageData(image, 0, 0);
  return { url: canvas.toDataURL("image/png"), width, height: frameHeight };
}

/**
 * The plane: crosses the sky left to right, bobbing, propeller
 * spinning, banner rippling behind it on a rope — then is gone until
 * the next pass, which tows the next line. Each pass is a fresh mount
 * (`key`) of one CSS animation, which reports back when it's off the
 * far side.
 *
 * Under reduced motion it doesn't cross at all: it appears once, in
 * place, with the first line, and is taken away after a few seconds.
 */
function Flyby({ reducedMotion }: { reducedMotion: boolean }) {
  // The banner needs the pixel font, which may still be on its way.
  const [isFontReady, setIsFontReady] = useState(false);
  // The pass in progress and the banner made for it; null between passes.
  const [pass, setPass] = useState<{ id: number; banner: BannerSprite } | null>(null);
  const passes = useRef(0);

  useEffect(() => {
    let cancelled = false;
    document.fonts.load(PIXEL_FONT).then(() => {
      if (!cancelled) setIsFontReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isFlying = pass !== null;
  useEffect(() => {
    if (!isFontReady || isFlying) return;
    // The one standing appearance has been and gone.
    if (reducedMotion && passes.current > 0) return;

    const begin = () => {
      const banner = drawBanner(nextLine("plane"));
      if (!banner) return;
      passes.current += 1;
      setPass({ id: passes.current, banner });
    };
    const delay =
      passes.current > 0 ? randomBetween(...FLYBY_GAP_MS) : reducedMotion ? 0 : FIRST_FLYBY_MS;
    const id = setTimeout(begin, delay);
    return () => clearTimeout(id);
  }, [isFontReady, isFlying, reducedMotion]);

  // Nothing ends a standing appearance but the clock.
  useEffect(() => {
    if (!reducedMotion || !isFlying) return;
    const id = setTimeout(() => setPass(null), PARKED_MS);
    return () => clearTimeout(id);
  }, [reducedMotion, isFlying]);

  if (!pass) return null;

  const { plane } = backdrop;
  const { banner } = pass;
  return (
    <div
      key={pass.id}
      className="backdrop__flyby"
      onAnimationEnd={(e) => {
        // Not the bob or the propeller, which bubble up to here too.
        if (e.target === e.currentTarget) setPass(null);
      }}
    >
      <div className="backdrop__flyby-bob">
        <div
          className="backdrop__banner"
          style={{
            width: u(banner.width * BANNER_SCALE),
            height: u(banner.height * BANNER_SCALE),
            backgroundImage: `url(${banner.url})`,
            backgroundSize: `100% ${BANNER_FRAMES * 100}%`,
          }}
        />
        <div className="backdrop__rope" style={{ width: u(ROPE_LENGTH) }} />
        <div
          className="backdrop__plane"
          style={{
            width: u(plane.width * PLANE_SCALE),
            height: u(plane.height * PLANE_SCALE),
            backgroundImage: `url(${plane.src})`,
            backgroundSize: `${plane.frames * 100}% 100%`,
          }}
        />
      </div>
    </div>
  );
}

// --- The searchlight (sec) ------------------------------------------------

// Where things are on the night wallpaper, in its pixels (the stage
// scales them with it). The lamp stands on a rooftop to the right of
// the tall central tower and points up and to the left, at the
// tower's lit face — which it uses as a screen.
// It's on the flat roof of the short beige building, at its left end.
const LAMP = { x: 1482, y: 459, scale: 1 };
const LENS = {
  x: LAMP.x + backdrop.searchlight.lens[0] * LAMP.scale,
  y: LAMP.y + backdrop.searchlight.lens[1] * LAMP.scale,
};
// The tower's face: the only surface the light lands on. Where the
// pool swings past its edges, or below the roofs in front of it, there
// is nothing for it to fall on, and nothing is drawn.
const FACE = { left: 1104, right: 1344, bottom: 578 };
// The pool of light the beam ends in at the middle of its sweep, and
// its size: as wide as the face allows, since the message has to fit
// inside it, and at the height that puts that line on the one stretch
// of wall between floors with hardly a window in it.
const SPOT = { x: 1224, y: 360, radiusX: 108, radiusY: 50 };
// The pool is a squarish oval (a superellipse of this power): a true
// ellipse narrows too soon to hold a line of text below its middle.
const SPOT_POWER = 3;
// Everything the light can reach — all the canvas has to cover.
const REACH = { x: 1080, y: 280, width: 440, height: 300 };
// The canvas is wallpaper-sized (so the lettering can be small), but
// the light itself is drawn in blocks this big, to keep it stepped.
const BEAM_BLOCK = 2;
const BEAM_COLOR = [255, 246, 200] as const;
// All of it is meant to be glimpsed, not read from across the room.
const BEAM_OPACITY = 0.11;
// The pool is flat bands rather than a soft falloff: each is lit this
// much, out to this share of the way to the pool's edge.
const SPOT_BANDS = [
  { within: 0.45, opacity: 0.2 },
  { within: 0.8, opacity: 0.16 },
  { within: 1, opacity: 0.12 },
] as const;
// How much the wall inside the pool is dimmed under the light, so the
// projection isn't lost among the tower's windows.
const SPOT_SHADE = 0.2;
// The emblem and the message are light thrown on a wall, not print.
const PROJECTION_OPACITY = 0.65;
// One emblem cell (see EMBLEM) is this many wallpaper pixels: 36 tall.
const EMBLEM_PIXEL = 2;
// Between the emblem and the line under it.
const EMBLEM_GAP = 4;

// Frames per second: enough for a slow sweep, cheap, and suitably choppy.
const BEAM_FPS = 8;
const SWEEP_DEGREES = 5;
const SWEEP_PERIOD_MS = 14000;
// Each line fades up, is held, fades out, and after a short dark gap
// the next one fades up in its place.
const FADE_MS = 700;
const HOLD_MS = 8000;
const LINE_GAP_MS = 500;
const LINE_MS = FADE_MS * 2 + HOLD_MS + LINE_GAP_MS;
// The fade happens in this many visible steps, not smoothly.
const FADE_STEPS = 4;

// thOS's own mark: a shield with a keyhole. `#` is lit, `.` isn't.
const EMBLEM = [
  ".###############.",
  "#################",
  "#################",
  "#######...#######",
  "######.....######",
  "######.....######",
  "#######...#######",
  "#######...#######",
  "######.....######",
  "#################",
  "#################",
  ".###############.",
  ".###############.",
  "..#############..",
  "...###########...",
  "....#########....",
  "......#####......",
  "........#........",
];

interface BeamFrame {
  /** How far the beam has swung from the middle of its sweep, in degrees. */
  angle: number;
  /** How visible the message is, 0–1. */
  reveal: number;
  /** Which line is up, counting from 1 — a new number means a new line. */
  show: number;
}

/**
 * Paints one frame of the light, pixel by pixel: a cone from the
 * lamp's lens to a pool of light on the tower's face and, inside that
 * pool and nowhere else, thOS's emblem with the message under it —
 * both placed from the pool's middle, so they ride along with it. Done
 * by hand rather than with canvas paths, whose edges would be
 * anti-aliased — these have to stay hard and stepped.
 */
function paintBeam(
  context: CanvasRenderingContext2D,
  message: Bitmap | null,
  frame: Pick<BeamFrame, "angle" | "reveal">,
) {
  const { width, height } = REACH;
  const image = context.createImageData(width, height);

  // Everything in canvas pixels (wallpaper pixels, from REACH's corner).
  const lens = { x: LENS.x - REACH.x, y: LENS.y - REACH.y };
  const rest = { x: SPOT.x - REACH.x - lens.x, y: SPOT.y - REACH.y - lens.y };
  const turn = (frame.angle * Math.PI) / 180;
  const axis = {
    x: rest.x * Math.cos(turn) - rest.y * Math.sin(turn),
    y: rest.x * Math.sin(turn) + rest.y * Math.cos(turn),
  };
  const spot = { x: lens.x + axis.x, y: lens.y + axis.y };
  const length = Math.hypot(axis.x, axis.y);
  // The cone widens from the lens to the pool, as wide as that looks
  // side-on from wherever the lamp is.
  const nearHalfWidth = 3 * LAMP.scale;
  const farHalfWidth =
    0.9 * Math.hypot((SPOT.radiusX * axis.y) / length, (SPOT.radiusY * axis.x) / length);

  const face = {
    left: FACE.left - REACH.x,
    right: FACE.right - REACH.x,
    bottom: FACE.bottom - REACH.y,
  };
  /** How far out of the pool a point is: 0 at its middle, 1 at its edge. */
  const poolReach = (x: number, y: number) =>
    Math.abs((x - spot.x) / SPOT.radiusX) ** SPOT_POWER +
    Math.abs((y - spot.y) / SPOT.radiusY) ** SPOT_POWER;

  // The projection: the emblem with the line under it, centred as one
  // block on the middle of the pool.
  const emblemWidth = EMBLEM[0].length * EMBLEM_PIXEL;
  const emblemHeight = EMBLEM.length * EMBLEM_PIXEL;
  const blockHeight = emblemHeight + (message ? EMBLEM_GAP + message.height : 0);
  const emblemLeft = Math.round(spot.x - emblemWidth / 2);
  const emblemTop = Math.round(spot.y - blockHeight / 2);
  const messageLeft = message ? Math.round(spot.x - message.width / 2) : 0;
  const messageTop = emblemTop + emblemHeight + EMBLEM_GAP;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // The light is tested at the middle of the block this pixel is
      // in, so its edges step in blocks; the projection's don't.
      const bx = x - (x % BEAM_BLOCK) + BEAM_BLOCK / 2;
      const by = y - (y % BEAM_BLOCK) + BEAM_BLOCK / 2;
      let light = 0;
      let shade = 0;

      const dx = bx - lens.x;
      const dy = by - lens.y;
      const along = (dx * axis.x + dy * axis.y) / (length * length);
      if (along > 0 && along < 1) {
        const across = Math.abs(dx * axis.y - dy * axis.x) / length;
        if (across < nearHalfWidth + (farHalfWidth - nearHalfWidth) * along) light = BEAM_OPACITY;
      }

      const isOnFace = x >= face.left && x < face.right && y < face.bottom;
      const reach = poolReach(bx, by);
      if (isOnFace && reach < 1) {
        light = SPOT_BANDS.find((band) => reach < band.within)?.opacity ?? 0;
        shade = SPOT_SHADE;

        const isEmblem =
          EMBLEM[Math.floor((y - emblemTop) / EMBLEM_PIXEL)]?.[
            Math.floor((x - emblemLeft) / EMBLEM_PIXEL)
          ] === "#";
        const mx = x - messageLeft;
        const my = y - messageTop;
        const isMessage =
          message !== null &&
          mx >= 0 &&
          mx < message.width &&
          my >= 0 &&
          my < message.height &&
          message.on[my * message.width + mx] === 1;
        if (isEmblem) light = PROJECTION_OPACITY;
        else if (isMessage) light += (PROJECTION_OPACITY - light) * frame.reveal;
      }

      // The light, over the shade, as one translucent pixel.
      const opacity = light + shade * (1 - light);
      if (opacity > 0) {
        const lit = light / opacity;
        image.data.set(
          [...BEAM_COLOR.map((channel) => Math.round(channel * lit)), Math.round(opacity * 255)],
          (y * width + x) * 4,
        );
      }
    }
  }

  context.putImageData(image, 0, 0);
}

/**
 * The light's whole routine as a function of time: the beam sweeps up
 * and down the tower without stopping, carrying the emblem with it,
 * while under the emblem one line after another fades up, holds, and
 * fades out again.
 */
function beamFrameAt(now: number): BeamFrame {
  const stepped = (value: number) => Math.round(value * FADE_STEPS) / FADE_STEPS;
  const elapsed = now % LINE_MS;

  let reveal = 0;
  if (elapsed < FADE_MS) reveal = stepped(elapsed / FADE_MS);
  else if (elapsed < FADE_MS + HOLD_MS) reveal = 1;
  else if (elapsed < FADE_MS * 2 + HOLD_MS) {
    reveal = stepped(1 - (elapsed - FADE_MS - HOLD_MS) / FADE_MS);
  }

  return {
    angle: SWEEP_DEGREES * Math.sin((now / SWEEP_PERIOD_MS) * Math.PI * 2),
    reveal,
    show: Math.floor(now / LINE_MS) + 1,
  };
}

interface SearchlightProps {
  isVisible: boolean;
  reducedMotion: boolean;
}

/**
 * The beam, on one canvas repainted a few times a second (and not at
 * all while the tab is hidden), with the emblem in its light and the
 * lines taking turns under it. Under reduced motion it doesn't sweep
 * or fade: it stands still, shows the first line for a few seconds as
 * the desktop appears, and then just stays lit.
 */
function Searchlight({ isVisible, reducedMotion }: SearchlightProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The line needs the pixel font, which may still be on its way.
  const [isFontReady, setIsFontReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    document.fonts.load(PIXEL_FONT).then(() => {
      if (!cancelled) setIsFontReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // The routine runs on its own clock, which only advances while
  // it's being painted — so a hidden tab pauses it rather than
  // skipping ahead in it.
  const clock = useRef(0);
  // The line being projected, and which projection it was drawn for.
  const line = useRef<{ show: number; bitmap: Bitmap | null }>({ show: 0, bitmap: null });

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context || !isFontReady) return;

    if (reducedMotion) {
      // Once only, however often this effect re-runs.
      if (line.current.show === 0) {
        line.current = { show: 1, bitmap: rasterizeMessage(nextLine("searchlight")) };
      }
      paintBeam(context, line.current.bitmap, { angle: 0, reveal: 1 });
      const id = setTimeout(() => paintBeam(context, null, { angle: 0, reveal: 0 }), HOLD_MS);
      return () => clearTimeout(id);
    }

    if (!isVisible) return;
    const tick = 1000 / BEAM_FPS;
    const paint = () => {
      const frame = beamFrameAt(clock.current);
      clock.current += tick;
      if (frame.show !== line.current.show) {
        line.current = { show: frame.show, bitmap: rasterizeMessage(nextLine("searchlight")) };
      }
      paintBeam(context, line.current.bitmap, frame);
    };
    paint();
    const id = setInterval(paint, tick);
    return () => clearInterval(id);
  }, [isFontReady, isVisible, reducedMotion]);

  const style: CSSProperties = {
    left: percentX(REACH.x),
    top: percentY(REACH.y),
    width: percentX(REACH.width),
    height: percentY(REACH.height),
  };

  return (
    <canvas
      ref={canvasRef}
      className="backdrop__beam"
      width={REACH.width}
      height={REACH.height}
      style={style}
    />
  );
}
