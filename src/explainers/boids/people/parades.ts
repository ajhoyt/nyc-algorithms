// One-off holiday crowds:
//   - SantaCon: once on Christmas day, a mob of Santas (plus a few elves and reindeer) floods along
//     the path, some stumbling, with the odd HO HO HO.
//   - Easter: the Easter Bunny hops through with a basket, stopping to toss eggs onto the lawn.

import { dayPhase, ev, openHours } from '../scene/calendar';
import { W, dim, type Dot, type Look, type World } from '../world';
import { dressAs } from './costumes';
import { lookFor } from './crowd';
import { drawPerson } from './draw';

export interface Santa { x: number; y: number; v: number; ph: number; dir: number; look: Look; stumble: number }
export interface Bunny { x: number; dir: number; ph: number; state: 'gone' | 'hop' | 'pause'; t: number; cool: number }
export interface LawnEgg { x: number; y: number; c: string }

const SANTAS = 36;
const PASTELS = ['#f4b6c8', '#b58ae0', '#f5e26a', '#9fd6c0', '#7fc8f0'];

// --- SantaCon ---------------------------------------------------------------------

export function stepSantaCon(w: World) {
  const christmasDay = ev(w).id === 'christmas' && !w.night;
  if (!christmasDay) w.santaconDone = false;
  else if (!w.santaconDone && dayPhase(w) > 0.3 && dayPhase(w) < 0.6) {
    w.santaconDone = true;
    const dir = Math.random() < 0.5 ? 1 : -1;
    for (let i = 0; i < SANTAS; i++) {
      const r = Math.random();
      const look = dressAs(lookFor(w, false), r < 0.75 ? 'santa' : r < 0.9 ? 'elf' : 'reindeer');
      w.santas.push({
        x: (dir > 0 ? -8 : W + 8) - dir * (i * 2.5 + Math.random() * 24), y: 163 + Math.floor(Math.random() * 8),
        v: 0.45 + Math.random() * 0.3, ph: Math.random() * 4, dir, look, stumble: 0,
      });
    }
  }
  for (let i = w.santas.length - 1; i >= 0; i--) {
    const s = w.santas[i];
    if (s.stumble > 0) { s.stumble--; s.x += s.dir * 0.04; s.ph += 0.05; }
    else {
      s.x += s.dir * s.v; s.ph += s.v * 0.7;
      if (Math.random() < 0.002) s.stumble = 50 + Math.random() * 60;
    }
    if (s.dir > 0 ? s.x > W + 10 : s.x < -10) w.santas.splice(i, 1);
  }
  // HO HO HO
  const t = w.t;
  if (w.santaBub && t > w.santaBub.until) w.santaBub = null;
  if (!w.santaBub && !w.tourBub && Math.random() < 0.02) {
    const on = w.santas.filter((s) => s.x > 20 && s.x < W - 20 && s.look.costume === 'santa');
    if (on.length) w.santaBub = { s: on[Math.floor(Math.random() * on.length)], lines: ['HO HO HO!'], until: t + 1400 };
  }
}

export function drawSanta(w: World, s: Santa, dot: Dot) {
  const x = Math.round(s.x);
  // Stumbling Santas sway.
  const sway = s.stumble > 0 ? (Math.floor(s.stumble / 8) % 2 ? 1 : 0) : 0;
  drawPerson(w, x + sway, s.y, s.look, s.stumble > 0 ? 0 : Math.floor(s.ph) % 2, false);
  if (s.look.costume === 'santa' && s.stumble === 0 && Math.floor(s.ph) % 4 === 0) dot('#7a4a24', x + (s.dir > 0 ? -1 : 3), s.y + 3); // toy sack
}

// --- Easter Bunny ------------------------------------------------------------------

const BUNNY = ['.w.w.', '.p.p.', '.www.', '.wkw.', 'wwwww', '.wpw.', '.www.', '.w.w.'];
const BUNNY_Y = 163;

export function stepBunny(w: World) {
  const easter = ev(w).id === 'easter';
  if (!easter) w.lawnEggs = [];
  const b = w.bunny;
  if (b.state === 'gone') {
    if (b.cool > 0) { b.cool--; return; }
    if (!easter || !openHours(w)) return;
    b.dir = Math.random() < 0.5 ? 1 : -1;
    b.x = b.dir > 0 ? -8 : W + 8;
    b.state = 'hop';
    return;
  }
  if (b.state === 'pause') {
    b.t++;
    if (b.t === 40) {
      // Toss an egg onto the lawn in front of the path.
      w.lawnEggs.push({ x: Math.round(b.x + b.dir * (6 + Math.random() * 10)), y: 174 + Math.floor(Math.random() * 4), c: PASTELS[Math.floor(Math.random() * PASTELS.length)] });
      if (w.lawnEggs.length > 14) w.lawnEggs.shift();
    }
    if (b.t >= 80) b.state = 'hop';
    return;
  }
  b.x += b.dir * 0.32;
  b.ph += 0.16;
  const onScreen = b.x > 10 && b.x < W - 10;
  if (onScreen && easter && openHours(w) && Math.random() < 0.004) { b.state = 'pause'; b.t = 0; }
  if (b.dir > 0 ? b.x > W + 10 : b.x < -10) { b.state = 'gone'; b.cool = 700; }
}

export function drawBunny(w: World, dot: Dot) {
  const b = w.bunny;
  if (b.state === 'gone') return;
  const C: Record<string, string> = { w: '#f6f2e8', p: '#f4b6c8', k: '#1c1c1c' };
  const hop = b.state === 'hop' && Math.floor(b.ph) % 2 ? 1 : 0;
  const x = Math.round(b.x), y = BUNNY_Y - hop;
  BUNNY.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch !== '.') dot(C[ch], b.dir > 0 ? x + c : x + 4 - c, y + r);
  }));
  // Basket (with an egg held up while tossing)
  const bx = b.dir > 0 ? x + 5 : x - 1;
  dot('#a87a40', bx, y + 5); dot('#a87a40', bx, y + 6); dot('#f4b6c8', bx, y + 4);
  if (b.state === 'pause' && b.t < 40) dot('#7fc8f0', b.dir > 0 ? x + 4 : x, y + 3);
}

export function drawLawnEggs(w: World) {
  const ctx = w.ctx;
  for (const e of w.lawnEggs) {
    ctx.fillStyle = dim(w, e.c);
    ctx.fillRect(e.x, e.y - 1, 1, 2);
  }
}
