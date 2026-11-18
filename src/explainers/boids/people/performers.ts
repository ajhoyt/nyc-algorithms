// Fixed-position park regulars: frisbee and catch pairs, bench sitters, and performers
// (busker, living statue, pigeon mascot, breakdance crew, chess hustler). They walk in when the
// park opens and walk out before dark; nobody appears or vanishes.

import { W, type Actor, type ActorKind, type Actors, type Dot, type World } from '../world';
import { openHours } from '../scene/calendar';
import { drawPerson } from './draw';
import { lookFor } from './crowd';

function actor(kind: ActorKind, home: number, y: number): Actor {
  return { kind, home, x: -10, y, state: 'gone', dir: 1, ph: 0, look: null, t: 0, coins: 0, react: 0, cool: 0 };
}

export function makeActors(): Actors {
  return {
    fa: actor('frisbee', 52, 166), fb: actor('frisbee', 100, 166),
    ca: actor('catch', 258, 166), cb: actor('catch', 286, 166),
    s1: actor('sit', 206, 163), s2: actor('sit', 210, 163),
    busk: actor('busker', 188, 164),
    statue: actor('statue', 160, 162),
    mascot: actor('mascot', 22, 163),
    crew: actor('crew', 124, 165),
    chess: actor('chess', 244, 163),
  };
}

/** Whether this actor wants to be in the park right now. */
export function wants(w: World, a: Actor): boolean {
  const day = openHours(w), s = w.season ?? 'winter';
  switch (a.kind) {
    case 'frisbee': case 'crew': case 'statue': return day && s !== 'winter';
    case 'catch': case 'busker': case 'mascot': case 'chess': return day;
    case 'sit': return a === w.actors!.s1 ? true : day;
  }
}

function dressUp(w: World, a: Actor) {
  a.look = lookFor(w, a === w.actors!.cb && Math.random() < 0.5);
  if (a.kind === 'crew') a.looks = [lookFor(w, false), lookFor(w, false), lookFor(w, false)];
}

/** On first load, actors who want to be out are already in place. */
export function placeNow(w: World, a: Actor) {
  dressUp(w, a);
  a.x = a.home;
  a.state = a.kind === 'busker' ? 'play' : 'active';
  a.dur = 3000;
  a.t = 0;
}

export function stepActors(w: World) {
  const A = w.actors!;
  for (const a of Object.values(A) as Actor[]) {
    const want = wants(w, a);
    switch (a.state) {
      case 'gone':
        if (a.cool > 0) a.cool--;
        else if (want) {
          dressUp(w, a);
          const fromLeft = a.home < W / 2;
          a.x = fromLeft ? -8 : W + 8; a.dir = fromLeft ? 1 : -1; a.state = 'arrive';
        }
        break;
      case 'arrive':
        if (!want) a.state = 'leave';
        else {
          const d = a.home - a.x;
          a.dir = d > 0 ? 1 : -1;
          if (Math.abs(d) < 0.4) { a.x = a.home; a.state = a.kind === 'busker' ? 'setup' : 'active'; a.t = 0; }
          else { a.x += a.dir * 0.35; a.ph += 0.15; }
        }
        break;
      case 'setup':
        if (++a.t >= 70) { a.state = 'play'; a.t = 0; a.dur = 3000 + Math.random() * 3000; }
        break;
      case 'play':
        a.t++; a.ph += 0.05;
        if (a.t % 45 === 0) w.fx.push({ type: 'note', x: a.x + 3, y: a.y + 1, life: 80, ph: Math.random() * 6 });
        if (!want || a.t > (a.dur ?? 0)) { a.state = 'pack'; a.t = 0; }
        break;
      case 'pack':
        if (++a.t >= 70) { a.state = 'leave'; a.coins = 0; }
        break;
      case 'active':
        a.ph += 0.05; a.t++;
        if (a.react > 0) a.react--;
        if (a.kind === 'mascot') { a.x = a.home + Math.sin(a.t * 0.004) * 12; a.dir = Math.cos(a.t * 0.004) >= 0 ? 1 : -1; }
        if (a.kind === 'chess' && a.t % 50 === 0 && w.challenger) { const bi = Math.floor(Math.random() * 8); w.board[bi] = !w.board[bi]; }
        if (!want) {
          a.state = 'leave';
          if (a.kind === 'chess' && w.challenger) { w.challenger.state = 'walk'; w.challenger = null; }
        }
        break;
      case 'leave':
        a.dir = a.x < W / 2 ? -1 : 1; a.x += a.dir * 0.35; a.ph += 0.15;
        if (a.x < -10 || a.x > W + 10) { a.state = 'gone'; a.cool = a.kind === 'busker' ? 600 : 120; }
        break;
    }
  }
}

