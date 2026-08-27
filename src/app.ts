import * as THREE from "three";
import { loadCharacter, type CharacterRuntime } from "./character";
import {
  CINEMATIC_DURATION_SECONDS,
  FIXED_STEP_SECONDS,
  FixedStepShotClock,
  type CinematicSample,
} from "./cinematic";
import { createShorelineScene, type QualityTier, type SceneSystemState, type ShorelineScene } from "./scene";

type AppStatus = "loading" | "ready" | "degraded" | "fatal";

interface CaptureDiagnostics {
  state: "idle" | "recording" | "complete" | "unavailable" | "failed";
  authoredDurationSeconds: number;
  wallDurationSeconds: number | null;
  bytes: number | null;
  mimeType: string | null;
  renderedFrames: number;
}

interface RuntimeDiagnostics {
  version: 1;
  status: AppStatus;
  statusMessage: string;
  statusKinds: readonly AppStatus[];
  frame: number;
  elapsedSeconds: number;
  shot: string;
  focalLength: number;
  cameraPosition: [number, number, number];
  cameraRoll: number;
  vrmLoaded: boolean;
  vrmAssetUrl: string;
  vrmModelName: string | null;
  vrmAuthor: string | null;
  vrmMToonMaterialCount: number;
  vrmNativeOutlineMaterialCount: number;
  vrmOutlineMode: string | null;
  vrmSkinnedMeshCount: number;
  springBonesSupported: boolean;
  springUpdateCount: number;
  expressionsSupported: boolean;
  qualityTier: QualityTier | null;
  rockCount: number;
  requiredSystems: SceneSystemState | null;
  errors: string[];
  warnings: string[];
  capture: CaptureDiagnostics & { start: () => Promise<Omit<CaptureDiagnostics, "state">> };
  sampleAt: (seconds: number) => CinematicSample;
}

declare global {
  interface Window {
    __SHORELINE__: RuntimeDiagnostics;
  }
}

const rootCandidate = document.querySelector<HTMLElement>("#app");
if (!rootCandidate) throw new Error("Application mount #app is missing from index.html.");
const root: HTMLElement = rootCandidate;

root.insertAdjacentHTML(
  "beforeend",
  `
    <section class="status-card" data-state="loading" aria-live="polite" aria-atomic="true">
      <h1 class="status-heading">Preparing shoreline</h1>
      <p class="status-detail">Starting the WebGL2 renderer…</p>
    </section>
    <section class="timeline" aria-label="Cinematic timeline" hidden>
      <div class="timeline-row">
        <span class="shot-name">shore-establishing</span>
        <span class="timecode">00:00 / 00:24</span>
      </div>
      <div class="progress" aria-hidden="true"><span></span></div>
      <button type="button" data-action="record">Record 24s WebM</button>
      <a class="download-link" data-action="download" download="shoreline-cinematic.webm" hidden>Save recording</a>
    </section>
  `,
);

const statusCard = root.querySelector<HTMLElement>(".status-card")!;
const statusHeading = root.querySelector<HTMLElement>(".status-heading")!;
const statusDetail = root.querySelector<HTMLElement>(".status-detail")!;
const timeline = root.querySelector<HTMLElement>(".timeline")!;
const shotName = root.querySelector<HTMLElement>(".shot-name")!;
const timecode = root.querySelector<HTMLElement>(".timecode")!;
const progressBar = root.querySelector<HTMLElement>(".progress > span")!;
const recordButton = root.querySelector<HTMLButtonElement>("[data-action='record']")!;
const downloadLink = root.querySelector<HTMLAnchorElement>("[data-action='download']")!;

let sceneRuntime: ShorelineScene | null = null;
let characterRuntime: CharacterRuntime | null = null;
let animationFrame = 0;
let previousTimestamp = performance.now();
let fatal = false;
let captureRecorder: MediaRecorder | null = null;
let captureStream: MediaStream | null = null;
let captureFrameCount = 0;
let captureStartedAt = 0;
let captureResolve: ((value: Omit<CaptureDiagnostics, "state">) => void) | null = null;
let captureReject: ((reason: Error) => void) | null = null;
let lastRecordingUrl: string | null = null;
const shotClock = new FixedStepShotClock();
const cameraTarget = new THREE.Vector3();

