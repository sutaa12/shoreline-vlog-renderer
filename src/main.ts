import './style.css';
import {
  ACESFilmicToneMapping,
  Color,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { CaptureBridge } from './capture';
import { CharacterSystem } from './character';
import { CinematicSystem } from './cinematic';
import type { AppStatusSnapshot, EvidenceSnapshot, LifecycleState, QualityTier, RuntimeReport } from './contracts';
import { FRAMES_PER_CYCLE } from './contracts';
import { EnvironmentSystem } from './environment';
import { FrameKernel } from './frame-kernel';

const EXPECTED_PLATE = 'ce16e6892f7a7c369e73390a23fe1043f68446c3a565bd96a853d53e386d9fed';
const EXPECTED_VRM = '12c2b97e95e700783a6a550dc0eee2d7880aeedccef9ae67bc4c5a2f0f2631a2';

class AppStatus {
  lifecycle: LifecycleState = 'loading';
  qualityTier: QualityTier;
  message = 'Loading shoreline plate and character…';
  failures: string[] = [];
  private element = document.querySelector<HTMLElement>('#status');
  private copy = document.querySelector<HTMLElement>('#status-copy');

  constructor(qualityTier: QualityTier) {
    this.qualityTier = qualityTier;
    this.paint();
  }

  set(lifecycle: LifecycleState, message: string): void {
    this.lifecycle = lifecycle;
    this.message = message;
    if (lifecycle === 'fatal') this.failures.push(message);
    this.paint();
  }

  snapshot(): AppStatusSnapshot {
    return { lifecycle: this.lifecycle, qualityTier: this.qualityTier, message: this.message, failures: [...this.failures] };
  }

  private paint(): void {
    if (this.element) this.element.dataset.state = this.lifecycle;
    if (this.copy) this.copy.textContent = this.message;
  }
}

async function sha256(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Asset request failed at ${path} with HTTP ${response.status}. Restore the file and reload.`);
  const buffer = await response.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function assertHash(path: string, actual: string, expected: string): void {
  if (actual !== expected) throw new Error(`Asset hash mismatch at ${path}. Restore the recorded asset before continuing.`);
}

const params = new URLSearchParams(location.search);
const captureMode = params.get('capture') === '1';
document.body.dataset.capture = String(captureMode);
const requestedQuality = params.get('quality');
const qualityTier: QualityTier = requestedQuality === 'balanced' || requestedQuality === 'reduced' ? requestedQuality : 'high';
const status = new AppStatus(qualityTier);
const canvas = document.querySelector<HTMLCanvasElement>('#scene');
if (!canvas) throw new Error('Renderer canvas #scene is missing from index.html. Restore the application shell.');

const webgl2 = canvas.getContext('webgl2', { alpha: false, antialias: true, preserveDrawingBuffer: captureMode });
if (!webgl2) {
  status.set('fatal', 'WebGL2 is unavailable. Open this page in a current desktop browser with hardware acceleration enabled.');
  throw new Error(status.message);
}

const renderer = new WebGLRenderer({ canvas, context: webgl2, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: captureMode });
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.setClearColor(new Color(0xc7c3b8), 1);
const interactiveRatio = qualityTier === 'reduced' ? 0.75 : qualityTier === 'balanced' ? 0.9 : 1;
renderer.setPixelRatio(captureMode ? 1 : Math.min(window.devicePixelRatio, interactiveRatio));
renderer.setSize(window.innerWidth, window.innerHeight, false);

const scene = new Scene();
const camera = new PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.05, 100);
const outline = new OutlineEffect(renderer, { defaultThickness: 0.00225, defaultColor: [0.035, 0.032, 0.03], defaultAlpha: 0.78, defaultKeepAlive: true });
const environment = new EnvironmentSystem(scene, qualityTier);
const character = new CharacterSystem();
scene.add(character.group);
const cinematic = new CinematicSystem(camera);
const shot = document.querySelector<HTMLElement>('#shot');

const render = (): void => {
  outline.render(scene, camera);
};
const kernel = new FrameKernel(render);
kernel.subscribe((frame) => environment.update(frame));
kernel.subscribe((frame) => character.update(frame));
kernel.subscribe((frame) => {
  cinematic.update(frame);
  if (shot) shot.textContent = cinematic.snapshot().cue;
});

const snapshot = (): EvidenceSnapshot => ({
  frame: kernel.frame,
  phaseFrame: kernel.frame % FRAMES_PER_CYCLE,
  cinematic: cinematic.snapshot(),
  character: character.snapshot(),
  environment: environment.snapshot(),
});

const runtimeReport = (): RuntimeReport => {
  const gl = renderer.getContext();
  return {
    status: status.snapshot(),
    frame: kernel.frame,
    vrmLoaded: character.loaded,
    mtoonMaterials: character.mtoonMaterials,
    outlineActive: character.outlineActive,
    springSystems: character.springSystems,
    systems: {
      plateProjection: environment.plateLoaded,
      movingOcean: environment.oceanActive,
      sandReceiver: environment.sandActive,
      unevenRocks: environment.rocksActive,
      fogBridge: environment.fogBridgeActive,
      reflectionCue: environment.reflectionActive,
      contactShadow: environment.contactShadow,
    },
    cameraEnvelopeOk: cinematic.snapshot().envelopeOk,
    renderer: String(gl.getParameter(gl.RENDERER)),
    webglVersion: String(gl.getParameter(gl.VERSION)),
  };
};

let resolveReady!: () => void;
let rejectReady!: (error: Error) => void;
const ready = new Promise<void>((resolve, reject) => {
  resolveReady = resolve;
  rejectReady = reject;
});
const bridge = new CaptureBridge(ready, { renderer, kernel, qualityTier: () => qualityTier, snapshot, report: runtimeReport });
window.__SHORELINE__ = bridge;

async function initialize(): Promise<void> {
  try {
    const [plateHash, vrmHash] = await Promise.all([
      sha256('/assets/environment/iteration-03/shoreline-plate.webp'),
      sha256('/assets/character.vrm'),
    ]);
    assertHash('/assets/environment/iteration-03/shoreline-plate.webp', plateHash, EXPECTED_PLATE);
    assertHash('/assets/character.vrm', vrmHash, EXPECTED_VRM);
    await environment.initialize();
    await character.initialize();
    kernel.step(1, true);
    const report = runtimeReport();
    if (!Object.values(report.systems).every(Boolean)) throw new Error('Scene initialization did not activate every required coastal system. Reload after restoring the recorded assets.');
    if (qualityTier === 'high') status.set('ready', 'Shoreline ready');
    else status.set('degraded', `Shoreline ready at the ${qualityTier} quality tier. Select high quality for full-resolution evidence.`);
    resolveReady();
    if (!captureMode) kernel.startInteractive();
  } catch (reason) {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    status.set('fatal', error.message);
    rejectReady(error);
    console.error(error);
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  outline.setSize(window.innerWidth, window.innerHeight);
});

void initialize();
