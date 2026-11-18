// Walkers on the path: crowds follow the time of day (joggers early, busiest midday, couples toward
// evening, stragglers at night). Walkers stop to watch performers and tip, play chess, propose on
// Valentine's, and some head to the dock to row or skate.

import { DX, W, pick, type Look, type Role, type Walker, type World } from '../world';
import { coupleChance, crowd, dayPhase, ev, openHours } from '../scene/calendar';
import { addSkater, launchBoat, stepSkaters } from '../scene/lake';
import { makeActors, placeNow, stepActors, wants } from './performers';
import { dressForHalloween, giveBonnet } from './costumes';
import { stepTour } from './tour';
import { stepBridge } from './bridge';
import { stepParks } from './parks';
import { raceOn, stepMarathon } from './marathon';
import { stepBunny, stepSantaCon } from './parades';

const SKINS = ['#f1c9a5', '#d9a07a', '#a86b4a', '#7a4a30', '#e8b48e'];
const HAIRS = ['#2a1f1a', '#5a3a22', '#c9a050', '#1c1c1c', '#8a8a8a'];
const WARDROBE = {
  spring: { tops: ['#e05a33', '#2e9e6b', '#f5c400', '#ffffff', '#1f5fa6', '#f4b6c8'], legs: ['#2f4f7f', '#3a3f45', '#c9b48a'], hats: null },
  summer: { tops: ['#f5c400', '#e05a33', '#4fb3d9', '#ffffff', '#2e9e6b', '#f08aa8'], legs: ['skin', '#2f4f7f', 'skin', '#c9b48a'], hats: null },
  fall: { tops: ['#c8512b', '#7a5a3a', '#3a3f45', '#1f5fa6', '#e3842f'], legs: ['#2f353c', '#3a4f6f', '#5a4a3a'], hats: null },
  winter: { tops: ['#b8432a', '#1c1c1c', '#2f4f7f', '#5a6470', '#2e6b48'], legs: ['#2f353c', '#1c1c1c'], hats: ['#e05a33', '#f5c400', '#ffffff', '#1f5fa6'] },
};

/** A random outfit for the season, with holiday touches (green on St. Patrick's, costumes on Halloween…). */
export function lookFor(w: World, kid: boolean): Look {
  const T = WARDROBE[w.season ?? 'winter'];
  const skin = pick(SKINS), legs = pick(T.legs);
  const L: Look = { skin, hair: T.hats ? pick(T.hats) : pick(HAIRS), top: pick(T.tops), legs: legs === 'skin' ? skin : legs, kid };
  const e = ev(w).id, r = Math.random();
  if (e === 'stpatricks' && r < 0.7) { L.top = pick(['#2e9e4b', '#3fbf5f', '#1f7a3a']); if (r < 0.3) L.hair = '#2e9e4b'; }
  // Easter: the Fifth Avenue Easter Parade, i.e. bonnets.
  if (e === 'easter' && Math.random() < (kid ? 0.5 : 0.65)) giveBonnet(L);
  if (e === 'pride' && r < 0.7) L.top = pick(['#e0302a', '#f5a030', '#f5e26a', '#2e9e4b', '#1f5fa6', '#8a4fc0']);
  if (e === 'pride' && !kid && Math.random() < 0.35) L.flag = true;
  // Halloween: most adults and nearly all kids are in costume (classic and New York).
  if (e === 'halloween' && Math.random() < (kid ? 0.9 : 0.6)) dressForHalloween(L);

  if (e === 'christmas' && r < 0.4) L.hair = '#e0302a';
  if (e === 'newyear' && r < 0.4) L.hair = '#f5c400';
  if (e === 'valentines' && r < 0.5) L.top = pick(['#e0302a', '#f08aa8', '#c42a5a']);
  return L;
}

export function spawnWalker(w: World, anywhere: boolean) {
  const dp = dayPhase(w);
  const couple = Math.random() < coupleChance(w);
  const dir = Math.random() < 0.5 ? 1 : -1;
  const jog = !couple && dp >= 0 && Math.random() < (dp < 0.25 ? 0.55 : 0.15);
  const look = lookFor(w, false);
  w.walkers.push({
    x: anywhere ? Math.random() * W : dir > 0 ? -8 : W + 8, y: 165 + Math.floor(Math.random() * 3), dir,
    v: jog ? 0.45 : 0.16 + Math.random() * 0.08, jog, ph: Math.random() * 4, look,
    partner: couple ? lookFor(w, false) : null,
    dog: !jog && !couple && Math.random() < 0.3 ? pick(['#8a5a30', '#1c1c1c', '#e9e3cc', '#c9a050']) : null,
    state: 'walk', t: 0, seen: {},
  });
}

