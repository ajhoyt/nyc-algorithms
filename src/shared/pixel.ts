// Pixel-art helpers shared by the home page and explainers.

/** Deterministic Park–Miller generator, so painted scenes look the same every load. */
export function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** Pixel cloud: overlapping discs with a shaded underside and a dithered edge. */
export function cloud(x: CanvasRenderingContext2D, cx: number, cy: number, s: number, rnd: () => number) {
  const C = [[0, 0, 1], [-1.15, 0.35, 0.72], [1.15, 0.4, 0.68], [0.55, -0.55, 0.72], [-0.55, -0.4, 0.62], [-1.9, 0.6, 0.45], [1.9, 0.65, 0.42]];
  const bottom = cy + s * 0.75;
  const inside = (px: number, py: number) => {
    if (py > bottom) return false;
    for (const k of C) {
      const dx = px - (cx + k[0] * s), dy = py - (cy + k[1] * s), r = k[2] * s;
      if (dx * dx + dy * dy <= r * r) return true;
    }
    return false;
  };
  for (let py = Math.floor(cy - s * 1.4); py <= bottom + 1; py++) {
    for (let px = Math.floor(cx - s * 2.5); px <= cx + s * 2.5; px++) {
      if (inside(px, py)) {
        const shade = (py > cy + s * 0.35 && rnd() < 0.7) || py > cy + s * 0.55;
        x.fillStyle = shade ? '#e4ebf2' : rnd() < 0.06 ? '#f1f5f9' : '#ffffff';
        x.fillRect(px, py, 1, 1);
      } else if (rnd() < 0.45 && (inside(px + 1, py) || inside(px - 1, py) || inside(px, py + 1) || inside(px, py - 1))) {
        x.fillStyle = rnd() < 0.5 ? '#d6e8f6' : '#2a62a8';
        x.fillRect(px, py, 1, 1);
      }
    }
  }
}

/** Mosaic sky: each pixel picks from a small palette by height, plus jitter. */
export function mosaicSky(x: CanvasRenderingContext2D, w: number, h: number, palette: string[], rnd: () => number) {
  for (let y = 0; y < h; y++) {
    for (let xx = 0; xx < w; xx++) {
      const v = (y / h) * (palette.length - 1) + (rnd() - 0.5) * 1.1;
      x.fillStyle = palette[Math.max(0, Math.min(palette.length - 1, Math.round(v)))];
      x.fillRect(xx, y, 1, 1);
    }
  }
}

