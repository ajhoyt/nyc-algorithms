// Game modes: sandbox, wrangle (merge the flock), survive the falcon.

import { W, FLOOR, type Mode, type World } from '../world';
import { spawn } from './flock';

export const SURVIVE_BIRDS = 80;
export const SURVIVE_MS = 30000;
export const WRANGLE_BIRDS = 80;
/** Wrangle: one group must hold this share of the birds… */
export const WRANGLE_SHARE = 0.75;
/** …for this many sim frames (2 s). */
export const WRANGLE_HOLD = 120;
/** Two birds closer than this are in the same group. */
const LINK_R = 22;

export function setWeights(w: World, sep: number, ali: number, coh: number) {
  w.w = { sep, ali, coh };
}

export function startGame(w: World, m: Mode) {
  w.mode = m;
  w.hawk.on = false;
  w.over = false;
  w.puffs = [];
  w.dialog = null;
  if (m === 'survive') {
    spawn(w, SURVIVE_BIRDS, false);
    w.falcon = { x: W + 20, y: 20, vx: -2, vy: 0.4, target: null, cool: 120, retarget: 0, ph: 0 };
    w.timeLeft = SURVIVE_MS;
  } else if (m === 'wrangle') {
    w.falcon = null;
    spawn(w, WRANGLE_BIRDS, true);
    setWeights(w, 1.2, 0, 0);
    w.elapsed = 0; w.oneFor = 0; w.flocks = 99; w.wt = 0;
  } else {
    w.falcon = null;
    spawn(w, w.count, false);
  }
}

/** Counts groups with union-find every 15 frames; wins when one group holds the flock long enough. */
export function wrangleStep(w: World) {
  if (w.over) return;
  w.elapsed += 16.67;
  w.wt++;
  if (w.wt % 15) return;
  const { groups, largest } = countGroups(w);
  w.flocks = groups;
  if (groups === 1 && largest >= w.birds.length * WRANGLE_SHARE) {
    w.oneFor += 15;
    if (w.oneFor >= WRANGLE_HOLD) w.over = true;
  } else w.oneFor = 0;
}

/** Groups of 3+ birds (wrapping horizontally), and the size of the largest group. */
export function countGroups(w: World): { groups: number; largest: number } {
  const B = w.birds;
  const n = B.length;
  const par = new Int32Array(n);
  for (let i = 0; i < n; i++) par[i] = i;
  const find = (a: number) => {
    while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; }
    return a;
  };
  const R2 = LINK_R * LINK_R;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let dx = B[i].x - B[j].x;
      const dy = B[i].y - B[j].y;
      if (Math.abs(dx) > W / 2) dx = W + 12 - Math.abs(dx);
      if (dx * dx + dy * dy < R2) {
        const a = find(i), b = find(j);
        if (a !== b) par[a] = b;
      }
    }
  }
  const size = new Map<number, number>();
  for (let i = 0; i < n; i++) { const r = find(i); size.set(r, (size.get(r) ?? 0) + 1); }
  let groups = 0, largest = 0;
  for (const s of size.values()) {
    if (s >= 3) groups++;
    if (s > largest) largest = s;
  }
  return { groups, largest };
}

/** Falcon AI: hunts the most isolated bird. Catch chance drops with the target's neighbour count. */
export function falconStep(w: World) {
  const f = w.falcon;
  if (!f) return;
  const B = w.birds;
  const FS = 3.8, FA = 0.28;
  f.ph += 0.3;
  if (!w.over) {
    w.timeLeft -= 16.67;
    if (w.timeLeft <= 0) { w.timeLeft = 0; w.over = true; f.target = null; f.cool = 9999; }
  }
  let tx: number, ty: number;
  if (f.cool > 0) {
    f.cool--;
    tx = f.x + f.vx * 20;
    ty = w.over ? -40 : 10;
  } else {
    f.retarget--;
    if (!f.target || B.indexOf(f.target) < 0 || f.retarget <= 0) {
      let best = null, bn = 1e9;
      for (const b of B) {
        if (b.x < 0 || b.x > W) continue;
        const score = b.nb * 10 + Math.hypot(b.x - f.x, b.y - f.y) * 0.05;
        if (score < bn) { bn = score; best = b; }
      }
      f.target = best;
      f.retarget = 90;
    }
    if (!f.target) { tx = W / 2; ty = 30; } else { tx = f.target.x; ty = f.target.y; }
  }
  const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1;
  let ax = (dx / d) * FS - f.vx, ay = (dy / d) * FS - f.vy;
  const am = Math.hypot(ax, ay);
  if (am > FA) { ax = (ax / am) * FA; ay = (ay / am) * FA; }
  f.vx += ax; f.vy += ay;
  const sp = Math.hypot(f.vx, f.vy);
  if (sp > FS) { f.vx = (f.vx / sp) * FS; f.vy = (f.vy / sp) * FS; }
  f.x += f.vx; f.y += f.vy;
  if (f.y > FLOOR) { f.y = FLOOR; f.vy = -Math.abs(f.vy); }
  if (f.cool <= 0 && f.target) {
    const td = Math.hypot(f.target.x - f.x, f.target.y - f.y);
    if (td < 4.5) {
      // Confusion effect: a bird surrounded by others is harder to single out.
      if (Math.random() >= Math.min(0.9, f.target.nb / 8)) {
        const k = B.indexOf(f.target);
        if (k >= 0) {
          const pc = w.species === 'pigeon' ? ['#a3a8b8', '#d6d8e0'] : ['#1b1f2b', '#e9e3cc'];
          for (let q = 0; q < 8; q++) {
            w.puffs.push({ x: f.target.x, y: f.target.y, vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.8) * 0.8, life: 30 + Math.random() * 20, c: pc[q % 2] });
          }
          if (w.bub && w.bub.b === f.target) { w.bub = null; w.bubShow = false; }
          B.splice(k, 1);
        }
      }
      f.cool = 22;
      f.target = null;
    }
  }
}
