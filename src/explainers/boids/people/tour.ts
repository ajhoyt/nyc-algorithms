// A walking tour: a guide in yellow with a flag, a few tourists (one kid). The tour stops once,
// the guide shares the next fact about the bird that's flying (see copy.ts), and the group
// snaps photos.

import { tourSequence } from '../copy';
import { wrap } from '../render/font3x5';
import { dayPhase, ev, isNight, openHours } from '../scene/calendar';
import { W, type Dot, type World } from '../world';
import { lookFor } from './crowd';
import { drawPerson } from './draw';

export function stepTour(w: World) {
  const T = w.tour;
  if (T.state === 'gone') {
    if (!openHours(w) || dayPhase(w) > 0.55 || ev(w).id === 'marathon') return;
    if (--T.cool > 0) return;
    T.state = 'walk'; T.x = -24; T.dir = 1; T.stopX = 60 + Math.random() * 190; T.stopped = false; T.t = 0;
    T.guide = lookFor(w, false);
    T.guide.top = '#f5c400';
    T.members = [lookFor(w, false), lookFor(w, false), lookFor(w, true), lookFor(w, false)];
    return;
  }
  if (T.state === 'walk') {
    const hurry = !openHours(w);
    T.x += hurry ? 0.5 : 0.2;
    T.ph = (T.ph ?? 0) + (hurry ? 0.25 : 0.12);
    if (!T.stopped && !isNight(w) && Math.abs(T.x - (T.stopX ?? 0)) < 0.2) { T.state = 'stop'; T.t = 0; T.stopped = true; }
    if (T.x > W + 30) { T.state = 'gone'; T.cool = 1200; }
  } else {
    T.t++;
    if (T.t === 40) {
      // Talk about whichever bird is flying right now.
      const H = tourSequence(w.species);
      if (H.length) {
        const i = (w.hintIdx[w.species] = ((w.hintIdx[w.species] ?? -1) + 1) % H.length);
        w.tourBub = { lines: wrap(H[i], 20), until: T.t + 300 };
      }
    }
    if (w.tourBub && T.t > w.tourBub.until) w.tourBub = null;
    if (T.t > 380 || !openHours(w)) { T.state = 'walk'; w.tourBub = null; }
  }
}

export function drawTour(w: World, dot: Dot) {
  const T = w.tour;
  if (!T.guide || !T.members) return;
  const x = Math.round(T.x), y = 167, stop = T.state === 'stop';
  const fr = stop ? 0 : Math.floor(T.ph ?? 0) % 2;
  T.members.forEach((m, i) => {
    const mx = x - 5 * (i + 1), my = y + (i % 2 ? -1 : 0);
    drawPerson(w, mx, my, m, stop ? 0 : (fr + i) % 2, false);
    if (stop && T.t > 50) {
      // Cameras out
      const by = m.kid ? my + 3 : my + 1;
      dot('#1c1c1c', mx + 1, by); dot('#1c1c1c', mx + 2, by);
    }
  });
  drawPerson(w, x, y, T.guide, fr, false);
  const raise = stop ? 2 : 0;
  dot('#5a4028', x + 3, y - 1 - raise); dot('#5a4028', x + 3, y - raise); dot('#5a4028', x + 3, y + 1 - raise); dot('#5a4028', x + 3, y + 2);
  dot('#1f5fa6', x + 4, y - 1 - raise); dot('#1f5fa6', x + 5, y - 1 - raise); dot('#1f5fa6', x + 4, y - raise);
}