const captureDiagnostics: CaptureDiagnostics = {
  state: typeof MediaRecorder === "undefined" ? "unavailable" : "idle",
  authoredDurationSeconds: CINEMATIC_DURATION_SECONDS,
  wallDurationSeconds: null,
  bytes: null,
  mimeType: null,
  renderedFrames: 0,
};

const diagnostics: RuntimeDiagnostics = {
  version: 1,
  status: "loading",
  statusMessage: "Starting the WebGL2 renderer.",
  statusKinds: ["loading", "ready", "degraded", "fatal"],
  frame: 0,
  elapsedSeconds: 0,
  shot: "shore-establishing",
  focalLength: 0,
  cameraPosition: [0, 0, 0],
  cameraRoll: 0,
  vrmLoaded: false,
  vrmAssetUrl: "/assets/character.vrm",
  vrmModelName: null,
  vrmAuthor: null,
  vrmMToonMaterialCount: 0,
  vrmNativeOutlineMaterialCount: 0,
  vrmOutlineMode: null,
  vrmSkinnedMeshCount: 0,
  springBonesSupported: false,
  springUpdateCount: 0,
  expressionsSupported: false,
  qualityTier: null,
  rockCount: 0,
  requiredSystems: null,
  errors: [],
  warnings: [],
  capture: Object.assign(captureDiagnostics, { start: startCapture }),
  sampleAt: (seconds) => {
    const currentFrame = shotClock.frame;
    shotClock.reset(Math.round(seconds / FIXED_STEP_SECONDS));
    const sample = shotClock.sample();
    shotClock.reset(currentFrame);
    return sample;
  },
};
window.__SHORELINE__ = diagnostics;

function setStatus(status: AppStatus, heading: string, detail: string): void {
  diagnostics.status = status;
  diagnostics.statusMessage = detail;
  statusCard.dataset.state = status;
  statusHeading.textContent = heading;
  statusDetail.textContent = detail;
  timeline.hidden = status === "loading" || status === "fatal";
  if (status === "fatal" && !root.querySelector(".fatal-backdrop")) {
    root.insertAdjacentHTML("beforeend", '<div class="fatal-backdrop" aria-hidden="true"></div>');
  }
}

function qualityFromLocation(): QualityTier {
  const requested = new URLSearchParams(window.location.search).get("quality");
  if (requested === "capture" || requested === "fallback" || requested === "interactive") return requested;
  const limitedDevice = (navigator.hardwareConcurrency ?? 8) <= 4 || (window.devicePixelRatio ?? 1) > 2.5;
  return limitedDevice ? "fallback" : "interactive";
}

function formatTime(seconds: number): string {
  const bounded = Math.max(0, Math.min(CINEMATIC_DURATION_SECONDS, seconds));
  return `00:${Math.floor(bounded).toString().padStart(2, "0")}`;
}

function updateCamera(sample: CinematicSample, subject: THREE.Vector3, runtime: ShorelineScene): void {
  const camera = runtime.camera;
  camera.position.set(
    subject.x + sample.cameraOffset[0] + sample.handheld[0],
    subject.y + sample.cameraOffset[1] + sample.handheld[1],
    subject.z + sample.cameraOffset[2] + sample.handheld[2],
  );
  cameraTarget.set(
    subject.x + sample.targetOffset[0],
    subject.y + sample.targetOffset[1],
    subject.z + sample.targetOffset[2],
  );
  camera.setFocalLength(sample.focalLength);
  camera.lookAt(cameraTarget);
  camera.rotateZ(sample.roll);
  camera.updateMatrixWorld();

  diagnostics.focalLength = sample.focalLength;
  diagnostics.cameraPosition = [camera.position.x, camera.position.y, camera.position.z];
  diagnostics.cameraRoll = sample.roll;
}

function updateTimeline(sample: CinematicSample): void {
  const progress = sample.time / CINEMATIC_DURATION_SECONDS;
  shotName.textContent = sample.shot.replaceAll("-", " ");
  timecode.textContent = `${formatTime(sample.time)} / 00:24`;
  progressBar.style.transform = `scaleX(${progress.toFixed(5)})`;
  diagnostics.frame = shotClock.frame;
  diagnostics.elapsedSeconds = sample.time;
  diagnostics.shot = sample.shot;
}

