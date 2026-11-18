// Live lights and holiday props: ESB tiers, Times Square billboards, fireworks, the ball drop,
// Thanksgiving balloons, lamp-post flags, the Christmas tree, eggs, the marathon finish, an open
// hydrant, jack-o'-lanterns, and the snowman.

import { glow } from '../render/glow';
import { W, dim, dotter, type Dot, type World } from '../world';
import { ev, evAlphaFor, evById, isNight, type HolidayDef } from './calendar';
import { makeFlakes } from './flakes';
import { buildCanopy } from './foliage';
import { stepBoats } from './lake';
import { LAMPS } from './paint';

const circleParts = (): [number, number][] =>
  Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    return [Math.cos(a), Math.sin(a)] as [number, number];
  });

/** Per-step sky events: fireworks, balloons, holiday flake swaps, boats. */
export function stepSky(w: World) {
  const e = ev(w), n = w.nightAmt;
  if (w.flakeEv !== e.id) makeFlakes(w, w.season ?? 'winter');
  if (e.fireworks && n > 0.6 && Math.random() < 0.025 && w.fireworks.length < 6) {
    const cols = e.id === 'july4' ? ['#e0302a', '#ffffff', '#4f8fe0'] : ['#f5c400', '#ffffff', '#f08aa8', '#7fd6ff'];
    w.fireworks.push({ x: 30 + Math.random() * 260, y: 22 + Math.random() * 50, t: 0, col: cols[Math.floor(Math.random() * cols.length)], parts: circleParts(), s: 10 + Math.random() * 8 });
  }
  for (let i = w.fireworks.length - 1; i >= 0; i--) {
    w.fireworks[i].t += 1 / 70;
    if (w.fireworks[i].t >= 1) w.fireworks.splice(i, 1);
  }
  if (!w.balloons) w.balloons = [{ kind: 'pigeon', x: -40, y: 86, v: 0.12 }, { kind: 'pizza', x: -120, y: 92, v: 0.1 }];
  const showB = e.id === 'thanksgiving' && !isNight(w);
  w.balloons.forEach((b, i) => {
    if (showB || (b.x > -30 && b.x < W + 30)) {
      b.x += b.v;
      if (b.x > W + 40) b.x = showB ? -60 - i * 60 : -999;
    } else if (showB && b.x < -60) b.x = -40 - i * 70;
  });
  stepBoats(w);
}

export function drawSkyFx(w: World) {
  const ctx = w.ctx, n = w.nightAmt;
  for (const f of w.fireworks) {
    if (f.t < 0) continue;
    const r = Math.sqrt(f.t) * f.s;
    glow(w, f.x, f.y + f.t * f.t * 6, Math.max(3, Math.round(r + 6)), f.col, 0.45 * Math.max(0, 1 - f.t) * n);
    ctx.globalAlpha = Math.max(0, 1 - f.t) * n;
    ctx.fillStyle = f.col;
    for (const p of f.parts) ctx.fillRect(Math.round(f.x + p[0] * r), Math.round(f.y + p[1] * r + f.t * f.t * 6), 1, 1);
    if (f.t < 0.15) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1); }
  }
  ctx.globalAlpha = 1;
}

