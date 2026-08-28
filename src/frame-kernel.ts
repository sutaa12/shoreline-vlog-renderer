import { FPS, FRAMES_PER_CYCLE, type FrameState } from './contracts';

export type FrameConsumer = (state: FrameState) => void;

export class FrameKernel {
  readonly fixedDelta = 1 / FPS;
  private consumers: FrameConsumer[] = [];
  private render: () => void;
  private running = false;
  private lastTime = 0;
  private accumulator = 0;
  frame = 0;

  constructor(render: () => void) {
    this.render = render;
  }

  subscribe(consumer: FrameConsumer): void {
    this.consumers.push(consumer);
  }

  state(): FrameState {
    const phaseFrame = this.frame % FRAMES_PER_CYCLE;
    return {
      frame: this.frame,
      deltaSeconds: this.fixedDelta,
      elapsedSeconds: this.frame * this.fixedDelta,
      phaseSeconds: phaseFrame * this.fixedDelta,
      phase01: phaseFrame / FRAMES_PER_CYCLE,
    };
  }

  step(count = 1, draw = true): FrameState {
    for (let index = 0; index < count; index += 1) {
      this.frame += 1;
      const state = this.state();
      for (const consumer of this.consumers) consumer(state);
    }
    if (draw) this.render();
    return this.state();
  }

  startInteractive(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const tick = (now: number): void => {
      if (!this.running) return;
      const elapsed = Math.min(0.1, (now - this.lastTime) / 1000);
      this.lastTime = now;
      this.accumulator += elapsed;
      while (this.accumulator >= this.fixedDelta) {
        this.step(1, false);
        this.accumulator -= this.fixedDelta;
      }
      this.render();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  stopInteractive(): void {
    this.running = false;
  }
}