function animate(timestamp: number): void {
  if (fatal || !sceneRuntime) return;
  const deltaSeconds = Math.min(0.25, Math.max(0, (timestamp - previousTimestamp) / 1000));
  previousTimestamp = timestamp;
  const steps = shotClock.advance(deltaSeconds);
  const sample = shotClock.sample();

  if (characterRuntime) {
    if (steps > 0) {
      characterRuntime.update(sample.time, steps * FIXED_STEP_SECONDS);
      diagnostics.springUpdateCount += characterRuntime.diagnostics.springBonesSupported ? steps : 0;
    }
    updateCamera(sample, characterRuntime.subjectPosition, sceneRuntime);
  }
  sceneRuntime.update(sample.time);
  sceneRuntime.render();
  updateTimeline(sample);

  if (captureRecorder?.state === "recording" && steps > 0) {
    captureFrameCount += steps;
    captureDiagnostics.renderedFrames = captureFrameCount;
    if (captureFrameCount >= CINEMATIC_DURATION_SECONDS / FIXED_STEP_SECONDS) {
      captureRecorder.stop();
    }
  }
  animationFrame = requestAnimationFrame(animate);
}

function supportedMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return candidates.find((value) => MediaRecorder.isTypeSupported(value)) ?? null;
}

function startCapture(): Promise<Omit<CaptureDiagnostics, "state">> {
  if (!sceneRuntime || !characterRuntime || diagnostics.status === "loading" || diagnostics.status === "fatal") {
    return Promise.reject(new Error("The shoreline must reach ready state before recording."));
  }
  if (captureRecorder?.state === "recording") {
    return Promise.reject(new Error("A shoreline recording is already in progress."));
  }
  const captureCanvas = sceneRuntime.canvas as HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream };
  const mimeType = supportedMimeType();
  if (!captureCanvas.captureStream || !mimeType) {
    captureDiagnostics.state = "unavailable";
    const message = "Canvas recording is unavailable in this browser. Use a current Chrome or Chromium build with MediaRecorder enabled.";
    diagnostics.warnings.push(message);
    setStatus("degraded", "Preview ready; recording unavailable", message);
    return Promise.reject(new Error(message));
  }

  if (lastRecordingUrl) {
    URL.revokeObjectURL(lastRecordingUrl);
    lastRecordingUrl = null;
  }
  downloadLink.hidden = true;
  const chunks: Blob[] = [];
  captureStream = captureCanvas.captureStream(30);
  captureRecorder = new MediaRecorder(captureStream, { mimeType, videoBitsPerSecond: 12_000_000 });
  captureRecorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });
  captureRecorder.addEventListener("error", (event) => {
    const error = (event as Event & { error?: DOMException }).error ?? new DOMException("Unknown MediaRecorder error");
    captureDiagnostics.state = "failed";
    diagnostics.errors.push(`Recording failed: ${error.message}`);
    document.body.classList.remove("capture-clean");
    recordButton.disabled = false;
    captureReject?.(new Error(`Recording failed: ${error.message}`));
    captureResolve = null;
    captureReject = null;
  });
  captureRecorder.addEventListener("stop", () => {
    const wallDurationSeconds = (performance.now() - captureStartedAt) / 1000;
    const blob = new Blob(chunks, { type: mimeType });
    captureStream?.getTracks().forEach((track) => track.stop());
    captureStream = null;
    captureRecorder = null;
    document.body.classList.remove("capture-clean");
    recordButton.disabled = false;
    recordButton.textContent = "Record another 24s WebM";
    if (blob.size === 0) {
      captureDiagnostics.state = "failed";
      const error = new Error("Recording completed without video data. Check MediaRecorder support and available memory.");
      diagnostics.errors.push(error.message);
      captureReject?.(error);
      captureResolve = null;
      captureReject = null;
      return;
    }

    lastRecordingUrl = URL.createObjectURL(blob);
    downloadLink.href = lastRecordingUrl;
    downloadLink.hidden = false;
    captureDiagnostics.state = "complete";
    captureDiagnostics.wallDurationSeconds = wallDurationSeconds;
    captureDiagnostics.bytes = blob.size;
    captureDiagnostics.mimeType = mimeType;
    const result = {
      authoredDurationSeconds: captureDiagnostics.authoredDurationSeconds,
      wallDurationSeconds,
      bytes: blob.size,
      mimeType,
      renderedFrames: captureFrameCount,
    };
    captureResolve?.(result);
    captureResolve = null;
    captureReject = null;
    setStatus("ready", "Shoreline ready", "The 24-second recording is ready to save. The preview continues on the authored loop.");
  });

  captureDiagnostics.state = "recording";
  captureDiagnostics.wallDurationSeconds = null;
  captureDiagnostics.bytes = null;
  captureDiagnostics.mimeType = mimeType;
  captureDiagnostics.renderedFrames = 0;
  captureFrameCount = 0;
  captureStartedAt = performance.now();
  shotClock.reset(0);
  characterRuntime.update(0, FIXED_STEP_SECONDS);
  previousTimestamp = performance.now();
  recordButton.disabled = true;
  recordButton.textContent = "Recording 24 seconds…";
  document.body.classList.add("capture-clean");
  captureRecorder.start(1000);

  return new Promise((resolve, reject) => {
    captureResolve = resolve;
    captureReject = reject;
  });
}

