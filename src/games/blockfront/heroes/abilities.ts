import type { MovementAbility } from '@platform';
import { HEROES, heroByNumber, usesSaber } from './defs';
import { MOVE, POWERS } from './tuning';

/**
 * How heroes move: a movement ability every player has (`shared.ts` lists it), resting until the
 * server makes them a hero (`h`). Like every ability it runs on the host and, ahead of it, on the
 * player's own screen, so what it does answers the moment they press the key:
 *
 * - a second jump in the air (a Force jump);
 * - the guard up (RMB) slows them;
 * - each swing of the saber steps them forward (a lunge);
 * - Luke's Saber Rush (E: a dash through everyone in the way; the server cuts them) and Force Leap
 *   (F: a great jump where he looks; the server's shockwave where he lands);
 * - Chewblocca's Wookiee Charge (E: a bull rush along the ground; the server flattens who it meets);
 * - Boba Fetch's jetpack (F: up, then hovering and strafing for a few seconds; Space climbs,
 *   crouching drops; he fires as he flies);
 * - every power's cooldown and how long one that lasts has left, counting down: the server sets
 *   them as powers are used, the hero HUD shows them (`client.me.abilities.hero`).
 *
 * The server's word: `h` (who they are), `g` (the guard can go up), `k` (they can swing: not while
 * the saber's thrown, choking, in a stance), `m` (the block meter, for the HUD).
 */
export interface HeroMove {
  /** Which hero (`heroNumber`), 0 for a trooper: the ability rests. */
  h: number;
  /** Seconds before each power (Q, E, F) is ready again. */
  c0: number;
  c1: number;
  c2: number;
  /** Seconds left of each power that lasts (0: not on). */
  a0: number;
  a1: number;
  a2: number;
  /** The guard can go up (1), and they can swing (1). */
  g: number;
  k: number;
  /** The block meter (0..100). */
  m: number;
  /** Jumps in the air since they left the ground. */
  j: number;
  /** Saber Rush: seconds left, and its way (level, unit). */
  r: number;
  rx: number;
  rz: number;
  /** Force Leap: seconds in the air since it (0: not leaping). */
  l: number;
  /** Seconds before the next lunge. */
  u: number;
  /** The jetpack: seconds of fuel left while it's lit (0: not flying), and seconds since it lit. */
  f: number;
  ft: number;
}

export const HERO_MOVE: HeroMove = { h: 0, c0: 0, c1: 0, c2: 0, a0: 0, a1: 0, a2: 0, g: 0, k: 0, m: 100, j: 0, r: 0, rx: 0, rz: -1, l: 0, u: 0, f: 0, ft: 0 };

/** The ability's name in `movement.abilities` (and `player.abilities`). */
export const HERO_ABILITY = 'hero';

/** Cooldowns and time left by the power's slot (0 Q, 1 E, 2 F). */
export const coolOf = (s: HeroMove, slot: number) => (slot === 0 ? s.c0 : slot === 1 ? s.c1 : s.c2);
export const activeOf = (s: HeroMove, slot: number) => (slot === 0 ? s.a0 : slot === 1 ? s.a1 : s.a2);

