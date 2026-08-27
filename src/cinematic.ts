export const FIXED_FPS = 30;
export const FIXED_STEP_SECONDS = 1 / FIXED_FPS;
export const CINEMATIC_DURATION_SECONDS = 24;

export type Vec3Tuple = readonly [number, number, number];

export interface CinematicSample {
  readonly time: number;
  readonly frame: number;
  readonly shot: "shore-establishing" | "walk-follow" | "quiet-close" | "profile-drift" | "coast-pullback";
  readonly cameraOffset: Vec3Tuple;
  readonly targetOffset: Vec3Tuple;
  readonly focalLength: number;
  readonly handheld: Vec3Tuple;
  readonly roll: number;
}

interface CameraKeyframe {
  readonly time: number;
  readonly offset: Vec3Tuple;
  readonly target: Vec3Tuple;
  readonly focalLength: number;
}

const CAMERA_KEYFRAMES: readonly CameraKeyframe[] = [
  { time: 0, offset: [7.8, 3.6, 9.8], target: [-0.7, 1.15, -1.8], focalLength: 27 },
  { time: 3.8, offset: [5.5, 2.8, 6.8], target: [-0.45, 1.25, -1.1], focalLength: 32 },
  { time: 6, offset: [-3.2, 2.15, 4.8], target: [0.15, 1.35, -0.1], focalLength: 39 },
  { time: 10.5, offset: [-2.25, 1.95, 3.65], target: [0.25, 1.43, 0], focalLength: 44 },
  { time: 12.5, offset: [1.22, 1.7, 2.08], target: [0.02, 1.48, 0], focalLength: 66 },
  { time: 16.7, offset: [1.52, 1.84, 2.32], target: [-0.08, 1.5, 0], focalLength: 58 },
  { time: 18.2, offset: [-2.1, 2.04, 3.25], target: [0.3, 1.38, -0.2], focalLength: 48 },
  { time: 21, offset: [-7.1, 4.15, 8.4], target: [0.65, 1.05, -2.4], focalLength: 29 },
  { time: 24, offset: [7.8, 3.6, 9.8], target: [-0.7, 1.15, -1.8], focalLength: 27 },
];

function wrapTime(seconds: number): number {
  if (!Number.isFinite(seconds)) return 0;
  const wrapped = seconds % CINEMATIC_DURATION_SECONDS;
  return wrapped < 0 ? wrapped + CINEMATIC_DURATION_SECONDS : wrapped;
}

function smoothstep(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function lerp(a: number, b: number, amount: number): number {
  return a + (b - a) * amount;
}

function lerpVec3(a: Vec3Tuple, b: Vec3Tuple, amount: number): Vec3Tuple {
  return [lerp(a[0], b[0], amount), lerp(a[1], b[1], amount), lerp(a[2], b[2], amount)];
}

function hashSigned(index: number, channel: number, seed: number): number {
  let value = (Math.imul(index + 1, 0x45d9f3b) ^ Math.imul(channel + 17, 0x27d4eb2d) ^ seed) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value = (value ^ (value >>> 15)) >>> 0;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  return (value / 0xffffffff) * 2 - 1;
}

function smoothNoise(time: number, channel: number, seed = 0x51a3c92d): number {
  const samplePosition = time * 3.75;
  const left = Math.floor(samplePosition);
  const amount = smoothstep(samplePosition - left);
  return lerp(hashSigned(left, channel, seed), hashSigned(left + 1, channel, seed), amount);
}

function shotForTime(time: number): CinematicSample["shot"] {
  if (time < 5) return "shore-establishing";
  if (time < 12.5) return "walk-follow";
  if (time < 17.5) return "quiet-close";
  if (time < 21) return "profile-drift";
  return "coast-pullback";
}

export function sampleCinematic(seconds: number): CinematicSample {
  const time = wrapTime(seconds);
  let left = CAMERA_KEYFRAMES[0]!;
  let right = CAMERA_KEYFRAMES[CAMERA_KEYFRAMES.length - 1]!;

  for (let index = 1; index < CAMERA_KEYFRAMES.length; index += 1) {
    const candidate = CAMERA_KEYFRAMES[index]!;
    if (candidate.time >= time) {
      right = candidate;
      left = CAMERA_KEYFRAMES[index - 1]!;
      break;
    }
  }

  const span = Math.max(0.0001, right.time - left.time);
  const amount = smoothstep((time - left.time) / span);
  const handheld: Vec3Tuple = [
    smoothNoise(time, 0) * 0.024,
    smoothNoise(time, 1) * 0.018,
    smoothNoise(time, 2) * 0.012,
  ];

  return {
    time,
    frame: Math.floor(time * FIXED_FPS),
    shot: shotForTime(time),
    cameraOffset: lerpVec3(left.offset, right.offset, amount),
    targetOffset: lerpVec3(left.target, right.target, amount),
    focalLength: lerp(left.focalLength, right.focalLength, amount),
    handheld,
    roll: smoothNoise(time, 3) * 0.0048,
  };
}

export class FixedStepShotClock {
  private accumulator = 0;
  private currentFrame = 0;

  get frame(): number {
    return this.currentFrame;
  }

  get time(): number {
    return this.currentFrame * FIXED_STEP_SECONDS;
  }

  reset(frame = 0): void {
    const totalFrames = Math.round(CINEMATIC_DURATION_SECONDS * FIXED_FPS);
    this.currentFrame = ((Math.floor(frame) % totalFrames) + totalFrames) % totalFrames;
    this.accumulator = 0;
  }

  advance(deltaSeconds: number): number {
    const boundedDelta = Math.max(0, Math.min(0.25, Number.isFinite(deltaSeconds) ? deltaSeconds : 0));
    this.accumulator += boundedDelta;
    let steps = 0;
    const totalFrames = Math.round(CINEMATIC_DURATION_SECONDS * FIXED_FPS);

    while (this.accumulator + Number.EPSILON >= FIXED_STEP_SECONDS) {
      this.accumulator -= FIXED_STEP_SECONDS;
      this.currentFrame = (this.currentFrame + 1) % totalFrames;
      steps += 1;
    }
    return steps;
  }

  sample(): CinematicSample {
    return sampleCinematic(this.time);
  }
}
