// The lake: shape mask, live reflections, frozen winter ice, rowboats, and skaters.

import { addWalkerFromDock, spawnRoleWalker } from '../people/crowd';
import { drawPerson } from '../people/draw';
import { DX, LX0, LX1, SCALE, dim, type Boat, type Look, type Skater, type World } from '../world';
import { crowd, isNight, openHours } from './calendar';

export interface LakeMask {
  rows: Record<number, [number, number]>;
  water(x: number, y: number): boolean;
}

let mask: LakeMask | null = null;

/** Irregular lake outline between y=132 and y=160. */
export function lakeMask(): LakeMask {
  if (mask) return mask;
  const rows: Record<number, [number, number]> = {};
  for (let y = 132; y < 161; y++) {
    const d = Math.pow((y - 132) / 28, 1.4);
    const e0 = Math.round(LX0 + 2 + 8 * d + 2.6 * Math.sin(y * 0.42 + 1.3) + 1.6 * Math.sin(y * 1.1) + (y > 141 && y < 147 ? 4 : 0));
    const e1 = Math.round(LX1 - 2 - 8 * d - 2.4 * Math.sin(y * 0.37 + 0.4) - 1.5 * Math.sin(y * 0.95 + 2) - (y > 149 && y < 155 ? 3 : 0));
    rows[y] = [e0, e1];
  }
  const top = (x: number) => 132 + (x < LX0 + 18 || x > LX1 - 18 ? 1 : 0) + (Math.sin(x * 0.31) > 0.8 ? 1 : 0);
  const bottom = (x: number) => 159 - (Math.sin(x * 0.13 + 0.7) > 0.55 ? 1 : 0) - (Math.sin(x * 0.29) > 0.85 ? 1 : 0);
  mask = {
    rows,
    water(x, y) {
      const r = rows[y];
      return !!r && x >= r[0] && x <= r[1] && y >= top(x) && y <= bottom(x);
    },
  };
  return mask;
}

/**
 * Mirrors rows of the frame itself (everything drawn so far) into the lake, foreshortened by k,
 * with a per-row sine ripple. Works on the backing store, so ripples move in quarter pixels.
 */
function reflect(w: World, axis: number, y0: number, y1: number, xa: number, xb: number, alpha: number, amp: number, k = 1) {
  const { ctx, canvas } = w;
  const t = w.t / 1000;
  const rows = lakeMask().rows;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = alpha;
  for (let y = y0; y < y1; y++) {
    const sy = axis - 1 - Math.floor((y - axis) * k);
    if (sy < 0) continue;
    const depth = y - axis + 1;
    const off = amp ? Math.round(Math.sin(t * 1.7 + y * 0.9) * amp * (0.4 + depth * 0.12) * SCALE) : 0;
    const mr = rows[y];
    let ra = xa, rb = xb;
    if (mr) { ra = Math.max(xa, mr[0]); rb = Math.min(xb, mr[1] + 1); }
    if (rb <= ra) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ra * SCALE, y * SCALE, (rb - ra) * SCALE, SCALE);
    ctx.clip();
    ctx.drawImage(canvas, xa * SCALE, sy * SCALE, (xb - xa) * SCALE, SCALE, xa * SCALE + off, y * SCALE, (xb - xa) * SCALE, SCALE);
    ctx.restore();
  }
  ctx.restore();
}

export function drawLake(w: World) {
  const ctx = w.ctx, frozen = w.season === 'winter', n = w.nightAmt, t = w.t / 1000;
  reflect(w, 132, 132, 160, LX0, LX1, frozen ? 0.22 : 0.6, frozen ? 0 : 1, 3.2);
  ctx.fillStyle = frozen ? 'rgba(220, 232, 242, 0.25)' : `rgba(30, 80, 140, ${(0.22 + 0.1 * n).toFixed(2)})`;
  const MR = lakeMask().rows;
  for (let ly = 132; ly < 160; ly++) { const rr = MR[ly]; ctx.fillRect(rr[0], ly, rr[1] - rr[0] + 1, 1); }
  if (!frozen) {
    // Glints
    ctx.fillStyle = n > 0.5 ? 'rgba(255, 240, 200, 0.6)' : 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 14; i++) {
      const gy = 134 + ((i * 7) % 25), gr = MR[gy];
      const gx = gr[0] + 3 + ((i * 47 + Math.floor(t * (6 + (i % 3) * 2))) % Math.max(1, gr[1] - gr[0] - 6));
      if (Math.sin(t * 3 + i) > 0.3) ctx.fillRect(gx, gy, 2, 1);
    }
  }
}

