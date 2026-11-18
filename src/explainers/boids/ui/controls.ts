// DOM side of the explainer: mode buttons, in-canvas dialogs, HUD chips, sliders, bird chooser,
// presets, and pointer input for the hawk. Dialogs and HUD overlay the canvas, so the page never
// changes height.

import { setSpecies, spawn } from '../sim/flock';
import { setWeights, startGame, SURVIVE_BIRDS } from '../sim/games';
import { drawPortrait } from '../render/sprites';
import { H, W, type Mode, type Species, type World } from '../world';

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll(sel)] as T[];

const fmtClock = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

export interface Ui {
  /** Re-reads the world into the DOM. Cheap; call on change and a few times a second. */
  sync(): void;
  /** Redraws the bird chooser portraits (starling plumage follows the season). */
  portraits(): void;
}

export function mountUi(w: World): Ui {
  const sliders = {
    count: $<HTMLInputElement>('#r-count'),
    sep: $<HTMLInputElement>('#r-sep'),
    ali: $<HTMLInputElement>('#r-ali'),
    coh: $<HTMLInputElement>('#r-coh'),
  };
  const sight = $<HTMLInputElement>('#sight');
  const panels = {
    hudSurvive: $('#hud-survive'), hudWrangle: $('#hud-wrangle'),
    dlgWrangle: $('#dlg-wrangle'), dlgSurvive: $('#dlg-survive'),
    overSurvive: $('#over-survive'), overWrangle: $('#over-wrangle'),
  };

  const bind = (name: string, value: string) => {
    for (const el of $$(`[data-bind="${name}"]`)) if (el.textContent !== value) el.textContent = value;
  };
  const show = (el: HTMLElement, on: boolean) => { if (el.hidden === on) el.hidden = !on; };

  function sync() {
    const mode = w.mode;
    for (const b of $$<HTMLButtonElement>('#modes [data-mode]')) {
      const on = b.dataset.mode === mode;
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('btn-accent', on);
    }
    for (const b of $$<HTMLButtonElement>('[data-species]')) b.setAttribute('aria-pressed', String(b.dataset.species === w.species));

    bind('count', String(w.count));
    bind('sep', w.w.sep.toFixed(1));
    bind('ali', w.w.ali.toFixed(1));
    bind('coh', w.w.coh.toFixed(1));
    sliders.count.value = String(w.count);
    sliders.sep.value = String(w.w.sep);
    sliders.ali.value = String(w.w.ali);
    sliders.coh.value = String(w.w.coh);
    sliders.count.disabled = mode !== 'sandbox';
    sight.checked = w.sightOn;

    const survSecs = Math.max(0, Math.ceil(w.timeLeft / 1000));
    const elapsedSecs = Math.floor(w.elapsed / 1000);
    bind('alive', String(w.birds.length));
    bind('total', String(SURVIVE_BIRDS));
    bind('survSecs', fmtClock(survSecs));
    bind('flocks', String(w.flocks));
    bind('clock', fmtClock(elapsedSecs));

    show(panels.hudSurvive, mode === 'survive' && !w.over && !w.dialog);
    show(panels.hudWrangle, mode === 'wrangle' && !w.over && !w.dialog);
    show(panels.dlgWrangle, w.dialog === 'wrangle');
    show(panels.dlgSurvive, w.dialog === 'survive');
    show(panels.overSurvive, mode === 'survive' && w.over);
    show(panels.overWrangle, mode === 'wrangle' && w.over);
  }

  function portraits() {
    const season = w.season ?? 'winter';
    drawPortrait($<HTMLCanvasElement>('#portrait-starling'), 'starling', season);
    drawPortrait($<HTMLCanvasElement>('#portrait-pigeon'), 'pigeon', season);
  }

  // Modes: sandbox switches at once; challenges open a dialog first.
  for (const b of $$<HTMLButtonElement>('#modes [data-mode]')) {
    b.addEventListener('click', () => {
      const m = b.dataset.mode as Mode;
      if (m === 'sandbox') { if (w.mode !== 'sandbox') startGame(w, 'sandbox'); else w.dialog = null; }
      else w.dialog = m;
      sync();
      if (w.dialog) $<HTMLButtonElement>(`#dlg-${w.dialog} [data-act="start"]`).focus();
    });
  }
  for (const el of $$<HTMLButtonElement>('[data-act]')) {
    el.addEventListener('click', () => {
      const act = el.dataset.act;
      if (act === 'start' && w.dialog) startGame(w, w.dialog);
      else if (act === 'close') w.dialog = null;
      else if (act === 'again') startGame(w, w.mode);
      else if (act === 'back') startGame(w, 'sandbox');
      sync();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && w.dialog) { w.dialog = null; sync(); }
  });

  for (const b of $$<HTMLButtonElement>('[data-species]')) {
    b.addEventListener('click', () => {
      const sp = b.dataset.species as Species;
      if (w.species === sp) return;
      setSpecies(w, sp);
      sync();
    });
  }

  sliders.count.addEventListener('input', () => { w.count = parseInt(sliders.count.value, 10); sync(); });
  for (const key of ['sep', 'ali', 'coh'] as const) {
    sliders[key].addEventListener('input', () => {
      const v = parseFloat(sliders[key].value);
      if (!isNaN(v)) { w.w[key] = v; sync(); }
    });
  }
  sight.addEventListener('change', () => { w.sightOn = sight.checked; });
  $('#preset-tight').addEventListener('click', () => { setWeights(w, 0.6, 2.0, 1.8); sync(); });
  $('#preset-chaos').addEventListener('click', () => { setWeights(w, 3.0, 0, 0); sync(); });
  $('#reset').addEventListener('click', () => {
    if (w.mode !== 'sandbox') startGame(w, w.mode);
    else { setWeights(w, 1.2, 1.0, 1.0); spawn(w, w.count, false); }
    sync();
  });

  // Hawk: a mouse controls it just by hovering; touch and pen while pressed.
  const c = w.canvas;
  const toLocal = (e: PointerEvent): [number, number] => {
    const r = c.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };
  const move = (e: PointerEvent) => {
    if (w.mode === 'survive') return;
    if (e.pointerType !== 'mouse' && !w.hawk.down) return;
    const [x, y] = toLocal(e);
    w.hawk.on = true; w.hawk.x = x; w.hawk.y = y;
  };
  c.addEventListener('pointermove', move);
  c.addEventListener('pointerdown', (e) => {
    w.hawk.down = true;
    move(e);
    try { c.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
  });
  c.addEventListener('pointerup', (e) => { w.hawk.down = false; if (e.pointerType !== 'mouse') w.hawk.on = false; });
  c.addEventListener('pointercancel', () => { w.hawk.on = false; w.hawk.down = false; });
  c.addEventListener('pointerleave', () => { w.hawk.on = false; w.hawk.down = false; });

  sync();
  return { sync, portraits };
}
