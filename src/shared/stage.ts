// Shared helpers for explainer sandboxes: a fixed-size "world" drawn into a responsive,
// HiDPI-aware canvas, plus a pointer API (mouse + touch + pen) in world coordinates.

export interface Stage {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** Device pixels per world unit. */
  scale: number;
  /** Call before drawing a frame; sets the world transform. */
  begin(): void;
}

export function createStage(
  canvas: HTMLCanvasElement,
  world: { w: number; h: number },
  onResize?: (scale: number) => void,
): Stage {
  const ctx = canvas.getContext('2d')!;
  const stage: Stage = {
    canvas,
    ctx,
    scale: 1,
    begin() {
      ctx.setTransform(stage.scale, 0, 0, stage.scale, 0, 0);
    },
  };
  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || world.w;
    stage.scale = (cssW / world.w) * dpr;
    canvas.width = Math.round(world.w * stage.scale);
    canvas.height = Math.round(world.h * stage.scale);
    onResize?.(stage.scale);
  };
  new ResizeObserver(fit).observe(canvas);
  fit();
  return stage;
}

export interface DragHandlers {
  start(x: number, y: number): void;
  move(x: number, y: number): void;
  end(): void;
}

/** One-pointer drag in world coordinates. Works for mouse, touch and pen. */
export function onDrag(canvas: HTMLCanvasElement, world: { w: number; h: number }, h: DragHandlers) {
  let activeId: number | null = null;
  const toWorld = (e: PointerEvent): [number, number] => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * world.w, ((e.clientY - r.top) / r.height) * world.h];
  };
  canvas.addEventListener('pointerdown', (e) => {
    if (activeId !== null) return;
    activeId = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
    h.start(...toWorld(e));
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId === activeId) h.move(...toWorld(e));
  });
  const stop = (e: PointerEvent) => {
    if (e.pointerId !== activeId) return;
    activeId = null;
    canvas.classList.remove('dragging');
    h.end();
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
}

/** requestAnimationFrame loop that pauses while the element is off-screen. dt is in 60fps frames. */
export function runLoop(el: Element, frame: (dt: number, now: number) => void) {
  let visible = true;
  let last = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    const dt = Math.min((now - last) / (1000 / 60), 2);
    last = now;
    frame(dt, now);
    raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !visible) {
      visible = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    } else if (!entry.isIntersecting && visible) {
      visible = false;
      cancelAnimationFrame(raf);
    }
  }).observe(el);
  raf = requestAnimationFrame(tick);
}
