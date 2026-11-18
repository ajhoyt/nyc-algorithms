// Bird, hawk and falcon sprites. Sprites never rotate: each bird has
// 3 flap frames × 5 shear angles × left/right, indexed ((k + 2) * 3 + frame) * 2 + flip.

import { makeCanvas, type Season, type Species } from '../world';

type Rows = string[];

function paint(rows: Rows[], w: number, h: number, colour: (ch: string) => string, rowOffset: number, shear: number, flipW: number) {
  const out: HTMLCanvasElement[] = [];
  for (let k = -2; k <= 2; k++) {
    for (let f = 0; f < rows.length; f++) {
      for (let fl = 0; fl < 2; fl++) {
        const [c, x] = makeCanvas(w, h);
        const F = rows[f];
        for (let row = 0; row < F.length; row++) {
          for (let col = 0; col < F[row].length; col++) {
            const ch = F[row][col];
            if (ch === '.') continue;
            x.fillStyle = colour(ch);
            x.fillRect(fl ? flipW - col : col, row + rowOffset + Math.round((col - (flipW >> 1)) * k * shear), 1, 1);
          }
        }
        out.push(c);
      }
    }
  }
  return out;
}

/** Starling 7×4; plumage changes by season. */
export function starlingSprites(season: Season): HTMLCanvasElement[] {
  const glossy = season === 'summer' || season === 'spring';
  const P: Record<string, string> = { k: '#1b1f2b', p: glossy ? '#6a55a8' : '#4a3f6e', g: glossy ? '#2f8a6e' : '#2c5a50' };
  const spotA = season !== 'summer';
  const spotB = season === 'fall' || season === 'winter';
  const bill = glossy ? '#f2c230' : '#3b3b44';
  const F: Rows[] = [
    ['..p....', '..sp...', 'kskwgky', '.......'],
    ['.......', '.ps....', 'kkswgky', '.......'],
    ['.......', '.......', 'kskwgky', '..sp...'],
  ];
  const colour = (ch: string) =>
    ch === 'y' ? bill : ch === 'w' ? (spotA ? '#f1ead2' : P.k) : ch === 's' ? (spotB ? '#e9e3cc' : P.k) : P[ch];
  return paint(F, 7, 10, colour, 3, 0.45, 6);
}

/** Pigeon 9×6; same in every season. */
export function pigeonSprites(): HTMLCanvasElement[] {
  const P: Record<string, string> = { g: '#a3a8b8', d: '#5d6275', w: '#d6d8e0', n: '#4fb390', m: '#9a6bc0', b: '#f0a848', k: '#3a3d4d' };
  const F: Rows[] = [
    ['..w......', '..dw.....', '...dg.mn.', 'kkggggnnb', '.ggggg...', '.........'],
    ['.........', '.........', '.wwdg.mn.', 'kkggggnnb', '.ggggg...', '.........'],
    ['.........', '.........', '....g.mn.', 'kkgddgnnb', '.gdddg...', '..dd.....'],
  ];
  return paint(F, 9, 14, (ch) => P[ch], 4, 0.4, 8);
}

export const SPECIES: Record<Species, { R: number; S: number; ox: number; oy: number }> = {
  starling: { R: 20, S: 6, ox: 3, oy: 5 },
  pigeon: { R: 26, S: 9, ox: 4, oy: 7 },
};

export function birdSprites(species: Species, season: Season) {
  return species === 'pigeon' ? pigeonSprites() : starlingSprites(season);
}

/** Index into a bird sheet for a given flap frame and velocity. */
export function spriteIndex(frame: number, vx: number, vy: number) {
  const ang = Math.atan2(vy, Math.abs(vx));
  const k = Math.max(-2, Math.min(2, Math.round(ang / (Math.PI / 8))));
  return ((k + 2) * 3 + frame) * 2 + (vx < 0 ? 1 : 0);
}

function sheet(frames: string[][], P: Record<string, string>): HTMLCanvasElement[] {
  const w = frames[0][0].length, h = frames[0].length;
  const out: HTMLCanvasElement[] = [];
  for (const F of frames) {
    for (let fl = 0; fl < 2; fl++) {
      const [c, x] = makeCanvas(w, h);
      for (let r = 0; r < h; r++) {
        for (let col = 0; col < w; col++) {
          const ch = F[r][col];
          if (ch === '.') continue;
          x.fillStyle = P[ch];
          x.fillRect(fl ? w - 1 - col : col, r, 1, 1);
        }
      }
      out.push(c);
    }
  }
  return out;
}

/** Wing-beat cycle shared by the hawk and falcon: up, level, down, level. */
export const FLAP = [0, 1, 2, 1];

/** Falcon 9×4 (the AI hunter): 3 flap frames × right/left, indexed frame * 2 + flip. */
export function falconSprites(): HTMLCanvasElement[] {
  return sheet(
    [
      ['..s......', '...ss....', 'ksssssky.', '.....w...'],
      ['.........', '..ssss...', 'ksssssky.', '.....w...'],
      ['.........', '.........', 'ksssssky.', '..sssw...'],
    ],
    { s: '#5b6878', k: '#2a2f38', w: '#e8e2d4', y: '#f2c230' },
  );
}

/**
 * Red-tailed hawk 11×7 (the player), side view: dark brown back, pale belly, rufous tail.
 * 3 flap frames × right/left, indexed frame * 2 + flip. Centre is (5, 3).
 */
export function hawkSprites(): HTMLCanvasElement[] {
  const body = ['rrdddddddey', '.rbbbbbbd..'];
  return sheet(
    [
      ['...kkh.....', '....khh....', '.....hhd...', body[0], body[1], '...........', '...........'],
      ['...........', '...........', '...khhhhd..', body[0], body[1], '...........', '...........'],
      ['...........', '...........', '...........', body[0], body[1], '....dhhh...', '...kkh.....'],
    ],
    { k: '#3a2414', d: '#6e4424', h: '#8a5530', b: '#e2c49a', r: '#c0582e', e: '#1c1c1c', y: '#f2c230' },
  );
}

/** Draws the level, mid-flap portrait used in the bird chooser. */
export function drawPortrait(c: HTMLCanvasElement, species: Species, season: Season) {
  c.width = 11;
  c.height = 10;
  const x = c.getContext('2d')!;
  x.imageSmoothingEnabled = false;
  x.clearRect(0, 0, 11, 10);
  const spr = birdSprites(species, season);
  const [ox, oy] = species === 'pigeon' ? [1, -2] : [2, 0];
  x.drawImage(spr[(2 * 3 + 1) * 2], ox, oy);
}
