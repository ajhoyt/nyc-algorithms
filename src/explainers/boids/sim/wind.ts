// Wind over the park. Real wind is a slowly wandering average plus gusts on top, so it's modelled as
// two Ornstein–Uhlenbeck processes (random walks pulled gently back toward calm):
//   - a slow "weather" drift (~12 s memory) that sometimes reverses, at unpredictable times
//   - quick gusts (~3 s memory) that jostle the flock
// plus faint vertical updrafts. The sum is low-passed so the push on the birds never jerks.
// Clouds, snow, petals and leaves drift with the same wind, so you can see it.

import type { World } from '../world';

/** Typical strength of the slow drift (an acceleration, logical px/step²). */
export const WIND_REF = 0.011;
const BASE_TAU = 60 * 12;
const GUST_TAU = 60 * 3;
const GUST_REF = WIND_REF * 0.7;
const UPDRAFT_TAU = 60 * 4;
const UPDRAFT_REF = WIND_REF * 0.25;
/** Fraction of the way the felt wind moves toward the raw wind each step. */
const SMOOTH = 0.04;

export interface Wind {
  base: number;
  gust: number;
  lift: number;
  /** Smoothed wind actually felt this step. */
  x: number;
  y: number;
}

export const calm = (): Wind => ({ base: 0, gust: 0, lift: 0, x: 0, y: 0 });

/** Standard normal sample (Box–Muller). */
function gauss() {
  const u = 1 - Math.random(), v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** One OU step; the long-run spread of the value is `ref`. */
const ou = (x: number, tau: number, ref: number) => x - x / tau + gauss() * ref * Math.sqrt(2 / tau);

/** Starts a breeze in the given direction (+1 east, −1 west) at a random strength. */
export function startWind(w: World, dir: number) {
  const base = dir * WIND_REF * (0.7 + Math.random() * 0.6);
  w.wind = { base, gust: 0, lift: 0, x: base, y: 0 };
}

export function stepWind(w: World) {
  const k = w.wind;
  k.base = ou(k.base, BASE_TAU, WIND_REF);
  k.gust = ou(k.gust, GUST_TAU, GUST_REF);
  k.lift = ou(k.lift, UPDRAFT_TAU, UPDRAFT_REF);
  k.x += (k.base + k.gust - k.x) * SMOOTH;
  k.y += (k.lift - k.y) * SMOOTH;
}

/** Wind as a multiple of its typical strength, for things that drift with it (clouds, flakes). */
export const windFactor = (w: World) => w.wind.x / WIND_REF;

// --- gust streaks ----------------------------------------------------------------
// Faint white lines that blow across the sky in strong wind: the classic pixel-art way to show gusts.

interface Streak { x: number; y: number; len: number; life: number; max: number }
const streaks: Streak[] = [];

export function drawWindStreaks(w: World, W: number) {
  const f = windFactor(w), strength = Math.abs(f);
  if (strength > 1.1 && streaks.length < 8 && Math.random() < (strength - 1.1) * 0.12) {
    const life = 50 + Math.random() * 40;
    streaks.push({ x: Math.random() * W, y: 6 + Math.random() * 100, len: 5 + Math.random() * 9, life, max: life });
  }
  const ctx = w.ctx, k = w.frameDt / 16.67;
  ctx.fillStyle = '#ffffff';
  for (let i = streaks.length - 1; i >= 0; i--) {
    const s = streaks[i];
    s.x += f * 1.6 * k;
    s.life -= k;
    if (s.life <= 0) { streaks.splice(i, 1); continue; }
    const u = s.life / s.max;
    ctx.globalAlpha = 0.5 * Math.sin(Math.PI * u) * (1 - w.nightAmt * 0.6);
    ctx.fillRect(Math.round(s.x), Math.round(s.y), Math.round(s.len), 1);
    // a little curl at the leading edge
    ctx.fillRect(Math.round(s.x + (f > 0 ? s.len : -1)), Math.round(s.y) - 1, 1, 1);
  }
  ctx.globalAlpha = 1;
}
