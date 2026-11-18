# NYC Algos

Playable explainers about the math behind New York, in tile-mosaic pixel art. Static site, Vite +
vanilla TypeScript, deployed to GitHub Pages by GitHub Actions on every push to `main`.

The design handoff (spec, style guide, original Claude Design mockups) lives in
[`docs/handoff/`](docs/handoff/). All prose is written by the owner. Pages use `[PLACEHOLDERS]` until then.

## Develop

Requires Node 20.19+ or 22.12+ (see `.nvmrc`).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + build to dist/
```

In dev, the console exposes `__birds.jump(season, event, night)` on the birds page to preview
seasons and holidays without waiting for the calendar (e.g. `__birds.jump('summer', 1, true)` for
July 4th night). It is not included in production builds.

## Layout

```
index.html                         home page
explainers/<name>/index.html       one page per explainer (auto-discovered by vite.config.ts)
src/styles/main.css                shared styles (see docs/handoff/STYLE.md)
src/shared/pixel.ts                rng, mosaic sky, pixel clouds
src/home/main.ts                   home hero + thumbnails

src/explainers/boids/              "Birds of Central Park"
  copy.ts                          owner-edited lists: tour-guide hints, bird chatter
  world.ts                         shared state, constants, types
  main.ts                          loop (fixed 60 Hz sim, pauses off-screen)
  sim/flock.ts                     boids step, species, threat
  sim/games.ts                     sandbox / wrangle / survive the falcon, union-find groups
  scene/calendar.ts                auto-cycling seasons + holidays, cross-fades
  scene/paint.ts                   static painted layers per season, night versions
  scene/lake.ts                    reflections, ice, boats, skaters
  scene/foliage.ts                 per-pixel canopy through the year
  scene/flakes.ts                  snow, petals, leaves, fireflies
  scene/holidays.ts                ESB lights, Times Square, fireworks, ball drop, props
  people/*.ts                      walkers, performers, tour, bridge crossers
  render/*.ts                      sprites, glow, 3×5 font + speech bubbles, frame order
  ui/controls.ts                   DOM: modes, dialogs, HUD, sliders, bird chooser, hawk input
```

Page copy (title, intro, hints, dialog text, story) is in `explainers/boids/index.html`.

## Add an explainer

1. Create `explainers/<name>/index.html` (copy the header/footer from the birds page).
2. Put its code in `src/explainers/<name>/` and load it with
   `<script type="module" src="/src/explainers/<name>/main.ts">`.
3. Turn its card on the home page (`index.html`) from `soon` into a link.

## Deploy

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages
(Settings → Pages → Source: GitHub Actions). The site uses a relative base path, so it works at
`https://<user>.github.io/<repo>/`.
