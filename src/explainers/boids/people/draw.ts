// Tiny people: 3×6 adults, 3×4 kids. Character comes from animation, not detail.

import { dim, dotter, type Dot, type Look, type World } from '../world';
import { drawSnowman } from '../scene/holidays';
import { drawSkatersFront } from '../scene/lake';
import { drawBusker, drawChess, drawCrew, drawMascot, drawStatue } from './performers';
import { drawTour } from './tour';
import type { Actor, Walker } from '../world';

export function drawPerson(w: World, x: number, y: number, look: Look, frame: number, sitting: boolean) {
  const ctx = w.ctx;
  const px = (c: string, dx: number, dy: number) => { ctx.fillStyle = dim(w, c); ctx.fillRect(x + dx, y + dy, 1, 1); };
  if (look.kid) {
    px(look.hair, 1, 2); px(look.skin, 1, 3);
    px(look.top, 0, 4); px(look.top, 1, 4); px(look.top, 2, 4);
    if (frame) { px(look.legs, 0, 5); px(look.legs, 2, 5); } else px(look.legs, 1, 5);
    return;
  }
  px(look.hair, 1, 0); px(look.skin, 1, 1);
  px(look.top, 0, 2); px(look.top, 1, 2); px(look.top, 2, 2); px(look.top, 1, 3);
  if (sitting) { px(look.legs, 1, 4); px(look.legs, 2, 4); return; }
  px(look.legs, 1, 4);
  if (frame) { px(look.legs, 0, 5); px(look.legs, 2, 5); } else px(look.legs, 1, 5);
}

/** A person plus extras (marathon bib). */
function drawPersonFull(w: World, x: number, y: number, look: Look, frame: number, sitting: boolean) {
  drawPerson(w, x, y, look, frame, sitting);
  if (look.bib) { w.ctx.fillStyle = dim(w, '#ffffff'); w.ctx.fillRect(x + 1, y + 2, 1, 1); }
}

function drawKneel(x: number, y: number, look: Look, dot: Dot) {
  dot(look.hair, x + 1, y + 1); dot(look.skin, x + 1, y + 2);
  dot(look.top, x, y + 3); dot(look.top, x + 1, y + 3); dot(look.top, x + 2, y + 3); dot(look.top, x + 1, y + 4);
  dot(look.legs, x + 1, y + 5); dot(look.legs, x, y + 5);
}

function drawWalker(w: World, p: Walker, dot: Dot) {
  const x = Math.round(p.x);
  const fr = p.state === 'watch' || p.state === 'propose' ? 0 : Math.floor(p.ph) % 2;
  if (p.state === 'propose' && p.partner) {
    const t = p.t;
    if (t >= 60 && t < 300) drawKneel(x, p.y, p.look, dot);
    else drawPersonFull(w, x, p.y, p.look, 0, false);
    const jump = t > 170 && t < 280 && Math.floor(t / 8) % 2 ? 1 : 0;
    drawPersonFull(w, x + (t >= 300 ? 3 : 4), p.y - jump, p.partner, 0, false);
    return;
  }
  drawPersonFull(w, x, p.y, p.look, fr, false);
  if (p.partner) drawPersonFull(w, x + 4 * (p.dir > 0 ? -1 : 1), p.y, p.partner, 1 - fr, false);
  if (p.dog) {
    const dir = p.state === 'watch' ? (p.face ?? p.dir) : p.dir, dx = x - dir * 6, dy = p.y + 3;
    // Leash, then the dog
    dot('#6b6b6b', p.x + 1 - dir * 1, p.y + 3); dot('#6b6b6b', p.x + 1 - dir * 3, p.y + 3);
    dot(p.dog, dx + (dir > 0 ? 3 : 0), dy);
    dot(p.dog, dx, dy + 1); dot(p.dog, dx + 1, dy + 1); dot(p.dog, dx + 2, dy + 1); dot(p.dog, dx + 3, dy + 1);
    if (fr) { dot(p.dog, dx, dy + 2); dot(p.dog, dx + 3, dy + 2); } else { dot(p.dog, dx + 1, dy + 2); dot(p.dog, dx + 2, dy + 2); }
  }
}

function drawActor(w: World, p: Actor, dot: Dot) {
  switch (p.kind) {
    case 'busker': return drawBusker(w, p, dot);
    case 'statue': return drawStatue(w, p, dot);
    case 'mascot': return drawMascot(p, dot);
    case 'crew': return drawCrew(w, p, dot);
    case 'chess': return drawChess(w, p, dot);
  }
  const moving = p.state === 'arrive' || p.state === 'leave';
  if (p.kind === 'sit' && !moving) { drawPerson(w, p.home, 163, p.look!, 0, true); return; }
  drawPerson(w, Math.round(p.x), p.y, p.look!, moving ? Math.floor(p.ph) % 2 : 0, false);
}

