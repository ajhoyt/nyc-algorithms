// Static painting per season: mosaic sky, far skyline (Plaza Hotel, One Times Square, Empire State
// Building), near skyline, tree line, lake banks, dock, lamps, and Bow Bridge. Each season is painted
// once into layers; a darkened "night" copy gets lit windows and baked lamp glows.

import { birdSprites } from '../render/sprites';
import { glowSprite } from '../render/glow';
import { cloud, mosaicSky } from '../../../shared/pixel';
import { DX, H, LX0, LX1, W, makeCanvas, rng, type DayLayers, type SceneLayers, type Season, type World } from '../world';
import { buildCanopy } from './foliage';
import { lakeMask } from './lake';
import { makeFlakes } from './flakes';
import { windFactor } from '../sim/wind';

export interface SeasonCfg {
  sky: string[];
  tree: string[] | null;
  grass: [string, string];
  bare: boolean;
  snow: boolean;
}

export const SEASONS: Record<Season, SeasonCfg> = {
  spring: { sky: ['#3477c0', '#4085c9', '#5296d4', '#6aa9df', '#86bce8', '#a6d0f0', '#c4e1f6'], tree: ['#9ad66f', '#7cc25c', '#68ad4f'], grass: ['#8fd06a', '#7cc15c'], bare: false, snow: false },
  summer: { sky: ['#1f5fae', '#2a6dbb', '#387fc8', '#4f93d4', '#69a8df', '#86bce8', '#a6d0f0'], tree: ['#56a24a', '#43893c', '#356f31'], grass: ['#6fb04f', '#619f45'], bare: false, snow: false },
  fall: { sky: ['#3b7cbf', '#4a8ac8', '#5d9bd2', '#76addc', '#91c0e5', '#acd2ee', '#c7e2f5'], tree: ['#f2c230', '#e3842f', '#c8512b'], grass: ['#a9b55c', '#96a24d'], bare: false, snow: false },
  winter: { sky: ['#7392b0', '#8099b8', '#90a7c2', '#a1b5cd', '#b3c4d7', '#c4d2e0', '#d5dfea'], tree: null, grass: ['#f4f7fa', '#e3e9ef'], bare: true, snow: true },
};

export const LAMPS = [40, 110, 226, 296];
/** Bow Bridge span. */
export const BX0 = 54;
export const BX1 = 266;

type Ctx = CanvasRenderingContext2D;
const rect = (x: Ctx, x0: number, y0: number, w: number, h: number, col: string) => { x.fillStyle = col; x.fillRect(x0, y0, w, h); };

function paintESB(x: Ctx, S: SeasonCfg, wins: [number, number][]) {
  const tiers = [[217, 110, 27, 14], [220, 100, 21, 10], [222, 52, 17, 48], [224, 46, 13, 6], [225, 42, 11, 4], [226, 38, 9, 4], [227, 32, 7, 6], [228, 27, 5, 5], [229, 22, 3, 5]];
  tiers.forEach((T, i) => {
    for (let xx = T[0]; xx < T[0] + T[2]; xx++) {
      const edge = xx >= T[0] + T[2] - 3;
      rect(x, xx, T[1], 1, T[3], edge ? '#9aa5b1' : i === 2 && (xx - T[0]) % 2 === 1 ? '#b3bcc6' : '#cfd6dd');
    }
    if (S.snow && i < 6) rect(x, T[0], T[1], T[2], 1, '#ffffff');
  });
  rect(x, 230, 8, 1, 14, '#8a949e');
  rect(x, 229, 20, 3, 2, '#9aa5b1');
  const rnd = rng(5);
  for (let yy = 54; yy < 122; yy += 3) {
    for (let wx = 218; wx < 242; wx += 2) {
      const inside = (yy >= 110 && wx >= 218 && wx < 241) || (yy >= 100 && yy < 110 && wx >= 221 && wx < 238) || (yy < 100 && wx >= 223 && wx < 236);
      if (!inside) continue;
      if (rnd() < 0.45) rect(x, wx, yy, 1, 1, '#e6edf3');
      else wins.push([wx, yy]);
    }
  }
}