/** A walker headed for the dock to take out a boat or go skating. */
export function spawnRoleWalker(w: World, role: Role) {
  const dir = Math.random() < 0.5 ? 1 : -1;
  w.walkers.push({
    x: dir > 0 ? -8 : W + 8, y: 165 + Math.floor(Math.random() * 2), dir, v: 0.2 + Math.random() * 0.06, jog: false,
    ph: Math.random() * 4, look: lookFor(w, false), partner: null, dog: null, state: 'walk', t: 0,
    seen: { busker: 1, statue: 1, mascot: 1, crew: 1, chess: 1 }, role,
  });
}

/** A rower or skater coming back up the dock and walking off. */
export function addWalkerFromDock(w: World, look: Look | null) {
  if (!look) return;
  w.walkers.push({
    x: DX - 1, y: 156, ty: 165 + Math.floor(Math.random() * 2), dir: Math.random() < 0.5 ? 1 : -1, v: 0.2, jog: false,
    ph: 0, look, partner: null, dog: null, state: 'fromDock', t: 0, seen: {},
  });
}

/** Midnight on New Year's Eve: every couple in the park stops for a kiss. */
export function midnightKiss(w: World) {
  for (const wk of w.walkers) {
    if (wk.partner && (wk.state === 'walk' || wk.state === 'watch')) { wk.state = 'kiss'; wk.t = Math.floor(Math.random() * 20); }
  }
  for (const b of w.bridgers) if (b.partner) { b.kiss = true; b.pause = 320; }
}

export function initPeople(w: World) {
  w.walkers = [];
  w.fx = [];
  w.actors = makeActors();
  w.board = Array.from({ length: 8 }, () => Math.random() < 0.5);
  for (const a of Object.values(w.actors)) if (wants(w, a)) placeNow(w, a);
  for (let i = 0; i < 5; i++) spawnWalker(w, true);
  w.tour = { state: 'gone', cool: 240, x: -30, dir: 1, t: 0 };
  w.discT = 0; w.ballT = 0; w.ball = { from: 0, t: 0, hold: 60, miss: false };
}

function stepBall(w: World) {
  const A = w.actors!, Bl = w.ball;
  w.discT += 0.012; w.ballT += 0.012;
  if (A.ca.state === 'active' && A.cb.state === 'active') {
    if (Bl.hold > 0) Bl.hold--;
    else {
      const football = w.season === 'fall' || w.season === 'winter';
      Bl.t += 1 / (football ? 75 : 55);
      if (Bl.t >= 1) {
        // About 12% of throws are dropped and picked up.
        Bl.t = 0; Bl.hold = Bl.miss ? 110 : 45; Bl.lastMiss = Bl.miss; Bl.from = 1 - Bl.from; Bl.miss = Math.random() < 0.12;
      }
    }
  } else { Bl.t = 0; Bl.hold = 60; Bl.miss = false; Bl.lastMiss = false; }
}