recordButton.addEventListener("click", () => {
  void startCapture().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (!diagnostics.errors.includes(message)) diagnostics.errors.push(message);
  });
});

function reportFatal(error: unknown): void {
  if (fatal) return;
  fatal = true;
  cancelAnimationFrame(animationFrame);
  const message = error instanceof Error ? error.message : String(error);
  diagnostics.errors.push(message);
  setStatus("fatal", "Shoreline could not start", message);
}

window.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  reportFatal(event.reason);
});

async function boot(): Promise<void> {
  try {
    const qualityTier = qualityFromLocation();
    diagnostics.qualityTier = qualityTier;
    setStatus("loading", "Preparing shoreline", "Building the procedural coast and shared light…");
    sceneRuntime = createShorelineScene(root, qualityTier);
    diagnostics.rockCount = sceneRuntime.rockCount;
    diagnostics.requiredSystems = sceneRuntime.systems;
    previousTimestamp = performance.now();
    animationFrame = requestAnimationFrame(animate);

    setStatus("loading", "Loading character", "Fetching /assets/character.vrm…");
    characterRuntime = await loadCharacter(sceneRuntime.scene, (loaded, total) => {
      const detail = total > 0 ? `${Math.min(100, Math.round((loaded / total) * 100))}%` : `${(loaded / 1_048_576).toFixed(1)} MB`;
      setStatus("loading", "Loading character", `Fetching /assets/character.vrm — ${detail}`);
    });
    const character = characterRuntime.diagnostics;
    diagnostics.vrmLoaded = true;
    diagnostics.vrmModelName = character.modelName;
    diagnostics.vrmAuthor = character.author;
    diagnostics.vrmMToonMaterialCount = character.mtoonMaterialCount;
    diagnostics.vrmNativeOutlineMaterialCount = character.nativeOutlineMaterialCount;
    diagnostics.vrmOutlineMode = character.outlineMode;
    diagnostics.vrmSkinnedMeshCount = character.skinnedMeshCount;
    diagnostics.springBonesSupported = character.springBonesSupported;
    diagnostics.expressionsSupported = character.expressionsSupported;
    sceneRuntime.setOutlinedObjects(character.outlineMode === "postprocess-fallback" ? [characterRuntime.root] : []);
    characterRuntime.update(0, FIXED_STEP_SECONDS);

    const missingSystems = Object.entries(sceneRuntime.systems)
      .filter(([, available]) => !available)
      .map(([name]) => name);
    if (missingSystems.length > 0) {
      const message = `Fallback active: ${missingSystems.join(", ")} is unavailable; all required scene elements remain visible.`;
      diagnostics.warnings.push(message);
      setStatus("degraded", "Shoreline ready with fallback", message);
    } else {
      const detail = captureDiagnostics.state === "unavailable"
        ? "Preview is ready. This browser cannot record the canvas; use current Chrome for WebM capture."
        : "The 24-second camera sequence is running. Recording starts only when requested.";
      if (captureDiagnostics.state === "unavailable") diagnostics.warnings.push(detail);
      setStatus(captureDiagnostics.state === "unavailable" ? "degraded" : "ready", "Shoreline ready", detail);
    }
  } catch (error) {
    reportFatal(error);
  }
}

void boot();