function drawESBFor(w: World, e: HolidayDef, A: number) {
  const n = w.nightAmt, ctx = w.ctx;
  if (n < 0.02 || A <= 0) return;
  glow(w, 230, 34, 24, e.esb[1 % e.esb.length], 0.3 * n * A);
  glow(w, 230, 32, 12, e.esb[1 % e.esb.length], 0.55 * n * A);
  glow(w, 230, 40, 9, e.esb[0], 0.45 * n * A);
  ctx.globalAlpha = n * A;
  const tiers = [[226, 38, 9, 4], [227, 32, 7, 6], [228, 27, 5, 5], [229, 22, 3, 5]];
  const cols = e.esb, t = w.t / 1000;
  tiers.forEach((T, i) => {
    if (e.rainbow) for (let yy = 0; yy < T[3]; yy++) { ctx.fillStyle = cols[(yy + i * 2) % cols.length]; ctx.fillRect(T[0], T[1] + yy, T[2], 1); }
    else { ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(T[0], T[1], T[2], T[3]); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(T[0] + T[2] - 2, T[1], 2, T[3]);
  });
  if (e.sparkle) { ctx.fillStyle = '#ffffff'; for (let s = 0; s < 4; s++) ctx.fillRect(225 + Math.floor(Math.random() * 11), 22 + Math.floor(Math.random() * 24), 1, 1); }
  if (Math.floor(t * 1.2) % 2) { ctx.fillStyle = '#ff4040'; ctx.fillRect(230, 8, 1, 1); }
  ctx.globalAlpha = 1;
}

/** Empire State Building tier colours, cross-fading between holidays. */
export function drawESBLights(w: World) {
  const cur = evById(w.evId), prev = evById(w.prevEvId), f = w.evFade;
  if (prev && f < 1) drawESBFor(w, prev, 1 - f);
  if (cur) drawESBFor(w, cur, prev && f < 1 ? f : 1);
}

/** Christmas: a party in a penthouse window. */
export function drawParty(w: World) {
  const A = evAlphaFor(w, 'christmas'), n = w.nightAmt;
  if (A <= 0 || n < 0.3) return;
  const ctx = w.ctx, t = w.t / 1000, beat = Math.floor(t * 2.2);
  const cols = ['#e0302a', '#2e9e4b', '#b04fe0', '#4f8fe0', '#f5c400', '#ff5fa2'];
  const a = A * Math.min(1, (n - 0.3) / 0.4);
  glow(w, 229, 72, 5, cols[beat % cols.length], 0.35 * a);
  ctx.globalAlpha = a;
  for (let x = 223; x < 236; x += 2) {
    let c = cols[(beat + x * 3) % cols.length];
    if (Math.floor(t * 8 + x) % 7 === 0) c = '#ffffff';
    ctx.fillStyle = c; ctx.fillRect(x, 72, 1, 1);
  }
  ctx.globalAlpha = 1;
}

type Ad = { bg: string; px?: [number, number, string][]; flash?: boolean; eye?: boolean; noise?: boolean };
const ADS: Ad[] = [
  { bg: '#f5c400', px: [[1, 1, '#c9884a'], [2, 1, '#c9884a'], [3, 1, '#c9884a'], [4, 1, '#c9884a'], [5, 1, '#c9884a'], [1, 2, '#2e9e4b'], [2, 2, '#6b3a1a'], [3, 2, '#6b3a1a'], [4, 2, '#6b3a1a'], [5, 2, '#2e9e4b'], [2, 3, '#c9884a'], [3, 3, '#c9884a'], [4, 3, '#c9884a']] },
  { bg: '#1f5fa6', px: [[2, 0, '#ffffff'], [3, 0, '#ffffff'], [4, 0, '#ffffff'], [2, 1, '#ffffff'], [3, 1, 'blink'], [4, 1, '#ffffff'], [2, 2, '#ffffff'], [3, 2, 'blink'], [4, 2, '#ffffff'], [2, 3, '#ffffff'], [3, 3, '#ffffff'], [4, 3, '#ffffff']] },
  { bg: '#e0302a', flash: true },
  { bg: '#2e9e6b', px: [[4, 0, '#ffffff'], [2, 1, '#e0302a'], [3, 1, '#ffffff'], [4, 1, '#e0302a'], [2, 2, '#e0302a'], [3, 2, '#ffffff'], [4, 2, '#e0302a'], [2, 3, '#e0302a'], [3, 3, '#e0302a'], [4, 3, '#e0302a']] },
  { bg: '#f08aa8', eye: true },
  { bg: '#8a4fc0', noise: true },
  { bg: '#4fb3d9', px: [[1, 2, '#ffffff'], [2, 1, '#ffffff'], [3, 2, '#ffffff'], [4, 1, '#ffffff'], [5, 2, '#ffffff'], [1, 3, '#1f5fa6'], [5, 3, '#1f5fa6']] },
];

/** Times Square billboards: always running, glowing at night, plus the news ticker. */
export function drawTimesSq(w: World) {
  const ctx = w.ctx, t = w.t / 1000, n = w.nightAmt;
  let spill: string | null = null;
  for (let i = 0; i < 4; i++) {
    const slot = Math.floor(t / (1.6 + i * 0.45) + i * 1.7);
    const ad = ADS[(slot * 3 + i * 5) % ADS.length];
    const x0 = 147, y0 = 82 + i * 6;
    glow(w, x0 + 3, y0 + 2, 7, ad.bg, 0.7 * n);
    const flashOn = Math.floor(t * 6) % 2;
    ctx.fillStyle = ad.flash && flashOn ? '#ffffff' : ad.bg; ctx.fillRect(x0, y0, 7, 4);
    if (ad.flash) { ctx.fillStyle = flashOn ? '#e0302a' : '#ffffff'; ctx.fillRect(x0 + 1, y0 + 1, 2, 2); ctx.fillRect(x0 + 4, y0 + 1, 2, 2); }
    if (ad.noise) for (let q = 0; q < 10; q++) { ctx.fillStyle = ['#f5c400', '#4fb3d9', '#ffffff', '#e05a33'][Math.floor(Math.random() * 4)]; ctx.fillRect(x0 + Math.floor(Math.random() * 7), y0 + Math.floor(Math.random() * 4), 1, 1); }
    if (ad.eye) {
      const shut = Math.floor(t * 2.3) % 5 === 0;
      ctx.fillStyle = '#ffffff';
      if (shut) ctx.fillRect(x0 + 1, y0 + 2, 5, 1);
      else { ctx.fillRect(x0 + 1, y0 + 1, 5, 2); ctx.fillStyle = '#1c1c1c'; ctx.fillRect(x0 + 3 + Math.round(Math.sin(t * 1.7)), y0 + 1, 1, 2); }
    }
    if (ad.px) for (const p of ad.px) {
      ctx.fillStyle = p[2] === 'blink' ? (Math.floor(t * 3) % 2 ? '#7fd6ff' : '#1f5fa6') : p[2];
      ctx.fillRect(x0 + p[0], y0 + p[1], 1, 1);
    }
    if (i === 1) spill = ad.bg;
  }
  const off = Math.floor(t * 8);
  for (let x = 0; x < 7; x++) {
    ctx.fillStyle = (x + off) % 3 === 0 ? '#ff4040' : (x + off) % 3 === 1 ? '#f5c400' : '#1c1c1c';
    ctx.fillRect(147 + x, 106, 1, 1);
  }
  if (spill) glow(w, 151, 95, 20, spill, 0.28 * n);
}

/** New Year: the ball drops over ~10 s of night, then fireworks and confetti. */
export function drawBallDrop(w: World) {
  const A = evAlphaFor(w, 'newyear'), n = w.nightAmt, ctx = w.ctx;
  if (A <= 0 || n < 0.05) return;
  const p = Math.min(1, w.nightClock / 10000);
  const by = Math.round(62 + p * 13);
  ctx.globalAlpha = A * n;
  const cols = ['#ffffff', '#bfe8ff', '#f5e26a', '#f08aa8'];
  for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) {
    if ((dx === 0 || dx === 2) && (dy === 0 || dy === 2)) continue;
    ctx.fillStyle = cols[Math.floor(Math.random() * cols.length)];
    ctx.fillRect(150 + dx, by + dy - 1, 1, 1);
  }
  glow(w, 151, by, 5, '#fff3c4', 0.5 * A * n);
  ctx.globalAlpha = 1;
  if (p >= 1 && !w.dropped && w.evId === 'newyear') {
    w.dropped = true;
    const cols2 = ['#f5c400', '#ffffff', '#f08aa8', '#7fd6ff', '#9fe870'];
    for (let k = 0; k < 7; k++) {
      w.fireworks.push({ x: 40 + Math.random() * 240, y: 20 + Math.random() * 45, t: -k * 0.12, col: cols2[k % cols2.length], parts: circleParts(), s: 10 + Math.random() * 10 });
    }
    for (let c = 0; c < 60; c++) w.flakes.push({ x: Math.random() * W, y: -Math.random() * 60, v: 0.25 + Math.random() * 0.3, ph: Math.random() * 6, c: cols2[c % cols2.length], dying: true });
  }
}

