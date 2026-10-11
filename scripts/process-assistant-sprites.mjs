// Turns the raw AI-generated assistant art in assets/assistant-raw/
// into the game-ready sprites the app actually loads:
//
//   public/assistant/sprites.png          seated atlas, a row per animation
//   public/assistant/sprites-drag.png     picked-up / falling atlas, likewise
//   public/assistant/cursor.png           pointing hand (hover)
//   public/assistant/cursor-pressed.png   pointing hand (pressed)
//   src/data/assistant-sprites.json       cell sizes, row/frame layout, anchors
//
//   node scripts/process-assistant-sprites.mjs
//
// The raw sheets are drawn on flat magenta, at whatever size and
// spacing the image model felt like per sheet. This keys out the
// magenta, slices each sheet into its frames, then scales and aligns
// every frame against one shared reference so nothing jumps when the
// app switches animations: the seated legs (which never move) for the
// seated sheets, the top of the head for the ones where he's carried.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW_DIR = join(ROOT, "assets", "assistant-raw");
const OUT_DIR = join(ROOT, "public", "assistant");
const META_PATH = join(ROOT, "src", "data", "assistant-sprites.json");

// Atlas rows, top to bottom: [animation name, raw file, frame count].
// idle-glint.png isn't here on purpose: its glint is white-on-near-white
// and vanishes at true pixel size, so the app draws the glint itself
// (see Assistant.tsx) over the idle frame instead.
const ANIMATIONS = [
  ["idle", "idle-typing.png", 3],
  ["talking", "talking.png", 3],
  ["pondering", "pondering.png", 3],
  ["happy", "happy.png", 3],
  ["glasses", "glasses.png", 3],
  ["surprised", "surprised.png", 2],
  ["base", "base.png", 1],
  // Getting back down after a drop: a squat, then cross-legged with the
  // laptop closed, then open. The squat has no crossed legs to measure,
  // so it borrows frame 1's (the trailing number) — see below.
  ["sitdown", "sit-down.png", 3, 1],
];

// The same, for the second atlas: being picked up, carried and dropped.
// He's standing in these, so they need a taller cell than the seated
// rows and can't share their floor anchor. The last number is which
// frame has him hanging straight, legs down — used to match the three
// sheets' sizes to each other.
const DRAG_ANIMATIONS = [
  // Frame 0 startled as he's lifted; frame 1 is the carried pose.
  ["pickup", "drag-pickup.png", 2, 1],
  ["struggle", "drag-struggle.png", 3, 1],
  ["fall", "drag-fall.png", 4, 0],
];

// base.png is drawn on a clean 8px grid, i.e. one "true" pixel of the
// art is 8 screen pixels there. Everything is scaled so its legs come
// out as wide as base.png's do at that true size.
const BASE_GRID = 8;

// The art is greyscale, so every kept pixel is snapped to one of
// these. It hides the off-grid mush a nearest-neighbour downscale of
// AI "pixel art" leaves behind, and stops flat areas shimmering
// between frames that were each drawn slightly differently.
const PALETTE = [0, 40, 72, 104, 144, 184, 216, 240, 255];

// Where the glasses' lenses sit in the first idle frame, in cell
// pixels — measured by hand from the processed art, for the glint the
// app draws itself. Re-measure if the idle art or BASE_GRID changes.
const LENSES = [
  { x: 42, y: 42, width: 5, height: 4 },
  { x: 51, y: 42, width: 5, height: 4 },
];

// Cursors are clamped to 32px by browsers on most platforms.
const CURSOR_SIZE = 32;

function readPng(name) {
  return PNG.sync.read(readFileSync(join(RAW_DIR, name)));
}

/**
 * Magenta has no green in it and the art has no colour in it, so
 * "how much do red and blue exceed green" cleanly separates the two —
 * including the anti-aliased fringe where they blend.
 */
function isBackground(png, x, y) {
  const i = (y * png.width + x) * 4;
  const r = png.data[i];
  const g = png.data[i + 1];
  const b = png.data[i + 2];
  // The brightness check keeps dark purple-ish linework (the "?" is
  // drawn that way) from being keyed out along with the backdrop.
  return Math.min(r, b) - g > 60 && Math.min(r, b) > 170;
}

function makeMask(png) {
  const mask = new Uint8Array(png.width * png.height);
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      mask[y * png.width + x] = isBackground(png, x, y) ? 0 : 1;
    }
  }
  return mask;
}