/** The Plaza Hotel, far left. */
function paintPlaza(x: Ctx, S: SeasonCfg, wins: [number, number][]) {
  const cream = '#d6d1c6', shade = '#b7b1a5', roof = '#86a89c', roofD = '#6c9084';
  rect(x, 14, 92, 46, 32, cream); rect(x, 57, 92, 3, 32, shade); rect(x, 14, 118, 46, 6, '#c4beb2');
  rect(x, 14, 92, 46, 1, '#c9c3b6');
  for (let r = 0; r < 9; r++) { const inset = Math.floor(r / 2); rect(x, 15 + inset, 83 + r, 44 - inset * 2, 1, r % 3 === 1 ? roofD : roof); }
  for (let dx = 19; dx < 56; dx += 4) rect(x, dx, 88, 1, 2, cream);
  rect(x, 13, 82, 6, 10, roof); rect(x, 55, 82, 6, 10, roof);
  rect(x, 14, 79, 4, 3, roofD); rect(x, 15, 77, 2, 2, roofD); rect(x, 56, 79, 4, 3, roofD); rect(x, 57, 77, 2, 2, roofD);
  rect(x, 13, 92, 6, 1, shade); rect(x, 55, 92, 6, 1, shade);
  rect(x, 37, 74, 1, 9, '#5a5048'); rect(x, 38, 74, 3, 2, '#c42a2a');
  if (S.snow) { rect(x, 16, 82, 42, 1, '#ffffff'); rect(x, 13, 81, 6, 1, '#ffffff'); rect(x, 55, 81, 6, 1, '#ffffff'); rect(x, 14, 76, 4, 1, '#ffffff'); rect(x, 56, 76, 4, 1, '#ffffff'); }
  for (let yy = 95; yy < 117; yy += 3) {
    for (let wx = 16; wx < 56; wx += 2) {
      if (Math.abs(wx - 36) < 2 && yy > 110) continue;
      if ((wx * 7 + yy * 3) % 5 < 2) rect(x, wx, yy, 1, 1, '#c3ccd3');
      else wins.push([wx, yy]);
    }
  }
  rect(x, 35, 117, 3, 7, '#8a7a62');
}

/** One Times Square: a slim tower with billboard slots (lit live in holidays.ts). */
function paintTimesSq(x: Ctx, S: SeasonCfg, wins: [number, number][]) {
  rect(x, 146, 78, 11, 46, '#a9b4bf'); rect(x, 154, 78, 3, 46, '#97a3ae'); rect(x, 151, 62, 1, 16, '#8a949e'); rect(x, 150, 76, 3, 2, '#97a3ae');
  if (S.snow) rect(x, 146, 77, 11, 1, '#ffffff');
  for (let i = 0; i < 4; i++) rect(x, 147, 82 + i * 6, 7, 4, '#2a2f38');
  rect(x, 147, 106, 7, 1, '#1c1c1c');
  for (let yy = 107; yy < 122; yy += 3) for (let wx = 147; wx < 155; wx += 2) wins.push([wx, yy]);
}

