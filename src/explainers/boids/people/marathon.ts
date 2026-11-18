// Marathon day: the path is cleared, runners in bibs stream through the finish line and celebrate,
// and spectators line both sides of the path (thickest at the finish), cheering and waving signs.
// Everyone walks in and out; nobody pops into existence.

import { dayPhase, ev, openHours } from '../scene/calendar';
import { DX, W, pick, type Dot, type Look, type World } from '../world';
import { lookFor } from './crowd';
import { drawPerson, drawPersonFull } from './draw';

/** Runners go left to right; the finish banner spans x 136–176 (see scene/holidays.ts). */
export const FINISH_X = 176;
const BIBS = ['#e05a33', '#4fb3d9', '#f5c400', '#2e9e6b', '#f08aa8', '#ffffff'];
const SIGNS = ['#f5c400', '#ffffff', '#e05a33', '#4fb3d9', '#f08aa8'];

export interface Runner { x: number; y: number; v: number; ph: number; look: Look; fin: number }
export interface Fan {
  home: number; x: number; y: number; dir: number; ph: number; look: Look;
  state: 'arrive' | 'cheer' | 'leave'; sign: string | null;
}

/** Race hours: marathon day, after the morning and before dark. */
export const raceOn = (w: World) => ev(w).id === 'marathon' && openHours(w) && dayPhase(w) < 0.9;

function fanSpots(): [number, number][] {
  const spots: [number, number][] = [];
  // Dense by the finish, sparse elsewhere; two rows: behind the path and in front of it.
  for (let x = 6; x < W - 6; x += 4) {
    const nearFinish = x > 112 && x < 204;
    for (const y of [160, 171]) {
      if (y === 160 && Math.abs(x - DX) < 6) continue; // the dock
      if (!nearFinish && Math.random() < 0.65) continue;
      spots.push([x + Math.floor(Math.random() * 2), y + Math.floor(Math.random() * 2)]);
    }
  }
  return spots;
}

export function stepMarathon(w: World) {
  const on = raceOn(w);
  // Spectators
  if (on && !w.fans.length) {
    w.fans = fanSpots().map(([home, y]) => {
      const fromLeft = home < W / 2;
      return {
        home, y, x: fromLeft ? -6 - Math.random() * 60 : W + 6 + Math.random() * 60, dir: fromLeft ? 1 : -1,
        ph: Math.random() * 4, look: lookFor(w, Math.random() < 0.15), state: 'arrive' as const,
        sign: Math.random() < 0.3 ? pick(SIGNS) : null,
      };
    });
  }
  for (let i = w.fans.length - 1; i >= 0; i--) {
    const f = w.fans[i];
    if (!on && f.state !== 'leave') { f.state = 'leave'; f.dir = f.x < W / 2 ? -1 : 1; }
    if (f.state === 'arrive') {
      const d = f.home - f.x;
      if (Math.abs(d) < 0.6) { f.x = f.home; f.state = 'cheer'; }
      else { f.dir = Math.sign(d); f.x += f.dir * 0.6; f.ph += 0.2; }
    } else if (f.state === 'cheer') f.ph += 0.06 + Math.random() * 0.04;
    else {
      f.x += f.dir * 0.6; f.ph += 0.2;
      if (f.x < -8 || f.x > W + 8) w.fans.splice(i, 1);
    }
  }
  // Runners
  if (on && Math.random() < 0.04) {
    const look = lookFor(w, false);
    look.bib = true; look.top = pick(BIBS); look.legs = '#1c1c1c';
    w.runners.push({ x: -6, y: 165 + Math.floor(Math.random() * 3), v: 0.55 + Math.random() * 0.35, ph: Math.random() * 4, look, fin: 0 });
  }
  for (let i = w.runners.length - 1; i >= 0; i--) {
    const r = w.runners[i];
    if (r.fin === 0 && r.x >= FINISH_X) r.fin = 1;
    if (r.fin > 0) r.fin++;
    // Sprint, cross, celebrate with arms up, then jog it out.
    const v = r.fin === 0 ? r.v : r.fin < 45 ? 0.15 : 0.3;
    r.x += v; r.ph += v * 0.7;
    if (r.x > W + 8) w.runners.splice(i, 1);
  }
}

export function drawRunner(w: World, r: Runner, dot: Dot) {
  const x = Math.round(r.x), celebrating = r.fin > 0 && r.fin < 45;
  drawPersonFull(w, x, r.y, r.look, Math.floor(r.ph) % 2, false);
  if (celebrating) { dot(r.look.skin, x - 1, r.y); dot(r.look.skin, x + 3, r.y); }
}

export function drawFan(w: World, f: Fan, dot: Dot) {
  const x = Math.round(f.x);
  const moving = f.state !== 'cheer';
  drawPerson(w, x, f.y, f.look, moving ? Math.floor(f.ph) % 2 : 0, false);
  if (moving) return;
  const hy = f.look.kid ? f.y + 2 : f.y;
  if (f.sign) {
    // Sign held overhead, bobbing
    const bob = Math.floor(f.ph) % 2;
    for (let i = -1; i <= 3; i++) { dot(f.sign, x + i, hy - 4 - bob); dot(f.sign, x + i, hy - 3 - bob); }
    dot('#5a4028', x + 1, hy - 2 - bob);
  } else if (Math.floor(f.ph) % 2) {
    // Cheering: arms up
    dot(f.look.skin, x - 1, hy); dot(f.look.skin, x + 3, hy);
  }
}
