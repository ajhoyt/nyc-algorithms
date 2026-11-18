// All drawing for the boids explainer lives here, so the art can be swapped
// (e.g. for designed sprites/illustrations) without touching the simulation.
//
// Everything is drawn in world coordinates (WORLD.w x WORLD.h); the caller sets the transform.
// To use bitmap art later: replace drawBackground / drawPigeon / drawHawk / drawArch bodies
// with ctx.drawImage calls. Pigeons and the hawk are drawn facing +x (east), centred at 0,0.

import { ARCH, FOUNTAIN, HAWK_R, SEP_R, VIEW_R, WORLD, type Flock, type Hawk, type Pigeon } from './sim';

export const PALETTE = {
  grass: '#8db36a',
  grassDark: '#7aa35a',
  path: '#ddd3c1',
  pathEdge: '#c9bea9',
  street: '#4f545b',
  water: '#84b9dc',
  stone: '#ece6da',
  stoneEdge: '#b5ab99',
  tree: '#4f7d3c',
  treeLight: '#6a9a4f',
  pigeonBody: '#9aa3b2',
  pigeonWing: '#818b9d',
  pigeonHead: '#525b6b',
  pigeonNeck: '#5f9a86',
  hawk: '#6e4b2c',
  hawkLight: '#a77c4f',
  sep: '#d7352b',
  ali: '#2161d1',
  coh: '#13894a',
  gold: '#f2b705',
};

const TREES: [number, number, number][] = [
  [70, 110, 26], [150, 190, 30], [90, 300, 24], [60, 470, 30], [170, 540, 26],
  [250, 470, 22], [230, 210, 20], [660, 120, 28], [740, 220, 24], [700, 330, 30],
  [610, 220, 20], [740, 480, 28], [630, 545, 24], [560, 480, 20], [300, 570, 18],
  [520, 575, 18], [240, 110, 18], [570, 130, 18],
];

/** Pre-renders the static park into an offscreen canvas at the given pixel scale. */
export function renderBackground(scale: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.round(WORLD.w * scale);
  c.height = Math.round(WORLD.h * scale);
  const ctx = c.getContext('2d')!;
  ctx.scale(scale, scale);
  drawBackground(ctx);
  return c;
}

export function drawBackground(ctx: CanvasRenderingContext2D) {
  const { w, h } = WORLD;
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(0, 0, w, h);

  // Mown stripes
  ctx.fillStyle = PALETTE.grassDark;
  for (let x = 0; x < w; x += 48) ctx.fillRect(x, 0, 24, h);

  // Paths radiating from the fountain plaza
  const paths: [number, number, number][] = [
    [0, 60, 26], [w, 60, 26], [0, h, 26], [w, h, 26], [0, FOUNTAIN.y, 22], [w, FOUNTAIN.y, 22], [FOUNTAIN.x, h, 26],
  ];
  ctx.lineCap = 'round';
  for (const [x, y, width] of paths) {
    ctx.strokeStyle = PALETTE.pathEdge;
    ctx.lineWidth = width + 4;
    line(ctx, FOUNTAIN.x, FOUNTAIN.y, x, y);
    ctx.strokeStyle = PALETTE.path;
    ctx.lineWidth = width;
    line(ctx, FOUNTAIN.x, FOUNTAIN.y, x, y);
  }
  // Wide promenade from the fountain up to the arch
  ctx.fillStyle = PALETTE.path;
  ctx.fillRect(330, 60, 140, FOUNTAIN.y - 60);
  ctx.fillRect(250, 60, 300, 100);

  // Fountain plaza + fountain
  circle(ctx, FOUNTAIN.x, FOUNTAIN.y, 124, PALETTE.pathEdge);
  circle(ctx, FOUNTAIN.x, FOUNTAIN.y, 120, PALETTE.path);
  circle(ctx, FOUNTAIN.x, FOUNTAIN.y, FOUNTAIN.r, PALETTE.stoneEdge);
  circle(ctx, FOUNTAIN.x, FOUNTAIN.y, FOUNTAIN.r - 6, PALETTE.water);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;
  for (const r of [16, 32, 48]) { ctx.beginPath(); ctx.arc(FOUNTAIN.x, FOUNTAIN.y, r, 0, Math.PI * 2); ctx.stroke(); }
  circle(ctx, FOUNTAIN.x, FOUNTAIN.y, 7, '#ffffff');

  // Fifth Avenue
  ctx.fillStyle = PALETTE.street;
  ctx.fillRect(0, 0, w, 60);
  ctx.fillStyle = '#ffffff';
  for (let x = 250; x < 550; x += 16) ctx.fillRect(x, 48, 9, 10); // crosswalk
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = 'bold 13px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('WASHINGTON SQ N', 14, 34);
  ctx.textAlign = 'center';
  ctx.fillText('FIFTH AVE ↑', 400, 30);

  // Trees (canopies, visual only; pigeons fly over)
  for (const [x, y, r] of TREES) {
    circle(ctx, x + 4, y + 5, r, 'rgba(0,0,0,0.15)');
    circle(ctx, x, y, r, PALETTE.tree);
    circle(ctx, x - r * 0.3, y - r * 0.3, r * 0.55, PALETTE.treeLight);
  }
}