export function paintScene(season: Season): DayLayers {
  const S = SEASONS[season];
  const rnd = rng(7);
  const wins: [number, number][] = [];
  const winsFar: [number, number][] = [];

  const [sk, skx] = makeCanvas(W, H);
  mosaicSky(skx, W, 134, S.sky, rnd);

  const [far, farx] = makeCanvas(W, H);
  const [bg, bgx] = makeCanvas(W, H);
  const BASE = 124;
  let esbDone = false;
  const layers: [string, number, number, string, string][] = [
    ['#a9b4bf', 22, 46, '#d7e1ea', '#97a3ae'],
    ['#7d8894', 8, 26, '#c9d6e2', '#6c7783'],
  ];
  // Re-seed so the skyline doesn't depend on the sky's random draws.
  const rs = rng(7);
  for (let L = 0; L < 2; L++) {
    const x = L === 0 ? farx : bgx;
    const WL = L === 0 ? winsFar : wins;
    let xx = 0;
    while (xx < W) {
      const bw = 6 + Math.floor(rs() * 14);
      let bh = layers[L][1] + Math.floor(rs() * layers[L][2]);
      if (L === 1 && xx + bw > 12 && xx < 62) bh = Math.min(bh, 10); // keep the Plaza visible
      const top = BASE - bh;
      if (L === 0 && xx + bw > 212 && xx < 248) {
        if (!esbDone) { paintESB(x, S, winsFar); esbDone = true; }
        xx += bw;
        continue;
      }
      rect(x, xx, top, bw, BASE - top, layers[L][0]);
      rect(x, xx + bw - 2, top, 2, BASE - top, layers[L][4]);
      if (S.snow) rect(x, xx, top, bw, 1, '#ffffff');
      if (rs() < 0.15) rect(x, xx + Math.floor(bw / 2), top - 6, 1, 6, layers[L][0]);
      x.fillStyle = layers[L][3];
      for (let wy = top + 3; wy < BASE - 3; wy += 4) {
        for (let wx = xx + 2; wx < xx + bw - 2; wx += 3) {
          if (rs() < 0.4) x.fillRect(wx, wy, 1, 1);
          else if (L === 1 || rs() < 0.5) WL.push([wx, wy]);
        }
      }
      xx += bw + (rs() < 0.3 ? 1 : 0);
    }
    if (L === 0) {
      if (!esbDone) { paintESB(x, S, winsFar); esbDone = true; }
      paintTimesSq(x, S, winsFar);
      paintPlaza(x, S, winsFar);
    }
  }

  const x = bgx;
  // Far lawn strip under the tree line
  for (let y = 124; y < 132; y++) {
    for (let xx = 0; xx < W; xx++) {
      x.fillStyle = S.snow ? (rs() < 0.3 ? '#d5dee6' : '#e6edf2') : season === 'fall' ? (rs() < 0.3 ? '#6f7a3e' : '#7d8846') : rs() < 0.3 ? '#3f7a3a' : '#4a8a42';
      x.fillRect(xx, y, 1, 1);
    }
  }
  const C = buildCanopy();
  x.fillStyle = '#5a4e45';
  for (const t of C.trunks) x.fillRect(t[0], t[1], 1, t[2]);

  // Lake water and banks. Banks near the lake also go into their own layer so they can sit
  // above the lake reflection.
  const water = S.snow ? ['#eef4f8', '#dfe9f1', '#cfdeea'] : ['#5f9fd9', '#4a8bcb', '#3a78b8', '#2f6aa8'];
  const M = lakeMask();
  const [bk, bx] = makeCanvas(W, H);
  const put = (col: string, px: number, py: number, bankToo: boolean) => {
    x.fillStyle = col; x.fillRect(px, py, 1, 1);
    if (bankToo) { bx.fillStyle = col; bx.fillRect(px, py, 1, 1); }
  };
  for (let y = 132; y < 161; y++) {
    for (let xx = 0; xx < W; xx++) {
      if (M.water(xx, y)) {
        const wv = ((y - 132) / 28) * (water.length - 1) + (rs() - 0.5) * 1.2;
        put(water[Math.max(0, Math.min(water.length - 1, Math.round(wv)))], xx, y, false);
        continue;
      }
      const edge = M.water(xx - 1, y) || M.water(xx + 1, y) || M.water(xx, y - 1) || M.water(xx, y + 1);
      const near2 = !edge && (M.water(xx - 2, y) || M.water(xx + 2, y) || M.water(xx, y + 2));
      let col: string;
      if (edge) col = S.snow ? (rs() < 0.5 ? '#f4f7fa' : '#c9d3dc') : rs() < 0.45 ? '#8f969c' : rs() < 0.5 ? '#a7adb2' : '#b9ae94';
      else if (near2 && rs() < 0.35) col = S.snow ? '#e3e9ef' : rs() < 0.5 ? '#9a9f94' : '#b9ae94';
      else col = rs() < 0.3 ? S.grass[1] : S.grass[0];
      const inBank = xx >= LX0 - 4 && xx <= LX1 + 4;
      put(col, xx, y, inBank);
      if (edge && !S.snow && !S.bare && rs() < 0.12 && y > 136) {
        put(rs() < 0.5 ? '#3f7a3a' : '#5a8f3e', xx, y - 1, inBank);
        if (rs() < 0.5) put('#6b8f3e', xx, y - 2, inBank);
      }
    }
  }
  if (S.snow) {
    // Cracks in the ice
    x.fillStyle = '#b5c7d8';
    for (let i = 0; i < 12; i++) {
      const kx = LX0 + 18 + Math.floor(rs() * (LX1 - LX0 - 40)), ky = 136 + Math.floor(rs() * 20);
      for (let kk = 0; kk < 5; kk++) if (M.water(kx + kk, ky + (kk % 2))) x.fillRect(kx + kk, ky + (kk % 2), 1, 1);
    }
  }
  // Near lawn and path
  for (let y = 160; y < H; y++) for (let xx = 0; xx < W; xx++) { x.fillStyle = rs() < 0.3 ? S.grass[1] : S.grass[0]; x.fillRect(xx, y, 1, 1); }
  const pathA = S.snow ? '#e8edf2' : '#d9d1c0', pathB = S.snow ? '#d3dbe3' : '#c3b9a5';
  for (let y = 166; y < 173; y++) for (let xx = 0; xx < W; xx++) { x.fillStyle = rs() < 0.25 ? pathB : pathA; x.fillRect(xx, y, 1, 1); }
  if (season === 'fall' && S.tree) for (let i = 0; i < 60; i++) { x.fillStyle = S.tree[Math.floor(rs() * 3)]; x.fillRect(Math.floor(rs() * W), 161 + Math.floor(rs() * 19), 1, 1); }

  // Dock
  rect(x, DX - 7, 157, 1, 3, '#5a4028'); rect(x, DX + 7, 157, 1, 3, '#5a4028'); rect(x, DX, 157, 1, 3, '#5a4028');
  for (let dpx = DX - 8; dpx <= DX + 8; dpx++) rect(x, dpx, 155, 1, 2, dpx % 3 === 0 ? '#7a5a38' : '#8a6a44');
  for (let dpy = 157; dpy < 166; dpy++) rect(x, DX - 1, dpy, 3, 1, dpy % 2 ? '#8a6a44' : '#7a5a38');
  if (S.snow) rect(x, DX - 8, 154, 17, 1, '#ffffff');
  bx.drawImage(bg, DX - 9, 153, 19, 13, DX - 9, 153, 19, 13);

  // Lamps
  for (const l of LAMPS) {
    rect(x, l, 160, 1, 7, '#2f353c');
    rect(x, l - 1, 158, 3, 2, '#e9eef2');
    if (S.snow) rect(x, l - 1, 157, 3, 1, '#ffffff');
  }

  // Bow Bridge (foreground layer)
  const [fc, fx] = makeCanvas(W, H);
  const arc = (px: number) => Math.sin((Math.PI * (px - BX0)) / (BX1 - BX0));
  for (let xx = BX0; xx <= BX1; xx++) {
    const dk = Math.round(142 - 8 * arc(xx));
    rect(fx, xx, dk, 1, 2, '#e9e4d6');
    rect(fx, xx, dk + 2, 1, 1, '#c9c3b3');
    rect(fx, xx, dk - 3, 1, 1, S.snow ? '#ffffff' : '#f6f2e8');
    if (xx % 3 === 0) rect(fx, xx, dk - 2, 1, 2, '#d8d2c2');
    const under = Math.round(151 - 13 * arc(xx));
    if (under > dk + 2 && xx > LX0 - 2 && xx < LX1 + 2) rect(fx, xx, under, 1, 1, '#d8d2c2');
  }
  rect(fx, BX0 - 4, 140, 7, 10, '#b9b4a6'); rect(fx, BX1 - 2, 140, 7, 10, '#b9b4a6');
  rect(fx, BX0 - 4, 140, 1, 10, '#9b968a'); rect(fx, BX1 + 4, 140, 1, 10, '#9b968a');
  rect(fx, BX0 - 5, 138, 9, 2, '#d8d2c2'); rect(fx, BX1 - 3, 138, 9, 2, '#d8d2c2');

  return { sky: sk, far, bg, fg: fc, banks: bk, wins, winsFar };
}

