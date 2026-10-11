// Builds everything the animated desktop backdrop
// (components/desktop/DesktopBackdrop.tsx) is drawn from:
//
//   public/desktop/wallpaper-sky.jpg     the day wallpaper with its clouds painted out
//   public/desktop/clouds/cloud-N.png    each of those clouds, cut out on its own
//   public/desktop/city-skyline.png      the night wallpaper with its sky cut away
//   public/desktop/plane.png             the banner plane, 2 propeller frames side by side
//   public/desktop/searchlight.png       the rooftop lamp
//   src/data/backdrop.json               where all of it goes
//
//   node scripts/process-backdrop.mjs
//
// A one-off: re-run it only if a wallpaper or one of the raw sprites
// in assets/desktop-raw/ changes.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW_DIR = join(ROOT, "assets", "desktop-raw");
const WALLPAPER_DIR = join(ROOT, "public", "wallpapers");
const OUT_DIR = join(ROOT, "public", "desktop");
const CLOUD_DIR = join(OUT_DIR, "clouds");
const META_PATH = join(ROOT, "src", "data", "backdrop.json");

/** Reads a PNG or a JPEG (several of the "PNG" sources are really JPEGs) as RGBA. */
function readImage(path) {
  const file = readFileSync(path);
  return file[0] === 0xff ? jpeg.decode(file, { useTArray: true }) : PNG.sync.read(file);
}

function writePng(path, { width, height, data }) {
  const png = new PNG({ width, height });
  png.data.set(data);
  writeFileSync(path, PNG.sync.write(png));
}

function blank(width, height) {
  return { width, height, data: new Uint8Array(width * height * 4) };
}

// --- Day sky: paint the clouds out, and keep each one ------------------

// Rows below this are the bright band along the horizon, then the sea.
const HORIZON_Y = 748;
// A pixel is cloud if it's this much redder than its row's sky — the
// sky is blue all the way down, the clouds white and lavender.
const CLOUD_RED_MARGIN = 18;
// Grown by this much to take in each cloud's soft JPEG edge…
const CLOUD_GROW_PX = 3;
// …and smaller specks than this are noise, not clouds.
const MIN_CLOUD_AREA = 300;
// The sky's dither repeats every this many pixels, so a hole is filled
// from sky that's a whole number of repeats away along the same row.
const DITHER_PERIOD = 8;
// Clouds are split by size into this many depth layers, biggest nearest.
const CLOUD_LAYERS = 3;

const day = readImage(join(WALLPAPER_DIR, "day.jpg"));
const { width: W, height: H } = day;

let cloudMask = new Uint8Array(W * H);
for (let y = 0; y < HORIZON_Y; y++) {
  const reds = [];
  for (let x = 0; x < W; x += 2) reds.push(day.data[(y * W + x) * 4]);
  reds.sort((a, b) => a - b);
  const skyRed = reds[reds.length >> 1];
  for (let x = 0; x < W; x++) {
    if (day.data[(y * W + x) * 4] > skyRed + CLOUD_RED_MARGIN) cloudMask[y * W + x] = 1;
  }
}

for (let pass = 0; pass < CLOUD_GROW_PX; pass++) {
  const grown = cloudMask.slice();
  for (let y = 1; y < HORIZON_Y; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (cloudMask[i - 1] || cloudMask[i + 1] || cloudMask[i - W] || cloudMask[i + W]) grown[i] = 1;
    }
  }
  cloudMask = grown;
}

// Connected clusters of cloud pixels.
const labels = new Int32Array(W * H);
const clusters = [];
for (let start = 0; start < W * H; start++) {
  if (!cloudMask[start] || labels[start]) continue;
  const id = clusters.length + 1;
  const cluster = { id, x0: W, y0: H, x1: 0, y1: 0, area: 0 };
  const stack = [start];
  labels[start] = id;
  while (stack.length) {
    const i = stack.pop();
    const x = i % W;
    const y = (i - x) / W;
    cluster.area++;
    cluster.x0 = Math.min(cluster.x0, x);
    cluster.x1 = Math.max(cluster.x1, x);
    cluster.y0 = Math.min(cluster.y0, y);
    cluster.y1 = Math.max(cluster.y1, y);
    for (const j of [i - 1, i + 1, i - W, i + W]) {
      if (j >= 0 && j < W * H && cloudMask[j] && !labels[j] && Math.abs((j % W) - x) <= 1) {
        labels[j] = id;
        stack.push(j);
      }
    }
  }
  clusters.push(cluster);
}

const kept = clusters.filter((cluster) => cluster.area >= MIN_CLOUD_AREA);

