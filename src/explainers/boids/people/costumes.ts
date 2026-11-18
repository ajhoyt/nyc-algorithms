// Halloween costumes. A person is 3×6 pixels, so a costume is a colour scheme plus a few extra
// pixels (hat, ears, torch, tail…). Extras are in adult coordinates relative to the person's
// top-left: head at (1,0)–(1,1), torso (0..2,2) and (1,3), legs rows 4–5. Negative rows sit above
// the head; x 3+ is the right hand. Kids use the same extras shifted down 2, head and torso only.

import type { Look } from '../world';

type Px = [number, number, string];

interface Costume {
  skin?: string;
  hair?: string;
  top?: string;
  legs?: string;
  extras: Px[];
}

const K = '#1c1c1c';

export const COSTUMES: Record<string, Costume> = {
  // --- classic
  ghost: { skin: '#f2f2f2', hair: '#f2f2f2', top: '#f2f2f2', legs: '#f2f2f2', extras: [[0, 3, '#f2f2f2'], [2, 3, '#f2f2f2'], [0, 4, '#f2f2f2'], [2, 4, '#f2f2f2']] },
  witch: { skin: '#7fbf5a', hair: K, top: '#3a2a4a', legs: K, extras: [[0, 0, K], [2, 0, K], [1, -1, K], [2, -2, K], [3, 3, '#8a6a44'], [3, 4, '#c9a050']] },
  vampire: { skin: '#e6e6ee', hair: K, top: K, legs: K, extras: [[0, 1, '#a01a2a'], [2, 1, '#a01a2a'], [0, 3, '#a01a2a'], [2, 3, '#a01a2a']] },
  skeleton: { skin: '#f2f2f2', hair: '#f2f2f2', top: K, legs: K, extras: [[1, 2, '#f2f2f2'], [1, 4, '#f2f2f2']] },
  pumpkin: { hair: '#2e6b2e', top: '#e3842f', legs: '#2f353c', extras: [[0, 3, '#e3842f'], [2, 3, '#e3842f'], [1, 2, '#3a2a1a']] },
  mummy: { skin: '#e9e3cc', hair: '#e9e3cc', top: '#e9e3cc', legs: '#d9d0b8', extras: [[0, 2, '#c9c0a0'], [2, 3, '#e9e3cc']] },
  frankenstein: { skin: '#7fbf5a', hair: K, top: '#3a3f45', legs: K, extras: [[0, 0, K], [2, 0, K], [0, 1, '#9aa5b1'], [2, 1, '#9aa5b1']] },
  cat: { skin: K, hair: K, top: K, legs: K, extras: [[0, -1, K], [2, -1, K], [3, 4, K], [4, 3, K]] },
  // --- New York
  liberty: { skin: '#6fb59a', hair: '#9fd6c0', top: '#6fb59a', legs: '#4f9a80', extras: [[0, -1, '#9fd6c0'], [2, -1, '#9fd6c0'], [1, -2, '#9fd6c0'], [3, 1, '#6fb59a'], [3, 0, '#6fb59a'], [3, -1, '#f5c400']] },
  pizza: { hair: '#c9884a', top: '#f5c400', legs: '#2f353c', extras: [[0, 2, '#c9884a'], [2, 2, '#c9884a'], [1, 3, '#e0302a']] },
  taxi: { top: '#f5c400', legs: K, extras: [[1, -1, '#fff3a0'], [0, 3, K], [1, 3, '#ffffff'], [2, 3, K]] },
  yankees: { hair: '#1c2a4a', top: '#ffffff', legs: '#1c2a4a', extras: [[2, 0, '#1c2a4a'], [1, 2, '#1c2a4a']] },
  pizzaRat: { skin: '#8a8f9e', hair: '#8a8f9e', top: '#8a8f9e', legs: '#8a8f9e', extras: [[0, -1, '#e08a7a'], [2, -1, '#e08a7a'], [-1, 4, '#e08a7a'], [-2, 5, '#e08a7a'], [3, 2, '#f5c400'], [4, 2, '#c9884a'], [3, 3, '#e0302a']] },
  hotdog: { hair: '#c0582e', top: '#e0b070', legs: '#2f353c', extras: [[1, 2, '#c0582e'], [1, 3, '#f5c400'], [0, 3, '#e0b070'], [2, 3, '#e0b070']] },
};

const IDS = Object.keys(COSTUMES);