/** Night colour transform: crush red/green, keep some blue. */
export function darkenCanvas(src: HTMLCanvasElement): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const [c, x] = makeCanvas(src.width, src.height);
  x.drawImage(src, 0, 0);
  const img = x.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    d[i] = d[i] * 0.42;
    d[i + 1] = d[i + 1] * 0.5;
    d[i + 2] = Math.min(255, d[i + 2] * 0.72 + 8);
  }
  x.putImageData(img, 0, 0);
  return [c, x];
}

export function nightify(day: DayLayers): SceneLayers {
  const rnd = rng(31);
  const [skC, skX] = darkenCanvas(day.sky);
  const [farC, farX] = darkenCanvas(day.far);
  const [bgC, bgX] = darkenCanvas(day.bg);
  const [fgC] = darkenCanvas(day.fg);
  const [bkC] = darkenCanvas(day.banks);

  // Stars where the sky is still clearly blue
  const d = skX.getImageData(0, 0, W, H).data;
  for (let y = 0; y < 110; y++) {
    for (let xx = 0; xx < W; xx++) {
      const i = (y * W + xx) * 4;
      if (d[i + 2] > d[i] * 2.2 && d[i + 2] > 110 && rnd() < 0.012) {
        skX.fillStyle = rnd() < 0.3 ? '#fff3c4' : '#c9d6f2';
        skX.fillRect(xx, y, 1, 1);
      }
    }
  }
  // Moon
  const mx = 108, my = 16;
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      if (dx * dx + dy * dy > 25) continue;
      const crater = (dx === 1 && dy === -1) || (dx === -2 && dy === 2) || (dx === 2 && dy === 1);
      skX.fillStyle = crater ? '#d6d0bd' : '#f4f1e4';
      skX.fillRect(mx + dx, my + dy, 1, 1);
    }
  }
  const lightUp = (cx: CanvasRenderingContext2D, list: [number, number][]) => {
    const lit: [number, number, string][] = [];
    for (const p of list) if (rnd() < 0.55) lit.push([p[0], p[1], rnd() < 0.8 ? '#ffd27a' : '#fff1c2']);
    cx.globalAlpha = 0.28;
    for (const l of lit) cx.drawImage(glowSprite(2, '#ffcf70'), l[0] - 2, l[1] - 2);
    cx.globalAlpha = 1;
    for (const l of lit) { cx.fillStyle = l[2]; cx.fillRect(l[0], l[1], 1, 1); }
  };
  lightUp(farX, day.winsFar);
  lightUp(bgX, day.wins);
  for (const l of LAMPS) {
    bgX.globalAlpha = 0.5; bgX.drawImage(glowSprite(10, '#ffe08c'), l - 10, 159 - 10);
    bgX.globalAlpha = 0.35; bgX.drawImage(glowSprite(6, '#ffe08c'), l - 6, 169 - 6);
    bgX.globalAlpha = 1;
    bgX.fillStyle = '#fff2b0'; bgX.fillRect(l - 1, 158, 3, 2);
  }
  return { sky: skC, far: farC, bg: bgC, fg: fgC, banks: bkC };
}

