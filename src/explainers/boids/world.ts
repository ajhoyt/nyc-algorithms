// Shared state for the Central Park birds scene. Every module reads and writes this one object;
// it plays the role the component instance played in the design prototype.

import { calm, type Wind } from './sim/wind';
import type { Fan, Runner } from './people/marathon';

export const W = 320;
export const H = 180;
/** Lowest y a bird or falcon may reach (just above the tree line). */
export const FLOOR = 116;
/** Lake extents and dock x. */
export const LX0 = 64;
export const LX1 = 256;
export const DX = 200;
/** Backing-store pixels per logical pixel. */
export const SCALE = 4;

export type Mode = 'sandbox' | 'wrangle' | 'survive';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export type Species = 'starling' | 'pigeon';

export interface Look {
  skin: string; hair: string; top: string; legs: string; kid: boolean; bib?: boolean;
  /** Carrying a little rainbow flag (Pride). */
  flag?: boolean;
  /** Halloween costume id (see people/costumes.ts). */
  costume?: string;
}

export interface Bird {
  x: number; y: number; vx: number; vy: number;
  /** Flap phase. */
  ph: number;
  /** Neighbours seen last step (falcon targets lonely birds). */
  nb: number;
  nvx: number; nvy: number; maxs: number;
  /** Wander offset from current heading (radians). */
  wan: number;
  /** Steps left of a turn this bird decided on, and the direction it's turning toward. */
  urge: number; urgeAng: number;
}

export interface Puff { x: number; y: number; vx: number; vy: number; life: number; c: string }

export interface Falcon {
  x: number; y: number; vx: number; vy: number;
  target: Bird | null; cool: number; retarget: number; ph: number;
}

export interface Hawk {
  on: boolean; down: boolean; x: number; y: number;
  /** Flap phase, facing (+1 right, −1 left) and smoothed velocity, from how the pointer moves. */
  ph: number; face: number; lastX: number; lastY: number; vx: number; vy: number;
}

export interface Firework { x: number; y: number; t: number; col: string; parts: [number, number][]; s: number }

export interface Flake {
  x: number; y: number; v: number; ph: number; c: string;
  tree?: boolean; vx?: number; wait?: number; ff?: boolean; dying?: boolean; land?: number; rest?: number;
}

export interface Balloon { kind: 'turkey' | 'pigeon' | 'pizza'; x: number; y: number; v: number }

export interface Boat {
  slot: number; state: 'docked' | 'out' | 'return'; x: number; y: number; v: number; ph: number;
  a: Look | null; al: number; summer?: boolean; pending?: boolean; timer?: number; ty?: number;
}

export interface Role { boat?: Boat; skate?: boolean }

export interface Walker {
  x: number; y: number; dir: number; v: number; jog: boolean; ph: number; look: Look;
  partner: Look | null; dog: string | null;
  state: 'walk' | 'watch' | 'chess' | 'propose' | 'kiss' | 'toDock' | 'fromDock';
  t: number; seen: Record<string, number>; role?: Role | null; ty?: number;
  target?: Actor; face?: number;
}

export type ActorKind = 'frisbee' | 'catch' | 'sit' | 'busker' | 'statue' | 'mascot' | 'crew' | 'chess';

export interface Actor {
  kind: ActorKind; home: number; x: number; y: number;
  state: 'gone' | 'arrive' | 'setup' | 'play' | 'pack' | 'active' | 'leave';
  dir: number; ph: number; look: Look | null; looks?: Look[]; t: number; dur?: number;
  coins: number; react: number; cool: number;
}

export interface Actors {
  fa: Actor; fb: Actor; ca: Actor; cb: Actor; s1: Actor; s2: Actor;
  busk: Actor; statue: Actor; mascot: Actor; crew: Actor; chess: Actor;
}

