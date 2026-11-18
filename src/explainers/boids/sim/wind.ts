// Wind over the park. Real wind is a slowly wandering average plus gusts on top, so it's modelled as
// two Ornstein–Uhlenbeck processes (random walks pulled gently back toward calm):
//   - a slow "weather" drift (~25 s memory) that sometimes reverses, at unpredictable times
//   - quick gusts (~3 s memory) that jostle the flock
// plus faint vertical updrafts. The sum is low-passed so the push on the birds never jerks.
// Clouds, snow, petals and leaves drift with the same wind, so you can see it.

import type { World } from '../world';

/** Typical strength of the slow drift (an acceleration, logical px/step²). */
export const WIND_REF = 0.006;
const BASE_TAU = 60 * 25;
const GUST_TAU = 60 * 3;
const GUST_REF = WIND_REF * 0.5;
const UPDRAFT_TAU = 60 * 4;
const UPDRAFT_REF = WIND_REF * 0.25;
/** Fraction of the way the felt wind moves toward the raw wind each step. */
const SMOOTH = 0.02;

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