/** Six cloud depths; nearer clouds are bigger, faster and more opaque. */
export function makeCloudSprites(w: World) {
  const rnd = rng(3);
  const defs = [[0.2, 20, 40], [0.3, 40, 150], [0.45, 30, 250], [0.65, 52, 90], [0.8, 34, 205], [1.0, 58, 300]];
  w.cloudSprites = defs.map(([dp, cy, cxw]) => {
    const sz = 5 + dp * 11, cw = Math.ceil(sz * 5.2) + 6, ch = Math.ceil(sz * 2.4) + 6;
    const [c, x] = makeCanvas(cw, ch);
    cloud(x, cw / 2, sz * 1.5 + 2, sz, rnd);
    return { day: c, night: darkenCanvas(c)[0], x: cxw - cw / 2, y: cy - sz * 1.5 - 2, v: 0.025 + dp * 0.14, a: 0.5 + dp * 0.5 };
  });
}

/** Builds (and caches) the painted layers and bird sprites for the calendar's season. */
export function ensureScene(w: World) {
  const season = w.calSeason;
  const key = season + '/' + w.species;
  if (w.sceneKey === key) return false;
  if (!w.days[season]) {
    const day = paintScene(season);
    w.days[season] = day;
    w.nights[season] = nightify(day);
  }
  if (!w.sprCache[key]) w.sprCache[key] = birdSprites(w.species, season);
  if (w.season && w.season !== season) { w.prevSeason = w.season; w.seasonFade = 0; }
  else if (!w.season) w.seasonFade = 1;
  w.season = season;
  w.sceneKey = key;
  w.sprites = w.sprCache[key];
  if (!w.cloudSprites) makeCloudSprites(w);
  makeFlakes(w, season);
  return true;
}

