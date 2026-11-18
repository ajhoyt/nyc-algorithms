// The park's calendar. It auto-cycles (no user controls): each holiday is one day (~28 s) and
// one night (~14 s); three holidays per season. Day/night, season and holiday changes cross-fade.

import type { Season, World } from '../world';
import { callParksCrew } from '../people/parks';

export interface HolidayDef {
  id: string;
  label: string;
  /** Empire State Building tier colours (stylized, not the real schedule). */
  esb: string[];
  fireworks?: boolean;
  sparkle?: boolean;
  rainbow?: boolean;
}

export const SEASON_ORDER: Season[] = ['spring', 'summer', 'fall', 'winter'];

export const EVENTS: Record<Season, HolidayDef[]> = {
  winter: [
    { id: 'christmas', label: 'CHRISTMAS', esb: ['#e0302a', '#2e9e4b', '#e0302a'] },
    { id: 'newyear', label: 'NEW YEAR', esb: ['#ffffff', '#f5c400', '#ffffff'], fireworks: true, sparkle: true },
    { id: 'valentines', label: 'VALENTINE’S', esb: ['#e0302a', '#f08aa8', '#ffffff'] },
  ],
  spring: [
    { id: 'stpatricks', label: 'ST. PATRICK’S', esb: ['#2e9e4b', '#2e9e4b', '#2e9e4b'] },
    { id: 'blossom', label: 'BLOSSOMS', esb: ['#f08aa8', '#ffffff', '#f08aa8'] },
    { id: 'easter', label: 'EASTER', esb: ['#f5c400', '#b58ae0', '#f5c400'] },
  ],
  summer: [
    { id: 'pride', label: 'PRIDE', esb: ['#e0302a', '#f5c400', '#2e9e4b', '#1f5fa6', '#8a4fc0'], rainbow: true },
    { id: 'july4', label: 'JULY 4TH', esb: ['#e0302a', '#ffffff', '#1f5fa6'], fireworks: true },
    { id: 'heat', label: 'HEAT WAVE', esb: ['#ffffff', '#ffffff', '#ffffff'] },
  ],
  fall: [
    { id: 'marathon', label: 'MARATHON', esb: ['#1f5fa6', '#e3842f', '#1f5fa6'] },
    { id: 'halloween', label: 'HALLOWEEN', esb: ['#e3842f', '#8a4fc0', '#e3842f'] },
    { id: 'thanksgiving', label: 'THANKSGIVING', esb: ['#e3842f', '#f5c400', '#c8512b'] },
  ],
};

export const DAY_MS = 28000;
export const NIGHT_MS = 14000;
const NIGHT_FADE_MS = 4000;
const SEASON_FADE_MS = 2500;
const EVENT_FADE_MS = 3000;

export function ev(w: World): HolidayDef {
  const list = EVENTS[w.calSeason];
  return list[Math.min(list.length - 1, w.event)];
}

export function evById(id: string | null): HolidayDef | null {
  if (!id) return null;
  for (const s of SEASON_ORDER) for (const e of EVENTS[s]) if (e.id === id) return e;
  return null;
}

/** How visible a holiday's props are right now (cross-fades between holidays). */
export function evAlphaFor(w: World, id: string): number {
  const f = w.evFade;
  if (id === w.evId) return w.prevEvId && f < 1 ? f : 1;
  if (id === w.prevEvId && f < 1) return 1 - f;
  return 0;
}

export const isNight = (w: World) => w.night;

/** 0..1 through the current day, or -1 at night. */
export function dayPhase(w: World): number {
  if (w.night) return -1;
  return Math.min(1, w.autoClock / DAY_MS);
}

/** Target number of walkers: busiest at midday, a few stragglers at night. */
export function crowd(w: World): number {
  const dp = dayPhase(w), id = ev(w).id;
  // Romantic nights fill the park: Valentine's, and couples gathering for midnight on New Year's.
  if (dp < 0) return id === 'newyear' ? 8 : id === 'valentines' ? 5 : 1;
  return Math.round(2 + 6 * Math.sin(Math.PI * Math.min(1, dp * 1.05))) + (id === 'valentines' || id === 'pride' ? 3 : 0);
}

/** Share of new walkers who arrive as a couple. */
export function coupleChance(w: World): number {
  const dp = dayPhase(w), id = ev(w).id;
  if (id === 'valentines') return 0.85;
  if (id === 'pride') return 0.7;
  if (id === 'newyear' && dp < 0) return 0.8;
  return dp < 0 || dp > 0.8 ? 0.35 : 0.12;
}

/** Performers, boats, the tour and kids are out after morning and gone before dark. */
export function openHours(w: World): boolean {
  const dp = dayPhase(w);
  return dp >= 0.1 && dp <= 0.97;
}

/** 0..1 through the current season (drives continuous foliage change). */
export function seasonProgress(w: World): number {
  const within = w.night ? (DAY_MS + w.autoClock) / (DAY_MS + NIGHT_MS) : w.autoClock / (DAY_MS + NIGHT_MS);
  return Math.max(0, Math.min(0.999, (w.event + Math.min(1, within)) / 3));
}

export function advanceAuto(w: World, dt: number) {
  w.autoClock += dt;
  if (w.autoClock < (w.night ? NIGHT_MS : DAY_MS)) return;
  w.autoClock = 0;
  if (!w.night) { w.night = true; return; }
  w.night = false;
  if (w.event + 1 >= 3) {
    w.event = 0;
    w.calSeason = SEASON_ORDER[(SEASON_ORDER.indexOf(w.calSeason) + 1) % 4];
  } else w.event++;
}

/** Advances all cross-fades. Call once per frame after advanceAuto and ensureScene. */
export function updateFades(w: World, dt: number) {
  const nt = w.night ? 1 : 0;
  if (w.nightAmt < nt) w.nightAmt = Math.min(nt, w.nightAmt + dt / NIGHT_FADE_MS);
  else if (w.nightAmt > nt) w.nightAmt = Math.max(nt, w.nightAmt - dt / NIGHT_FADE_MS);
  if (w.seasonFade < 1) w.seasonFade = Math.min(1, w.seasonFade + dt / SEASON_FADE_MS);
  // The snowman melts in early spring, leaving a puddle that dries.
  if (w.season === 'winter') { w.meltT = 0; w.puddle = 0; }
  else if (w.prevSeason === 'winter' && w.meltT < 1) { w.meltT = Math.min(1, w.meltT + dt / 7000); w.puddle = 1.5; }
  else if (w.puddle > 0) w.puddle = Math.max(0, w.puddle - dt / 9000);
  const eid = ev(w).id;
  if (w.evId !== eid) {
    w.prevEvId = w.evId; w.evId = eid; w.evFade = w.prevEvId ? 0 : 1;
    if (w.prevEvId) callParksCrew(w);
  }
  if (w.evFade < 1) w.evFade = Math.min(1, w.evFade + dt / EVENT_FADE_MS);
  if (w.night) w.nightClock += dt;
  else { w.nightClock = 0; w.dropped = false; }
}
