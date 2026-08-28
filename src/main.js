import * as THREE from "three";
import { loadCharacter } from "./character.js";
import { createEnvironment } from "./environment.js";
import {
  CAPTURE_FPS,
  CAPTURE_FRAME_COUNT,
  DURATION_SECONDS,
  sampleTimeline,
} from "./timeline.js";
import "./styles.css";

const canvas = document.querySelector("#shoreline-canvas");
const statusElement = document.querySelector("#status");
const statusTitle = document.querySelector("#status-title");
const statusMessage = document.querySelector("#status-message");
const statusDetail = document.querySelector("#status-detail");
const query = new URLSearchParams(window.location.search);
const captureMode = query.get("capture") === "1";
const requestedQuality = query.get("quality") === "balanced" ? "balanced" : "high";

if (captureMode) document.body.classList.add("capture");

const runtime = {
  state: "loading",
  message: "Preparing the coast and character.",
  detail: "",
  frame: 0,
  time: 0,
  shot: "environmental-establishing",
  capture: {
    enabled: captureMode,
    fps: CAPTURE_FPS,
    frameCount: CAPTURE_FRAME_COUNT,
    durationSeconds: DURATION_SECONDS,
    rule: "t = frame / 30",
  },
  systems: {
    webgl2: false,
    photographicPlate: false,
    foregroundSand: false,
    movingWater: false,
    wetSeam: false,
    irregularRocks: false,
    fog: false,
    shadows: false,
    reflectionCue: false,
    validVrm: false,
    mtoon: false,
    nativeOutline: false,
    silhouetteShell: false,
    animation: false,
    cameraTimeline: false,
  },
  diagnostics: {},
  warnings: [],
  errors: [],
  renderFrame: null,
};
window.__SHORELINE__ = runtime;

function setStatus(state, title, message, detail = "") {
  runtime.state = state;
  runtime.message = message;
  runtime.detail = detail;
  statusElement.dataset.state = state;
  statusTitle.textContent = title;
  statusMessage.textContent = message;
  statusDetail.textContent = detail;
}

function failFatal(title, message, detail, error) {
  const record = {
    severity: "fatal",
    asset: detail,
    message: error instanceof Error ? error.message : String(error),
  };
  runtime.errors.push(record);
  setStatus("fatal", title, message, detail);
}

setStatus("loading", "Loading scene", "Preparing the coast and character…", "WebGL2 capability check");

const context = canvas.getContext("webgl2", {
  alpha: false,
  antialias: requestedQuality === "high",
  depth: true,
  stencil: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
});

if (!context) {
  failFatal(
    "WebGL2 is unavailable",
    "This scene requires a WebGL2-capable desktop browser.",
    "feature: WebGL2",
    new Error("Unable to create a WebGL2 rendering context."),
  );
} else {
  start(context).catch((error) => {
    failFatal(
      "Scene initialization failed",
      "The browser could not finish preparing the shoreline scene.",
      "system: scene initialization",
      error,
    );
  });
}

