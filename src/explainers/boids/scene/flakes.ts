// Things that drift: snow (only snow falls from the sky), spring petals and fall leaves (from the
// trees, settling on the lawn), and summer-night fireflies.

import { glow } from '../render/glow';
import { H, W, type Flake, type Season, type World } from '../world';
import { ev } from './calendar';
import { windFactor } from '../sim/wind';

export function makeFlakes(w: World, s: Season) {
  for (const o of w.flakes) o.dying = true;
  const e = ev(w);
  const n = s === 'winter' ? 70 : s === 'fall' ? 6 : s === 'spring' ? (e.id === 'blossom' ? 34 : 10) : 14;
  const cols = s === 'winter' ? ['#ffffff'] : s === 'fall' ? ['#f2c230', '#e3842f', '#c8512b'] : s === 'spring' ? ['#f4b6c8'] : ['#d8ff6a'];
  const firefly = s === 'summer';
  const fromTree = s === 'spring' || s === 'fall';
  const fresh: Flake[] = [];
  for (let i = 0; i < n; i++) {
    const c = cols[i % cols.length];
    if (fromTree) {
      fresh.push({ tree: true, x: Math.random() * W, y: 116 + Math.random() * 16, v: 0.05 + Math.random() * 0.07, vx: 0.08 + Math.random() * 0.15, ph: Math.random() * 6, c, wait: Math.floor(Math.random() * 600) });
    } else {
      fresh.push({ x: Math.random() * W, y: firefly ? 140 + Math.random() * 25 : -Math.random() * H * 1.5, v: firefly ? 0 : 0.2 + Math.random() * 0.35, ph: Math.random() * 6, c, ff: firefly });
    }
  }
  w.flakes = w.flakes.concat(fresh);
  w.flakeEv = e.id;
}

export function drawFlakes(w: World) {
  const ctx = w.ctx, F = w.flakes, n = w.nightAmt;
  // Everything drifting (not fireflies) is pushed sideways by the wind.
  const wf = Math.max(-2.5, Math.min(2.5, windFactor(w)));
  for (let i = F.length - 1; i >= 0; i--) {
    const f = F[i];
    f.ph += 0.03;
    if (f.dying && f.ff && Math.random() < 0.01) { F.splice(i, 1); continue; }
    if (f.ff) {
      if (n < 0.05 || Math.sin(f.ph * 3) < 0.2) continue;
      const fx = Math.round(f.x + Math.sin(f.ph) * 6), fy = Math.round(f.y + Math.cos(f.ph * 0.7) * 4);
      glow(w, fx, fy, 2, f.c, 0.5 * n);
      ctx.globalAlpha = n; ctx.fillStyle = f.c; ctx.fillRect(fx, fy, 1, 1); ctx.globalAlpha = 1;
      continue;
    }
    if (f.tree) {
      if ((f.wait ?? 0) > 0) { f.wait!--; continue; }
      f.ph += 0.04;
      f.y += f.v + Math.max(0, Math.sin(f.ph * 1.3)) * 0.05;
      if (!(f.land && f.y >= f.land)) f.x += (f.vx ?? 0) * wf + Math.sin(f.ph) * 0.18; // settled ones stay put
      const land = f.land || (f.land = 160 + Math.random() * 18);
      if (f.y >= land) {
        f.rest = (f.rest ?? 0) + 1;
        f.y = land;
        if (f.rest > 240) {
          if (f.dying) { F.splice(i, 1); continue; }
          f.rest = 0; f.land = 0; f.y = 116 + Math.random() * 16; f.x = Math.random() * W; f.wait = Math.floor(Math.random() * 300);
          continue;
        }
        ctx.globalAlpha = 1 - f.rest / 240;
      }
      if (f.x > W + 2) f.x = -2;
      else if (f.x < -2) f.x = W + 2;
      ctx.fillStyle = f.c; ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
      ctx.globalAlpha = 1;
      continue;
    }
    f.y += f.v;
    f.x += wf * 0.15;
    if (f.x > W + 2) f.x = -2;
    else if (f.x < -2) f.x = W + 2;
    if (f.y > H) {
      if (f.dying) { F.splice(i, 1); continue; }
      f.y = -2; f.x = Math.random() * W;
    }
    ctx.fillStyle = f.c;
    ctx.fillRect(Math.round(f.x + Math.sin(f.ph) * 2), Math.round(f.y), 1, 1);
  }
}