/** Lake banks drawn over the reflection so the water stays inside its shoreline. */
export function drawBanks(w: World) {
  const ctx = w.ctx, n = w.nightAmt;
  const one = (season: NonNullable<World['season']>, alpha: number) => {
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha; ctx.drawImage(w.days[season]!.banks, 0, 0);
    if (n > 0.001) { ctx.globalAlpha = alpha * n; ctx.drawImage(w.nights[season]!.banks, 0, 0); }
  };
  if (w.prevSeason && w.seasonFade < 1) { one(w.prevSeason, 1); one(w.season!, w.seasonFade); }
  else one(w.season!, 1);
  ctx.globalAlpha = 1;
}

/** Bow Bridge reflects 1:1 around its footings. */
export function drawBridgeReflection(w: World) {
  const frozen = w.season === 'winter';
  reflect(w, 151, 151, 160, LX0 + 6, LX1 - 6, frozen ? 0.18 : 0.45, frozen ? 0 : 0.7);
}

// --- boats ------------------------------------------------------------------

export function stepBoats(w: World) {
  if (!w.boats) {
    w.boats = [
      { slot: DX - 18, state: 'docked', x: DX - 18, y: 157, v: 0.08, ph: 0, a: null, al: 1 },
      { slot: DX + 10, state: 'docked', x: DX + 10, y: 157, v: -0.07, ph: 1, a: null, al: 1 },
      { slot: DX - 30, state: 'docked', x: DX - 30, y: 157, v: 0.06, ph: 2, a: null, al: 1, summer: true },
    ];
  }
  const winter = w.season === 'winter';
  const ok = !winter && openHours(w);
  for (const b of w.boats) {
    const allowed = ok && (!b.summer || w.season === 'summer');
    if (b.state === 'docked') {
      // Boats are pulled out of the water in winter.
      b.al = Math.max(0, Math.min(1, b.al + (winter ? -1 / 120 : 1 / 120)));
      b.x = b.slot; b.y = 157;
      if (allowed && !b.pending && Math.random() < 0.0015) { b.pending = true; spawnRoleWalker(w, { boat: b }); }
    } else if (b.state === 'out') {
      b.ph += 0.06; b.x += b.v; b.y += ((b.ty ?? 151) - b.y) * 0.01; b.timer = (b.timer ?? 0) - 1;
      if (b.x > LX1 - 18 || b.x < LX0 + 10) { b.v = -b.v; b.x += b.v * 2; }
      if ((b.timer ?? 0) <= 0 || !allowed) b.state = 'return';
    } else {
      b.ph += 0.08;
      const dx = b.slot - b.x, dy = 157 - b.y, d = Math.hypot(dx, dy), sp = winter ? 0.3 : 0.12;
      if (d < 0.6) { b.state = 'docked'; b.pending = false; addWalkerFromDock(w, b.a); b.a = null; }
      else { b.x += (dx / d) * sp; b.y += (dy / d) * sp; b.v = dx >= 0 ? Math.abs(b.v) : -Math.abs(b.v); }
    }
  }
}

export function launchBoat(bt: Boat, look: Look) {
  bt.state = 'out';
  bt.a = look;
  bt.timer = 1500 + Math.random() * 2200;
  bt.ty = 145 + Math.random() * 10;
  bt.v = (Math.random() < 0.5 ? 1 : -1) * (0.06 + Math.random() * 0.04);
}

