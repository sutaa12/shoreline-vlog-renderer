import test from "node:test";
import assert from "node:assert/strict";
import {
  CAPTURE_FPS,
  CAPTURE_FRAME_COUNT,
  DURATION_SECONDS,
  sampleHandheld,
  sampleTimeline,
} from "../src/timeline.js";

function maximumDelta(a, b) {
  if (typeof a === "number") return Math.abs(a - b);
  if (typeof a !== "object" || a === null) return Object.is(a, b) ? 0 : Number.POSITIVE_INFINITY;
  if (Array.isArray(a)) {
    return Math.max(...a.map((value, index) => maximumDelta(value, b[index])));
  }
  return Math.max(
    ...Object.keys(a)
      .filter((key) => key !== "frame")
      .map((key) => maximumDelta(a[key], b[key])),
  );
}

test("capture contract is exactly 720 frames at 30 fps for 24 seconds", () => {
  assert.equal(CAPTURE_FPS, 30);
  assert.equal(DURATION_SECONDS, 24);
  assert.equal(CAPTURE_FRAME_COUNT, 720);
  assert.equal((CAPTURE_FRAME_COUNT - 1) / CAPTURE_FPS, 719 / 30);
});

test("timeline and handheld motion are deterministic", () => {
  for (let frame = 0; frame < CAPTURE_FRAME_COUNT; frame += 17) {
    const time = frame / CAPTURE_FPS;
    assert.deepEqual(sampleTimeline(time), sampleTimeline(time));
    assert.deepEqual(sampleHandheld(time), sampleHandheld(time));
  }
});

test("timeline closes without a pose, camera, or shake discontinuity", () => {
  const start = sampleTimeline(0);
  const end = sampleTimeline(DURATION_SECONDS);
  assert.ok(maximumDelta(start, end) < 1e-12);
});

test("handheld translation and roll remain inside the calibrated limits", () => {
  let maximumTranslation = 0;
  let maximumRollDegrees = 0;
  let maximumLateralCamera = 0;
  let maximumDepthOffset = 0;
  for (let frame = 0; frame < CAPTURE_FRAME_COUNT; frame += 1) {
    const state = sampleTimeline(frame / CAPTURE_FPS);
    const translation = state.camera.handheld.translation;
    maximumTranslation = Math.max(maximumTranslation, Math.hypot(...translation));
    maximumRollDegrees = Math.max(
      maximumRollDegrees,
      Math.abs((state.camera.handheld.rollRadians * 180) / Math.PI),
    );
    maximumLateralCamera = Math.max(
      maximumLateralCamera,
      Math.abs(state.camera.position[0] + translation[0]),
    );
    maximumDepthOffset = Math.max(
      maximumDepthOffset,
      Math.abs(state.camera.position[2] + translation[2] - 5.6),
    );
  }
  assert.ok(maximumTranslation <= 0.018, `${maximumTranslation}m exceeds 0.018m`);
  assert.ok(maximumRollDegrees <= 0.35, `${maximumRollDegrees}° exceeds 0.35°`);
  assert.ok(maximumLateralCamera <= 0.65, `${maximumLateralCamera}m exceeds 0.65m`);
  assert.ok(maximumDepthOffset <= 0.35, `${maximumDepthOffset}m exceeds 0.35m`);
});

test("authored loop exposes every required camera and character beat", () => {
  const samples = Array.from({ length: CAPTURE_FRAME_COUNT }, (_, frame) =>
    sampleTimeline(frame / CAPTURE_FPS),
  );
  const shots = new Set(samples.map((sample) => sample.shot));
  assert.deepEqual(shots, new Set([
    "environmental-establishing",
    "shoreline-follow",
    "quiet-close-up",
    "gaze-beat",
    "environmental-pullback",
  ]));
  assert.ok(samples.some((sample) => sample.character.walkAmount > 0.95));
  assert.ok(samples.some((sample) => sample.character.quietAmount > 0.95));
  assert.ok(samples.some((sample) => sample.character.gazeAmount > 0.95));
  assert.ok(samples.some((sample) => sample.character.blink > 0.9));
  const fovs = samples.map((sample) => sample.camera.fov);
  assert.ok(Math.max(...fovs) - Math.min(...fovs) > 20);
});
