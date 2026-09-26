/**
 * The heroes' numbers, in one place: the saber, the guard, the Force powers, how heroes move.
 * Plain data: the server's rules read it (`saber.ts`, `powers.ts`, `rules.ts`) and so does the
 * movement ability every screen runs (`abilities.ts`).
 *
 * Troopers have 100 health (a heavy 140); heroes 600 to 800 (`defs.ts`). A hero should cut
 * through a few troopers, and fall to fire from several sides, or to detonators.
 */

/** The saber: a three-swing combo, each a slash one way, cleaving everyone in a wide arc ahead. */
export const SABER = {
  /** Each swing of the combo, seconds (a third, heavier one to finish). */
  swings: [0.36, 0.34, 0.46],
  /** How far into a swing its blade crosses (the hit), as a part of it. */
  strike: 0.42,
  /** After a swing ends, the next still follows on in the combo if it starts within this (seconds). */
  follow: 0.38,
  /** A press this long before the saber's ready still counts. */
  buffer: 0.45,
  /** A pause after the combo's last swing. */
  recover: 0.12,
  /** Damage to a trooper: two cuts kill a 100-health one. */
  damage: 55,
  /** The finisher hits harder. */
  finisher: 1.2,
  /** Heroes take this much of it. */
  heroes: 0.42,
  /** Reach from the eye (blocks, level), and the arc ahead it cleaves (degrees each side). */
  reach: 3.2,
  arc: 72,
  /** Up and down: how far above or below the feet a target can be. */
  height: 2.2,
  /** Anyone this near is cut whichever way they are. */
  close: 1.1,
  knockback: 0.35,
};

/** Each swing's whoosh, pitched (the swinger's own screen plays it too: `client/predict.ts`). */
export const SWING_PITCH = [1, 1.12, 0.86];

/**
 * How long a swing of the combo takes (seconds), at a pace (a rage quickens it): as the server
 * times it (`saber.ts`) and as the swinger's own screen predicts it (`client/predict.ts`).
 */
export const swingLength = (n: number, pace: number) => SABER.swings[n] * pace + (n === 2 ? SABER.recover : 0);

/** Holding the guard up (RMB): what it stops, what it costs, how it breaks. */
export const GUARD = {
  /** Degrees each side of where they look that it covers (a 150° front). */
  arc: 75,
  /** The meter, and what each thing blocked costs. */
  meter: 100,
  bolt: 5,
  parry: 20,
  /** Lightning into the guard, a second. */
  lightning: 30,
  /** It refills this fast, once the guard's been down (or quiet) this long. */
  refill: 28,
  refillAfter: 0.7,
  /** Emptied: the guard breaks for this long (no blocking; a stagger). */
  broken: 1.8,
  /** A bolt blocked goes back at whoever fired it this often (else off somewhere), doing this much. */
  reflect: 0.35,
  reflectDamage: 22,
  /** A parried swing: what gets through, and how long the one who swung is staggered. */
  parried: 0.15,
  stagger: 0.55,
  /** Lightning into the guard: what gets through. */
  lightningThrough: 0.25,
};

/** What gets through to a hero: blaster bolts (they shrug off much of it); explosions whole. */
export const TOUGH = { blaster: 0.6 };

/** How heroes move (the movement ability, `abilities.ts`, and the server's `player.speed`). */
export const MOVE = {
  /** Times a trooper's speeds. */
  speed: 1.2,
  /** The guard up: times their speed (walking; sprinting it's slower still). */
  block: 0.55,
  blockSprint: 0.42,
  /** A second jump in the air (Force jump): upward speed. */
  doubleJump: 10.5,
  /** Each swing steps them forward this fast (blocks a second), at most this often. */
  lunge: 6.5,
  lungeEvery: 0.28,
};

export const POWERS = {
  /** Heroes take this much of a power's damage (the saber's is `SABER.heroes`). */
  heroes: 0.45,
  /** How far off the crosshair a targeted power (pull, choke, chain) looks for someone (degrees). */
  aim: 16,
  push: { range: 9, arc: 55, damage: 30, out: 15, up: 7.5 },
  rush: { time: 0.32, speed: 25, exit: 8, radius: 1.6, damage: 60 },
  leap: { speed: 15, up: 12.5, gravity: 0.85, control: 0.25, radius: 4.8, damage: 45, out: 10, up2: 6 },
  pull: { range: 17, time: 0.4, stun: 1.3, heroStun: 0.5, damage: 15, lands: 1.9 },
  soresu: { speed: 0.72, reflect: 0.7, reflectDamage: 30 },
  throw: { range: 16, out: 0.5, back: 0.5, radius: 1.5, damage: 48 },
  choke: { range: 14, time: 3, dps: 42, lift: 1.1, rise: 0.45, speed: 0.35 },
  rage: { speed: 1.22, pace: 0.75, damage: 1.4 },
  lightning: { range: 11, arc: 32, dps: 62, speed: 0.5, zap: 0.12 },
  chain: { range: 18, jump: 8, jumps: 4, damage: 55, falloff: 0.78 },
  aura: { radius: 5.5, every: 0.25, drain: 8 },
};

/** A hero's health doesn't come back as a trooper's does: only slowly, a while after being hurt. */
export const REGEN = {
  after: 8,
  perSecond: 4,
  /** A rise in a step under this is the game's regeneration (held back); more is a heal (it stands). */
  step: 4,
};
