// People crossing Bow Bridge; some pause at the top. Couples are common on Valentine's.

import { coupleChance, crowd, ev } from '../scene/calendar';
import { BX0, BX1 } from '../scene/paint';
import type { World } from '../world';
import { lookFor } from './crowd';
import { drawPerson } from './draw';

/** Feet y on the bridge deck at x. */
export function bridgeFeet(x: number): number {
  if (x < BX0 || x > BX1) return 139;
  return Math.round(142 - 8 * Math.sin((Math.PI * (x - BX0)) / (BX1 - BX0))) - 1;
}

export function stepBridge(w: World) {
  const B = w.bridgers;
  const target = Math.max(1, Math.round(crowd(w) / 2.5));
  if (B.length < target && Math.random() < 0.003) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    const couple = Math.random() < Math.max(0.15, coupleChance(w));
    B.push({ x: dir > 0 ? BX0 - 6 : BX1 + 6, dir, v: 0.15 + Math.random() * 0.07, ph: Math.random() * 4, look: lookFor(w, false), partner: couple ? lookFor(w, false) : null, pause: 0 });
  }
  for (let i = B.length - 1; i >= 0; i--) {
    const b = B[i];
    if (b.pause > 0) {
      b.pause--;
      // Couples pausing at the top on Valentine's, or kissing at midnight, make hearts.
      if (b.partner && (b.kiss || ev(w).id === 'valentines') && b.pause % 30 === 0) {
        w.fx.push({ type: 'heart', x: b.x + 1 - 2 * b.dir, y: bridgeFeet(Math.round(b.x) + 1) - 9, life: 80 });
      }
      if (b.pause === 0) b.kiss = false;
      continue;
    }
    b.x += b.v * b.dir; b.ph += b.v * 0.6;
    const lingerChance = b.partner && ev(w).id === 'valentines' ? 0.95 : 0.5;
    if (Math.abs(b.x - 160) < 0.2 && Math.random() < lingerChance) b.pause = 180 + Math.random() * 200;
    if (b.x < BX0 - 8 || b.x > BX1 + 8) B.splice(i, 1);
  }
}

/** People step onto the bridge from behind its stone end posts; off the span they're out of view. */
const onSpan = (x: number) => x >= BX0 - 1 && x <= BX1 - 2;

export function drawBridgers(w: World) {
  for (const b of w.bridgers) {
    const x = Math.round(b.x), fr = b.pause > 0 ? 0 : Math.floor(b.ph) % 2;
    if (!onSpan(x)) continue;
    drawPerson(w, x, bridgeFeet(x + 1) - 5, b.look, fr, false);
    if (b.partner) {
      const px = x - (b.kiss ? 3 : 4) * b.dir;
      if (!onSpan(px)) continue;
      drawPerson(w, px, bridgeFeet(px + 1) - 5, b.partner, b.pause > 0 ? 0 : 1 - fr, false);
    }
  }
}
