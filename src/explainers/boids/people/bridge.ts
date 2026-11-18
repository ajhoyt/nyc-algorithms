// People crossing Bow Bridge; some pause at the top. Couples are common on Valentine's.

import { crowd, ev, isNight } from '../scene/calendar';
import { BX0, BX1 } from '../scene/paint';
import { W, type World } from '../world';
import { lookFor } from './crowd';
import { drawPerson } from './draw';

/** Feet y on the bridge deck at x. */
export function bridgeFeet(x: number): number {
  if (x < BX0 || x > BX1) return 139;
  return Math.round(142 - 8 * Math.sin((Math.PI * (x - BX0)) / (BX1 - BX0))) - 1;
}

export function stepBridge(w: World) {
  const B = w.bridgers;
  const target = isNight(w) ? 1 : Math.max(1, Math.round(crowd(w) / 2.5));
  if (B.length < target && Math.random() < 0.003) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    const couple = Math.random() < (ev(w).id === 'valentines' ? 0.6 : 0.15);
    B.push({ x: dir > 0 ? -6 : W + 6, dir, v: 0.15 + Math.random() * 0.07, ph: Math.random() * 4, look: lookFor(w, false), partner: couple ? lookFor(w, false) : null, pause: 0 });
  }
  for (let i = B.length - 1; i >= 0; i--) {
    const b = B[i];
    if (b.pause > 0) { b.pause--; continue; }
    b.x += b.v * b.dir; b.ph += b.v * 0.6;
    if (Math.abs(b.x - 160) < 0.2 && Math.random() < 0.5) b.pause = 180 + Math.random() * 200;
    if (b.x < -8 || b.x > W + 8) B.splice(i, 1);
  }
}

export function drawBridgers(w: World) {
  for (const b of w.bridgers) {
    const x = Math.round(b.x), fr = b.pause > 0 ? 0 : Math.floor(b.ph) % 2;
    drawPerson(w, x, bridgeFeet(x + 1) - 5, b.look, fr, false);
    if (b.partner) {
      const px = x - 4 * b.dir;
      drawPerson(w, px, bridgeFeet(px + 1) - 5, b.partner, 1 - fr, false);
    }
  }
}