/** Splits a sheet into `count` frames at its empty columns; returns each frame's bounding box. */
function findFrames(png, mask, count) {
  const filled = [];
  for (let x = 0; x < png.width; x++) {
    let n = 0;
    for (let y = 0; y < png.height; y++) n += mask[y * png.width + x];
    filled.push(n >= 2);
  }

  let runs = [];
  for (let x = 0; x < png.width; x++) {
    if (!filled[x]) continue;
    const last = runs[runs.length - 1];
    if (last && x - last.x1 <= 1) last.x1 = x;
    else runs.push({ x0: x, x1: x });
  }

  // Detached bits (a sparkle, a raised fist) can leave extra gaps —
  // close the narrowest gap until the expected number of frames is left.
  while (runs.length > count) {
    let narrowest = 1;
    for (let i = 2; i < runs.length; i++) {
      if (runs[i].x0 - runs[i - 1].x1 < runs[narrowest].x0 - runs[narrowest - 1].x1) narrowest = i;
    }
    runs[narrowest - 1].x1 = runs[narrowest].x1;
    runs.splice(narrowest, 1);
  }
  if (runs.length !== count) {
    throw new Error(`expected ${count} frames, found ${runs.length}`);
  }

  return runs.map(({ x0, x1 }) => {
    let y0 = png.height;
    let y1 = -1;
    for (let y = 0; y < png.height; y++) {
      for (let x = x0; x <= x1; x++) {
        if (mask[y * png.width + x]) {
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
          break;
        }
      }
    }
    return { x0, x1, y0, y1 };
  });
}

/** Horizontal extent of everything in the bottom `band` rows of a frame. */
function bottomExtent(png, mask, box, band) {
  let left = box.x1;
  let right = box.x0;
  for (let y = Math.max(box.y0, Math.round(box.y1 - band)); y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      if (mask[y * png.width + x]) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
  }
  return { left, right, width: right - left + 1 };
}

/**
 * The frame's anchor: the crossed legs, measured across a band at the
 * very bottom (shoe tip to knee). Arms, heads and floating punctuation
 * all move between frames; this doesn't, so its width gives the scale
 * and its centre/floor give the position.
 */
function measureLegs(png, mask, box) {
  const rough = bottomExtent(png, mask, box, (box.y1 - box.y0) * 0.12);
  const legs = bottomExtent(png, mask, box, rough.width * 0.25);
  return { width: legs.width, centerX: (legs.left + legs.right + 1) / 2, floorY: box.y1 + 1 };
}

/** The widest unbroken run of art on row `y` of a frame. */
function widestRun(png, mask, box, y) {
  let best = { left: 0, right: -1 };
  let start = -1;
  for (let x = box.x0; x <= box.x1 + 1; x++) {
    const on = x <= box.x1 && mask[y * png.width + x];
    if (on && start < 0) start = x;
    if (!on && start >= 0) {
      if (x - start > best.right - best.left + 1) best = { left: start, right: x - 1 };
      start = -1;
    }
  }
  return { ...best, width: best.right - best.left + 1 };
}

/**
 * The head: everything from the top of the frame down to the neck,
 * found as the point where the silhouette stops narrowing and widens
 * out again into the shoulders. Gives the scale and anchor for frames
 * with no seated legs to measure — and, unlike the frame's bounding
 * box, isn't thrown by a floating "!" or a stray lock of hair.
 */
function measureHead(png, mask, box) {
  const runs = [];
  let widest = 0;
  let narrowest = Infinity;
  for (let y = box.y0; y <= box.y1; y++) {
    const run = widestRun(png, mask, box, y);
    if (run.width > widest) {
      widest = run.width;
      narrowest = Infinity;
    } else if (run.width < narrowest) {
      narrowest = run.width;
    } else if (narrowest < widest * 0.8 && run.width > narrowest * 1.25) {
      break;
    }
    runs.push({ y, ...run });
  }

  // Not the single widest row, which a wisp of hair can inflate.
  const widths = runs.map((run) => run.width).sort((a, b) => a - b);
  const width = widths[Math.floor(widths.length * 0.85)];
  const full = runs.filter((run) => run.width >= width * 0.9 && run.width <= width * 1.03);
  const centerX = full.reduce((sum, run) => sum + (run.left + run.right + 1) / 2, 0) / full.length;
  // The first row that's properly hair, not a flyaway strand above it.
  const topY = runs.find((run) => run.width >= width * 0.25).y;
  return { width, centerX, topY };
}

function quantize(value) {
  let best = PALETTE[0];
  for (const level of PALETTE) {
    if (Math.abs(level - value) < Math.abs(best - value)) best = level;
  }
  return best;
}

// --- Character frames -------------------------------------------------

const PAD = 1;

/**
 * Lays rows of measured frames out as one atlas. Every frame carries
 * its own scale and anchor point (in source pixels); the anchors all
 * land on the same spot in every cell, which is what keeps the
 * character from jumping between frames.
 */
