import '../../styles/main.css';
import { advanceAuto, updateFades } from './scene/calendar';
import { stepSky } from './scene/holidays';
import { ensureScene } from './scene/paint';
import { stepPeople } from './people/crowd';
import { stepFlock, spawn, syncCount } from './sim/flock';
import { falconStep, wrangleStep } from './sim/games';
import { stepWind } from './sim/wind';
import { drawFrame } from './render/frame';
import { updateBubble } from './render/font3x5';
import { falconSprites, hawkSprites } from './render/sprites';
import { mountUi } from './ui/controls';
import { createWorld, type Season, type World } from './world';

const STEP_MS = 16.67;

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const w = createWorld(canvas, hawkSprites(), falconSprites());
spawn(w, w.count, false);
const ui = mountUi(w);

let prevT = 0;
let lastHud = 0;
let raf = 0;
let running = false;

function tick(t: number) {
  raf = requestAnimationFrame(tick);
  const dt = prevT ? Math.min(100, t - prevT) : STEP_MS;
  prevT = t;
  w.t = t;
  w.frameDt = dt;
  advanceAuto(w, dt);
  if (ensureScene(w)) ui.portraits();
  updateFades(w, dt);
  syncCount(w);
  // Fixed-rate simulation, at most 4 steps per frame.
  w.acc += dt;
  let steps = 0;
  while (w.acc >= STEP_MS && steps < 4) {
    stepWind(w);
    stepFlock(w);
    if (w.mode === 'survive') falconStep(w);
    if (w.mode === 'wrangle') wrangleStep(w);
    stepPeople(w);
    stepSky(w);
    w.acc -= STEP_MS;
    steps++;
  }
  if (steps === 4) w.acc = 0;
  updateBubble(w);
  drawFrame(w);
  if (t - lastHud > 200) { lastHud = t; ui.sync(); }
}

function start() {
  if (running) return;
  running = true;
  prevT = 0;
  raf = requestAnimationFrame(tick);
}
function stop() {
  running = false;
  cancelAnimationFrame(raf);
}

// Pause while the scene is off-screen or the tab is hidden.
let onScreen = true;
const update = () => (onScreen && !document.hidden ? start() : stop());
new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; update(); }).observe(canvas);
document.addEventListener('visibilitychange', update);
start();

// Dev-only hook for checking seasons and holidays without waiting for the calendar.
if (import.meta.env.DEV) {
  Object.assign(window, {
    __birds: {
      w,
      jump(season: Season, event = 0, night = false) {
        w.calSeason = season; w.event = event; w.night = night; w.autoClock = 0;
        w.nightAmt = night ? 1 : 0;
        w.esbEvId = null;
        w.nightClock = 0;
      },
    } satisfies { w: World; jump: unknown },
  });
}