/** Christmas lights strung through the canopy. */
export function drawParkFx(w: World) {
  const ctx = w.ctx, n = w.nightAmt, t = w.t / 1000;
  const lights = buildCanopy().lights;
  const xa = evAlphaFor(w, 'christmas');
  if (xa <= 0) return;
  const cols = ['#e0302a', '#2e9e4b', '#f5c400', '#4f8fe0'];
  const on = (i: number) => (i + Math.floor(t * 2)) % 3 !== 0;
  const base = (0.45 + 0.55 * n) * xa;
  ctx.globalAlpha = base;
  lights.forEach((l, i) => { if (on(i)) glow(w, l[0], l[1], 2, cols[i % 4], 0.6 * n * xa); });
  ctx.globalAlpha = base;
  lights.forEach((l, i) => { if (on(i)) { ctx.fillStyle = cols[i % 4]; ctx.fillRect(l[0], l[1], 1, 1); } });
  ctx.globalAlpha = 1;
}

export function drawJackOLanterns(w: World) {
  const ha = evAlphaFor(w, 'halloween');
  if (ha <= 0) return;
  const ctx = w.ctx, n = w.nightAmt;
  ctx.globalAlpha = ha;
  for (const jx of [24, 134, 258, 312]) {
    ctx.fillStyle = dim(w, '#e3842f'); ctx.fillRect(jx, 162, 3, 2);
    ctx.fillStyle = '#2e6b2e'; ctx.fillRect(jx + 1, 161, 1, 1);
    ctx.fillStyle = n > 0.3 ? '#ffe08a' : '#3a2a1a'; ctx.fillRect(jx, 162, 1, 1); ctx.fillRect(jx + 2, 162, 1, 1);
    if (n > 0.3) glow(w, jx + 1, 162, 4, '#ffa03c', 0.45 * n * ha);
  }
  ctx.globalAlpha = 1;
}

