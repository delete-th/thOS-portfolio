/**
 * What the sky says: the lines on the plane's banner (dev profile) and
 * under the emblem the searchlight projects (sec profile). See
 * components/desktop/DesktopBackdrop.tsx.
 *
 * Each list is cycled in order — a new line per pass of the plane, or
 * per projection — starting from the first on every page load and
 * wrapping round after the last. The two keep their places separately.
 *
 * Edit freely: the banner is cut to fit whatever's written. A " ✦ " is
 * drawn as a pixel star. Keep lines short: the searchlight's has to
 * fit inside its pool of light, which holds about 30 characters, and
 * anything past the pool's edge isn't drawn.
 */
export const SKY_MESSAGES = {
  plane: [
    "thOS ✦ built by Thea Saguid",
    "Thea Saguid ✦ Software Engineer",
    "Now running: thOS",
    "You're on thOS. Click anything.",
    "thOS ✦ est. 2026",
  ],
  searchlight: [
    "thOS ✦ built by Thea Saguid",
    "Thea Saguid ✦ Security",
    "Now running: thOS",
    "You're on thOS. Click anything.",
    "thOS ✦ est. 2026",
  ],
} as const;

export type SkyMessageList = keyof typeof SKY_MESSAGES;
