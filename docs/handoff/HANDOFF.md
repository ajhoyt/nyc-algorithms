# Handoff: NYC Algos

A static site of playable explainers about the math behind New York, hosted on GitHub Pages.
The first explainer, boids, is fully prototyped. Everything here came out of design mockups, and the code is meant to be **rebuilt properly**, not copied as-is.

## What's in this folder
- `STYLE.md`: look, type, copy rules, rendering rules, scene layering, calendar.
- `design/Main.dc.html`: home page mockup.
- `design/Pigeons.dc.html`: the boids explainer, a full working simulation (the file name is historical).
- `design/Sprites.dc.html`: pigeon and starling sprite sheets.

The `.dc.html` files are Claude Design canvas files. They load a `support.js` runtime that is not included, so they won't open on their own.
The logic lives in the `class Component extends DCLogic` script at the bottom of each file: plain JS, React-class style (`state`, `setState`, `renderVals`).
Treat the markup and script as a reference spec.

## Target stack
- Vite + vanilla TypeScript, no framework. One page per explainer.
- GitHub Pages, deployed by GitHub Actions.
- All rendering runs client-side on `<canvas>`. No backend.

## Suggested module split for the boids page
- `sim/flock.ts`: boids step, species params (starling R=20/S=6, pigeon R=26/S=9), hawk/falcon threat
- `sim/games.ts`: modes (sandbox, wrangle, survive the falcon), falcon AI, group counting (union-find)
- `scene/paint.ts`: static painting per season (sky, far skyline, near city, bridge), night variants (darken + lit windows + baked glows)
- `scene/lake.ts`: reflections, ice, dock, boats, skaters
- `scene/foliage.ts`: per-pixel canopy that changes continuously through the year
- `scene/calendar.ts`: seasons, holidays, auto-cycle, cross-fades, ESB colors, holiday props, fireworks, ball drop, balloons
- `people/*.ts`: walkers (time-of-day crowds), bridge walkers, dock roles (rowers, skaters), couples and proposals, performers (busker, living statue, pigeon mascot, breakdance crew, chess hustler), tour guide, tipping
- `render/sprites.ts`, `render/glow.ts`, `render/font3x5.ts` (pixel font for speech bubbles)
- `ui/`: mode buttons, in-canvas dialogs (title/description/START/BACK), HUD chips, sliders, bird chooser

## Behavior to preserve
- Sandbox: bird count slider (10–250), separation/alignment/cohesion sliders, "what one bird sees" toggle, drag to become a hawk.
- Wrangle: birds start scattered with alignment and cohesion at 0. Win when one group holds ≥75% of the birds for 2 s. The hawk can herd.
- Survive the Falcon: 80 birds, 30 s. The falcon targets the most isolated bird, and its catch chance drops as the target has more neighbors (confusion effect).
- Challenges open as a dialog inside the canvas. The page layout never shifts height.
- Bird chooser: two boxes (sprite + name). The starling box shows current-season plumage.
- No user controls for season, holiday or time of day. They only auto-cycle.

## Known issues / to tune
- Falcon balance is narrow (headless runs: about 62/80 survive with no cohesion vs. about 77/80 with a tight flock). Needs playtesting.
- Wrangle can take about 60 s without herding.
- None of the visuals were checked in a real browser during prototyping; logic was run headless only. Do a visual pass.
- Home page thumbnail for the bird explainer still shows the old Washington Square arch.
- Performance: O(n²) boids is fine to ~250 birds; use a spatial grid if you go higher.
- Possible future: the 9/11 Tribute in Light was discussed and left out. Only add it as a quiet night with no gags.

## Placeholders (owner writes all copy)
`[TITLE]`, `[INTRO]`, `[STORY HEADLINE]`, `[STORY]`, `[ILLUSTRATION: CENTRAL PARK, 1890]`, `[HINT]`, `[TOGGLE LABEL]`, `[DESCRIPTION]`, `[RESULT]`, `[HEADLINE]`, `[BUTTON]`, `[SECTION]`, tour hints list, bird chatter list.

## Kickoff prompt
> Read HANDOFF.md and STYLE.md, then the mockups in design/. Scaffold the site (Vite + vanilla TS, GitHub Pages via Actions). Rebuild the home page and the boids explainer to match the mockups, split into the modules listed in HANDOFF.md before adding anything new. Keep all copy as placeholders. When it runs, do a visual pass in the browser against the known issues list.