export function drawBoats(w: World) {
  const ctx = w.ctx, n = w.nightAmt;
  const dot = (c: string, x: number, y: number) => { ctx.fillStyle = dim(w, c); ctx.fillRect(x, y, 1, 1); };
  for (const b of w.boats ?? []) {
    if (b.al <= 0) continue;
    const bx = Math.round(b.x), by = Math.round(b.y), oar = b.state === 'docked' ? 0 : Math.floor(b.ph) % 2;
    // Reflection
    ctx.globalAlpha = b.al * 0.35;
    ctx.fillStyle = dim(w, '#6b4424'); ctx.fillRect(bx + 1, by + 3, 5, 1);
    if (b.a) { ctx.fillStyle = dim(w, b.a.top); ctx.fillRect(bx + 2, by + 4, 3, 1); ctx.fillStyle = dim(w, b.a.skin); ctx.fillRect(bx + 3, by + 5, 1, 1); }
    ctx.globalAlpha = b.al;
    for (let k = 0; k < 7; k++) dot('#8a5a30', bx + k, by + 1);
    for (let k = 1; k < 6; k++) dot('#6b4424', bx + k, by + 2);
    if (b.a) {
      dot(b.a.hair, bx + 3, by - 2); dot(b.a.skin, bx + 3, by - 1);
      dot(b.a.top, bx + 2, by); dot(b.a.top, bx + 3, by); dot(b.a.top, bx + 4, by);
      dot('#c9a050', oar ? bx + 1 : bx, by + (oar ? 1 : 2));
      dot('#c9a050', oar ? bx + 5 : bx + 6, by + (oar ? 1 : 2));
      if (n < 0.5 && b.state !== 'docked') { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(bx - (b.v > 0 ? 2 : -8), by + 2, 2, 1); }
    } else dot('#5a4028', bx - 1, by + 1);
    ctx.globalAlpha = 1;
  }
}

// --- skaters ------------------------------------------------------------------

export const skY = (k: Skater) => (k.state === 'skate' ? Math.round(k.cy + Math.sin(k.a) * k.ry) : Math.round(k.gy));
export const skX = (k: Skater) => (k.state === 'skate' ? Math.round(k.cx + Math.cos(k.a) * k.rx) : Math.round(k.gx));

export function addSkater(w: World, look: Look) {
  w.skaters.push({
    state: 'glideIn', gx: DX - 1, gy: 156, cx: 110 + Math.random() * 100, cy: 140 + Math.random() * 12,
    rx: 12 + Math.random() * 22, ry: 3 + Math.random() * 4, a: Math.random() * 6,
    v: (Math.random() < 0.5 ? 1 : -1) * (0.008 + Math.random() * 0.01), look,
    fall: 0, spin: 0, dizzy: 0, cool: 0, timer: 1800 + Math.random() * 2400,
  });
}