export type Fx =
  | { type: 'note'; x: number; y: number; life: number; ph: number }
  | { type: 'heart'; x: number; y: number; life: number }
  | { type: 'spark'; x: number; y: number; life: number }
  | { type: 'coin'; sx: number; sy: number; tx: number; ty: number; t: number; to: Actor };

export interface Tour {
  state: 'gone' | 'walk' | 'stop'; cool: number; x: number; dir: number; t: number; ph?: number;
  stopX?: number; stopped?: boolean; guide?: Look; members?: Look[];
}

export type ParksJob = 'treeIn' | 'treeOut' | 'lamps';
export interface ParksCrew {
  x: number; y: number; job: ParksJob; jobs: ParksJob[]; step: string; lamp: number; t: number; ph: number; look: Look;
}

export interface Bridger { x: number; dir: number; v: number; ph: number; look: Look; partner: Look | null; pause: number; kiss?: boolean }

export interface Skater {
  state: 'glideIn' | 'skate' | 'glideOut'; gx: number; gy: number; cx: number; cy: number; rx: number; ry: number;
  a: number; v: number; look: Look; fall: number; spin: number; dizzy: number; cool: number; timer: number;
  ph?: number; bonk?: boolean;
}

export interface SceneLayers { sky: HTMLCanvasElement; far: HTMLCanvasElement; bg: HTMLCanvasElement; fg: HTMLCanvasElement; banks: HTMLCanvasElement }
export interface DayLayers extends SceneLayers { wins: [number, number][]; winsFar: [number, number][] }

export interface CloudSprite { day: HTMLCanvasElement; night: HTMLCanvasElement; x: number; y: number; v: number; a: number }

export interface Bubble { b: Bird; lines: string[]; until: number }

export interface World {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** Frame time (ms, from rAF). */
  t: number;
  frameDt: number;
  acc: number;

  // --- game
  mode: Mode;
  dialog: Mode | null;
  over: boolean;
  w: { sep: number; ali: number; coh: number };
  count: number;
  species: Species;
  spec: { R: number; S: number; ox: number; oy: number };
  sightOn: boolean;
  birds: Bird[];
  puffs: Puff[];
  falcon: Falcon | null;
  hawk: Hawk;
  timeLeft: number;
  elapsed: number;
  oneFor: number;
  flocks: number;
  wt: number;
  /** Wind over the park (see sim/wind.ts). */
  wind: Wind;

  // --- calendar (the "clock"); auto-cycles
  calSeason: Season;
  event: number;
  night: boolean;
  autoClock: number;

  // --- scene (what is currently drawn, cross-fading toward the calendar)
  season: Season | null;
  prevSeason: Season | null;
  seasonFade: number;
  sceneKey: string;
  days: Partial<Record<Season, DayLayers>>;
  nights: Partial<Record<Season, SceneLayers>>;
  sprCache: Record<string, HTMLCanvasElement[]>;
  sprites: HTMLCanvasElement[];
  cloudSprites: CloudSprite[] | null;
  nightAmt: number;
  meltT: number;
  puddle: number;
  evId: string | null;
  prevEvId: string | null;
  evFade: number;
  /** Holiday whose colours the Empire State Building shows; locked from dusk until full daylight. */
  esbEvId: string | null;
  /** Holiday decoration currently hung on each lamp post (changed by the Parks worker). */
  lampDecor: (string | null)[];
  parks: ParksCrew | null;
  /** The Christmas tree: brought in, lit, chopped and hauled out by the Parks worker. */
  xmasTree: 'unset' | 'gone' | 'carried' | 'up' | 'lit';
  /** Marathon day (see people/marathon.ts). */
  runners: Runner[];
  fans: Fan[];
  nightClock: number;
  dropped: boolean;
  fireworks: Firework[];
  flakes: Flake[];
  flakeEv: string | null;
  balloons: Balloon[] | null;
  boats: Boat[] | null;