const FLAGS: Record<string, string[][]> = {
  stpatricks: [['#2e9e4b'], ['#3fbf5f'], ['#2e9e4b'], ['#ffffff']],
  pride: [['#e0302a'], ['#f5a030'], ['#f5e26a'], ['#2e9e4b'], ['#1f5fa6'], ['#8a4fc0']],
  july4: [['#1f5fa6', '#e0302a'], ['#1f5fa6', '#ffffff'], ['#e0302a', '#e0302a'], ['#ffffff', '#ffffff'], ['#e0302a', '#e0302a']],
  valentines: [['#f08aa8', '#f08aa8'], ['#e0305a', '#e0305a'], ['#f08aa8', '#f08aa8']],
  easter: [['#f4b6c8'], ['#b58ae0'], ['#f5e26a'], ['#9fd6c0']],
  marathon: [['#1f5fa6', '#1f5fa6'], ['#e3842f', '#e3842f'], ['#1f5fa6', '#1f5fa6']],
  halloween: [['#e3842f', '#e3842f'], ['#3a2a4a', '#3a2a4a'], ['#e3842f', '#e3842f']],
  thanksgiving: [['#c8512b', '#c8512b'], ['#e3842f', '#e3842f'], ['#7a5a3a', '#7a5a3a']],
  blossom: [['#f4b6c8', '#f4b6c8'], ['#ffffff', '#ffffff'], ['#f4b6c8', '#f4b6c8']],
  newyear: [['#f5c400', '#f5c400'], ['#ffffff', '#ffffff'], ['#f5c400', '#f5c400']],
};