async function start(webgl2Context) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: webgl2Context,
    antialias: requestedQuality === "high",
    alpha: false,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const pixelRatio = captureMode
    ? 1
    : requestedQuality === "balanced"
      ? Math.min(window.devicePixelRatio, 0.85)
      : Math.min(window.devicePixelRatio, 1);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.05, 120);
  camera.name = "authored-vlog-camera";
  scene.add(camera);

  function resize() {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    runtime.diagnostics.output = {
      cssWidth: width,
      cssHeight: height,
      bufferWidth: renderer.domElement.width,
      bufferHeight: renderer.domElement.height,
      pixelRatio: renderer.getPixelRatio(),
    };
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  const debugInfo = webgl2Context.getExtension("WEBGL_debug_renderer_info");
  runtime.systems.webgl2 = true;
  runtime.diagnostics.renderer = {
    webglVersion: webgl2Context.getParameter(webgl2Context.VERSION),
    shadingLanguageVersion: webgl2Context.getParameter(webgl2Context.SHADING_LANGUAGE_VERSION),
    vendor: debugInfo
      ? webgl2Context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : webgl2Context.getParameter(webgl2Context.VENDOR),
    renderer: debugInfo
      ? webgl2Context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : webgl2Context.getParameter(webgl2Context.RENDERER),
    quality: requestedQuality,
  };

  setStatus("loading", "Loading shoreline", "Building the real-time contact stage…", "foreground sand, water, rocks, fog, and shadows");
  const environment = createEnvironment({ scene, camera, renderer, quality: requestedQuality });
  Object.assign(runtime.systems, {
    foregroundSand: environment.diagnostics.foregroundSand,
    movingWater: environment.diagnostics.movingWater,
    wetSeam: environment.diagnostics.movingWetSeam,
    irregularRocks: environment.diagnostics.irregularRockCount >= 8,
    fog: environment.diagnostics.fog,
    shadows: environment.diagnostics.shadows,
    reflectionCue: environment.diagnostics.reflectionCue,
  });
  runtime.diagnostics.environment = environment.diagnostics;

  setStatus("loading", "Loading character", "Preparing the VRM character and MToon silhouette…", "/assets/character.vrm");
  const [plateResult, characterResult] = await Promise.allSettled([
    environment.loadPlate(),
    loadCharacter(scene),
  ]);

  if (characterResult.status === "rejected") {
    renderWithoutCharacter(environment, renderer, scene, camera);
    failFatal(
      "Character unavailable",
      "The required VRM character could not be loaded. Check the asset and reload.",
      "/assets/character.vrm",
      characterResult.reason,
    );
    return;
  }

  const character = characterResult.value;
  const characterDiagnostics = character.diagnostics;
  Object.assign(runtime.systems, {
    validVrm: characterDiagnostics.validVrm,
    mtoon: characterDiagnostics.mtoonMaterialCount > 0,
    nativeOutline: characterDiagnostics.nativeOutlineMaterialCount > 0,
    silhouetteShell: characterDiagnostics.silhouetteShellMeshCount > 0,
    animation: characterDiagnostics.controlledBoneCount >= 10,
    cameraTimeline: true,
  });
  runtime.diagnostics.character = characterDiagnostics;

  if (plateResult.status === "fulfilled") {
    runtime.systems.photographicPlate = true;
    setStatus("ready", "Scene ready", "The shoreline loop is running.");
  } else {
    runtime.warnings.push({
      severity: "degraded",
      asset: "/assets/environment/shoreline-plate.webp",
      message: plateResult.reason instanceof Error ? plateResult.reason.message : String(plateResult.reason),
    });
    setStatus(
      "degraded",
      "Distant shoreline unavailable",
      "The real 3D foreground is running with a calibration fallback. Capture evidence is not valid in this state.",
      "/assets/environment/shoreline-plate.webp",
    );
  }

  function renderTimelineFrame(frameIndex) {
    if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= CAPTURE_FRAME_COUNT) {
      throw new RangeError(`Capture frame must be an integer from 0 to ${CAPTURE_FRAME_COUNT - 1}.`);
    }
    const time = frameIndex / CAPTURE_FPS;
    const sample = sampleTimeline(time);
    renderSample(sample, 1 / CAPTURE_FPS);
    runtime.frame = frameIndex;
    return {
      frame: runtime.frame,
      time: runtime.time,
      shot: runtime.shot,
      state: runtime.state,
    };
  }

  function renderSample(sample, delta) {
    character.update(sample, delta);
    environment.update(sample.time, sample.character);
    camera.position.fromArray(sample.camera.position);
    camera.position.x += sample.camera.handheld.translation[0];
    camera.position.y += sample.camera.handheld.translation[1];
    camera.position.z += sample.camera.handheld.translation[2];
    camera.fov = sample.camera.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(...sample.camera.target);
    camera.rotateZ(sample.camera.handheld.rollRadians);
    renderer.render(scene, camera);
    runtime.frame = Math.floor(sample.time * CAPTURE_FPS);
    runtime.time = sample.time;
    runtime.shot = sample.shot;
    runtime.diagnostics.camera = {
      shot: sample.shot,
      position: camera.position.toArray(),
      target: sample.camera.target,
      fov: camera.fov,
      shakeTranslation: sample.camera.handheld.translation,
      shakeRollRadians: sample.camera.handheld.rollRadians,
    };
  }

  runtime.renderFrame = renderTimelineFrame;
  renderTimelineFrame(0);

  if (!captureMode) {
    const startedAt = performance.now();
    let previousNow = startedAt;
    const tick = (now) => {
      const elapsed = (now - startedAt) / 1000;
      const delta = Math.min((now - previousNow) / 1000, 1 / 20);
      previousNow = now;
      const sample = sampleTimeline(elapsed);
      renderSample(sample, delta);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

function renderWithoutCharacter(environment, renderer, scene, camera) {
  const sample = sampleTimeline(0);
  environment.update(0, sample.character);
  camera.position.fromArray(sample.camera.position);
  camera.fov = sample.camera.fov;
  camera.updateProjectionMatrix();
  camera.lookAt(...sample.camera.target);
  renderer.render(scene, camera);
}