rmSync(CLOUD_DIR, { recursive: true, force: true });
mkdirSync(CLOUD_DIR, { recursive: true });

// Biggest first, so the layer split below is by size.
kept.sort((a, b) => b.area - a.area);
const clouds = kept.map((cluster, index) => {
  const width = cluster.x1 - cluster.x0 + 1;
  const height = cluster.y1 - cluster.y0 + 1;
  const out = blank(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (cluster.y0 + y) * W + cluster.x0 + x;
      if (labels[i] !== cluster.id) continue;
      // The grown rim is sky-coloured; left in, it'd be a blue halo
      // once the cloud drifts over a different part of the sky.
      const o = (y * width + x) * 4;
      const red = day.data[i * 4];
      out.data.set(day.data.subarray(i * 4, i * 4 + 3), o);
      out.data[o + 3] = red > 205 ? 255 : 0;
    }
  }
  const file = `cloud-${index + 1}.png`;
  writePng(join(CLOUD_DIR, file), out);
  return {
    src: `/desktop/clouds/${file}`,
    x: cluster.x0,
    y: cluster.y0,
    width,
    height,
    layer: Math.min(CLOUD_LAYERS - 1, Math.floor((index * CLOUD_LAYERS) / kept.length)),
  };
});

// Fill every cloud pixel (kept or speck) with sky from the same row.
const sky = { width: W, height: H, data: day.data.slice() };
for (let y = 0; y < HORIZON_Y; y++) {
  for (let x = 0; x < W; x++) {
    if (!cloudMask[y * W + x]) continue;
    let from = -1;
    for (let step = DITHER_PERIOD; step < W && from < 0; step += DITHER_PERIOD) {
      if (x - step >= 0 && !cloudMask[y * W + x - step]) from = x - step;
      else if (x + step < W && !cloudMask[y * W + x + step]) from = x + step;
    }
    if (from < 0) continue;
    sky.data.set(day.data.subarray((y * W + from) * 4, (y * W + from) * 4 + 4), (y * W + x) * 4);
  }
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "wallpaper-sky.jpg"), jpeg.encode(sky, 92).data);

// --- Night city: cut the sky away --------------------------------------
//
// Leaves just the buildings, so clouds and the searchlight's beam can
// be drawn between the wallpaper's sky and its skyline. The sky is one
// flat colour, so it's whatever that colour reaches from the top edge.

const city = readImage(join(WALLPAPER_DIR, "city.png"));
const skyline = { width: city.width, height: city.height, data: Uint8Array.from(city.data) };
{
  const { width, height, data } = skyline;
  const isSky = (i) => data[i * 4] === data[0] && data[i * 4 + 1] === data[1] && data[i * 4 + 2] === data[2];
  const seen = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) stack.push(x);
  while (stack.length) {
    const i = stack.pop();
    if (seen[i] || !isSky(i)) continue;
    seen[i] = 1;
    const x = i % width;
    if (x > 0) stack.push(i - 1);
    if (x < width - 1) stack.push(i + 1);
    if (i >= width) stack.push(i - width);
    if (i < width * (height - 1)) stack.push(i + width);
  }
  for (let i = 0; i < width * height; i++) if (seen[i]) data[i * 4 + 3] = 0;
}
writePng(join(OUT_DIR, "city-skyline.png"), skyline);

// --- Sprites: plane and searchlight ------------------------------------

// One art pixel in the raw sprite sheets is this many image pixels.
const SPRITE_GRID = 11.5;

function isMagenta(image, x, y) {
  const i = (y * image.width + x) * 4;
  const [r, g, b] = [image.data[i], image.data[i + 1], image.data[i + 2]];
  return Math.min(r, b) - g > 60 && Math.min(r, b) > 170;
}

/** Bounding boxes of the `count` sprites on a magenta sheet, left to right. */
function findSprites(image, count) {
  const runs = [];
  for (let x = 0; x < image.width; x++) {
    let filled = 0;
    for (let y = 0; y < image.height; y++) if (!isMagenta(image, x, y)) filled++;
    if (filled < 2) continue;
    const last = runs[runs.length - 1];
    if (last && x - last.x1 <= SPRITE_GRID * 2) last.x1 = x;
    else runs.push({ x0: x, x1: x });
  }
  if (runs.length !== count) throw new Error(`expected ${count} sprites, found ${runs.length}`);
  return runs.map(({ x0, x1 }) => {
    let y0 = image.height;
    let y1 = 0;
    for (let y = 0; y < image.height; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!isMagenta(image, x, y)) {
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
          break;
        }
      }
    }
    return { x0, x1, y0, y1 };
  });
}