function drawEventPropsFor(w: World, e: string | null, A: number) {
  if (!e || A <= 0) return;
  const ctx = w.ctx, t = w.t / 1000, n = w.nightAmt;
  const dot = dotter(w);
  ctx.globalAlpha = A;
  const flag = FLAGS[e];
  for (const lamp of LAMPS) {
    const lx = lamp + 1;
    if (flag) for (let r = 0; r < flag.length; r++) for (let c = 0; c < 2; c++) dot(flag[r][Math.min(c, flag[r].length - 1)], lx + c, 160 + r);
    if (e === 'christmas') {
      // Wreath
      dot('#2e7a3a', lx - 2, 161); dot('#2e7a3a', lx - 1, 160); dot('#2e7a3a', lx, 160); dot('#2e7a3a', lx + 1, 161);
      dot('#2e7a3a', lx - 1, 162); dot('#2e7a3a', lx, 162); dot('#e0302a', lx - 1, 163); dot('#e0302a', lx, 163);
    }
  }
  if (e === 'christmas') {
    const cx = 34, base = 156;
    for (let r = 0; r < 18; r++) {
      const half = Math.floor(r / 2.4) + 1;
      for (let dx = -half; dx <= half; dx++) dot(r % 4 === 3 ? '#1f6a33' : '#2e8a45', cx + dx, base - 18 + r);
    }
    dot('#6b4a2a', cx, base); dot('#6b4a2a', cx, base + 1);
    dot(Math.floor(t * 2) % 2 ? '#f5c400' : '#fff3a0', cx, base - 19); dot('#f5c400', cx - 1, base - 18); dot('#f5c400', cx + 1, base - 18);
    const bulbs = ['#e0302a', '#f5c400', '#4f8fe0', '#ffffff'];
    const ba = (0.6 + 0.4 * n) * A;
    ctx.globalAlpha = ba;
    for (let r = 0; r < 14; r++) {
      const by = base - 16 + r, bx = cx + Math.round(Math.sin(r * 1.7) * Math.min(5, r / 2.4));
      if ((r + Math.floor(t * 3)) % 4 === 0) continue;
      glow(w, bx, by, 2, bulbs[r % 4], 0.6 * n * A);
      ctx.globalAlpha = ba;
      dot(bulbs[r % 4], bx, by);
    }
    glow(w, cx, base - 19, 4, '#f5e26a', 0.6 * n * A);
    ctx.globalAlpha = A;
  }
  if (e === 'easter' && !isNight(w)) {
    const eggs = [[150, 176], [168, 178], [182, 175], [236, 177], [120, 178]], ec = ['#f4b6c8', '#b58ae0', '#f5e26a', '#9fd6c0', '#7fc8f0'];
    eggs.forEach((g, i) => { dot(ec[i], g[0], g[1]); dot(ec[i], g[0], g[1] - 1); });
  }
  if (e === 'marathon') {
    const fx0 = 136, fx1 = 176;
    for (let r = 0; r < 12; r++) { dot('#1c1c1c', fx0, 155 + r); dot('#1c1c1c', fx1, 155 + r); }
    for (let i = fx0; i <= fx1; i++) { dot(i % 4 < 2 ? '#1f5fa6' : '#e3842f', i, 154); dot(i % 4 < 2 ? '#e3842f' : '#1f5fa6', i, 155); }
  }
  if (e === 'heat' && !isNight(w)) {
    const hyx = 178;
    dot('#c42a2a', hyx, 166); dot('#c42a2a', hyx, 165); dot('#c42a2a', hyx - 1, 165); dot('#c42a2a', hyx + 1, 165); dot('#a02020', hyx, 164);
    ctx.globalAlpha = 0.8 * A;
    for (let i = 0; i < 10; i++) {
      const u = (t * 1.3 + i / 10) % 1;
      dot('#bfe3ff', hyx + 2 + Math.round(u * 14), 165 - Math.round(Math.sin(Math.PI * u) * 7));
    }
    ctx.globalAlpha = A;
  }
  ctx.globalAlpha = 1;
}

export function drawEventProps(w: World) {
  if (w.prevEvId && w.evFade < 1) drawEventPropsFor(w, w.prevEvId, 1 - w.evFade);
  drawEventPropsFor(w, w.evId, w.prevEvId && w.evFade < 1 ? w.evFade : 1);
}

