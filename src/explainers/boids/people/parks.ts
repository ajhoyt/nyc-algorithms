// A Parks Department worker who handles the holiday changeover at dawn:
//   - Christmas starts: drags the tree in, stands it up, plugs it into the lamp post.
//   - New Year's ends: unplugs it, chops it down, hauls it out. (Like the city's trees, it stays
//     lit through New Year's; the curbside pickup and Mulchfest come in January.)
//   - Every change: walks the path with a ladder, swapping each lamp post's decoration.
// Until the worker reaches a lamp, it keeps the old holiday's flag.

import { TREE_X, drawLyingTree } from '../scene/holidays';
import { LAMPS } from '../scene/paint';
import { W, pick, type Dot, type ParksCrew, type ParksJob, type World } from '../world';
import { drawPerson } from './draw';

const LADDER = '#b8c0c8';
const PATH_Y = 166;
/** Worker's y on the lawn beside the tree (feet at the tree's base). */
const GRASS_Y = 151;
const SPOT_X = TREE_X + 4;
/** Holidays the tree is up for. */
const TREE_SEASON = ['christmas', 'newyear'];

/** First call each step: decorations and tree match the calendar on page load. */
function ensureState(w: World) {
  if (w.lampDecor.length !== LAMPS.length) w.lampDecor = LAMPS.map(() => w.evId);
  if (w.xmasTree === 'unset') w.xmasTree = TREE_SEASON.includes(w.evId ?? '') ? 'lit' : 'gone';
}

/** The holiday just changed: queue up the work (or add to the worker's list). */
export function callParksCrew(w: World) {
  ensureState(w);
  const jobs: ParksJob[] = [];
  if (w.prevEvId === 'newyear' && w.xmasTree !== 'gone') jobs.push('treeOut');
  if (w.evId === 'christmas' && w.xmasTree === 'gone') jobs.push('treeIn');
  jobs.push('lamps');
  const p = w.parks;
  if (p) {
    for (const j of jobs) if (p.job !== j && !p.jobs.includes(j)) p.jobs.push(j);
    return;
  }
  w.parks = {
    x: -26, y: GRASS_Y, job: jobs[0], jobs: jobs.slice(1), step: 'go', lamp: 0, t: 0, ph: 0,
    look: { skin: pick(['#f1c9a5', '#d9a07a', '#a86b4a', '#7a4a30', '#e8b48e']), hair: '#2e6b48', top: '#2e6b48', legs: '#c9b48a', kid: false },
  };
  startJob(w, w.parks);
}

function startJob(w: World, p: ParksCrew) {
  p.step = 'go'; p.t = 0;
  if (p.job === 'lamps') {
    p.lamp = 0;
    if (p.x < 0) { p.x = -10; p.y = PATH_Y; }
  } else if (p.x < 0) { p.x = -26; p.y = GRASS_Y; }
  if (p.job === 'treeIn') w.xmasTree = 'carried';
}

function nextJob(w: World, p: ParksCrew) {
  const j = p.jobs.shift();
  if (!j) { w.parks = null; return; }
  p.job = j;
  startJob(w, p);
}

/** Moves toward (tx, ty); true once there. */
function walkTo(p: ParksCrew, tx: number, ty: number, v = 0.4) {
  const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
  if (d < 0.5) { p.x = tx; p.y = ty; return true; }
  p.x += (dx / d) * v; p.y += (dy / d) * v; p.ph += 0.15;
  return false;
}

