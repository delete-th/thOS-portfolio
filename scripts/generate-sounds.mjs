// Synthesizes every thOS sound effect into public/sounds/*.wav.
//
//   node scripts/generate-sounds.mjs
//
// The sounds are original and generated from scratch (plain oscillators
// + noise), so there's no third-party audio to license or credit. To
// retune one, edit its recipe below and re-run; to replace one with a
// sourced file instead, drop it in public/sounds/ and point the entry
// in src/lib/sound-manager.ts at it.
//
// 22.05kHz / 16-bit / mono keeps every file well under the spec's
// <100KB target, and the low sample rate is period-appropriate anyway.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 22050;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sounds");

const TAU = Math.PI * 2;

const WAVES = {
  sine: (phase) => Math.sin(phase * TAU),
  square: (phase) => (phase % 1 < 0.5 ? 1 : -1),
  triangle: (phase) => 1 - 4 * Math.abs((phase % 1) - 0.5),
};

function buffer(seconds) {
  return new Float32Array(Math.round(seconds * SAMPLE_RATE));
}

/**
 * Mixes one note into `out`: a `wave` oscillator gliding from `from` Hz
 * to `to` Hz, with a short attack and an exponential decay so nothing
 * starts or ends on a click.
 */
function tone(out, { start = 0, duration, from, to = from, wave = "square", gain = 0.3, decay = 4 }) {
  const first = Math.round(start * SAMPLE_RATE);
  const length = Math.min(Math.round(duration * SAMPLE_RATE), out.length - first);
  const attack = Math.min(0.004 * SAMPLE_RATE, length / 4);
  const release = Math.min(0.01 * SAMPLE_RATE, length / 4);
  let phase = 0;
  for (let i = 0; i < length; i++) {
    const t = i / length;
    phase += (from + (to - from) * t) / SAMPLE_RATE;
    const envelope =
      Math.min(1, i / attack) * Math.min(1, (length - i) / release) * Math.exp(-decay * t);
    out[first + i] += WAVES[wave](phase) * gain * envelope;
  }
}

/** One-pole lowpass, in place — takes the harsh edge off raw square waves. */
function lowpass(samples, cutoffHz) {
  const a = 1 - Math.exp((-TAU * cutoffHz) / SAMPLE_RATE);
  let y = 0;
  for (let i = 0; i < samples.length; i++) {
    y += a * (samples[i] - y);
    samples[i] = y;
  }
  return samples;
}

// Deterministic noise so re-running the script doesn't churn the
// committed .wav files.
function makeNoise(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x80000000 - 1;
  };
}

const RECIPES = {
  click() {
    const out = buffer(0.04);
    tone(out, { duration: 0.04, from: 1400, to: 900, gain: 0.25, decay: 7 });
    return lowpass(out, 5000);
  },

  "window-open"() {
    const out = buffer(0.14);
    tone(out, { duration: 0.07, from: 523, gain: 0.2, decay: 3 });
    tone(out, { start: 0.06, duration: 0.08, from: 784, gain: 0.2, decay: 3 });
    return lowpass(out, 4000);
  },

  "window-close"() {
    const out = buffer(0.14);
    tone(out, { duration: 0.07, from: 784, gain: 0.2, decay: 3 });
    tone(out, { start: 0.06, duration: 0.08, from: 523, gain: 0.2, decay: 3 });
    return lowpass(out, 4000);
  },

  minimize() {
    const out = buffer(0.11);
    tone(out, { duration: 0.11, from: 700, to: 330, wave: "triangle", gain: 0.35, decay: 3 });
    return out;
  },

  error() {
    const out = buffer(0.3);
    tone(out, { duration: 0.12, from: 196, gain: 0.22, decay: 1.5 });
    tone(out, { start: 0.15, duration: 0.15, from: 165, gain: 0.22, decay: 1.5 });
    return lowpass(out, 2500);
  },

  // A noise "whoosh" swelling under a rising chirp.
  send() {
    const out = buffer(0.45);
    const noise = makeNoise(7);
    for (let i = 0; i < out.length; i++) {
      const t = i / out.length;
      out[i] = noise() * 0.18 * Math.sin(Math.PI * t) ** 2;
    }
    lowpass(out, 3000);
    tone(out, { duration: 0.4, from: 420, to: 1500, wave: "sine", gain: 0.25, decay: 1.5 });
    tone(out, { start: 0.33, duration: 0.12, from: 1568, wave: "triangle", gain: 0.2, decay: 4 });
    return out;
  },

  // Rising C-major arpeggio that settles into a held chord.
  startup() {
    const out = buffer(1.8);
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    notes.forEach((hz, i) => {
      tone(out, { start: i * 0.11, duration: 0.5, from: hz, gain: 0.13, decay: 4 });
      tone(out, { start: i * 0.11, duration: 0.5, from: hz * 2, wave: "triangle", gain: 0.08, decay: 5 });
    });
    for (const hz of [261.63, 392.0, 523.25, 783.99]) {
      tone(out, { start: 0.6, duration: 1.2, from: hz, wave: "triangle", gain: 0.12, decay: 3.5 });
    }
    return lowpass(out, 4500);
  },

  // Seamless 2s loop: mains-style hum plus fan hiss. Every hum partial
  // completes a whole number of cycles in 2s, and the hiss is filtered
  // circularly (two laps, keeping the second), so the end lines up
  // with the start and the loop point is inaudible.
  ambient() {
    const out = buffer(2);
    const noise = makeNoise(42);
    const hiss = Float32Array.from(out, () => noise());
    const a = 1 - Math.exp((-TAU * 500) / SAMPLE_RATE);
    let y = 0;
    for (let lap = 0; lap < 2; lap++) {
      for (let i = 0; i < hiss.length; i++) {
        y += a * (hiss[i] - y);
        if (lap === 1) out[i] = y * 0.35;
      }
    }
    for (let i = 0; i < out.length; i++) {
      const t = i / SAMPLE_RATE;
      out[i] +=
        Math.sin(TAU * 60 * t) * 0.12 +
        Math.sin(TAU * 120 * t) * 0.06 +
        Math.sin(TAU * 180 * t) * 0.02 +
        // Slow 0.5Hz wobble so the hum doesn't sound perfectly static.
        Math.sin(TAU * 90 * t) * 0.02 * Math.sin(TAU * 0.5 * t);
    }
    return out;
  },
};

function encodeWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(clamped * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, render] of Object.entries(RECIPES)) {
  const wav = encodeWav(render());
  writeFileSync(join(OUT_DIR, `${name}.wav`), wav);
  console.log(`${name}.wav  ${(wav.length / 1024).toFixed(1)} KB`);
}