/** Frisbee (always) and catch: baseball in spring/summer, a spiralling football in fall/winter. */
function drawGames(w: World, dot: Dot) {
  const A = w.actors!;
  if (A.fa.state === 'active' && A.fb.state === 'active') {
    const u = w.discT % 2, tt = u < 1 ? u : 2 - u, span = A.fb.home - A.fa.home - 3;
    dot('#e05a33', A.fa.home + 3 + span * tt, 168 - Math.sin(Math.PI * tt) * 10);
    dot('#e05a33', A.fa.home + 4 + span * tt, 168 - Math.sin(Math.PI * tt) * 10);
  }
  if (A.ca.state !== 'active' || A.cb.state !== 'active') return;
  const Bl = w.ball, football = w.season === 'fall' || w.season === 'winter';
  const P = [A.ca, A.cb], thr = P[Bl.from], rec = P[1 - Bl.from];
  const hand = (q: Actor) => (q.look!.kid ? 168 : 167);
  const glove = rec.home + (Bl.from === 0 ? -1 : 3);
  const sx = thr.home + (Bl.from === 0 ? 3 : -1);
  let ex = glove;
  const sy = hand(thr);
  let ey = hand(rec);
  if (Bl.miss) { ex = rec.home + (Bl.from === 0 ? 5 : -3); ey = 171; }
  const ballCol = football ? '#7a4a24' : '#f6f2e8';
  if (Bl.hold > 0) {
    const holder = thr;
    if (Bl.lastMiss && Bl.hold > 40) {
      // The ball was dropped; it sits on the grass until picked up.
      dot(ballCol, holder.home + (Bl.from === 0 ? -3 : 5), 171);
      if (Bl.hold < 70) dot(holder.look!.top, holder.home + (Bl.from === 0 ? -1 : 3), 169);
    } else {
      const windup = Bl.hold < 12;
      const hx = holder.home + (Bl.from === 0 ? (windup ? -1 : 3) : windup ? 3 : -1), hy = windup ? hand(holder) - 3 : hand(holder);
      dot(holder.look!.skin, hx, hy);
      dot(ballCol, hx, hy - 1);
    }
    dot('#6b4424', glove, hand(rec));
    return;
  }
  const tt = Bl.t, arcH = football ? 16 : 11;
  const bx = sx + (ex - sx) * tt, by = sy + (ey - sy) * tt - Math.sin(Math.PI * tt) * arcH;
  if (football) {
    const spin = Math.floor(w.ballT * 60) % 2;
    dot(ballCol, bx, by); dot(ballCol, bx + (Bl.from === 0 ? 1 : -1), by - (spin ? 1 : 0));
  } else dot(ballCol, bx, by);
  // The catcher raises a glove as the ball arrives.
  if (tt > 0.6 && !Bl.miss) { dot('#6b4424', glove, hand(rec) - 1); dot('#6b4424', glove, hand(rec) - 2); }
  else dot('#6b4424', glove, hand(rec));
  if (tt < 0.12) dot(thr.look!.skin, thr.home + (Bl.from === 0 ? 3 : -1), hand(thr) - 2);
}

function drawFx(w: World, dot: Dot) {
  const ctx = w.ctx;
  for (const f of w.fx) {
    if (f.type === 'note') {
      const nx = Math.round(f.x + Math.sin(f.ph) * 2), ny = Math.round(f.y);
      ctx.globalAlpha = Math.min(1, f.life / 30);
      dot('#1c1c1c', nx, ny); dot('#1c1c1c', nx + 1, ny - 1); dot('#1c1c1c', nx + 1, ny - 2);
      ctx.globalAlpha = 1;
    } else if (f.type === 'heart') {
      const hx = Math.round(f.x + Math.sin(f.life * 0.15)), hy = Math.round(f.y);
      ctx.globalAlpha = Math.min(1, f.life / 30);
      for (const [dx, dy] of [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [1, 2]]) dot('#e0305a', hx + dx, hy + dy);
      ctx.globalAlpha = 1;
    } else if (f.type === 'spark') {
      if (Math.floor(f.life / 6) % 2) {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
        ctx.fillStyle = '#bfe8ff'; ctx.fillRect(Math.round(f.x), Math.round(f.y) - 1, 1, 1);
      }
    } else {
      dot('#f5c400', f.sx + (f.tx - f.sx) * f.t, f.sy + (f.ty - f.sy) * f.t - Math.sin(Math.PI * f.t) * 7);
    }
  }
}

/** Everyone on the near shore and path, depth-sorted by y. */
export function drawPeople(w: World) {
  const A = w.actors;
  if (!A) return;
  const dot = dotter(w);
  drawSkatersFront(w);
  drawSnowman(w, dot);
  // Bench
  for (let b = 0; b < 9; b++) { dot('#7a5a3a', 205 + b, 168); dot('#5a4028', 205 + b, 166); }
  dot('#3a2a1a', 205, 169); dot('#3a2a1a', 205, 170); dot('#3a2a1a', 213, 169); dot('#3a2a1a', 213, 170);

  type Item = { y: number; draw: () => void };
  const list: Item[] = [];
  for (const a of Object.values(A) as Actor[]) if (a.state !== 'gone') list.push({ y: a.y, draw: () => drawActor(w, a, dot) });
  for (const p of w.walkers) if (p.state !== 'chess') list.push({ y: p.y, draw: () => drawWalker(w, p, dot) });
  if (w.tour.state !== 'gone') list.push({ y: 168, draw: () => drawTour(w, dot) });
  list.sort((p, q) => p.y - q.y);
  for (const it of list) it.draw();
  drawGames(w, dot);
  drawFx(w, dot);
}