/** Arch piers sit below the pigeons; the vault overhead is drawn on top so birds pass "under" it. */
export function drawArchBase(ctx: CanvasRenderingContext2D, highlightGoal: boolean) {
  for (const r of ARCH.piers) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(r.x0 + 5, r.y0 + 6, r.x1 - r.x0, r.y1 - r.y0);
    ctx.fillStyle = PALETTE.stone;
    ctx.strokeStyle = PALETTE.stoneEdge;
    ctx.lineWidth = 2;
    ctx.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
    ctx.strokeRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
  }
  if (highlightGoal) {
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    line(ctx, ARCH.opening.x0 + 3, ARCH.lineY, ARCH.opening.x1 - 3, ARCH.lineY);
    ctx.setLineDash([]);
  }
}

export function drawArchVault(ctx: CanvasRenderingContext2D) {
  const { x0 } = ARCH.opening;
  const w = ARCH.opening.x1 - x0;
  const r0 = ARCH.piers[0];
  ctx.fillStyle = 'rgba(236,230,218,0.55)';
  ctx.fillRect(x0, r0.y0, w, r0.y1 - r0.y0);
  ctx.strokeStyle = PALETTE.stoneEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(ARCH.piers[0].x0, r0.y0, ARCH.piers[1].x1 - ARCH.piers[0].x0, r0.y1 - r0.y0);
}

export function drawPigeon(ctx: CanvasRenderingContext2D, p: Pigeon) {
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.glow > 0) {
    ctx.globalAlpha = p.glow * 0.7;
    circle(ctx, 0, 0, 12, PALETTE.gold);
    ctx.globalAlpha = 1;
  }
  ctx.rotate(Math.atan2(p.vy, p.vx));
  // Shadow
  ellipse(ctx, 3, 4, 7, 4, 'rgba(0,0,0,0.15)');
  // Tail
  ctx.fillStyle = PALETTE.pigeonWing;
  ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-11, -3.2); ctx.lineTo(-11, 3.2); ctx.closePath(); ctx.fill();
  // Wings (flap sideways, seen from above)
  const span = 3 + 6 * Math.abs(Math.sin(p.phase));
  ellipse(ctx, -1, 0, 3.6, span, PALETTE.pigeonWing);
  // Body, neck sheen, head
  ellipse(ctx, 0, 0, 7, 3.6, PALETTE.pigeonBody);
  ellipse(ctx, 4, 0, 2.2, 2.8, PALETTE.pigeonNeck);
  circle(ctx, 6.4, 0, 2.6, PALETTE.pigeonHead);
  ctx.restore();
}

export function drawHawk(ctx: CanvasRenderingContext2D, h: Hawk, t: number) {
  ctx.save();
  ctx.translate(h.x, h.y);
  if (h.active) {
    // Danger radius
    ctx.fillStyle = 'rgba(215,53,43,0.08)';
    ctx.strokeStyle = 'rgba(215,53,43,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, HAWK_R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.globalAlpha = h.active ? 1 : 0.85;
  ctx.rotate(h.angle);
  const s = h.active ? 1.25 : 1;
  ctx.scale(s, s);
  const flap = h.active ? 0.85 + 0.15 * Math.sin(t / 90) : 0.55;
  ellipse(ctx, 8, 10, 12, 30 * flap, 'rgba(0,0,0,0.18)');
  // Wings
  ctx.fillStyle = PALETTE.hawk;
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.quadraticCurveTo(0, -30 * flap, -10, -34 * flap);
  ctx.lineTo(-6, -4);
  ctx.lineTo(-6, 4);
  ctx.lineTo(-10, 34 * flap);
  ctx.quadraticCurveTo(0, 30 * flap, 6, 0);
  ctx.fill();
  // Tail
  ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-20, -6); ctx.lineTo(-20, 6); ctx.closePath(); ctx.fill();
  // Body + head
  ellipse(ctx, 0, 0, 12, 5, PALETTE.hawkLight);
  circle(ctx, 11, 0, 4.5, PALETTE.hawk);
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath(); ctx.moveTo(15, -1.5); ctx.lineTo(19, 0); ctx.lineTo(15, 1.5); ctx.fill();
  ctx.restore();
}

/** Overlay showing one pigeon's neighbourhood and the three steering forces acting on it. */
export function drawWatched(ctx: CanvasRenderingContext2D, flock: Flock) {
  const p = flock.pigeons[0];
  if (!p) return;
  const w = flock.watched;
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  for (const j of w.neighbors) line(ctx, p.x, p.y, flock.pigeons[j].x, flock.pigeons[j].y);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.arc(p.x, p.y, VIEW_R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = PALETTE.sep;
  ctx.beginPath(); ctx.arc(p.x, p.y, SEP_R, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  const k = 500; // forces are tiny; scale them up to be visible
  arrow(ctx, p.x, p.y, w.sx * k, w.sy * k, PALETTE.sep);
  arrow(ctx, p.x, p.y, w.ax * k, w.ay * k, PALETTE.ali);
  arrow(ctx, p.x, p.y, w.cx * k, w.cy * k, PALETTE.coh);
  ctx.restore();
}

// --- helpers ---------------------------------------------------------------

function line(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
}
function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, color: string) {
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const ux = dx / len, uy = dy / len;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
  line(ctx, x, y, x + dx, y + dy);
  ctx.beginPath();
  ctx.moveTo(x + dx + ux * 6, y + dy + uy * 6);
  ctx.lineTo(x + dx - uy * 5, y + dy + ux * 5);
  ctx.lineTo(x + dx + uy * 5, y + dy - ux * 5);
  ctx.closePath(); ctx.fill();
}
