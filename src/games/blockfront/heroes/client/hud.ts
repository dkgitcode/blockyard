import type { Client, ClientKit } from '@platform/client';
import { HERO_ABILITY, activeOf, coolOf, type HeroMove } from '../abilities';
import { HEROES, heroByNumber, usesSaber, type HeroId, type PowerId } from '../defs';
import { GUARD } from '../tuning';
import type { HeroScene } from './state';

/** A mark for each power (plain text: the HUD's font draws it). */
const GLYPH: Record<PowerId, string> = {
  push: '⟫',
  rush: '➤',
  leap: '⤒',
  pull: '⟪',
  soresu: '◈',
  throw: '↻',
  choke: '✊',
  rage: '✹',
  lightning: 'ϟ',
  chain: '⌁',
  aura: '◉',
  scatter: '⋔',
  charge: '⏵',
  roar: '✺',
  rocket: '➹',
  flame: '♨',
  jetpack: '⇡',
};

const CSS = `
/* While a hero's panel is up it stands in for the hotbar (a saber alone) and the small health bar. */
body.bfh-on .hotbar, body.bfh-on .healthbar { visibility: hidden; }
.bfh-hero { position: absolute; left: 50%; bottom: 22px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: stretch; gap: 6px; width: min(560px, 92vw); pointer-events: none; font-family: var(--sans, system-ui); color: #fff; --blade: #5dff6a; }
.bfh-hero.off { display: none; }
.bfh-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.bfh-name { font: 700 17px var(--pixel, 'Arial Black'); letter-spacing: 0.08em; text-transform: uppercase; color: var(--blade); text-shadow: 0 0 10px color-mix(in srgb, var(--blade) 70%, transparent), 0 1px 0 #000; }
.bfh-title { font: 600 11px var(--sans); letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.75; margin-left: 8px; color: #fff; text-shadow: 0 1px 0 #000; }
.bfh-hp-n { font: 700 15px var(--pixel); text-shadow: 0 1px 0 #000; }
.bfh-hp-n small { font-size: 11px; opacity: 0.6; }
.bfh-bar { position: relative; height: 14px; background: rgba(8, 11, 16, 0.8); border: 1px solid rgba(255, 255, 255, 0.28); clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%); }
.bfh-bar > i { position: absolute; left: 0; top: 0; bottom: 0; width: calc(var(--fill, 1) * 100%); transition: width 0.12s linear; }
.bfh-hp > i { background: linear-gradient(180deg, #fff 0%, var(--blade) 38%, color-mix(in srgb, var(--blade) 55%, #000) 100%); box-shadow: 0 0 12px var(--blade); }
.bfh-hp.low > i { background: linear-gradient(180deg, #fff 0%, #ff3b30 40%, #7a0d08 100%); box-shadow: 0 0 14px #ff3b30; animation: bfh-pulse 0.6s ease-in-out infinite; }
.bfh-hp > b { position: absolute; left: 0; top: 0; bottom: 0; width: calc(var(--lost, 1) * 100%); background: rgba(255, 255, 255, 0.55); transition: width 0.6s ease-out 0.25s; }
.bfh-guard-row { display: flex; align-items: center; gap: 8px; }
.bfh-hero.gun .bfh-guard-row { display: none; }
.bfh-guard-l { font: 700 10px var(--pixel); letter-spacing: 0.14em; opacity: 0.8; min-width: 50px; text-shadow: 0 1px 0 #000; }
.bfh-guard { flex: 1; height: 7px; }
.bfh-guard > i { background: linear-gradient(90deg, #9fd8ff, #e9f6ff); box-shadow: 0 0 8px #9fd8ff; }
.bfh-guard-row.up .bfh-guard-l { color: #9fd8ff; opacity: 1; }
.bfh-guard-row.up .bfh-guard { border-color: #9fd8ff; }
.bfh-guard-row.broken .bfh-guard-l { color: #ff3b30; opacity: 1; animation: bfh-pulse 0.3s ease-in-out infinite; }
.bfh-guard-row.broken .bfh-guard > i { background: #ff3b30; box-shadow: 0 0 8px #ff3b30; }
.bfh-powers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 2px; }
.bfh-p { position: relative; display: flex; align-items: center; gap: 8px; padding: 6px 8px 6px 6px; background: rgba(8, 11, 16, 0.78); border: 1px solid rgba(255, 255, 255, 0.22); overflow: hidden; }
.bfh-p .ic { position: relative; flex: none; width: 34px; height: 34px; display: grid; place-items: center; font: 700 19px var(--sans); color: var(--blade); background: rgba(255, 255, 255, 0.06); border: 1px solid color-mix(in srgb, var(--blade) 55%, transparent); text-shadow: 0 0 8px var(--blade); }
.bfh-p .cd { position: absolute; inset: 0; background: conic-gradient(rgba(4, 6, 10, 0.82) calc(var(--cd, 0) * 360deg), transparent 0); }
.bfh-p .key { position: absolute; right: -1px; bottom: -1px; font: 700 10px var(--pixel); background: var(--hud-accent, #ffe81f); color: #111; padding: 0 3px; line-height: 13px; }
.bfh-p .nm { font: 700 11px var(--sans); letter-spacing: 0.04em; line-height: 1.15; text-transform: uppercase; text-shadow: 0 1px 0 #000; }
.bfh-p .st { font: 600 10px var(--sans); opacity: 0.7; letter-spacing: 0.08em; }
.bfh-p.cooling .nm { opacity: 0.55; }
.bfh-p.ready { border-color: color-mix(in srgb, var(--blade) 60%, transparent); }
.bfh-p.ready .st { color: var(--blade); opacity: 0.95; }
.bfh-p.just { animation: bfh-ready 0.5s ease-out; }
.bfh-p.on { border-color: var(--blade); box-shadow: inset 0 0 14px color-mix(in srgb, var(--blade) 45%, transparent); }
.bfh-p .left { position: absolute; left: 0; bottom: 0; height: 2px; width: calc(var(--on, 0) * 100%); background: var(--blade); box-shadow: 0 0 6px var(--blade); }
@keyframes bfh-pulse { 50% { opacity: 0.55; } }
@keyframes bfh-ready { 0% { box-shadow: inset 0 0 24px var(--blade); } 100% { box-shadow: inset 0 0 0 transparent; } }
@media (max-width: 700px) { .bfh-p .nm { font-size: 9px; } .bfh-p .st { display: none; } }
`;