function buildAtlas(rows) {
  for (const frame of rows.flatMap((row) => row.frames)) {
    const { box, anchor, scale } = frame;
    // Extent in output pixels, relative to the anchor.
    frame.left = Math.floor((box.x0 - anchor.x) * scale);
    frame.right = Math.ceil((box.x1 + 1 - anchor.x) * scale);
    frame.top = Math.floor((box.y0 - anchor.y) * scale);
    frame.bottom = Math.ceil((box.y1 + 1 - anchor.y) * scale);
  }

  const allFrames = rows.flatMap((row) => row.frames);
  const anchorX = PAD - Math.min(...allFrames.map((f) => f.left));
  const anchorY = PAD - Math.min(...allFrames.map((f) => f.top));
  const cellWidth = anchorX + Math.max(...allFrames.map((f) => f.right)) + PAD;
  const cellHeight = anchorY + Math.max(...allFrames.map((f) => f.bottom)) + PAD;
  const maxFrames = Math.max(...rows.map((row) => row.frames.length));

  const png = new PNG({ width: cellWidth * maxFrames, height: cellHeight * rows.length });

  rows.forEach((row, rowIndex) => {
    row.frames.forEach((frame, frameIndex) => {
      const { box, anchor, scale } = frame;
      for (let y = 0; y < cellHeight; y++) {
        for (let x = 0; x < cellWidth; x++) {
          // Nearest-neighbour: sample the source at this output pixel's centre.
          const sx = Math.floor(anchor.x + (x - anchorX + 0.5) / scale);
          const sy = Math.floor(anchor.y + (y - anchorY + 0.5) / scale);
          if (sx < box.x0 || sx > box.x1 || sy < box.y0 || sy > box.y1) continue;
          if (!row.mask[sy * row.png.width + sx]) continue;

          // Green is the one channel magenta never touches, so it's the
          // true grey even for a pixel with a little fringe (or a pink
          // tint) left in it.
          const grey = quantize(row.png.data[(sy * row.png.width + sx) * 4 + 1]);
          const o = ((rowIndex * cellHeight + y) * png.width + frameIndex * cellWidth + x) * 4;
          png.data[o] = png.data[o + 1] = png.data[o + 2] = grey;
          png.data[o + 3] = 255;
        }
      }
    });
  });

  return { png, cellWidth, cellHeight, anchorX, anchorY };
}

function rowsMeta(rows) {
  return Object.fromEntries(
    rows.map((row, index) => [row.name, { row: index, frames: row.frames.length }]),
  );
}

// Seated frames: scaled and anchored on the legs.

const base = readPng("base.png");
const baseMask = makeMask(base);
const [baseBox] = findFrames(base, baseMask, 1);
const baseLegs = measureLegs(base, baseMask, baseBox);
const LEGS_WIDTH = Math.round(baseLegs.width / BASE_GRID);
// How wide the head comes out at that scale — the size the carried
// frames, which have no seated legs to measure, are matched to instead.
const HEAD_WIDTH = measureHead(base, baseMask, baseBox).width * (LEGS_WIDTH / baseLegs.width);

const rows = ANIMATIONS.map(([name, file, count, firstSeated = 0]) => {
  const png = readPng(file);
  const mask = makeMask(png);
  const frames = findFrames(png, mask, count).map((box) => {
    const legs = measureLegs(png, mask, box);
    return {
      box,
      scale: LEGS_WIDTH / legs.width,
      anchor: { x: legs.centerX, y: legs.floorY },
      head: measureHead(png, mask, box),
    };
  });

  // Frames before `firstSeated` aren't cross-legged yet, so what
  // measureLegs found in them isn't the legs. They take that frame's
  // scale instead (it's the same drawing, on the same sheet), and
  // stand where their head lines up with its head. Their own lowest
  // row still goes on the floor line.
  const seated = frames[firstSeated];
  for (const frame of frames.slice(0, firstSeated)) {
    frame.scale = seated.scale;
    frame.anchor.x = frame.head.centerX - (seated.head.centerX - seated.anchor.x);
  }

  return { name, png, mask, frames };
});

const atlas = buildAtlas(rows);
const { cellWidth, cellHeight } = atlas;

// Carried frames: anchored on the top of the head. The pickup sheet
// (which has the carried pose) is scaled so his head matches the
// seated one; the other two were drawn with slightly different
// proportions, so they're scaled to make him exactly as tall as that,
// head to soles — otherwise he'd visibly grow when he starts kicking.

