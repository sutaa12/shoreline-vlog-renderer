import type { PerspectiveCamera, WebGLRenderer } from 'three';

export const FPS = 30;
export const PHASE_SECONDS = 24;
export const FRAMES_PER_CYCLE = FPS * PHASE_SECONDS;

export type LifecycleState = 'loading' | 'ready' | 'degraded' | 'fatal';
export type QualityTier = 'high' | 'balanced' | 'reduced';

export interface AppStatusSnapshot {
  lifecycle: LifecycleState;
  qualityTier: QualityTier;
  message: string;
  failures: string[];
}

export interface FrameState {
  frame: number;
  deltaSeconds: number;
  elapsedSeconds: number;
  phaseSeconds: number;
  phase01: number;
}

export interface CinematicSnapshot {
  cue: string;
  position: [number, number, number];
  target: [number, number, number];
  roll: number;
  fov: number;
  envelopeOk: boolean;
  maxEnvelopeRatio: number;
}

export interface CharacterSnapshot {
  loaded: boolean;
  mtoonMaterials: number;
  outlineActive: boolean;
  springSystems: number;
  pose: number[];
  secondary: number[];
}

export interface EnvironmentSnapshot {
  plateLoaded: boolean;
  oceanActive: boolean;
  sandActive: boolean;
  rocksActive: boolean;
  fogBridgeActive: boolean;
  reflectionActive: boolean;
  oceanPhase: number;
  waterEdge: number;
}

export interface EvidenceSnapshot {
  frame: number;
  phaseFrame: number;
  cinematic: CinematicSnapshot;
  character: CharacterSnapshot;
  environment: EnvironmentSnapshot;
}

export interface RuntimeReport {
  status: AppStatusSnapshot;
  frame: number;
  vrmLoaded: boolean;
  mtoonMaterials: number;
  outlineActive: boolean;
  springSystems: number;
  systems: {
    plateProjection: boolean;
    movingOcean: boolean;
    sandReceiver: boolean;
    unevenRocks: boolean;
    fogBridge: boolean;
    reflectionCue: boolean;
    contactShadow: boolean;
  };
  cameraEnvelopeOk: boolean;
  renderer: string;
  webglVersion: string;
}

export interface PerformanceReceipt {
  samples: number;
  warmupFrames: number;
  medianMs: number;
  p95Ms: number;
  longFramesOver33_34Ms: number;
  estimatedFps: number;
  renderer: string;
  resolution: [number, number];
  effectiveQualityTier: QualityTier;
}

export interface ShorelineApi {
  ready: Promise<void>;
  advance(frames: number): EvidenceSnapshot;
  snapshot(): EvidenceSnapshot;
  report(): RuntimeReport;
  measurePerformance(samples?: number): Promise<PerformanceReceipt>;
  recordTwoCycles(): Promise<string>;
}

export interface RenderContext {
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  render(): void;
}

declare global {
  interface Window {
    __SHORELINE__: ShorelineApi;
  }
}
