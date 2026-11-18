// Boids: separation, alignment, cohesion, plus a threat (the player's hawk or the falcon).
// Birds wrap around left/right and stay between the top of the sky and the tree line.
//
// There is no outside push. Like a real murmuration, direction changes start inside the flock:
// every bird wanders a little (Reynolds' "wander"), and now and then, at random, one bird and its
// closest neighbours decide to turn. Turning is contagious: a bird that sees a neighbour turning
// tends to copy it (a little less keenly at each hop), so the turn sweeps the flock as a wave.
// Real starling flocks turn this way (Attanasi et al., 2014).
// (Wind is scenery only: clouds, snow and gust streaks. Birds steer relative to the air.)

import { SPECIES } from '../render/sprites';
import { startWind } from './wind';
import { FLOOR, W, type Bird, type Species, type World } from '../world';

const MAXS = 1.4;
const MINS = 0.5;
const MAXF = 0.045;
/** Threat radius (logical px) and push strength. */
const THREAT_R = 36;
/** Wander: how fast each bird's personal steering urge drifts, its range, and its weight. */
const WANDER_JITTER = 0.12;
const WANDER_RANGE = 0.8;
const WANDER_W = 0.35;
/** Turn initiators: average gap between them, how long a turn lasts, and who joins in. */
const INITIATE_EVERY_STEPS = 60 * 8;
const URGE_STEPS = 45;
const URGE_W = 1.6;
const URGE_R = 10;
/** Chance per step of catching a neighbour's turn, and how much weaker each hop is. */
const CATCH_P = 0.2;
const CATCH_DECAY = 3;
export function setSpecies(w: World, sp: Species) {
  w.species = sp;
  w.spec = { ...SPECIES[sp] };
  w.season = null; // forces the scene to rebuild sprites without a cross-fade
}

function newBird(xmin: number, xmax: number, scatter: boolean, dir: number): Bird {
  const a = scatter ? Math.random() * Math.PI * 2 : (dir < 0 ? Math.PI : 0) + (Math.random() - 0.5) * 0.6;
  return {
    x: xmin + Math.random() * (xmax - xmin),
    y: scatter ? 10 + Math.random() * 105 : 20 + Math.random() * 80,
    vx: Math.cos(a), vy: Math.sin(a), ph: Math.random() * 4, nb: 0, nvx: 0, nvy: 0, maxs: MAXS,
    wan: (Math.random() - 0.5) * WANDER_RANGE, urge: 0, urgeAng: 0,
  };
}

export function spawn(w: World, n: number, scatter: boolean) {
  // The flock sets off a random way; the breeze (scenery) starts up independently.
  const dir = Math.random() < 0.5 ? 1 : -1;
  startWind(w, Math.random() < 0.5 ? 1 : -1);
  w.birds = [];
  for (let i = 0; i < n; i++) {
    w.birds.push(scatter ? newBird(0, W, true, dir) : dir > 0 ? newBird(8, 130, false, dir) : newBird(W - 130, W - 8, false, dir));
  }
  w.bub = null;
  w.bubShow = false;
}

/** Sandbox only: grow or shrink the flock to match the count slider. New birds join from behind. */
export function syncCount(w: World) {
  if (w.mode !== 'sandbox') return;
  const B = w.birds;
  if (B.length === w.count) return;
  const dir = B.reduce((s, b) => s + b.vx, 0) >= 0 ? 1 : -1;
  while (B.length < w.count) B.push(dir > 0 ? newBird(-6, 40, false, dir) : newBird(W - 40, W + 6, false, dir));
  if (B.length > w.count) { B.length = w.count; w.bub = null; w.bubShow = false; }
}

function steer(b: Bird, dx: number, dy: number, max: number): [number, number] {
  const m = Math.hypot(dx, dy);
  if (m < 1e-6) return [0, 0];
  let sx = (dx / m) * max - b.vx;
  let sy = (dy / m) * max - b.vy;
  const f = Math.hypot(sx, sy);
  if (f > MAXF) { sx = (sx / f) * MAXF; sy = (sy / f) * MAXF; }
  return [sx, sy];
}

