// Per-pixel tree canopy that changes continuously through the year. Every canopy pixel has its own
// thresholds: leaves bud in spring (cherries bloom pink first), deepen into summer, turn and drop one
// by one in fall, and stay bare (with snow on top) in winter.

import { W, H, makeCanvas, rng, type World } from '../world';
import { seasonProgress } from './calendar';

interface LeafPx {
  x: number; y: number;
  /** 0 = lit, 1–2 = shaded. */
  shade: 0 | 1 | 2;
  branch: boolean;
  /** Fall: turn colour after r1, drop after r2. */
  r1: number; r2: number;
  /** Spring: bud after rb. */
  rb: number;
  cherry: boolean;
  /** Per-pixel random hue/order. */
  h: number;
  /** Christmas light position. */
  light: boolean;
  /** Last leaf colour (to spawn a falling leaf when it drops). */
  was?: string | null;
}

export interface Canopy { px: LeafPx[]; trunks: [number, number, number][]; lights: [number, number][] }

let canopy: Canopy | null = null;

export function buildCanopy(): Canopy {
  if (canopy) return canopy;
  const rp = rng(99);
  const px: LeafPx[] = [];
  const trunks: [number, number, number][] = [];
  let ti = 0;
  const add = (cx: number, cy: number, r: number, ymax: number, cherry: boolean) => {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r || cy + dy >= ymax) continue;
        const r1 = rp() * 0.6;
        px.push({
          x: cx + dx, y: cy + dy,
          shade: dx + dy < -r * 0.5 ? 0 : rp() < 0.25 ? 1 : 2,
          branch: rp() < 0.22, r1, r2: Math.min(0.98, r1 + 0.25 + rp() * 0.4), rb: rp() * 0.45,
          cherry, h: rp(), light: rp() < 0.08,
        });
      }
    }
  };
  for (let tx = -4; tx < W + 4; tx += 6) {
    const cx = tx + Math.floor(rp() * 3), cy = 121 + Math.floor(rp() * 5), r = 5 + Math.floor(rp() * 4);
    trunks.push([cx, cy, 132 - cy]);
    add(cx, cy, r, 132, ti % 3 === 0);
    ti++;
  }
  const bush = [[8, 140, 6], [26, 147, 5], [292, 146, 6], [312, 138, 5]];
  bush.forEach((b, i) => { trunks.push([b[0], b[1], 160 - b[1]]); add(b[0], b[1], b[2], 160, i % 2 === 0); });
  const lights: [number, number][] = px.filter((p) => p.light).map((p) => [p.x, p.y]);
  canopy = { px, trunks, lights };
  return canopy;
}

const SUM = ['#56a24a', '#43893c', '#356f31'];
const SPR = ['#9ad66f', '#7cc25c', '#68ad4f'];
const FALL = ['#f2c230', '#e3842f', '#c8512b', '#b8432a'];
const BRANCH = '#6b5d52';

/** Colour of one canopy pixel at season progress sp (0..1), or null if empty. */
function leafColor(p: LeafPx, season: World['season'], sp: number): string | null {
  if (season === 'summer') return SUM[p.shade];
  if (season === 'fall') {
    if (sp < p.r1 * 0.85) return SUM[p.shade];
    if (sp < p.r2) return FALL[Math.floor(p.h * 4)];
    return p.branch ? BRANCH : null;
  }
  if (season === 'winter') return p.branch ? (p.shade === 0 && p.h < 0.5 ? '#ffffff' : BRANCH) : null;
  // spring
  if (sp < p.rb) return p.branch ? BRANCH : sp > p.rb - 0.08 && p.h < 0.3 ? '#b8de8a' : null;
  if (p.cherry && sp < p.rb + 0.4) return p.h < 0.35 ? '#ffffff' : p.h < 0.7 ? '#f4b6c8' : '#f8d3de';
  return p.h < (sp - 0.6) * 2.5 ? SUM[p.shade] : SPR[p.shade];
}

let foliD: HTMLCanvasElement | null = null;
let foliN: HTMLCanvasElement | null = null;
let foliT = -Infinity;
const nightCache: Record<string, string> = {};
const nightOf = (hex: string) => {
  const hit = nightCache[hex];
  if (hit) return hit;
  const v = parseInt(hex.slice(1), 16);
  return (nightCache[hex] = `rgb(${Math.round(((v >> 16) & 255) * 0.42)},${Math.round(((v >> 8) & 255) * 0.5)},${Math.min(255, Math.round((v & 255) * 0.72 + 8))})`);
};

/** Repaints the canopy at most 4×/s; dropping fall leaves become falling-leaf flakes. */
export function renderFoliage(w: World, force = false) {
  if (!foliD || !foliN) { foliD = makeCanvas(W, H)[0]; foliN = makeCanvas(W, H)[0]; }
  if (!force && w.t - foliT < 250) return;
  foliT = w.t;
  const C = buildCanopy(), season = w.season ?? 'winter', sp = seasonProgress(w);
  const xd = foliD.getContext('2d')!, xn = foliN.getContext('2d')!;
  xd.clearRect(0, 0, W, H);
  xn.clearRect(0, 0, W, H);
  let drops = 0;
  for (const p of C.px) {
    const col = leafColor(p, season, sp);
    if (season === 'fall' && p.was && !col && drops < 6 && Math.random() < 0.5) {
      w.flakes.push({ tree: true, x: p.x, y: p.y, v: 0.05 + Math.random() * 0.06, vx: 0.05 + Math.random() * 0.12, ph: Math.random() * 6, c: p.was, wait: 0, dying: true });
      drops++;
    }
    p.was = col && col !== BRANCH && col !== '#ffffff' ? col : null;
    if (!col) continue;
    xd.fillStyle = col; xd.fillRect(p.x, p.y, 1, 1);
    xn.fillStyle = nightOf(col); xn.fillRect(p.x, p.y, 1, 1);
  }
}

export function drawFoliage(w: World) {
  renderFoliage(w);
  w.ctx.drawImage(foliD!, 0, 0);
  if (w.nightAmt > 0.001) {
    w.ctx.globalAlpha = w.nightAmt;
    w.ctx.drawImage(foliN!, 0, 0);
    w.ctx.globalAlpha = 1;
  }
}
