import { Howl, Howler } from "howler";

export type SoundName =
  | "startup"
  | "click"
  | "window-open"
  | "window-close"
  | "minimize"
  | "error"
  | "send"
  | "ambient";

interface SoundConfig {
  src: string;
  volume: number;
  loop?: boolean;
}

/**
 * Every sound effect in thOS. The files are synthesized by
 * scripts/generate-sounds.mjs — swapping one for a sourced recording is
 * a matter of dropping the file in public/sounds/ and editing `src`
 * here, nothing that plays the sound needs to change.
 */
const SOUNDS: Record<SoundName, SoundConfig> = {
  startup: { src: "/sounds/startup.wav", volume: 0.6 },
  click: { src: "/sounds/click.wav", volume: 0.35 },
  "window-open": { src: "/sounds/window-open.wav", volume: 0.45 },
  "window-close": { src: "/sounds/window-close.wav", volume: 0.45 },
  minimize: { src: "/sounds/minimize.wav", volume: 0.45 },
  error: { src: "/sounds/error.wav", volume: 0.5 },
  send: { src: "/sounds/send.wav", volume: 0.55 },
  // Atmosphere only — it should be barely noticeable until it's gone.
  ambient: { src: "/sounds/ambient.wav", volume: 0.12, loop: true },
};

// Module-level singleton, not React state: sounds are fired from all
// over the tree (page.tsx, MailMe, ThTerminal, global click listener)
// and the mute flag has to apply to all of them at once. Components
// read it through useSound() (hooks/useSound.ts).
const howls = new Map<SoundName, Howl>();
let muted = false;
const muteListeners = new Set<() => void>();

// Howls are created on first use rather than at import time — this
// module is imported by client components that Next still prerenders
// on the server, where there's no audio to load.
function getHowl(name: SoundName): Howl {
  let howl = howls.get(name);
  if (!howl) {
    const { src, volume, loop } = SOUNDS[name];
    howl = new Howl({ src: [src], volume, loop });
    howls.set(name, howl);
  }
  return howl;
}

/** Starts fetching `names` (default: everything) so the first play isn't delayed. */
export function preloadSounds(names: SoundName[] = Object.keys(SOUNDS) as SoundName[]) {
  names.forEach(getHowl);
}

/**
 * Plays `name`. If the browser's autoplay policy is still blocking
 * audio (no click/keypress yet this visit), Howler holds the sound and
 * plays it on the first interaction instead of dropping it.
 */
export function playSound(name: SoundName) {
  const howl = getHowl(name);
  // A looping sound that's already running would otherwise stack a
  // second copy on top of itself.
  if (SOUNDS[name].loop && howl.playing()) return;
  howl.play();
}

export function stopSound(name: SoundName) {
  howls.get(name)?.stop();
}

export function isMuted() {
  return muted;
}

export function setMuted(next: boolean) {
  if (next === muted) return;
  muted = next;
  // Global mute rather than skipping play() calls — sounds keep
  // "playing" silently, so the ambient loop is still there on unmute.
  Howler.mute(next);
  muteListeners.forEach((listener) => listener());
}

export function subscribeToMute(listener: () => void) {
  muteListeners.add(listener);
  return () => {
    muteListeners.delete(listener);
  };
}