function stepWalker(w: World, wk: Walker, i: number, target: number): void {
  const A = w.actors!;
  switch (wk.state) {
    case 'toDock':
      wk.y -= 0.12; wk.ph += 0.1;
      if (wk.y <= 156) {
        if (wk.role?.boat) launchBoat(wk.role.boat, wk.look);
        else if (wk.role?.skate) addSkater(w, wk.look);
        w.walkers.splice(i, 1);
      }
      return;
    case 'fromDock':
      wk.y += 0.12; wk.ph += 0.1;
      if (wk.y >= (wk.ty ?? 165)) { wk.y = wk.ty ?? 165; wk.state = 'walk'; }
      return;
    case 'walk': {
      // Race starting: clear the path, briskly, toward the nearest edge.
      if (raceOn(w) && !wk.role) { wk.dir = wk.x < W / 2 ? -1 : 1; wk.v = Math.max(wk.v, 0.5); }
      wk.x += wk.v * wk.dir; wk.ph += wk.v * 0.6;
      if (wk.role && Math.abs(wk.x - (DX - 1)) < 0.3) {
        const valid = wk.role.skate ? w.season === 'winter' : w.season !== 'winter' && openHours(w);
        if (valid) { wk.state = 'toDock'; wk.x = DX - 1; return; }
        if (wk.role.boat) wk.role.boat.pending = false;
        wk.role = null;
      }
      // Valentine's couples leave a trail of little hearts.
      if (wk.partner && ev(w).id === 'valentines' && Math.random() < 0.004) w.fx.push({ type: 'heart', x: wk.x + 1 - 2 * wk.dir, y: wk.y - 2, life: 70 });
      if (wk.partner && ev(w).id === 'valentines' && !w.proposing && wk.x > 40 && wk.x < 280 && Math.random() < 0.002) {
        wk.state = 'propose'; wk.t = 0; w.proposing = wk;
        return;
      }
      if (!wk.jog && !wk.partner && A.chess.state === 'active' && !w.challenger && !wk.seen.chess && Math.abs(wk.x - (A.chess.x + 9)) < 1) {
        wk.seen.chess = 1;
        if (Math.random() < 0.4) { wk.state = 'chess'; wk.t = 500 + Math.random() * 500; w.challenger = wk; return; }
      }
      if (!wk.jog) {
        const perf = [A.busk.state === 'play' ? A.busk : null, A.statue, A.mascot, A.crew].filter((p) => p && p.state === (p.kind === 'busker' ? 'play' : 'active'));
        for (const pf of perf) {
          if (!pf) continue;
          const cx = pf.kind === 'crew' ? pf.x + 5 : pf.x;
          if (!wk.seen[pf.kind] && Math.abs(wk.x - cx) < 10 && (wk.dir > 0 ? wk.x < cx : wk.x > cx)) {
            wk.seen[pf.kind] = 1;
            if (Math.random() < (pf.kind === 'crew' ? 0.55 : 0.35)) { wk.state = 'watch'; wk.t = 90 + Math.random() * 150; wk.target = pf; wk.face = cx > wk.x ? 1 : -1; }
            break;
          }
        }
      }
      if (wk.x > W + 10 || wk.x < -10) {
        w.walkers.splice(i, 1);
        if (target > 0 && w.walkers.length <= target) spawnWalker(w, false);
      }
      return;
    }
    case 'watch': {
      wk.t--;
      const tg = wk.target!;
      if (tg.state !== 'play' && tg.state !== 'active') { wk.state = 'walk'; return; }
      if (wk.t <= 0) {
        const tp = tg.kind === 'busker' ? 0.5 : tg.kind === 'statue' ? 0.55 : tg.kind === 'crew' ? 0.45 : 0.3;
        if (Math.random() < tp) {
          const tx = tg.kind === 'busker' ? tg.x - 4 : tg.kind === 'crew' ? tg.x - 5 : tg.x + 1;
          const ty = tg.kind === 'busker' ? tg.y + 4 : tg.y + 3;
          w.fx.push({ type: 'coin', sx: wk.x + 1, sy: wk.y + 2, tx, ty, t: 0, to: tg });
        }
        wk.state = 'walk';
      }
      return;
    }
    case 'chess':
      wk.t--;
      if (wk.t <= 0 || A.chess.state !== 'active') {
        if (A.chess.state === 'active' && Math.random() < 0.6) w.fx.push({ type: 'coin', sx: A.chess.x + 9, sy: 166, tx: A.chess.x + 1, ty: 166, t: 0, to: A.chess });
        wk.state = 'walk'; wk.dir = 1; wk.x = A.chess.x + 10; w.challenger = null;
      }
      return;
    case 'kiss':
      wk.t++;
      if (wk.t < 260 && wk.t % 26 === 0) w.fx.push({ type: 'heart', x: wk.x + 1 - wk.dir * 2 + (Math.random() - 0.5) * 3, y: wk.y - 3, life: 80 });
      if (wk.t >= 320) wk.state = 'walk';
      return;
    case 'propose':
      wk.t++;
      if (wk.t === 150) w.fx.push({ type: 'spark', x: wk.x + 3, y: wk.y + 2, life: 140 });
      if (wk.t > 190 && wk.t < 280 && wk.t % 14 === 0) w.fx.push({ type: 'heart', x: wk.x + 2 + Math.random() * 4, y: wk.y - 2, life: 90 });
      if (wk.t >= 420) { wk.state = 'walk'; w.proposing = null; }
      return;
  }
}

function stepFx(w: World) {
  for (let i = w.fx.length - 1; i >= 0; i--) {
    const f = w.fx[i];
    if (f.type === 'note') { f.y -= 0.15; f.ph += 0.08; if (--f.life <= 0) w.fx.splice(i, 1); }
    else if (f.type === 'heart') { f.y -= 0.22; if (--f.life <= 0) w.fx.splice(i, 1); }
    else if (f.type === 'spark') { if (--f.life <= 0) w.fx.splice(i, 1); }
    else {
      f.t += 1 / 32;
      if (f.t >= 1) {
        if (f.to.kind === 'busker') f.to.coins = Math.min(4, f.to.coins + 1);
        else f.to.react = 80;
        w.fx.splice(i, 1);
      }
    }
  }
}

export function stepPeople(w: World) {
  if (!w.actors) initPeople(w);
  // On marathon day the path is cleared for the race.
  const racing = raceOn(w);
  const target = racing ? 0 : crowd(w);
  // New arrivals trickle in, faster when the park is well short of its crowd (e.g. NYE night).
  const deficit = target - w.walkers.filter((q) => !q.role).length;
  if (deficit > 0 && Math.random() < (deficit > 2 ? 0.02 : 0.006)) spawnWalker(w, false);
  stepActors(w);
  stepBall(w);
  stepTour(w);
  stepBridge(w);
  stepSkaters(w);
  stepParks(w);
  stepMarathon(w);
  stepSantaCon(w);
  stepBunny(w);
  for (let i = w.walkers.length - 1; i >= 0; i--) stepWalker(w, w.walkers[i], i, target);
  stepFx(w);
}