let carriedHeight = 0;
const dragRows = DRAG_ANIMATIONS.map(([name, file, count, straight]) => {
  const png = readPng(file);
  const mask = makeMask(png);
  const boxes = findFrames(png, mask, count);
  const heads = boxes.map((box) => measureHead(png, mask, box));
  const height = boxes[straight].y1 + 1 - heads[straight].topY;
  const scale = carriedHeight ? carriedHeight / height : HEAD_WIDTH / heads[straight].width;
  carriedHeight ||= height * scale;
  const frames = boxes.map((box, i) => ({
    box,
    scale,
    anchor: { x: heads[i].centerX, y: heads[i].topY },
    head: heads[i],
  }));
  return { name, png, mask, frames };
});

const dragAtlas = buildAtlas(dragRows);

/** Head-top to soles, in output pixels. */
function standingHeight(rowName, frameIndex) {
  return dragRows.find((row) => row.name === rowName).frames[frameIndex].bottom;
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "sprites.png"), PNG.sync.write(atlas.png));
writeFileSync(join(OUT_DIR, "sprites-drag.png"), PNG.sync.write(dragAtlas.png));

// --- Cursor -----------------------------------------------------------

const cursorPng = readPng("cursor.png");
const cursorMask = makeMask(cursorPng);
const cursorBoxes = findFrames(cursorPng, cursorMask, 2);
// Both frames share the first one's scale, so the hand doesn't change
// size when pressed.
const cursorScale =
  (CURSOR_SIZE - 2) /
  Math.max(...cursorBoxes.map((b) => Math.max(b.x1 - b.x0 + 1, b.y1 - b.y0 + 1)));

const cursors = cursorBoxes.map((box, index) => {
  const out = new PNG({ width: CURSOR_SIZE, height: CURSOR_SIZE });
  let hotspot = null;
  for (let y = 0; y < CURSOR_SIZE; y++) {
    for (let x = 0; x < CURSOR_SIZE; x++) {
      const sx = Math.floor(box.x0 + (x - 1 + 0.5) / cursorScale);
      const sy = Math.floor(box.y0 + (y - 1 + 0.5) / cursorScale);
      if (sx < box.x0 || sx > box.x1 || sy < box.y0 || sy > box.y1) continue;
      if (!cursorMask[sy * cursorPng.width + sx]) continue;
      const grey = quantize(cursorPng.data[(sy * cursorPng.width + sx) * 4 + 1]);
      const o = (y * CURSOR_SIZE + x) * 4;
      out.data[o] = out.data[o + 1] = out.data[o + 2] = grey;
      out.data[o + 3] = 255;
      // The click point is the fingertip: the first pixel met scanning
      // from the top.
      hotspot ??= [x, y];
    }
  }
  const file = index === 0 ? "cursor.png" : "cursor-pressed.png";
  writeFileSync(join(OUT_DIR, file), PNG.sync.write(out));
  return { src: `/assistant/${file}`, hotspot };
});

// --- Layout metadata --------------------------------------------------

// Where the top-centre of the head is in the first idle frame — what
// the app lines the carried frames' anchor up with when switching
// between the two sheets.
const idle = rows[0].frames[0];
const seatedHead = [
  Math.round(atlas.anchorX + (idle.head.centerX - idle.anchor.x) * idle.scale),
  Math.round(atlas.anchorY + (idle.head.topY - idle.anchor.y) * idle.scale),
];

const meta = {
  src: "/assistant/sprites.png",
  cellWidth,
  cellHeight,
  rows: rowsMeta(rows),
  // The floor line (the row just under his lowest pixel), the centre
  // of his crossed legs along it, and the head's top-centre — all in
  // cell pixels.
  floorY: atlas.anchorY,
  centerX: atlas.anchorX,
  head: seatedHead,
  lenses: LENSES,
  cursor: { hover: cursors[0], pressed: cursors[1] },
  // The carried / falling frames: their own sheet, with a taller cell,
  // aligned on the top-centre of the head rather than the floor.
  drag: {
    src: "/assistant/sprites-drag.png",
    cellWidth: dragAtlas.cellWidth,
    cellHeight: dragAtlas.cellHeight,
    rows: rowsMeta(dragRows),
    anchor: [dragAtlas.anchorX, dragAtlas.anchorY],
    // Head-top to soles while carried, and in the final crouch of the fall.
    carriedHeight: standingHeight("pickup", 1),
    landHeight: standingHeight("fall", 3),
  },
};
writeFileSync(META_PATH, `${JSON.stringify(meta, null, 2)}
`);

console.log(`legs ${LEGS_WIDTH}px wide, head ${HEAD_WIDTH.toFixed(1)}px wide`);
console.log(`seated cell ${cellWidth}x${cellHeight}, carried cell ${dragAtlas.cellWidth}x${dragAtlas.cellHeight}`);
for (const row of [...rows, ...dragRows]) {
  console.log(
    `${row.name.padEnd(10)} scale ${row.frames.map((f) => f.scale.toFixed(3)).join(" ")}`,
  );
}