export function stepParks(w: World) {
  ensureState(w);
  const p = w.parks;
  if (!p) return;
  if (p.job === 'treeIn') {
    if (p.step === 'go') { if (walkTo(p, SPOT_X, GRASS_Y, 0.3)) { p.step = 'raise'; p.t = 0; } }
    else if (p.step === 'raise') { if (++p.t === 30) w.xmasTree = 'up'; if (p.t >= 50) { p.step = 'plug'; p.t = 0; } }
    else if (++p.t === 30) w.xmasTree = 'lit';
    else if (p.t >= 60) nextJob(w, p);
  } else if (p.job === 'treeOut') {
    if (p.step === 'go') { if (walkTo(p, SPOT_X, GRASS_Y)) { p.step = 'unplug'; p.t = 0; } }
    else if (p.step === 'unplug') { if (++p.t === 20) w.xmasTree = 'up'; if (p.t >= 35) { p.step = 'chop'; p.t = 0; } }
    else if (p.step === 'chop') { if (++p.t >= 80) { w.xmasTree = 'carried'; p.step = 'haul'; } }
    else if (walkTo(p, -26, GRASS_Y, 0.3)) { w.xmasTree = 'gone'; nextJob(w, p); }
  } else {
    // Lamps: skip ones already right; walk, climb, swap, climb down.
    while (p.step === 'go' && p.lamp < LAMPS.length && w.lampDecor[p.lamp] === w.evId) p.lamp++;
    if (p.step === 'go') {
      if (p.lamp >= LAMPS.length) { if (walkTo(p, W + 12, PATH_Y)) nextJob(w, p); }
      else if (walkTo(p, LAMPS[p.lamp] - 4, PATH_Y)) { p.step = 'work'; p.t = 0; }
    } else {
      p.t++;
      if (p.t === 60) w.lampDecor[p.lamp] = w.evId; // the swap, at the top of the ladder
      if (p.t >= 120) { p.lamp++; p.step = 'go'; }
    }
  }
}

export function drawParks(w: World, dot: Dot) {
  const p = w.parks;
  if (!p) return;
  const x = Math.round(p.x), y = Math.round(p.y);
  const walking = Math.floor(p.ph) % 2;
  if (p.job === 'treeIn' && p.step === 'go') {
    drawLyingTree(w, x - 1, y + 5, -1); // dragged behind, trunk first
    drawPerson(w, x, y, p.look, walking, false);
    dot(p.look.skin, x - 1, y + 3);
    return;
  }
  if (p.job === 'treeOut' && p.step === 'haul') {
    drawLyingTree(w, x + 3, y + 5, 1);
    drawPerson(w, x, y, p.look, walking, false);
    dot(p.look.skin, x + 3, y + 3);
    return;
  }
  if (p.job === 'treeIn' && p.step === 'raise' && w.xmasTree === 'carried') drawLyingTree(w, TREE_X + 9, 157, -1); // on the ground, about to go up
  if (p.job === 'treeIn' || p.job === 'treeOut') {
    const stand = p.step === 'go';
    drawPerson(w, x, y, p.look, stand ? walking : 0, false);
    if (p.step === 'chop') {
      // Axe: wind up, swing
      const up = Math.floor(p.t / 10) % 2 === 0;
      dot('#8a6a44', x - 1, y + (up ? 0 : 2)); dot('#8a6a44', x - 1, y + (up ? 1 : 3));
      dot('#9aa5b1', x - 2, y + (up ? 0 : 3));
    } else if (p.step === 'plug' || p.step === 'unplug') dot(p.look.skin, x + 2, y + 4); // reaching for the outlet
    return;
  }
  // Lamps
  if (p.step === 'go') {
    drawPerson(w, x, y, p.look, walking, false);
    for (let i = -2; i <= 4; i++) dot(LADDER, x + i, y + 1); // ladder on the shoulder
    return;
  }
  const lx = LAMPS[p.lamp] - 1;
  for (let ly = 159; ly <= PATH_Y + 5; ly++) { dot(LADDER, lx - 1, ly); dot(LADDER, lx, ly); if (ly % 2) dot('#8a949e', lx - 1, ly); }
  const up = p.t < 30 ? p.t / 30 : p.t < 90 ? 1 : 1 - (p.t - 90) / 30;
  const climb = Math.round(up * 5);
  drawPerson(w, lx - 4, PATH_Y - climb, p.look, p.t < 30 || p.t >= 90 ? Math.floor(p.t / 6) % 2 : 0, false);
  if (p.t >= 40 && p.t < 80) dot(p.look.skin, lx - 1, PATH_Y - climb + 1); // arm up, swapping
}