/** Draws one painted layer, cross-fading seasons and blending in the night copy. */
export function drawLayer(w: World, name: keyof SceneLayers) {
  const ctx = w.ctx, n = w.nightAmt;
  const one = (season: Season, alpha: number) => {
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha; ctx.drawImage(w.days[season]![name], 0, 0);
    if (n > 0.001) { ctx.globalAlpha = alpha * n; ctx.drawImage(w.nights[season]![name], 0, 0); }
  };
  if (w.prevSeason && w.seasonFade < 1) { one(w.prevSeason, 1); one(w.season!, w.seasonFade); }
  else one(w.season!, 1);
  ctx.globalAlpha = 1;
}

/** Sunset/sunrise warm tint, strongest halfway through the day–night fade. */
export function tint(w: World, strength: number, h: number) {
  const d = Math.sin(Math.PI * w.nightAmt);
  if (d <= 0.01) return;
  w.ctx.fillStyle = `rgba(255, 128, 72, ${(strength * d).toFixed(3)})`;
  w.ctx.fillRect(0, 0, W, h);
}

export function drawClouds(w: World) {
  const ctx = w.ctx, nA = w.nightAmt, k60 = w.frameDt / 16.67;
  // Clouds ride the wind; nearer (faster) clouds show parallax.
  const wf = windFactor(w);
  for (const cl of w.cloudSprites ?? []) {
    cl.x += cl.v * wf * k60;
    if (cl.x > W + 4) cl.x = -cl.day.width - 4;
    else if (cl.x < -cl.day.width - 4) cl.x = W + 4;
    ctx.globalAlpha = cl.a; ctx.drawImage(cl.day, cl.x, cl.y);
    if (nA > 0.001) { ctx.globalAlpha = cl.a * nA; ctx.drawImage(cl.night, cl.x, cl.y); }
  }
  ctx.globalAlpha = 1;
}