/** Busker with an open guitar case that fills with coins. */
export function drawBusker(w: World, a: Actor, dot: Dot) {
  const x = Math.round(a.x), y = a.y, L = a.look!;
  if (a.state === 'arrive' || a.state === 'leave') {
    drawPerson(w, x, y, L, Math.floor(a.ph) % 2, false);
    const cxw = a.dir > 0 ? x - 1 : x + 3;
    dot('#6b4a2a', cxw, y + 3); dot('#6b4a2a', cxw, y + 4);
    return;
  }
  const open = a.state === 'play' || (a.state === 'setup' && a.t > 20) || (a.state === 'pack' && a.t < 40);
  const cx = x - 6;
  for (let i = 0; i < 4; i++) dot('#6b4a2a', cx + i, y + 5);
  if (open) {
    dot('#6b4a2a', cx - 1, y + 4); dot('#6b4a2a', cx - 1, y + 3);
    for (let i = 0; i < 4; i++) dot(i < a.coins ? '#f5c400' : '#a3343a', cx + i, y + 4);
  } else for (let i = 0; i < 4; i++) dot('#5a3a20', cx + i, y + 4);
  drawPerson(w, x, y, L, 0, false);
  const raised = a.state === 'play' || (a.state === 'setup' && a.t > 40) || (a.state === 'pack' && a.t < 30);
  if (raised) {
    const tilt = a.state === 'play' && Math.floor(a.ph * 2) % 2;
    dot('#d9a640', x + 2, y + 1); dot('#d9a640', x + 3, y + 2); dot('#d9a640', x + 3, y + 3);
    dot('#f2c860', x + 3 + (tilt ? 1 : 0), y + 4 - (tilt ? 1 : 0)); dot('#d9a640', x + 2, y + 4);
  }
}

/** Green living statue on a plinth; waves the torch when tipped. */
export function drawStatue(w: World, a: Actor, dot: Dot) {
  const x = Math.round(a.x), y = a.y;
  const G = '#6fb59a', D = '#4f9a80', Lt = '#9fd6c0';
  if (a.state !== 'active') {
    drawPerson(w, x, y + 3, { hair: Lt, skin: G, top: G, legs: D, kid: false }, Math.floor(a.ph) % 2, false);
    return;
  }
  for (let i = -1; i <= 3; i++) { dot('#b8c0c8', i + x, y + 4); dot('#8a949e', i + x, y + 5); }
  dot(Lt, x, y - 3); dot(Lt, x + 2, y - 3); dot(Lt, x + 1, y - 4);
  dot(G, x + 1, y - 2); dot(G, x, y - 1); dot(G, x + 1, y - 1); dot(G, x + 2, y - 1);
  for (let r = 0; r <= 3; r++) { dot(D, x, y + r); dot(G, x + 1, y + r); dot(G, x + 2, y + r); }
  dot(D, x - 1, y);
  const wave = a.react > 0 && Math.floor(a.react / 10) % 2;
  const flame = Math.floor(a.ph * 3) % 2 ? '#f5c400' : '#f5a030';
  if (wave) { dot(G, x + 3, y); dot(G, x + 4, y - 1); dot(flame, x + 4, y - 2); }
  else { dot(G, x + 3, y - 2); dot(G, x + 3, y - 3); dot(flame, x + 3, y - 4); }
}

/** Someone in a pigeon costume pacing and flapping; hops when tipped. */
export function drawMascot(a: Actor, dot: Dot) {
  const x = Math.round(a.x), y = a.y - 3 - (a.react > 0 && Math.floor(a.react / 8) % 2 ? 1 : 0);
  const flap = a.state === 'active' ? Math.floor(a.ph * (a.react > 0 ? 6 : 2)) % 2 : 0;
  const walk = a.state !== 'active' ? Math.floor(a.ph) % 2 : 0;
  const rows = ['.ggg.', '.gegb', '.nmn.', flap ? '.ggg.' : 'wgggw', flap ? 'wgggw' : '.ggg.', '.ggg.', walk ? '..p..' : '.p.p.'];
  const C: Record<string, string> = { g: '#a3a8b8', e: '#1c1c1c', b: '#f0a848', n: '#4fb390', m: '#9a6bc0', w: '#8a8f9e', p: '#e08a7a' };
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < 5; c++) {
      const ch = rows[r][c];
      if (ch === '.') continue;
      dot(C[ch], a.dir >= 0 ? x + c : x + 4 - c, y + r);
    }
  }
}

