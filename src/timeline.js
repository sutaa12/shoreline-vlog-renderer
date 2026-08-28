export const DURATION_SECONDS = 24;
export const CAPTURE_FPS = 30;
export const CAPTURE_FRAME_COUNT = DURATION_SECONDS * CAPTURE_FPS;

const TAU = Math.PI * 2;

export function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

export function smoothstep(value) {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

export function wrapTime(timeSeconds) {
  const wrapped = timeSeconds % DURATION_SECONDS;
  return wrapped < 0 ? wrapped + DURATION_SECONDS : wrapped;
}

function mix(a, b, amount) {
  return a + (b - a) * amount;
}

function mixVector(a, b, amount) {
  return a.map((value, index) => mix(value, b[index], amount));
}

function keyframeValue(time, keyframes) {
  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const current = keyframes[index];
    const next = keyframes[index + 1];
    if (time <= next.time) {
      const amount = smoothstep((time - current.time) / (next.time - current.time));
      if (Array.isArray(current.value)) {
        return mixVector(current.value, next.value, amount);
      }
      return mix(current.value, next.value, amount);
    }
  }
  return keyframes.at(-1).value;
}

const CHARACTER_POSITION_KEYS = [
  { time: 0, value: [-1.05, 0, 0.42] },
  { time: 4, value: [-1.05, 0, 0.42] },
  { time: 9.5, value: [0.72, 0, 0.04] },
  { time: 15.5, value: [0.72, 0, 0.04] },
  { time: 21, value: [-1.05, 0, 0.42] },
  { time: 24, value: [-1.05, 0, 0.42] },
];

const CHARACTER_YAW_KEYS = [
  { time: 0, value: 0.08 },
  { time: 4, value: Math.PI * 0.48 },
  { time: 9.5, value: 0.08 },
  { time: 15.5, value: -Math.PI * 0.48 },
  { time: 21, value: 0.08 },
  { time: 24, value: 0.08 },
];

const CAMERA_KEYS = [
  {
    time: 0,
    position: [0.05, 2.38, 5.65],
    target: [-0.1, 0.95, -0.25],
    fov: 42,
  },
  {
    time: 4,
    position: [-0.55, 1.9, 5.45],
    target: [-0.72, 1.02, 0.2],
    fov: 36,
  },
  {
    time: 9.5,
    position: [-0.05, 1.62, 5.35],
    target: [0.5, 1.05, 0.04],
    fov: 29,
  },
  {
    time: 13.4,
    position: [0.32, 1.62, 5.4],
    target: [0.7, 1.25, 0.02],
    fov: 15.5,
  },
  {
    time: 16.5,
    position: [0.58, 1.72, 5.55],
    target: [0.68, 1.17, -0.02],
    fov: 23,
  },
  {
    time: 21,
    position: [0.48, 2.08, 5.85],
    target: [-0.38, 0.92, -0.38],
    fov: 38,
  },
  {
    time: 24,
    position: [0.05, 2.38, 5.65],
    target: [-0.1, 0.95, -0.25],
    fov: 42,
  },
];

function sampleCamera(time) {
  for (let index = 0; index < CAMERA_KEYS.length - 1; index += 1) {
    const current = CAMERA_KEYS[index];
    const next = CAMERA_KEYS[index + 1];
    if (time <= next.time) {
      const amount = smoothstep((time - current.time) / (next.time - current.time));
      return {
        position: mixVector(current.position, next.position, amount),
        target: mixVector(current.target, next.target, amount),
        fov: mix(current.fov, next.fov, amount),
      };
    }
  }
  return CAMERA_KEYS.at(-1);
}

export function sampleHandheld(timeSeconds) {
  const time = wrapTime(timeSeconds);
  const phase = (time / DURATION_SECONDS) * TAU;
  return {
    translation: [
      0.007 * Math.sin(7 * phase) + 0.003 * Math.sin(17 * phase),
      0.006 * Math.sin(5 * phase) + 0.002 * Math.sin(19 * phase),
      0.003 * Math.sin(11 * phase),
    ],
    rollRadians:
      (Math.PI / 180) *
      (0.19 * Math.sin(5 * phase) + 0.08 * Math.sin(13 * phase)),
  };
}

function blinkValue(time) {
  const centers = [2.2, 7.25, 11.75, 17.15, 22.35];
  return centers.reduce((strongest, center) => {
    const distance = Math.abs(time - center);
    const pulse = distance < 0.13 ? 1 - distance / 0.13 : 0;
    return Math.max(strongest, pulse);
  }, 0);
}

function shotForTime(time) {
  if (time < 4) return "environmental-establishing";
  if (time < 9.5) return "shoreline-follow";
  if (time < 15.5) return "quiet-close-up";
  if (time < 18.5) return "gaze-beat";
  return "environmental-pullback";
}

export function sampleTimeline(timeSeconds) {
  const time = wrapTime(timeSeconds);
  let walkAmount = 0;
  let walkPhase = 0;

  if (time >= 4 && time < 9.5) {
    const progress = (time - 4) / 5.5;
    walkAmount = Math.sin(Math.PI * smoothstep(progress));
    walkPhase = progress * Math.PI * 8;
  } else if (time >= 15.5 && time < 21) {
    const progress = (time - 15.5) / 5.5;
    walkAmount = Math.sin(Math.PI * smoothstep(progress));
    walkPhase = progress * Math.PI * 8;
  }

  const camera = sampleCamera(time);
  const handheld = sampleHandheld(time);
  const position = keyframeValue(time, CHARACTER_POSITION_KEYS);
  const yaw = keyframeValue(time, CHARACTER_YAW_KEYS);
  const breathing = Math.sin((time / 4.8) * TAU);
  const quietAmount = smoothstep((time - 10) / 1.2) * (1 - smoothstep((time - 17.2) / 1.1));
  const gazeAmount = smoothstep((time - 12.2) / 1.4) * (1 - smoothstep((time - 18.1) / 1.3));

  return {
    time,
    frame: Math.round(time * CAPTURE_FPS),
    shot: shotForTime(time),
    character: {
      position,
      yaw,
      walkAmount,
      walkPhase,
      breathing,
      quietAmount,
      gazeAmount,
      blink: blinkValue(time),
      weightShift: Math.sin((time / 6) * TAU) * (1 - walkAmount),
    },
    camera: {
      ...camera,
      handheld,
    },
  };
}