export function stepSkaters(w: World) {
  const winter = w.season === 'winter';
  const S = w.skaters;
  const target = winter ? (isNight(w) ? 2 : Math.max(1, Math.min(6, crowd(w) - 1))) : 0;
  const active = S.length + w.walkers.filter((q) => q.role && q.role.skate).length;
  if (active < target && Math.random() < 0.004) spawnRoleWalker(w, { skate: true });
  let skating = S.filter((q) => q.state === 'skate').length;
  for (let i = S.length - 1; i >= 0; i--) {
    const k = S[i];
    if (k.cool > 0) k.cool--;
    if (k.state === 'glideIn' || k.state === 'glideOut') {
      let tx: number, ty: number;
      if (k.state === 'glideIn') { tx = k.cx + Math.cos(k.a) * k.rx; ty = k.cy + Math.sin(k.a) * k.ry; }
      else { tx = DX - 1; ty = 156; }
      const dx = tx - k.gx, dy = ty - k.gy, d = Math.hypot(dx, dy), sp = winter ? 0.35 : 0.6;
      k.ph = (k.ph ?? 0) + 0.15;
      if (d < 0.5) {
        if (k.state === 'glideIn') k.state = 'skate';
        else { S.splice(i, 1); addWalkerFromDock(w, k.look); continue; }
      } else { k.gx += (dx / d) * sp; k.gy += (dy / d) * sp; }
      continue;
    }
    k.timer--;
    if (k.timer <= 0 || !winter || skating > target) {
      k.state = 'glideOut'; k.gx = k.cx + Math.cos(k.a) * k.rx; k.gy = skY(k); skating--;
      continue;
    }
    if (k.fall > 0) { k.fall--; if (k.fall === 0 && k.bonk) { k.dizzy = 150; k.bonk = false; } continue; }
    if (k.spin > 0) { k.spin--; continue; }
    if (k.dizzy > 0) { k.dizzy--; k.a += k.v * 0.4; continue; }
    k.a += k.v;
    const r = Math.random();
    if (r < 0.0005) k.fall = 100;
    else if (r < 0.0015) k.spin = 80;
  }
  // Collisions: sometimes both skaters go down and see stars.
  for (let i = 0; i < S.length; i++) {
    for (let j = i + 1; j < S.length; j++) {
      const A = S[i], B = S[j];
      if (A.state !== 'skate' || B.state !== 'skate' || A.fall || B.fall || A.cool || B.cool) continue;
      const ddx = skX(A) - skX(B), ddy = skY(A) - skY(B);
      if (Math.abs(ddx) < 2.5 && Math.abs(ddy) < 2) {
        A.cool = B.cool = 300;
        if (Math.random() < 0.6) {
          A.fall = B.fall = 80; A.bonk = B.bonk = true;
          w.fx.push({ type: 'spark', x: skX(A) + 1, y: skY(A) - 7, life: 30 });
        }
      }
    }
  }
}

export function drawSkater(w: World, k: Skater) {
  const ctx = w.ctx, x = skX(k), y = skY(k) - 5;
  const dot = (c: string, px: number, py: number) => { ctx.fillStyle = dim(w, c); ctx.fillRect(px, py, 1, 1); };
  if (k.fall > 0) {
    dot(k.look.hair, x - 1, y + 5); dot(k.look.skin, x, y + 5); dot(k.look.top, x + 1, y + 5);
    dot(k.look.top, x + 2, y + 5); dot(k.look.legs, x + 3, y + 5); dot(k.look.legs, x + 4, y + 4);
    return;
  }
  const wob = k.dizzy > 0 ? (Math.floor(k.dizzy / 6) % 2 ? 1 : -1) : 0;
  const fr = k.spin > 0 ? Math.floor(k.spin / 4) % 2 : k.state === 'skate' ? Math.floor(k.a * 40) % 2 : Math.floor(k.ph ?? 0) % 2;
  drawPerson(w, x + (wob > 0 ? 1 : 0), y, k.look, k.spin > 0 || k.dizzy > 0 ? 0 : fr, false);
  if (k.spin > 0) dot(k.look.top, fr ? x - 1 : x + 3, y + 2);
  if (k.dizzy > 0) {
    const ang = k.dizzy * 0.25;
    dot('#f5e26a', x + 1 + Math.round(Math.cos(ang) * 2), y - 2 + Math.round(Math.sin(ang) * 0.7));
    dot('#f5e26a', x + 1 + Math.round(Math.cos(ang + Math.PI) * 2), y - 2 + Math.round(Math.sin(ang + Math.PI) * 0.7));
  }
  dot('#c9d3e6', x, y + 6); dot('#c9d3e6', x + 2, y + 6);
  ctx.globalAlpha = 0.18; dot(k.look.top, x + 1, y + 7); dot(k.look.skin, x + 1, y + 8);
  ctx.globalAlpha = 1;
}

/** Skaters far out on the ice are drawn behind Bow Bridge. */
export function drawSkatersBehind(w: World) {
  for (const k of w.skaters) if (skY(k) < 148) drawSkater(w, k);
}
export function drawSkatersFront(w: World) {
  for (const k of w.skaters) if (skY(k) >= 148) drawSkater(w, k);
}