/** Thanksgiving parade balloons: a pigeon and a slice of pizza. */
export function drawBalloons(w: World) {
  const ctx = w.ctx;
  const box = (c: string, x: number, y: number, bw = 1, bh = 1) => { ctx.fillStyle = dim(w, c); ctx.fillRect(Math.round(x), Math.round(y), bw, bh); };
  (w.balloons ?? []).forEach((b, i) => {
    if (b.x < -40 || b.x > W + 40) return;
    const x = b.x, y = b.y + Math.sin(w.t / 900 + i) * 1.5;
    ctx.globalAlpha = 0.6;
    for (let r = 0; r < 4; r++) box('#6b6b6b', x + 2 + r * 4, y + 9, 1, 30);
    ctx.globalAlpha = 1;
    if (b.kind === 'pigeon') {
      box('#a3a8b8', x, y + 3, 16, 6); box('#a3a8b8', x + 12, y, 6, 6); box('#5d6275', x + 3, y + 1, 7, 3);
      box('#4fb390', x + 12, y + 5, 4, 2); box('#9a6bc0', x + 14, y + 4, 2, 1); box('#1c1c1c', x + 15, y + 2); box('#f0a848', x + 18, y + 3, 2, 1);
      box('#3a3d4d', x - 3, y + 4, 3, 3); box('#e08a7a', x + 5, y + 9, 1, 2); box('#e08a7a', x + 10, y + 9, 1, 2);
    } else {
      for (let row = 0; row < 12; row++) box(row < 2 ? '#c9884a' : '#f5c400', x + row * 0.5, y + row - 1, 16 - row, 1);
      box('#e0302a', x + 4, y + 3, 2, 2); box('#e0302a', x + 9, y + 4, 2, 2); box('#e0302a', x + 6, y + 7, 2, 2);
    }
  });
}

/** The snowman: built in winter, melts in early spring (sinks, hat drops, carrot falls in the puddle). */
export function drawSnowman(w: World, dot: Dot) {
  const ctx = w.ctx, X = 70, Y = 161;
  const inWinter = w.season === 'winter';
  const fadeIn = inWinter ? (w.prevSeason && w.seasonFade < 1 ? w.seasonFade : 1) : 0;
  const m = w.meltT, pud = w.puddle;
  if (!inWinter && m <= 0 && pud <= 0) return;
  if (pud > 0 || m > 0) {
    ctx.globalAlpha = inWinter ? 0 : Math.min(1, pud);
    const pw = 3 + Math.round(5 * Math.min(1, m * 1.3));
    for (let i = 0; i < pw; i++) dot(i % 3 === 1 ? '#d8eefc' : '#a9d4f2', X + 1 - Math.floor(pw / 2) + i, Y + 5);
    ctx.globalAlpha = 1;
  }
  const h = inWinter ? 6 : Math.ceil(6 * (1 - m));
  if (h <= 0 && !inWinter) {
    ctx.globalAlpha = Math.min(1, pud);
    dot('#e3842f', X + 3, Y + 5); dot('#1c1c1c', X - 1, Y + 5); dot('#1c1c1c', X, Y + 5);
    ctx.globalAlpha = 1;
    return;
  }
  ctx.globalAlpha = inWinter ? fadeIn : 1;
  const rows = [[[1, 0]], [[0, 1], [1, 1], [2, 1]], [[1, 2]], [[0, 3], [1, 3], [2, 3]], [[-1, 4], [0, 4], [1, 4], [2, 4], [3, 4]], [[-1, 5], [0, 5], [1, 5], [2, 5], [3, 5]]];
  const shift = 6 - h;
  for (let r = shift; r < 6; r++) {
    for (const [px, py] of rows[r]) {
      const wide = r < 4 && h < 5 ? (px === 0 ? -1 : px === 2 ? 3 : px) : px;
      dot(m > 0.3 && Math.random() < 0.02 ? '#d8eefc' : '#ffffff', X + wide, Y + py);
    }
  }
  const topY = Y + shift;
  dot('#1c1c1c', X + 1, topY - 1); dot('#1c1c1c', X, topY - 1); dot('#1c1c1c', X + 2, topY - 1);
  if (h >= 3) dot('#e3842f', X + 2, topY + 1);
  else dot('#e3842f', X + 3, Y + 5);
  ctx.globalAlpha = 1;
}