  // --- people
  walkers: Walker[];
  fx: Fx[];
  actors: Actors | null;
  board: boolean[];
  tour: Tour;
  discT: number;
  ballT: number;
  ball: { from: number; t: number; hold: number; miss: boolean; lastMiss?: boolean };
  bridgers: Bridger[];
  skaters: Skater[];
  challenger: Walker | null;
  proposing: Walker | null;
  /** Next tour fact per species. */
  hintIdx: Partial<Record<Species, number>>;
  tourBub: { lines: string[]; until: number } | null;

  // --- speech bubbles
  bub: Bubble | null;
  bubShow: boolean;
  nextBub: number;
  bag: string[];
  bagKey: string;
  lastLine: string;

  hawkSpr: HTMLCanvasElement[];
  falconSpr: HTMLCanvasElement[];
}

export function createWorld(canvas: HTMLCanvasElement, hawkSpr: HTMLCanvasElement[], falconSpr: HTMLCanvasElement[]): World {
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  return {
    canvas, ctx, t: 0, frameDt: 16.67, acc: 0,
    mode: 'sandbox', dialog: null, over: false,
    w: { sep: 1.2, ali: 1.0, coh: 1.0 }, count: 120, species: 'starling', spec: { R: 20, S: 6, ox: 3, oy: 5 },
    sightOn: false, birds: [], puffs: [], falcon: null, hawk: { on: false, down: false, x: 0, y: 0, ph: 0, face: 1, lastX: 0, lastY: 0, vx: 0, vy: 0 },
    timeLeft: 0, elapsed: 0, oneFor: 0, flocks: 0, wt: 0, wind: calm(),
    calSeason: 'winter', event: 0, night: false, autoClock: 0,
    season: null, prevSeason: null, seasonFade: 1, sceneKey: '', days: {}, nights: {}, sprCache: {}, sprites: [],
    cloudSprites: null, nightAmt: 0, meltT: 0, puddle: 0, evId: null, prevEvId: null, evFade: 1, esbEvId: null, lampDecor: [], parks: null, xmasTree: 'unset', runners: [], fans: [],
    nightClock: 0, dropped: false, fireworks: [], flakes: [], flakeEv: null, balloons: null, boats: null,
    walkers: [], fx: [], actors: null, board: [], tour: { state: 'gone', cool: 240, x: -30, dir: 1, t: 0 },
    discT: 0, ballT: 0, ball: { from: 0, t: 0, hold: 60, miss: false }, bridgers: [], skaters: [],
    challenger: null, proposing: null, hintIdx: {}, tourBub: null,
    bub: null, bubShow: false, nextBub: 0, bag: [], bagKey: '', lastLine: '',
    hawkSpr, falconSpr,
  };
}

export { rng } from '../../shared/pixel';

export function pick<T>(a: readonly T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

const dimCache: Record<string, string> = {};
/** Darkens a hex colour by the current night amount (cached in 5% steps). */
export function dim(w: World, hex: string): string {
  const n = w.nightAmt;
  if (n <= 0.01) return hex;
  const q = Math.round(n * 20) / 20;
  const key = hex + q;
  const hit = dimCache[key];
  if (hit) return hit;
  const v = parseInt(hex.slice(1), 16);
  const r = Math.round(((v >> 16) & 255) * (1 - 0.5 * q));
  const g = Math.round(((v >> 8) & 255) * (1 - 0.45 * q));
  const b = Math.min(255, Math.round((v & 255) * (1 - 0.3 * q) + 10 * q));
  return (dimCache[key] = `rgb(${r},${g},${b})`);
}

/** A 1×1 pixel plotter that dims with night. */
export type Dot = (c: string, x: number, y: number) => void;
export function dotter(w: World): Dot {
  const ctx = w.ctx;
  return (c, x, y) => {
    ctx.fillStyle = dim(w, c);
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  };
}

export function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return [c, c.getContext('2d', { willReadFrequently: true })!];
}
