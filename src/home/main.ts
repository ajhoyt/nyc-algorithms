// Home page: animated hero (a murmuration over a pixel skyline) and explainer thumbnails.

import '../styles/main.css';
import { cloud, mosaicSky, rng } from '../shared/pixel';

const SKY = ['#2f6fb8', '#3b80c6', '#4f93d4', '#69a8df', '#86bce8', '#a6d0f0', '#c4e1f6'];

function starlingFrames(): HTMLCanvasElement[] {
  const P: Record<string, string> = { k: '#1b1f2b', p: '#6a55a8', g: '#2f8a6e', w: '#f1ead2', y: '#f2c230' };
  const F = [
    ['..p....', '..kp...', 'kkwkgky', '.......'],
    ['.......', '.pk....', 'kkkwgky', '.......'],
    ['.......', '.......', 'kkwkgky', '..kp...'],
  ];
  return F.map((rows) => {
    const c = document.createElement('canvas');
    c.width = 7; c.height = 4;
    const x = c.getContext('2d')!;
    rows.forEach((row, r) => [...row].forEach((ch, col) => {
      if (ch === '.') return;
      x.fillStyle = P[ch]; x.fillRect(col, r, 1, 1);
    }));
    return c;
  });
}

function heroScene(): HTMLCanvasElement {
  const W = 320, H = 90, G = 80;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d')!;
  const rnd = rng(11);
  mosaicSky(x, W, G, SKY, rnd);
  cloud(x, 70, 26, 12, rnd);
  cloud(x, 230, 18, 9, rnd);
  const layers: [string, number, number, string][] = [['#a9b4bf', 18, 40, '#d7e1ea'], ['#7d8894', 8, 22, '#c9d6e2']];
  for (let L = 0; L < 2; L++) {
    let xx = 0;
    while (xx < W) {
      const bw = 6 + Math.floor(rnd() * 12), bh = layers[L][1] + Math.floor(rnd() * layers[L][2]), top = 74 - bh;
      x.fillStyle = layers[L][0]; x.fillRect(xx, top, bw, 74 - top);
      x.fillStyle = L ? '#6c7783' : '#97a3ae'; x.fillRect(xx + bw - 2, top, 2, 74 - top);
      if (rnd() < 0.15) { x.fillStyle = layers[L][0]; x.fillRect(xx + Math.floor(bw / 2), top - 5, 1, 5); }
      x.fillStyle = layers[L][3];
      for (let wy = top + 3; wy < 70; wy += 4) for (let wx = xx + 2; wx < xx + bw - 2; wx += 3) if (rnd() < 0.4) x.fillRect(wx, wy, 1, 1);
      xx += bw + (rnd() < 0.3 ? 1 : 0);
    }
  }
  for (let tx = -4; tx < W + 4; tx += 7) {
    const cx = tx + Math.floor(rnd() * 4), cy = 72 + Math.floor(rnd() * 4), r = 5 + Math.floor(rnd() * 3);
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      x.fillStyle = dx + dy < -r * 0.5 ? '#7fbf5a' : rnd() < 0.2 ? '#5d9e48' : '#4b8a3e';
      x.fillRect(cx + dx, cy + dy, 1, 1);
    }
  }
  for (let y = G; y < H; y++) for (let xx = 0; xx < W; xx++) { x.fillStyle = rnd() < 0.3 ? '#73b356' : '#82c063'; x.fillRect(xx, y, 1, 1); }
  for (let y = G + 4; y < G + 7; y++) for (let xx = 0; xx < W; xx++) { x.fillStyle = rnd() < 0.25 ? '#c3b9a5' : '#d9d1c0'; x.fillRect(xx, y, 1, 1); }
  x.fillStyle = '#2f353c'; x.fillRect(60, G - 12, 1, 12); x.fillRect(250, G - 12, 1, 12);
  x.fillStyle = '#e9eef2'; x.fillRect(59, G - 13, 3, 2); x.fillRect(249, G - 13, 3, 2);
  return c;
}

