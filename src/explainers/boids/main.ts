import '../../styles/main.css';
import { createStage, onDrag, runLoop } from '../../shared/stage';
import { ArchChallenge, Flock, WORLD, type Hawk, type Params } from './sim';
import { drawArchBase, drawArchVault, drawHawk, drawPigeon, drawWatched, renderBackground } from './render';

const PIGEONS = 80;
const GOAL = 30;
const WINDOW_MS = 2000;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const canvas = $<HTMLCanvasElement>('stage');
const hint = $('hint');
const watchBox = $<HTMLInputElement>('watch');
const pauseBtn = $<HTMLButtonElement>('pause');
const challengeEl = $('challenge');
const meter = $('meter');
const nowEl = $('now');
const bestEl = $('best');
const timeEl = $('time');
const wonTime = $('won-time');

const params: Params = { separation: 1.5, alignment: 1.0, cohesion: 1.0 };
const defaults = { ...params };
const sliders = (['separation', 'alignment', 'cohesion'] as const).map((key) => {
  const input = $<HTMLInputElement>(key);
  const out = $<HTMLOutputElement>(`${key}-out`);
  const sync = () => {
    params[key] = Number(input.value);
    out.value = params[key].toFixed(1);
  };
  input.addEventListener('input', sync);
  sync();
  return { key, input, sync };
});

const flock = new Flock(PIGEONS);
const hawk: Hawk = { x: 730, y: 540, tx: 730, ty: 540, active: false, angle: -Math.PI * 0.75 };
const challenge = new ArchChallenge(GOAL, WINDOW_MS);
let simTime = 0;
let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let background: HTMLCanvasElement | null = null;
const stage = createStage(canvas, WORLD, (scale) => {
  background = renderBackground(scale);
});

onDrag(canvas, WORLD, {
  start(x, y) {
    hawk.active = true;
    hawk.tx = x; hawk.ty = y;
    hint.classList.add('gone');
  },
  move(x, y) { hawk.tx = x; hawk.ty = y; },
  end() { hawk.active = false; },
});

$('reset').addEventListener('click', () => {
  flock.reset();
  challenge.reset();
  simTime = 0;
  Object.assign(params, defaults);
  for (const s of sliders) { s.input.value = String(defaults[s.key]); s.sync(); }
  hawk.x = hawk.tx = 730; hawk.y = hawk.ty = 540;
  updateHud();
});

const setPaused = (p: boolean) => {
  paused = p;
  pauseBtn.textContent = paused ? 'Play' : 'Pause';
  pauseBtn.setAttribute('aria-pressed', String(paused));
};
pauseBtn.addEventListener('click', () => setPaused(!paused));
setPaused(paused);

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function updateHud() {
  meter.style.width = `${Math.min(100, (challenge.current / GOAL) * 100)}%`;
  nowEl.textContent = String(challenge.current);
  bestEl.textContent = String(challenge.best);
  timeEl.textContent = fmt(challenge.wonAt ?? simTime);
  const won = challenge.wonAt !== null;
  challengeEl.classList.toggle('won', won);
  if (won) wonTime.textContent = fmt(challenge.wonAt!);
}

runLoop(canvas, (dt, now) => {
  if (!paused) {
    simTime += dt * (1000 / 60);
    flock.step(params, hawk, dt, (p) => challenge.record(p.id, simTime));
    challenge.update(simTime);
    updateHud();
  }

  const { ctx } = stage;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (background) ctx.drawImage(background, 0, 0);
  stage.begin();
  drawArchBase(ctx, challenge.wonAt === null);
  if (watchBox.checked) drawWatched(ctx, flock);
  for (const p of flock.pigeons) drawPigeon(ctx, p);
  drawArchVault(ctx);
  drawHawk(ctx, hawk, now);
});

// Expose for debugging in the console.
Object.assign(window, { __boids: { flock, hawk, params, challenge } });
