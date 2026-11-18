// Soft radial glows, cached per colour and radius. Glows only appear with darkness.

import { makeCanvas, type World } from '../world';

const cache: Record<string, HTMLCanvasElement> = {};

export function glowSprite(R: number, color: string): HTMLCanvasElement {
  const key = color + R;
  let g = cache[key];
  if (!g) {
    const [c, x] = makeCanvas(R * 2 + 1, R * 2 + 1);
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy) / R;
        if (d >= 1) continue;
        x.globalAlpha = Math.pow(1 - d, 2.2);
        x.fillStyle = color;
        x.fillRect(dx + R, dy + R, 1, 1);
      }
    }
    g = cache[key] = c;
  }
  return g;
}

export function glow(w: World, cx: number, cy: number, R: number, color: string, a: number) {
  if (a <= 0.003) return;
  const ctx = w.ctx;
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = Math.min(1, a);
  ctx.drawImage(glowSprite(R, color), Math.round(cx - R), Math.round(cy - R));
  ctx.globalAlpha = prev;
}