/** Breakdance crew with a boombox: one bounces, one spins on their head, one claps (or freezes when tipped). */
export function drawCrew(w: World, a: Actor, dot: Dot) {
  const x = Math.round(a.x), y = a.y, L = a.looks ?? [a.look!, a.look!, a.look!];
  if (a.state !== 'active') {
    for (let i = 0; i < 3; i++) drawPerson(w, x - a.dir * i * 5, y, L[i], Math.floor(a.ph + i) % 2, false);
    dot('#3a3f45', x - a.dir * 2 + 1, y + 3);
    return;
  }
  // Boombox
  dot('#3a3f45', x - 7, y + 3); dot('#3a3f45', x - 6, y + 3); dot('#3a3f45', x - 5, y + 3);
  dot('#3a3f45', x - 7, y + 4); dot('#9aa5b1', x - 6, y + 4); dot('#3a3f45', x - 5, y + 4);
  const b = Math.floor(a.ph * 3) % 2;
  drawPerson(w, x, y, L[0], b, false);
  dot(L[0].top, b ? x - 1 : x + 3, y + 1);
  const k = Math.floor(a.ph * 4) % 4, X = x + 5, M = L[1];
  if (k === 0) drawPerson(w, X, y, M, 0, false);
  else if (k === 2) {
    dot(M.legs, X + 1, y); dot(M.legs, X, y - 1); dot(M.legs, X + 2, y - 1); dot(M.legs, X + 1, y + 1);
    dot(M.top, X + 1, y + 2); dot(M.top, X, y + 3); dot(M.top, X + 1, y + 3); dot(M.top, X + 2, y + 3);
    dot(M.skin, X + 1, y + 4); dot(M.hair, X + 1, y + 5);
  } else {
    const f = k === 1 ? 1 : -1, c0 = X + 1;
    dot(M.hair, c0 - 2 * f, y + 5); dot(M.skin, c0 - f, y + 5); dot(M.top, c0, y + 5);
    dot(M.top, c0, y + 4); dot(M.legs, c0 + f, y + 4); dot(M.legs, c0 + 2 * f, y + 3);
  }
  const X2 = x + 10, N = L[2];
  if (a.react > 0) {
    dot(N.hair, X2 + 1, y + 3); dot(N.skin, X2 + 1, y + 4); dot(N.top, X2, y + 4); dot(N.top, X2 + 2, y + 2);
    dot(N.legs, X2 + 2, y + 1); dot(N.legs, X2 + 3, y); dot(N.top, X2 + 1, y + 5);
  } else {
    drawPerson(w, X2, y, N, 0, false);
    if (Math.floor(a.ph * 2) % 2) { dot(N.skin, X2 - 1, y + 2); dot(N.skin, X2 + 3, y + 2); }
  }
}

/** Chess hustler at a table; passers-by sometimes sit down for a game. */
export function drawChess(w: World, a: Actor, dot: Dot) {
  const x = Math.round(a.x), y = a.y;
  if (a.state !== 'active') { drawPerson(w, x, y + 2, a.look!, Math.floor(a.ph) % 2, false); return; }
  for (let i = 2; i < 8; i++) dot('#7a5a3a', x + i, y + 5);
  dot('#5a4028', x + 3, y + 6); dot('#5a4028', x + 6, y + 6); dot('#5a4028', x + 3, y + 7); dot('#5a4028', x + 6, y + 7);
  for (let i = 0; i < 4; i++) dot(i % 2 ? '#1c1c1c' : '#f6f2e8', x + 3 + i, y + 4);
  if (w.challenger) for (let i = 0; i < 4; i++) if (w.board[i]) dot(i % 2 ? '#f6f2e8' : '#1c1c1c', x + 3 + i, y + 3);
  drawPerson(w, x, y, a.look!, 0, true);
  if (w.challenger) drawPerson(w, x + 8, y, w.challenger.look, 0, true);
}
