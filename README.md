# NYC Algorithms

Explorable explanations of algorithms, set in New York City. Each explainer is its own page with a
short intro, an interactive canvas sandbox, and one small challenge.

Vite + vanilla TypeScript, no framework. Deployed to GitHub Pages by GitHub Actions on every push to
`main`.

## Explainers

| Line | Explainer | Path |
| --- | --- | --- |
| **B** | Boids: the pigeons of Washington Square | `explainers/boids/` |

## Develop

Requires Node 20.19+ or 22.12+ (see `.nvmrc`).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + build to dist/
```

## Layout

```
index.html                    home page (list of explainers)
explainers/<name>/index.html  one page per explainer (auto-discovered by vite.config.ts)
src/styles/main.css           shared styles
src/shared/stage.ts           responsive HiDPI canvas, pointer/touch drag, rAF loop
src/explainers/<name>/        explainer code
```

Each explainer keeps the algorithm (`sim.ts`) separate from the drawing (`render.ts`), so the art
can be replaced without touching the simulation.

## Add an explainer

1. Create `explainers/<name>/index.html` (copy the boids one for the structure: intro, `.sandbox`,
   `.challenge`).
2. Put its code in `src/explainers/<name>/` and load it with
   `<script type="module" src="/src/explainers/<name>/main.ts">`.
3. Add a card to the home page `index.html`.

The build picks up the new page automatically.

## Deploy

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages. In the repo settings,
**Pages → Source** must be set to **GitHub Actions**. The site uses a relative base path, so it
works at `https://<user>.github.io/<repo>/` under any repo name.
