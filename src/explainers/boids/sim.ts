// Boids simulation: pure state + physics, no drawing. render.ts draws whatever is in here.

export const WORLD = { w: 800, h: 600 };

export interface Rect { x0: number; y0: number; x1: number; y1: number }

/** Washington Square Arch, seen from above. North (Fifth Ave) is up. */
export const ARCH = {
  piers: [
    { x0: 296, y0: 86, x1: 362, y1: 130 },
    { x0: 438, y0: 86, x1: 504, y1: 130 },
  ] as Rect[],
  opening: { x0: 362, x1: 438 },
  /** A pigeon crossing this line northbound, inside the opening, counts as "through the arch". */
  lineY: 108,
};

export const FOUNTAIN = { x: 400, y: 380, r: 70 };

export interface Params { separation: number; alignment: number; cohesion: number }

export interface Pigeon {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  /** Wing-beat phase, for animation. */
  phase: number;
  /** 0..1, how spooked by the hawk. Raises top speed. */
  panic: number;
  /** 0..1, flashes after passing through the arch. */
  glow: number;
}

export interface Hawk {
  x: number; y: number;
  /** Where the pointer wants the hawk to be. */
  tx: number; ty: number;
  active: boolean;
  angle: number;
}

/** Per-rule steering forces for one pigeon, for the "see what one pigeon sees" overlay. */
export interface Forces { sx: number; sy: number; ax: number; ay: number; cx: number; cy: number; neighbors: number[] }

export const VIEW_R = 60;
export const SEP_R = 22;
export const HAWK_R = 140;
const MAX_SPEED = 2.4;
const PANIC_SPEED = 4.6;
const MIN_SPEED = 0.9;
const MAX_FORCE = 0.06;
const EDGE = 40;
const PIER_R = 16;

const hypot = Math.hypot;

export class Flock {
  pigeons: Pigeon[] = [];
  /** Forces on pigeons[0] from the last step. */
  watched: Forces = { sx: 0, sy: 0, ax: 0, ay: 0, cx: 0, cy: 0, neighbors: [] };

  count: number;

  constructor(count: number) {
    this.count = count;
    this.reset();
  }

  reset() {
    this.pigeons = [];
    for (let i = 0; i < this.count; i++) {
      const a = Math.random() * Math.PI * 2;
      this.pigeons.push({
        id: i,
        x: 160 + Math.random() * 480,
        y: 300 + Math.random() * 250,
        vx: Math.cos(a) * MAX_SPEED * 0.6,
        vy: Math.sin(a) * MAX_SPEED * 0.6,
        phase: Math.random() * Math.PI * 2,
        panic: 0,
        glow: 0,
      });
    }
  }

  /** Advance one step. dt is in 60fps frames (1 = 16.7ms). */
  step(params: Params, hawk: Hawk, dt: number, onThroughArch: (p: Pigeon) => void) {
    const ps = this.pigeons;
    const n = ps.length;
    const fx = new Float32Array(n);
    const fy = new Float32Array(n);
    const VIEW2 = VIEW_R * VIEW_R;
    const SEP2 = SEP_R * SEP_R;

    for (let i = 0; i < n; i++) {
      const p = ps[i];
      const maxSp = MAX_SPEED + (PANIC_SPEED - MAX_SPEED) * p.panic;
      let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, seen = 0, close = 0;
      const neighbors: number[] | null = i === 0 ? [] : null;

      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const q = ps[j];
        const dx = q.x - p.x, dy = q.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= VIEW2) continue;
        seen++;
        neighbors?.push(j);
        ax += q.vx; ay += q.vy;
        cx += q.x; cy += q.y;
        if (d2 < SEP2 && d2 > 0.0001) {
          // Push away, harder the closer they are.
          sx -= dx / d2; sy -= dy / d2;
          close++;
        }
      }

      let f: [number, number];
      let Sx = 0, Sy = 0, Ax = 0, Ay = 0, Cx = 0, Cy = 0;
      if (close > 0) { f = steer(sx, sy, p, maxSp); Sx = f[0] * params.separation; Sy = f[1] * params.separation; }
      if (seen > 0) {
        f = steer(ax / seen, ay / seen, p, maxSp); Ax = f[0] * params.alignment; Ay = f[1] * params.alignment;
        f = steer(cx / seen - p.x, cy / seen - p.y, p, maxSp); Cx = f[0] * params.cohesion; Cy = f[1] * params.cohesion;
      }
      if (neighbors) this.watched = { sx: Sx, sy: Sy, ax: Ax, ay: Ay, cx: Cx, cy: Cy, neighbors };

      let Fx = Sx + Ax + Cx;
      let Fy = Sy + Ay + Cy;

      // A little wander so a calm flock still drifts around like real pigeons.
      Fx += (Math.random() - 0.5) * 0.04;
      Fy += (Math.random() - 0.5) * 0.04;

