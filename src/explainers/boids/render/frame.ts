// Composes one frame, back to front (see STYLE.md "Scene"). Birds are drawn before the lake so the
// reflection picks them up.

import { drawBubbleAt } from './font3x5';
import { spriteIndex } from './sprites';
import { drawBalloons, drawBallDrop, drawESBLights, drawEventProps, drawJackOLanterns, drawParkFx, drawParty, drawSkyFx, drawTimesSq } from '../scene/holidays';
import { drawClouds, drawLayer, tint } from '../scene/paint';
import { drawFoliage } from '../scene/foliage';
import { drawBanks, drawBoats, drawBridgeReflection, drawLake, drawSkatersBehind } from '../scene/lake';
import { drawFlakes } from '../scene/flakes';
import { drawBridgers } from '../people/bridge';
import { drawPeople } from '../people/draw';
import { H, type World } from '../world';

/** "What one bird sees": its neighbourhood radius and dotted lines to every neighbour. */
function drawSight(w: World) {
  const B = w.birds;
  if (!w.sightOn || !B.length) return;
  const ctx = w.ctx, me = B[0], R = w.spec.R;
  ctx.fillStyle = w.nightAmt > 0.5 ? '#ffffff' : '#1c1c1c';
  for (let a = 0; a < Math.PI * 2; a += 0.07) ctx.fillRect(Math.round(me.x + Math.cos(a) * R), Math.round(me.y + Math.sin(a) * R), 1, 1);
  for (let i = 1; i < B.length; i++) {
    const dx = B[i].x - me.x, dy = B[i].y - me.y;
    if (dx * dx + dy * dy >= R * R) continue;
    const n = Math.max(Math.abs(dx), Math.abs(dy));
    for (let s = 0; s <= n; s += 2) ctx.fillRect(Math.round(me.x + (dx * s) / n), Math.round(me.y + (dy * s) / n), 1, 1);
  }
  // Marker above the chosen bird
  ctx.fillRect(Math.round(me.x) - 1, Math.round(me.y) - 11, 3, 1);
  ctx.fillRect(Math.round(me.x), Math.round(me.y) - 10, 1, 2);
}

function drawBirds(w: World) {
  const ctx = w.ctx, { ox, oy } = w.spec;
  for (const b of w.birds) {
    const fr = [0, 1, 2, 1][Math.floor(b.ph) % 4];
    ctx.drawImage(w.sprites[spriteIndex(fr, b.vx, b.vy)], Math.round(b.x) - ox, Math.round(b.y) - oy);
  }
  for (const p of w.puffs) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
}

function drawPredator(w: World) {
  const ctx = w.ctx;
  if (w.mode === 'survive' && w.falcon) {
    const f = w.falcon, ff = Math.floor(f.ph) % 2;
    ctx.drawImage(w.falconSpr[ff * 2 + (f.vx < 0 ? 1 : 0)], Math.round(f.x) - 4, Math.round(f.y) - 2);
  } else if (w.hawk.on) ctx.drawImage(w.hawkSpr, Math.round(w.hawk.x) - 5, Math.round(w.hawk.y) - 3);
}

export function drawFrame(w: World) {
  drawLayer(w, 'sky');
  drawClouds(w);
  drawSkyFx(w);
  tint(w, 0.38, 134);
  drawLayer(w, 'far');
  drawESBLights(w);
  drawParty(w);
  drawTimesSq(w);
  drawBallDrop(w);
  drawLayer(w, 'bg');
  drawFoliage(w);
  drawBalloons(w);
  drawParkFx(w);
  tint(w, 0.12, H);
  drawSight(w);
  drawBirds(w);
  drawPredator(w);
  drawLake(w);
  drawBanks(w);
  drawSkatersBehind(w);
  drawBridgers(w);
  drawLayer(w, 'fg');
  drawBridgeReflection(w);
  drawJackOLanterns(w);
  drawBoats(w);
  drawEventProps(w);
  drawPeople(w);
  drawFlakes(w);
  if (w.bubShow && w.bub) drawBubbleAt(w, w.bub.b.x, w.bub.b.y - 6, w.bub.lines);
  if (w.tourBub && w.tour.state === 'stop') drawBubbleAt(w, w.tour.x + 1, 165, w.tourBub.lines);
}