const hero: MovementAbility<HeroMove> = {
  state: HERO_MOVE,
  step(s, c, body, dt) {
    s.c0 = Math.max(0, s.c0 - dt);
    s.c1 = Math.max(0, s.c1 - dt);
    s.c2 = Math.max(0, s.c2 - dt);
    s.a0 = Math.max(0, s.a0 - dt);
    s.a1 = Math.max(0, s.a1 - dt);
    s.a2 = Math.max(0, s.a2 - dt);
    s.u = Math.max(0, s.u - dt);
    const id = heroByNumber(s.h);
    if (!id) {
      s.r = s.l = s.j = s.f = 0;
      return;
    }
    const guard = s.g > 0 && c.button(2);
    // The guard up: slower, and slower still at a run.
    if (guard) body.speed *= body.sprinting ? MOVE.blockSprint : MOVE.block;
    // Each swing of a saber steps them in (on the ground, not guarding, not mid-dash).
    if (usesSaber(id) && c.buttonPressed(0) && s.k > 0 && !guard && s.u === 0 && body.onGround && s.r === 0) {
      s.u = MOVE.lungeEvery;
      body.addVelocity({ x: -Math.sin(body.yaw) * MOVE.lunge, z: -Math.cos(body.yaw) * MOVE.lunge });
    }

    // Luke's: Saber Rush (E) and Force Leap (F), when they're ready.
    if (id === 'luke' && s.k > 0) {
      const [, rush, leap] = HEROES.luke.powers;
      if (c.pressed(rush.key) && s.c1 === 0 && s.r === 0) {
        s.rx = -Math.sin(body.yaw);
        s.rz = -Math.cos(body.yaw);
        s.r = POWERS.rush.time;
        s.c1 = rush.cooldown;
        body.trigger('rush');
      }
      if (c.pressed(leap.key) && s.c2 === 0 && s.l === 0 && s.r === 0 && !body.inWater) {
        const L = POWERS.leap;
        const up = Math.max(0, Math.sin(body.pitch));
        body.setVelocity({ x: -Math.sin(body.yaw) * L.speed, y: L.up + up * 4, z: -Math.cos(body.yaw) * L.speed });
        s.l = 1e-3;
        s.c2 = leap.cooldown;
        body.trigger('leap');
      }
    }

    // Chewblocca's Wookiee Charge (E): a bull rush along the ground.
    if (id === 'chewie' && s.k > 0) {
      const charge = HEROES.chewie.powers[1];
      if (c.pressed(charge.key) && s.c1 === 0 && s.r === 0) {
        s.rx = -Math.sin(body.yaw);
        s.rz = -Math.cos(body.yaw);
        s.r = POWERS.charge.time;
        s.c1 = charge.cooldown;
        body.trigger('charge');
      }
    }
    // Boba Fetch's jetpack (F): up, then hovering and strafing on its fuel.
    if (id === 'boba' && s.k > 0) {
      const jet = HEROES.boba.powers[2];
      if (c.pressed(jet.key) && s.c2 === 0 && s.f === 0 && !body.inWater) {
        s.f = jet.lasts ?? 4;
        s.ft = 0;
        s.c2 = jet.cooldown;
        body.setVelocity({ y: POWERS.jetpack.lift });
        body.trigger('jet');
      }
    }
    if (s.f > 0) {
      const J = POWERS.jetpack;
      s.f = Math.max(0, s.f - dt);
      s.ft += dt;
      s.a2 = s.f;
      const vy = body.velocity.y;
      // Space climbs, crouching drops, else it hovers (the climb eased off).
      const want = c.isDown('Space') ? J.climb : body.crouching ? J.drop : J.hover;
      if (s.ft > 0.25) body.setVelocity({ y: vy + (want - vy) * Math.min(1, dt * 5) });
      body.gravity = J.gravity;
      body.control = J.control;
      body.speed *= J.speed;
      body.jump = false;
      // Back on the ground (not just leaving it), or out of fuel: it cuts out.
      if (s.f === 0 || (body.onGround && s.ft > 0.4 && !c.isDown('Space'))) {
        s.f = 0;
        s.a2 = 0;
        body.trigger('jetEnd');
      }
    }

    // On the ground: the jumps come back, and a leap lands (the server's shockwave).
    if (body.onGround || body.inWater) {
      s.j = 0;
      if (s.l > 0.12) body.trigger('land');
      if (s.l > 0.12 || body.inWater) s.l = 0;
    } else if (s.j < 1 && s.r === 0 && s.l === 0 && s.f === 0 && body.control !== 0 && c.pressed('Space')) {
      // A second jump, in the air.
      s.j++;
      c.consume('Space');
      body.setVelocity({ y: MOVE.doubleJump });
      body.trigger('jump');
    }

    // A rush under way: level and unsteerable, out of it at a run. (A charge keeps to the ground.)
    if (s.r > 0) {
      s.r = Math.max(0, s.r - dt);
      const charge = id === 'chewie';
      const R = charge ? POWERS.charge : POWERS.rush;
      const speed = s.r > 0 ? R.speed : R.exit;
      if (charge) body.setVelocity({ x: s.rx * speed, z: s.rz * speed });
      else {
        body.setVelocity({ x: s.rx * speed, y: 0, z: s.rz * speed });
        body.gravity = 0;
      }
      body.control = 0;
      body.jump = false;
    }
    // A leap under way: it carries him (a little steering), falling slowly.
    if (s.l > 0) {
      s.l += dt;
      body.gravity = POWERS.leap.gravity;
      body.control = POWERS.leap.control;
    }
  },
};

/** The heroes' movement abilities, for `shared.ts`'s `movement.abilities`. */
export const HERO_ABILITIES: Record<string, MovementAbility> = { [HERO_ABILITY]: hero };