/** Not picked at random for Halloween; used by SantaCon. */
export const SANTACON: Record<string, Costume> = {
  santa: { hair: '#e0302a', top: '#e0302a', legs: '#e0302a', extras: [[2, -1, '#e0302a'], [3, -1, '#ffffff'], [1, 2, '#ffffff'], [1, 3, K]] },
  elf: { hair: '#2e9e4b', top: '#2e9e4b', legs: '#e0302a', extras: [[1, -1, '#2e9e4b'], [2, -2, '#e0302a'], [0, 1, '#f1c9a5'], [2, 1, '#f1c9a5']] },
  reindeer: { skin: '#8a5a30', hair: '#8a5a30', top: '#8a5a30', legs: '#6b4424', extras: [[0, -1, '#c9a050'], [-1, -2, '#c9a050'], [2, -1, '#c9a050'], [3, -2, '#c9a050'], [1, 1, '#e0302a']] },
};

/**
 * Easter Parade bonnets (Fifth Avenue's tradition of over-the-top hats). Drawn above the head;
 * the brim covers the hair.
 */
export const BONNETS: Record<string, Px[]> = {
  flowers: [[-1, 0, '#e8d8a8'], [0, 0, '#e8d8a8'], [1, 0, '#e8d8a8'], [2, 0, '#e8d8a8'], [3, 0, '#e8d8a8'], [0, -1, '#f4b6c8'], [1, -1, '#f4b6c8'], [2, -1, '#f4b6c8'], [0, -2, '#f08aa8'], [1, -2, '#ffffff'], [2, -2, '#f5e26a']],
  bunny: [[0, -1, '#ffffff'], [2, -1, '#ffffff'], [0, -2, '#ffffff'], [2, -2, '#ffffff'], [0, -3, '#ffffff'], [2, -3, '#ffffff'], [1, -1, '#f4b6c8']],
  tower: [[0, 0, '#b58ae0'], [2, 0, '#b58ae0'], [1, -1, '#9fd6c0'], [1, -2, '#f5e26a'], [1, -3, '#f4b6c8'], [1, -4, '#b58ae0'], [0, -5, '#f08aa8'], [2, -5, '#f08aa8'], [1, -5, '#ffffff']],
  empire: [[0, 0, '#cfd6dd'], [1, 0, '#cfd6dd'], [2, 0, '#cfd6dd'], [0, -1, '#cfd6dd'], [1, -1, '#cfd6dd'], [2, -1, '#cfd6dd'], [1, -2, '#cfd6dd'], [1, -3, '#cfd6dd'], [1, -4, '#8a949e']],
  eggs: [[-1, 0, '#c9a050'], [0, 0, '#c9a050'], [1, 0, '#c9a050'], [2, 0, '#c9a050'], [3, 0, '#c9a050'], [0, -1, '#7fc8f0'], [1, -1, '#f4b6c8'], [2, -1, '#f5e26a'], [1, -2, '#9fd6c0']],
};
const BONNET_IDS = Object.keys(BONNETS);

export function giveBonnet(L: Look): Look {
  L.hat = L.kid ? 'bunny' : BONNET_IDS[Math.floor(Math.random() * BONNET_IDS.length)];
  return L;
}

export function dressAs(L: Look, id: string): Look {
  const c = SANTACON[id];
  if (c.skin) L.skin = c.skin;
  if (c.hair) L.hair = c.hair;
  if (c.top) L.top = c.top;
  if (c.legs) L.legs = c.legs;
  L.costume = id;
  return L;
}

/** Dresses a look in a random costume (mutates and returns it). Kids also get a candy bucket. */
export function dressForHalloween(L: Look): Look {
  const id = IDS[Math.floor(Math.random() * IDS.length)];
  const c = COSTUMES[id];
  if (c.skin) L.skin = c.skin;
  if (c.hair) L.hair = c.hair;
  if (c.top) L.top = c.top;
  if (c.legs) L.legs = c.legs;
  L.costume = id;
  return L;
}

/** Plots a costume's extra pixels. `px(colour, dx, dy)` draws relative to the person. */
export function drawCostume(look: Look, px: (c: string, dx: number, dy: number) => void) {
  const c = look.costume ? COSTUMES[look.costume] ?? SANTACON[look.costume] : null;
  if (c) {
    for (const [dx, dy, col] of c.extras) {
      if (look.kid) { if (dy < 3) px(col, dx, dy + 2); }
      else px(col, dx, dy);
    }
  }
  // Trick-or-treat bucket (Halloween costumes only)
  if (look.kid && look.costume && COSTUMES[look.costume]) { px('#e3842f', 3, 5); px(K, 3, 4); }
  if (look.hat) for (const [dx, dy, col] of BONNETS[look.hat] ?? []) px(col, dx, look.kid ? dy + 2 : dy);
}
