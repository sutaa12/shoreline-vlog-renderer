import { expect, test } from "@playwright/test";
import {
  CINEMATIC_DURATION_SECONDS,
  FIXED_FPS,
  FIXED_STEP_SECONDS,
  FixedStepShotClock,
  sampleCinematic,
} from "../src/cinematic";

test("the camera timeline is deterministic and contains every authored beat", () => {
  const timestamps = [0, 6.5, 13.5, 18.8, 21.3];
  const firstPass = timestamps.map(sampleCinematic);
  const secondPass = timestamps.map(sampleCinematic);

  expect(secondPass).toEqual(firstPass);
  expect(firstPass.map((sample) => sample.shot)).toEqual([
    "shore-establishing",
    "walk-follow",
    "quiet-close",
    "profile-drift",
    "coast-pullback",
  ]);
  expect(firstPass[2]!.focalLength).toBeGreaterThan(60);
  expect(firstPass[0]!.focalLength).toBeLessThan(35);
  expect(firstPass[4]!.cameraOffset[0]).toBeLessThan(-5);
});

test("seeded handheld motion stays inside the translation and roll budget", () => {
  for (let frame = 0; frame < CINEMATIC_DURATION_SECONDS * FIXED_FPS; frame += 1) {
    const sample = sampleCinematic(frame * FIXED_STEP_SECONDS);
    expect(Math.abs(sample.handheld[0])).toBeLessThanOrEqual(0.024001);
    expect(Math.abs(sample.handheld[1])).toBeLessThanOrEqual(0.018001);
    expect(Math.abs(sample.handheld[2])).toBeLessThanOrEqual(0.012001);
    expect(Math.abs(sample.roll)).toBeLessThanOrEqual(0.004801);
  }
});

test("the fixed-step shot clock advances at 30 fps and loops at 24 seconds", () => {
  const clock = new FixedStepShotClock();
  expect(clock.advance(FIXED_STEP_SECONDS * 0.9)).toBe(0);
  expect(clock.frame).toBe(0);
  expect(clock.advance(FIXED_STEP_SECONDS * 0.2)).toBe(1);
  expect(clock.frame).toBe(1);

  clock.reset(CINEMATIC_DURATION_SECONDS * FIXED_FPS - 1);
  expect(clock.advance(FIXED_STEP_SECONDS)).toBe(1);
  expect(clock.frame).toBe(0);
  expect(clock.sample().time).toBe(0);
});

test("invalid and out-of-range inputs remain bounded", () => {
  const clock = new FixedStepShotClock();
  expect(clock.advance(Number.NaN)).toBe(0);
  expect(clock.advance(-4)).toBe(0);
  expect(clock.advance(10)).toBeLessThanOrEqual(Math.ceil(0.25 / FIXED_STEP_SECONDS));
  expect(sampleCinematic(-1).time).toBeCloseTo(CINEMATIC_DURATION_SECONDS - 1);
  expect(sampleCinematic(Number.NaN).time).toBe(0);
});
