// 3×5 pixel font and speech bubbles (bird chatter, tour guide).

import { BIRD_CHATTER } from '../copy';
import { W, type World } from '../world';

const GLYPHS: Record<string, string[]> = {
  A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'], C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'], E: ['111', '100', '110', '100', '111'], F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'], H: ['101', '101', '111', '101', '101'], I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '010'], K: ['101', '101', '110', '101', '101'], L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'], N: ['110', '101', '101', '101', '101'], O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'], Q: ['010', '101', '101', '110', '011'], R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'], U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'], W: ['101', '101', '111', '111', '101'], X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'], Z: ['111', '001', '010', '100', '111'],
  '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'], '2': ['110', '001', '010', '100', '111'],
  '3': ['110', '001', '010', '001', '110'], '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '110', '001', '110'],
  '6': ['011', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'], '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '110'],
  '!': ['010', '010', '010', '000', '010'], '?': ['110', '001', '010', '000', '010'], '.': ['000', '000', '000', '000', '010'],
  ',': ['000', '000', '000', '010', '100'], "'": ['010', '010', '000', '000', '000'], '-': ['000', '000', '111', '000', '000'],
  ':': ['000', '010', '000', '010', '000'], '&': ['010', '101', '010', '101', '011'], '[': ['110', '100', '100', '100', '110'],
  ']': ['011', '001', '001', '001', '011'], '/': ['001', '001', '010', '100', '100'],
};

/** Upper-cases and word-wraps text to at most `max` characters per line. */
export function wrap(text: string, max: number): string[] {
  const words = text.toUpperCase().replace(/[‘’]/g, "'").split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    if (!word) continue;
    if (!cur) cur = word;
    else if ((cur + ' ' + word).length <= max) cur += ' ' + word;
    else { lines.push(cur); cur = word; }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Draws a bubble whose tail points at (ax, ay). */
export function drawBubbleAt(w: World, ax: number, ay: number, L: string[]) {
  const ctx = w.ctx;
  let max = 0;
  for (const line of L) max = Math.max(max, line.length);
  const bw = max * 4 - 1 + 6;
  const bh = L.length * 6 - 1 + 6;
  const bx = Math.round(Math.max(2, Math.min(W - bw - 2, ax - bw / 2)));
  let by = Math.round(ay - 3 - bh);
  if (by < 2) by = 2;
  const tx = Math.round(Math.max(bx + 2, Math.min(bx + bw - 3, ax)));
  ctx.fillStyle = '#1c1c1c'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, bw, bh);
  if (by + bh + 2 < ay) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(tx, by + bh, 1, 1);
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(tx - 1, by + bh, 1, 1); ctx.fillRect(tx + 1, by + bh, 1, 1); ctx.fillRect(tx, by + bh + 1, 1, 1);
  }
  ctx.fillStyle = '#1c1c1c';
  for (let i = 0; i < L.length; i++) {
    for (let c = 0; c < L[i].length; c++) {
      const g = GLYPHS[L[i][c]];
      if (!g) continue;
      for (let r = 0; r < 5; r++) for (let q = 0; q < 3; q++) if (g[r][q] === '1') ctx.fillRect(bx + 3 + c * 4 + q, by + 3 + i * 6 + r, 1, 1);
    }
  }
}

/** Every so often a random bird near the middle says a line from BIRD_CHATTER. */
export function updateBubble(w: World) {
  const B = w.birds;
  const t = w.t;
  let bb = w.bub;
  if (bb && B.indexOf(bb.b) < 0) { w.bub = null; w.bubShow = false; bb = null; }
  if (bb && t < bb.until) return;
  if (w.bubShow) { w.bubShow = false; w.nextBub = t + 6000 + Math.random() * 7000; }
  if (!w.nextBub) w.nextBub = t + 3000;
  if (t < w.nextBub) return;
  const lines = BIRD_CHATTER.map((s) => s.trim()).filter(Boolean);
  if (!lines.length || !B.length) return;
  const cand = B.filter((b) => b.x > 30 && b.x < 290 && b.y > 30);
  if (!cand.length) return;
  const key = lines.join('\n');
  if (!w.bag.length || w.bagKey !== key) {
    w.bagKey = key;
    w.bag = lines.slice();
    for (let k = w.bag.length - 1; k > 0; k--) {
      const r = Math.floor(Math.random() * (k + 1));
      [w.bag[k], w.bag[r]] = [w.bag[r], w.bag[k]];
    }
    if (w.bag.length > 1 && w.bag[w.bag.length - 1] === w.lastLine) w.bag.unshift(w.bag.pop()!);
  }
  const txt = w.bag.pop()!;
  w.lastLine = txt;
  w.bub = { b: cand[Math.floor(Math.random() * cand.length)], lines: wrap(txt, 18), until: t + 2600 };
  w.bubShow = true;
}