function startHero(c: HTMLCanvasElement) {
  c.width = 320; c.height = 90;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const bg = heroScene();
  const spr = starlingFrames();
  const rnd = rng(5);
  const birds = Array.from({ length: 40 }, () => {
    const ang = rnd() * Math.PI * 2, rad = Math.sqrt(rnd());
    return { ox: Math.cos(ang) * rad * 30, oy: Math.sin(ang) * rad * 12, ph: rnd() * 4, b: rnd() * 6, r: 2 + rnd() * 4 };
  });
  let heroX = 40;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frame = (t: number) => {
    ctx.drawImage(bg, 0, 0);
    const tt = t / 1000;
    if (!reduce) { heroX += 0.35; if (heroX > 370) heroX = -50; }
    const my = 30 + Math.sin(tt * 0.6) * 6, stretch = 1 + Math.sin(tt * 0.9) * 0.35;
    for (const b of birds) {
      if (!reduce) b.ph += 0.22;
      const fr = [0, 1, 2, 1][Math.floor(b.ph) % 4];
      const px = heroX + b.ox * stretch + Math.cos(tt * 1.3 + b.b) * b.r;
      const py = my + b.oy / stretch + Math.sin(tt * 1.7 + b.b) * b.r * 0.6 + Math.sin(tt * 1.1 + b.ox * 0.08) * 4;
      ctx.drawImage(spr[fr], Math.round(px) - 3, Math.round(py) - 2);
    }
    if (!reduce) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function drawThumb(id: string, c: HTMLCanvasElement) {
  c.width = 96; c.height = 54;
  const x = c.getContext('2d')!;
  x.imageSmoothingEnabled = false;
  const rnd = rng(id.length * 97 + 3);
  const px = (col: string, a: number, b: number, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const noise = (x0: number, y0: number, w: number, h: number, a: string, b: string, p: number) => {
    for (let yy = y0; yy < y0 + h; yy++) for (let q = x0; q < x0 + w; q++) px(rnd() < p ? b : a, q, yy);
  };
  if (id === 'birds') {
    // Central Park, looking south: skyline with the Empire State Building, the lake, Bow Bridge.
    mosaicSky(x, 96, 34, SKY, rnd);
    cloud(x, 22, 10, 5, rnd);
    for (let i = 0; i < 96; i += 4) { const h = 4 + Math.floor(rnd() * 9); px(i % 8 ? '#8b96a1' : '#a9b4bf', i, 34 - h, 4, h); }
    px('#cfd6dd', 66, 18, 7, 16); px('#cfd6dd', 67, 12, 5, 6); px('#cfd6dd', 68, 8, 3, 4); px('#8a949e', 69, 3, 1, 5);
    px('#9aa5b1', 71, 12, 1, 22);
    for (let tx = -2; tx < 98; tx += 5) {
      const cx = tx + Math.floor(rnd() * 3), cy = 35 + Math.floor(rnd() * 2), r = 3 + Math.floor(rnd() * 2);
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) px(dx + dy < -r * 0.5 ? '#7fbf5a' : '#4b8a3e', cx + dx, cy + dy);
    }
    const water = ['#5f9fd9', '#4a8bcb', '#3a78b8'];
    for (let y = 38; y < 50; y++) for (let xx = 0; xx < 96; xx++) {
      const inLake = xx > 10 + (y - 38) * 0.6 && xx < 86 - (y - 38) * 0.6;
      px(inLake ? water[Math.min(2, Math.floor((y - 38) / 4 + (rnd() - 0.5)))] ?? water[0] : rnd() < 0.3 ? '#73b356' : '#82c063', xx, y);
    }
    noise(0, 50, 96, 4, '#82c063', '#73b356', 0.3);
    for (let xx = 12; xx <= 84; xx++) {
      const dk = Math.round(42 - 4 * Math.sin((Math.PI * (xx - 12)) / 72));
      px('#e9e4d6', xx, dk); px('#c9c3b3', xx, dk + 1);
      if (xx % 3 === 0) px('#d8d2c2', xx, dk - 1);
    }
    for (let i = 0; i < 220; i++) {
      const u = rnd() * Math.PI * 2, rr = Math.sqrt(rnd());
      const t2 = rnd(), bx = 8 + t2 * 52, by = 16 + Math.sin(t2 * 5.5) * 5, ww = 3 + Math.sin(t2 * 3.1) * 4;
      px('#1b1f2b', Math.round(bx + Math.cos(u) * rr * 3), Math.round(by + Math.sin(u) * rr * ww));
    }
  } else if (id === 'subway') {
    noise(0, 0, 96, 54, '#f4f6f8', '#eaeef2', 0.25);
    for (let i = 0; i < 96; i += 8) px('#dde3e9', i, 0, 1, 54);
    for (let j = 0; j < 54; j += 8) px('#dde3e9', 0, j, 96, 1);
    const lines: [string, number[][]][] = [
      ['#e05a33', [[6, 8], [30, 8], [44, 22], [44, 46]]],
      ['#2e9e6b', [[6, 30], [28, 30], [44, 22], [70, 22], [90, 42]]],
      ['#1f5fa6', [[60, 6], [60, 22], [60, 38], [86, 38]]],
    ];
    for (const [col, L] of lines) {
      for (let j = 0; j < L.length - 1; j++) {
        const a = L[j], b = L[j + 1], n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
        for (let s = 0; s <= n; s++) px(col, Math.round(a[0] + ((b[0] - a[0]) * s) / n), Math.round(a[1] + ((b[1] - a[1]) * s) / n), 2, 2);
      }
    }
    for (const [sx, sy] of [[6, 8], [30, 8], [44, 22], [44, 46], [6, 30], [28, 30], [70, 22], [90, 42], [60, 6], [60, 38], [86, 38], [60, 22]]) {
      px('#1c1c1c', sx - 1, sy - 1, 4, 4); px('#ffffff', sx, sy, 2, 2);
    }
  } else if (id === 'braess') {
    noise(0, 0, 96, 54, '#82c063', '#73b356', 0.3);
    px('#8a929b', 0, 10, 96, 5); px('#8a929b', 0, 40, 96, 5); px('#8a929b', 12, 0, 5, 54); px('#8a929b', 78, 0, 5, 54);
    for (let i = 0; i < 96; i += 4) { px('#e9eef2', i, 12, 2, 1); px('#e9eef2', i, 42, 2, 1); }
    for (let i = 0; i < 26; i++) { if (i % 3 === 2) continue; px('#f5c400', Math.round(17 + i * 2.35), Math.round(15 + i * 0.97), 2, 2); }
    const cars = ['#f5c400', '#e05a33', '#ffffff', '#1f5fa6'];
    for (let i = 0; i < 10; i++) px(cars[i % 4], 4 + i * 9, i % 2 ? 11 : 13, 3, 2);
    for (let i = 0; i < 5; i++) px(cars[(i + 1) % 4], 13 + (i % 2) * 2, 18 + i * 6, 2, 3);
    for (let i = 0; i < 3; i++) px(cars[(i + 2) % 4], 30 + i * 20, 41, 3, 2);
  } else {
    noise(0, 0, 96, 54, '#c9d1d9', '#bcc5ce', 0.3);
    const blues = ['#2f6fb8', '#3b80c6', '#4f93d4', '#69a8df'];
    for (let y = 0; y < 54; y++) for (let xx = 34; xx < 60; xx++) px(blues[Math.floor(rnd() * blues.length)], xx, y);
    for (let i = 0; i < 34; i += 4) { const h = 6 + Math.floor(rnd() * 14); px('#8b96a1', i, 54 - h, 3, h); }
    for (let i = 62; i < 96; i += 4) { const h = 4 + Math.floor(rnd() * 10); px('#8b96a1', i, 54 - h, 3, h); }
    for (const y of [8, 20, 32, 44]) { px('#4b535c', 30, y, 34, 2); px('#e9e4d6', 39, y - 4, 2, 6); px('#e9e4d6', 53, y - 4, 2, 6); }
    px('#f5c400', 31, 7, 2, 2); px('#f5c400', 61, 21, 2, 2); px('#f5c400', 31, 31, 2, 2);
  }
}

const hero = document.getElementById('hero') as HTMLCanvasElement | null;
if (hero) startHero(hero);
for (const c of document.querySelectorAll<HTMLCanvasElement>('canvas[data-thumb]')) drawThumb(c.dataset.thumb!, c);