interface Card {
  root: HTMLElement;
  cd: HTMLElement;
  st: HTMLElement;
  was: string;
}

/**
 * The hero HUD, bottom middle (it reads well over the shoulder, under the figure): the hero's
 * name and a big health bar (what was lost fading after it), the guard's meter (lit while it's up,
 * red when it's broken), and their three powers with their keys, each darkening as it cools down,
 * lit while one that lasts is on, flashing as it's ready again. It reads this screen's own state:
 * their health, and their movement ability's (`client.me.abilities.hero`: the cooldowns and the
 * meter, counting down here as the server has them).
 */
export function heroHud(scene: HeroScene): ClientKit {
  let el: HTMLElement | null = null;
  let hero: HeroId | null = null;
  let name: HTMLElement;
  let title: HTMLElement;
  let hpBar: HTMLElement;
  let hpN: HTMLElement;
  let guardRow: HTMLElement;
  let guardBar: HTMLElement;
  let cards: Card[] = [];
  const set = (e: HTMLElement, k: string, v: string) => {
    if (e.style.getPropertyValue(k) !== v) e.style.setProperty(k, v);
  };
  const text = (e: HTMLElement, v: string) => {
    if (e.textContent !== v) e.textContent = v;
  };
  const cls = (e: HTMLElement, c: string, on: boolean) => {
    if (e.classList.contains(c) !== on) e.classList.toggle(c, on);
  };

  const build = (client: Client) => {
    client.hud.style(CSS);
    const layer = client.hud.layer('bfh-hero', 'panels');
    el = document.createElement('div');
    el.className = 'bfh-hero off';
    el.innerHTML = `
      <div class="bfh-top"><div><span class="bfh-name"></span><span class="bfh-title"></span></div><div class="bfh-hp-n"></div></div>
      <div class="bfh-bar bfh-hp"><b></b><i></i></div>
      <div class="bfh-guard-row"><span class="bfh-guard-l">GUARD</span><div class="bfh-bar bfh-guard"><i></i></div></div>
      <div class="bfh-powers"></div>`;
    layer.appendChild(el);
    name = el.querySelector('.bfh-name')!;
    title = el.querySelector('.bfh-title')!;
    hpBar = el.querySelector('.bfh-hp')!;
    hpN = el.querySelector('.bfh-hp-n')!;
    guardRow = el.querySelector('.bfh-guard-row')!;
    guardBar = el.querySelector('.bfh-guard')!;
  };

  const become = (id: HeroId) => {
    hero = id;
    const h = HEROES[id];
    set(el!, '--blade', h.blade);
    text(name, h.name);
    text(title, h.title);
    const box = el!.querySelector('.bfh-powers')!;
    box.innerHTML = '';
    cards = h.powers.map((p) => {
      const root = document.createElement('div');
      root.className = 'bfh-p';
      root.innerHTML = `<div class="ic">${GLYPH[p.id]}<div class="cd"></div><span class="key">${p.key.slice(3)}</span></div><div><div class="nm"></div><div class="st"></div></div><div class="left"></div>`;
      root.querySelector('.nm')!.textContent = p.name;
      box.appendChild(root);
      return { root, cd: root.querySelector('.cd')!, st: root.querySelector('.st')!, was: '' };
    });
  };

  return {
    name: 'blockfront.heroes.hud',
    frame(client) {
      if (!el) build(client);
      const me = client.me;
      const m = me.abilities[HERO_ABILITY] as unknown as HeroMove | undefined;
      const id = m ? heroByNumber(m.h) : null;
      const show = !!id && !me.dead && !client.replay.playing;
      cls(el!, 'off', !show);
      cls(document.body, 'bfh-on', show);
      if (!show || !id || !m) {
        hero = null;
        return;
      }
      if (id !== hero) become(id);
      const h = HEROES[id];
      // A hero with a blaster has no guard to show.
      cls(el!, 'gun', !usesSaber(id));
      // Health: the bar, and what was lost fading after it (its own, slower transition).
      const fill = Math.max(0, Math.min(1, me.health / (me.maxHealth || h.health)));
      set(hpBar, '--fill', fill.toFixed(3));
      set(hpBar, '--lost', fill.toFixed(3));
      cls(hpBar, 'low', fill < 0.25);
      hpN.innerHTML = `${Math.ceil(me.health)} <small>/ ${me.maxHealth || h.health}</small>`;
      // The guard: up, broken, or at rest.
      const meter = Math.max(0, Math.min(1, m.m / GUARD.meter));
      set(guardBar, '--fill', meter.toFixed(3));
      const broken = !m.g && m.m < 8;
      cls(guardRow, 'broken', broken);
      cls(guardRow, 'up', !broken && !!m.g && client.input.button(2));
      // Each power: cooling (darkened, seconds left), on (lit, what's left of it), or ready.
      h.powers.forEach((p, i) => {
        const c = cards[i];
        if (!c) return;
        const cool = coolOf(m, i);
        const on = activeOf(m, i);
        const state = on > 0 ? 'on' : cool > 0 ? 'cooling' : 'ready';
        cls(c.root, 'on', state === 'on');
        cls(c.root, 'cooling', state === 'cooling');
        cls(c.root, 'ready', state === 'ready');
        if (c.was === 'cooling' && state === 'ready') {
          c.root.classList.remove('just');
          void c.root.offsetWidth;
          c.root.classList.add('just');
        }
        c.was = state;
        set(c.cd, '--cd', state === 'cooling' ? Math.min(1, cool / p.cooldown).toFixed(3) : '0');
        set(c.root, '--on', on > 0 && p.lasts ? Math.min(1, on / p.lasts).toFixed(3) : '0');
        text(c.st, state === 'cooling' ? `${cool.toFixed(cool < 3 ? 1 : 0)} s` : state === 'on' ? (p.hold ? 'HOLDING' : 'ACTIVE') : p.hold ? 'HOLD ' + p.key.slice(3) : 'READY');
      });
      void scene;
    },
    dispose() {
      document.body.classList.remove('bfh-on');
    },
  };
}
