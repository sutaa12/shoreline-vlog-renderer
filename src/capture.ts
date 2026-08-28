import type { WebGLRenderer } from 'three';
import { FRAMES_PER_CYCLE, type EvidenceSnapshot, type PerformanceReceipt, type QualityTier, type RuntimeReport, type ShorelineApi } from './contracts';
import type { FrameKernel } from './frame-kernel';

interface CaptureSources {
  renderer: WebGLRenderer;
  kernel: FrameKernel;
  qualityTier: () => QualityTier;
  snapshot: () => EvidenceSnapshot;
  report: () => RuntimeReport;
}

const wait = (milliseconds: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export class CaptureBridge implements ShorelineApi {
  ready: Promise<void>;
  private readonly sources: CaptureSources;

  constructor(ready: Promise<void>, sources: CaptureSources) {
    this.ready = ready;
    this.sources = sources;
  }

  advance(frames: number): EvidenceSnapshot {
    if (!Number.isInteger(frames) || frames < 0 || frames > FRAMES_PER_CYCLE * 8) {
      throw new Error(`Capture advance rejected ${frames}. Use an integer from 0 through ${FRAMES_PER_CYCLE * 8}.`);
    }
    this.sources.kernel.step(frames, true);
    return this.sources.snapshot();
  }

  snapshot(): EvidenceSnapshot {
    return this.sources.snapshot();
  }

  report(): RuntimeReport {
    return this.sources.report();
  }

  async measurePerformance(samples = 240): Promise<PerformanceReceipt> {
    if (!Number.isInteger(samples) || samples < 60 || samples > 900) {
      throw new Error(`Performance sample count rejected ${samples}. Use an integer from 60 through 900.`);
    }
    const deltas: number[] = [];
    let previous = performance.now();
    while (deltas.length < samples) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const now = performance.now();
      deltas.push(now - previous);
      previous = now;
    }
    const sorted = [...deltas].sort((a, b) => a - b);
    const percentile = (ratio: number): number => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
    const median = percentile(0.5);
    const p95 = percentile(0.95);
    const gl = this.sources.renderer.getContext();
    return {
      samples,
      warmupFrames: this.sources.kernel.frame,
      medianMs: Number(median.toFixed(3)),
      p95Ms: Number(p95.toFixed(3)),
      longFramesOver33_34Ms: deltas.filter((delta) => delta > 33.34).length,
      estimatedFps: Number((1000 / median).toFixed(2)),
      renderer: String(gl.getParameter(gl.RENDERER)),
      resolution: [this.sources.renderer.domElement.width, this.sources.renderer.domElement.height],
      effectiveQualityTier: this.sources.qualityTier(),
    };
  }

  async recordTwoCycles(): Promise<string> {
    const canvas = this.sources.renderer.domElement;
    if (!('captureStream' in canvas) || typeof MediaRecorder === 'undefined') {
      throw new Error('Evidence capture is unavailable in this browser. Use a current Chromium build with canvas capture and MediaRecorder support.');
    }
    const supported = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type));
    if (!supported) throw new Error('Evidence export failed: this browser exposes no supported WebM MediaRecorder codec.');

    const phaseFrame = this.sources.kernel.frame % FRAMES_PER_CYCLE;
    if (phaseFrame !== 0) this.sources.kernel.step(FRAMES_PER_CYCLE - phaseFrame, true);
    for (let cycle = 0; cycle < 3; cycle += 1) this.sources.kernel.step(FRAMES_PER_CYCLE, false);
    this.sources.kernel.step(0, true);

    const stream = canvas.captureStream(0);
    const videoTrack = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
    if (!videoTrack || typeof videoTrack.requestFrame !== 'function') {
      for (const track of stream.getTracks()) track.stop();
      throw new Error('Evidence export failed: this browser cannot request deterministic canvas frames.');
    }
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, { mimeType: supported, videoBitsPerSecond: 10_000_000 });
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    const stopped = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = () => reject(new Error('Evidence export failed while MediaRecorder was encoding the two-cycle canvas stream.'));
    });
    const started = new Promise<void>((resolve) => {
      recorder.onstart = () => resolve();
    });
    recorder.start(1000);
    await started;
    const frameInterval = 1000 / 30;
    let target = performance.now();
    for (let frame = 0; frame < FRAMES_PER_CYCLE * 2; frame += 1) {
      this.sources.kernel.step(1, true);
      videoTrack.requestFrame();
      if (frame < FRAMES_PER_CYCLE * 2 - 1) {
        target += frameInterval;
        await wait(Math.max(0, target - performance.now()));
      }
    }
    await wait(frameInterval * 2);
    recorder.requestData();
    await wait(50);
    recorder.stop();
    await stopped;
    for (const track of stream.getTracks()) track.stop();
    const blob = new Blob(chunks, { type: supported });
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Evidence export failed while reading the encoded WebM.'));
      reader.readAsDataURL(blob);
    });
  }
}