/**
 * Shrinks sprites to their true pixel size (nearest-neighbour, one
 * sample from the middle of each art pixel) into equal cells side by
 * side, aligned on their top-left corners.
 */
function shrinkSprites(image, boxes) {
  const cellWidth = Math.max(...boxes.map((b) => Math.round((b.x1 - b.x0 + 1) / SPRITE_GRID)));
  const cellHeight = Math.max(...boxes.map((b) => Math.round((b.y1 - b.y0 + 1) / SPRITE_GRID)));
  const out = blank(cellWidth * boxes.length, cellHeight);
  // The sheets were drawn together, so one top line serves them all.
  const top = Math.min(...boxes.map((b) => b.y0));
  boxes.forEach((box, n) => {
    for (let y = 0; y < cellHeight; y++) {
      for (let x = 0; x < cellWidth; x++) {
        const sx = Math.floor(box.x0 + (x + 0.5) * SPRITE_GRID);
        const sy = Math.floor(top + (y + 0.5) * SPRITE_GRID);
        if (sx > box.x1 || sy >= image.height || isMagenta(image, sx, sy)) continue;
        const i = (sy * image.width + sx) * 4;
        const o = (y * out.width + n * cellWidth + x) * 4;
        let [r, g, b] = [image.data[i], image.data[i + 1], image.data[i + 2]];
        // What's left of the backdrop in an edge pixel is a pink cast;
        // drop it to grey (the edges are dark outline anyway).
        if (Math.min(r, b) - g > 40) r = b = g;
        out.data.set([r, g, b, 255], o);
      }
    }
  });
  return { ...out, cellWidth, cellHeight };
}

/** The first opaque pixel found scanning columns from the left (or right) of a cell. */
function edgePixel(sprite, fromRight) {
  for (let n = 0; n < sprite.cellWidth; n++) {
    const x = fromRight ? sprite.cellWidth - 1 - n : n;
    const rows = [];
    for (let y = 0; y < sprite.cellHeight; y++) {
      if (sprite.data[(y * sprite.width + x) * 4 + 3]) rows.push(y);
    }
    if (rows.length) return [x, rows[rows.length >> 1]];
  }
  return [0, 0];
}

const planeRaw = readImage(join(RAW_DIR, "plane.jpg"));
const plane = shrinkSprites(planeRaw, findSprites(planeRaw, 2));
writePng(join(OUT_DIR, "plane.png"), plane);

const lampRaw = readImage(join(RAW_DIR, "searchlight.jpg"));
const lamp = shrinkSprites(lampRaw, findSprites(lampRaw, 1));
writePng(join(OUT_DIR, "searchlight.png"), lamp);

// The middle of the lamp's lens: the centre of its yellow pixels.
let lensX = 0;
let lensY = 0;
let lensCount = 0;
for (let y = 0; y < lamp.height; y++) {
  for (let x = 0; x < lamp.width; x++) {
    const i = (y * lamp.width + x) * 4;
    if (lamp.data[i + 3] && lamp.data[i] > 200 && lamp.data[i + 1] > 190 && lamp.data[i + 2] < 200) {
      lensX += x;
      lensY += y;
      lensCount++;
    }
  }
}

// --- Layout metadata ---------------------------------------------------

const meta = {
  // Everything below is in wallpaper pixels unless it says otherwise.
  width: W,
  height: H,
  sky: "/desktop/wallpaper-sky.jpg",
  skyline: "/desktop/city-skyline.png",
  cloudLayers: CLOUD_LAYERS,
  clouds,
  plane: {
    src: "/desktop/plane.png",
    // In the sprite's own (art) pixels.
    width: plane.cellWidth,
    height: plane.cellHeight,
    frames: 2,
    // Where the tow rope ties on: the tip of the tail.
    tail: edgePixel(plane, false),
  },
  searchlight: {
    src: "/desktop/searchlight.png",
    width: lamp.cellWidth,
    height: lamp.cellHeight,
    lens: [Math.round(lensX / lensCount), Math.round(lensY / lensCount)],
  },
};
writeFileSync(META_PATH, `${JSON.stringify(meta, null, 2)}\n`);

console.log(`${clouds.length} clouds (of ${clusters.length} clusters found)`);
console.log(`plane ${plane.cellWidth}x${plane.cellHeight}, tail at ${meta.plane.tail}`);
console.log(`searchlight ${lamp.cellWidth}x${lamp.cellHeight}, lens at ${meta.searchlight.lens}`);