      // Turn back from the edges of the park.
      if (p.x < EDGE) Fx += 0.12 * (EDGE - p.x) / EDGE;
      if (p.x > WORLD.w - EDGE) Fx -= 0.12 * (p.x - (WORLD.w - EDGE)) / EDGE;
      if (p.y < EDGE / 2) Fy += 0.12 * (EDGE / 2 - p.y) / (EDGE / 2);
      if (p.y > WORLD.h - EDGE) Fy -= 0.12 * (p.y - (WORLD.h - EDGE)) / EDGE;

      // Steer around the arch's piers.
      for (const r of ARCH.piers) {
        const nx = clamp(p.x, r.x0, r.x1), ny = clamp(p.y, r.y0, r.y1);
        const dx = p.x - nx, dy = p.y - ny;
        const d = hypot(dx, dy);
        if (d > 0 && d < PIER_R) {
          const k = 0.25 * (1 - d / PIER_R);
          Fx += (dx / d) * k; Fy += (dy / d) * k;
        }
      }

      // Flee the hawk.
      if (hawk.active) {
        const dx = p.x - hawk.x, dy = p.y - hawk.y;
        const d = hypot(dx, dy);
        if (d < HAWK_R && d > 0) {
          const k = 1 - d / HAWK_R;
          Fx += (dx / d) * k * 0.5; Fy += (dy / d) * k * 0.5;
          p.panic = Math.max(p.panic, Math.min(1, k + 0.3));
        }
      }

      fx[i] = Fx; fy[i] = Fy;
    }

    for (let i = 0; i < n; i++) {
      const p = ps[i];
      const maxSp = MAX_SPEED + (PANIC_SPEED - MAX_SPEED) * p.panic;
      p.vx += fx[i] * dt; p.vy += fy[i] * dt;
      const sp = hypot(p.vx, p.vy);
      if (sp > maxSp) { p.vx *= maxSp / sp; p.vy *= maxSp / sp; }
      else if (sp < MIN_SPEED && sp > 0) { p.vx *= MIN_SPEED / sp; p.vy *= MIN_SPEED / sp; }

      const prevY = p.y;
      p.x += p.vx * dt; p.y += p.vy * dt;

      for (const r of ARCH.piers) pushOut(p, r);
      p.x = clamp(p.x, 2, WORLD.w - 2);
      p.y = clamp(p.y, 2, WORLD.h - 2);

      if (prevY >= ARCH.lineY && p.y < ARCH.lineY && p.x > ARCH.opening.x0 && p.x < ARCH.opening.x1) {
        p.glow = 1;
        onThroughArch(p);
      }

      p.panic *= Math.pow(0.985, dt);
      p.glow = Math.max(0, p.glow - 0.02 * dt);
      p.phase += dt * (0.2 + hypot(p.vx, p.vy) * 0.12);
    }

    // Hawk swoops toward the pointer rather than teleporting.
    const k = 1 - Math.pow(0.75, dt);
    const dx = hawk.tx - hawk.x, dy = hawk.ty - hawk.y;
    hawk.x += dx * k; hawk.y += dy * k;
    if (hypot(dx, dy) > 2) hawk.angle = Math.atan2(dy, dx);
  }
}

/** Reynolds steering: desired velocity (at full speed along dir) minus current velocity, capped. */
function steer(dx: number, dy: number, p: Pigeon, maxSp: number): [number, number] {
  const m = hypot(dx, dy);
  if (m === 0) return [0, 0];
  let x = (dx / m) * maxSp - p.vx;
  let y = (dy / m) * maxSp - p.vy;
  const f = hypot(x, y);
  if (f > MAX_FORCE) { x *= MAX_FORCE / f; y *= MAX_FORCE / f; }
  return [x, y];
}

function pushOut(p: Pigeon, r: Rect) {
  if (p.x <= r.x0 || p.x >= r.x1 || p.y <= r.y0 || p.y >= r.y1) return;
  const left = p.x - r.x0, right = r.x1 - p.x, top = p.y - r.y0, bottom = r.y1 - p.y;
  const m = Math.min(left, right, top, bottom);
  if (m === left) { p.x = r.x0; p.vx = -Math.abs(p.vx); }
  else if (m === right) { p.x = r.x1; p.vx = Math.abs(p.vx); }
  else if (m === top) { p.y = r.y0; p.vy = -Math.abs(p.vy); }
  else { p.y = r.y1; p.vy = Math.abs(p.vy); }
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Tracks "N different pigeons through the arch within a time window". */
export class ArchChallenge {
  goal: number;
  windowMs: number;
  best = 0;
  current = 0;
  wonAt: number | null = null;
  private events: { id: number; t: number }[] = [];

  constructor(goal: number, windowMs: number) {
    this.goal = goal;
    this.windowMs = windowMs;
  }

  reset() {
    this.events = [];
    this.best = 0;
    this.current = 0;
    this.wonAt = null;
  }

  record(id: number, t: number) {
    this.events.push({ id, t });
    this.update(t);
  }

  update(t: number) {
    this.events = this.events.filter((e) => t - e.t <= this.windowMs);
    this.current = new Set(this.events.map((e) => e.id)).size;
    this.best = Math.max(this.best, this.current);
    if (this.wonAt === null && this.current >= this.goal) this.wonAt = t;
  }
}