export function stepFlock(w: World) {
  const B = w.birds;
  const n = B.length;
  const G = FLOOR + 6;
  const { sep: wS, ali: wA, coh: wC } = w.w;
  const R2 = w.spec.R * w.spec.R;
  const S2 = w.spec.S * w.spec.S;
  const threat = w.mode === 'survive' && w.falcon ? w.falcon : w.hawk.on ? w.hawk : null;

  // Every so often (at random), a bird and its nearest neighbours decide to turn.
  if (n && Math.random() < 1 / INITIATE_EVERY_STEPS) {
    const lead = B[Math.floor(Math.random() * n)];
    const ang = Math.atan2(lead.vy, lead.vx) + (Math.random() < 0.5 ? 1 : -1) * (0.9 + Math.random() * 1.4);
    for (const b of B) {
      if (Math.hypot(b.x - lead.x, b.y - lead.y) <= URGE_R) { b.urge = URGE_STEPS; b.urgeAng = ang; }
    }
  }

  for (let i = 0; i < n; i++) {
    const b = B[i];
    let ax = 0, ay = 0, cnt = 0, avx = 0, avy = 0, cx = 0, cy = 0, sx = 0, sy = 0, sc = 0;
    let seenUrge = 0, seenAng = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const o = B[j];
      const dx = o.x - b.x, dy = o.y - b.y, d2 = dx * dx + dy * dy;
      if (d2 < R2) {
        cnt++; avx += o.vx; avy += o.vy; cx += o.x; cy += o.y;
        if (o.urge > seenUrge) { seenUrge = o.urge; seenAng = o.urgeAng; }
        if (d2 < S2 && d2 > 0.0001) { sx -= dx / d2; sy -= dy / d2; sc++; }
      }
    }
    b.nb = cnt;
    // Catch a neighbour's turn.
    if (b.urge === 0 && seenUrge > CATCH_DECAY * 2 && Math.random() < CATCH_P) { b.urge = seenUrge - CATCH_DECAY; b.urgeAng = seenAng; }
    if (cnt) {
      const s1 = steer(b, avx, avy, MAXS); ax += s1[0] * wA; ay += s1[1] * wA;
      const s2 = steer(b, cx / cnt - b.x, cy / cnt - b.y, MAXS); ax += s2[0] * wC; ay += s2[1] * wC;
    }
    if (sc) { const s3 = steer(b, sx, sy, MAXS); ax += s3[0] * wS * 1.5; ay += s3[1] * wS * 1.5; }
    // Soft ceiling and floor
    if (b.y < 14) ay += (14 - b.y) * 0.012;
    if (b.y > G - 18) ay -= (b.y - (G - 18)) * 0.02;
    // Wander: a personal heading offset that drifts slowly.
    b.wan = Math.max(-WANDER_RANGE, Math.min(WANDER_RANGE, b.wan + (Math.random() - 0.5) * WANDER_JITTER));
    const wa = Math.atan2(b.vy, b.vx) + b.wan;
    const s4 = steer(b, Math.cos(wa), Math.sin(wa), MAXS); ax += s4[0] * WANDER_W; ay += s4[1] * WANDER_W;
    // A turn this bird has decided to make (see initiators above).
    if (b.urge > 0) {
      b.urge--;
      const s5 = steer(b, Math.cos(b.urgeAng), Math.sin(b.urgeAng), MAXS); ax += s5[0] * URGE_W; ay += s5[1] * URGE_W;
    }
    let maxs = MAXS;
    if (threat) {
      const hx = b.x - threat.x, hy = b.y - threat.y, hd = Math.hypot(hx, hy);
      if (hd < THREAT_R && hd > 0.01) {
        const hf = (1 - hd / THREAT_R) * 0.3;
        ax += (hx / hd) * hf; ay += (hy / hd) * hf; maxs = MAXS * 1.3;
      }
    }
    ax += (Math.random() - 0.5) * 0.01;
    ay += (Math.random() - 0.5) * 0.01;
    b.nvx = b.vx + ax; b.nvy = b.vy + ay; b.maxs = maxs;
  }

  for (const b of B) {
    let vx = b.nvx, vy = b.nvy;
    const sp = Math.hypot(vx, vy);
    if (sp > b.maxs) { vx = (vx / sp) * b.maxs; vy = (vy / sp) * b.maxs; }
    else if (sp < MINS) {
      if (sp < 1e-6) { vx = MINS; vy = 0; } else { vx = (vx / sp) * MINS; vy = (vy / sp) * MINS; }
    }
    b.vx = vx; b.vy = vy;
    b.x += vx; b.y += vy;
    if (b.y < 3) { b.y = 3; b.vy = Math.abs(b.vy); }
    if (b.y > G - 6) { b.y = G - 6; b.vy = -Math.abs(b.vy); }
    if (b.x > W + 6) b.x -= W + 12; else if (b.x < -6) b.x += W + 12;
    b.ph += 0.18 + Math.hypot(b.vx, b.vy) * 0.08;
  }

  for (let i = w.puffs.length - 1; i >= 0; i--) {
    const p = w.puffs[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.life--;
    if (p.life <= 0) w.puffs.splice(i, 1);
  }
}
