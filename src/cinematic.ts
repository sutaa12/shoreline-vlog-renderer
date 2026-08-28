import { MathUtils, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import type { CinematicSnapshot, FrameState } from './contracts';

interface ShotPose {
  cue: string;
  at: number;
  position: Vector3;
  target: Vector3;
  fov: number;
}

const ENVELOPE = { x: 1.24, yMin: 1.42, yMax: 2.34, zMin: 2.45, zMax: 8.15, roll: 0.018 };

const smooth = (value: number): number => value * value * (3 - 2 * value);

export class CinematicSystem {
  readonly camera: PerspectiveCamera;
  private readonly shots: ShotPose[] = [
    { cue: 'Environmental wide', at: 0, position: new Vector3(0.05, 2.08, 7.85), target: new Vector3(0, 1.02, -0.35), fov: 46 },
    { cue: 'Environmental wide', at: 3.6, position: new Vector3(-0.18, 2.14, 7.35), target: new Vector3(0.02, 1.02, -0.45), fov: 43 },
    { cue: 'Follow', at: 7.4, position: new Vector3(-1.20, 1.86, 5.62), target: new Vector3(0.08, 1.04, -0.05), fov: 40 },
    { cue: 'Reframe', at: 11.2, position: new Vector3(1.08, 1.82, 4.52), target: new Vector3(-0.08, 1.16, -0.04), fov: 35 },
    { cue: 'Close-up', at: 14.8, position: new Vector3(0.38, 1.68, 3.48), target: new Vector3(-0.02, 0.94, 0.02), fov: 31 },
    { cue: 'Quiet beat', at: 18.8, position: new Vector3(-0.42, 1.80, 4.08), target: new Vector3(-0.02, 1.24, -0.08), fov: 34 },
    { cue: 'Return wide', at: 22.2, position: new Vector3(0.14, 2.02, 6.84), target: new Vector3(0, 1.05, -0.32), fov: 42 },
    { cue: 'Environmental wide', at: 24, position: new Vector3(0.05, 2.08, 7.85), target: new Vector3(0, 1.02, -0.35), fov: 46 },
  ];
  private position = this.shots[0].position.clone();
  private target = this.shots[0].target.clone();
  private desiredPosition = this.position.clone();
  private desiredTarget = this.target.clone();
  private roll = 0;
  private desiredRoll = 0;
  private desiredFov = this.shots[0].fov;
  private cue = this.shots[0].cue;
  private envelopeOk = true;
  private maxEnvelopeRatio = 0;
  private lookMatrixQuaternion = new Quaternion();

  constructor(camera: PerspectiveCamera) {
    this.camera = camera;
    this.applyCamera();
  }

  update(state: FrameState): void {
    const phase = state.phaseSeconds;
    let left = this.shots[0];
    let right = this.shots[1];
    for (let index = 0; index < this.shots.length - 1; index += 1) {
      if (phase >= this.shots[index].at && phase < this.shots[index + 1].at) {
        left = this.shots[index];
        right = this.shots[index + 1];
        break;
      }
    }
    const segment = Math.max(0.001, right.at - left.at);
    const mix = smooth(MathUtils.clamp((phase - left.at) / segment, 0, 1));
    this.desiredPosition.lerpVectors(left.position, right.position, mix);
    this.desiredTarget.lerpVectors(left.target, right.target, mix);
    this.desiredFov = MathUtils.lerp(left.fov, right.fov, mix);
    this.cue = mix < 0.55 ? left.cue : right.cue;

    const turn = Math.PI * 2 * state.phase01;
    const handheldEnvelope = 0.55 + 0.45 * Math.sin(turn) ** 2;
    this.desiredPosition.x += handheldEnvelope * (0.018 * Math.sin(5 * turn + 0.4) + 0.008 * Math.sin(11 * turn + 1.1));
    this.desiredPosition.y += handheldEnvelope * (0.011 * Math.sin(7 * turn + 2.0));
    this.desiredPosition.z += handheldEnvelope * (0.016 * Math.sin(3 * turn + 0.8));
    this.desiredTarget.x += 0.009 * Math.sin(4 * turn + 0.7);
    this.desiredTarget.y += 0.007 * Math.sin(6 * turn + 1.8);
    this.desiredRoll = handheldEnvelope * (0.0065 * Math.sin(5 * turn + 2.4) + 0.0025 * Math.sin(9 * turn + 0.1));

    const response = 1 - Math.exp(-state.deltaSeconds * 7.5);
    this.position.lerp(this.desiredPosition, response);
    this.target.lerp(this.desiredTarget, response);
    this.roll = MathUtils.lerp(this.roll, this.desiredRoll, response);
    this.camera.fov = MathUtils.lerp(this.camera.fov, this.desiredFov, response);
    this.camera.updateProjectionMatrix();
    this.validateEnvelope();
    this.applyCamera();
  }

  private validateEnvelope(): void {
    const ratios = [
      Math.abs(this.position.x) / ENVELOPE.x,
      this.position.y < ENVELOPE.yMin ? ENVELOPE.yMin / Math.max(this.position.y, 0.001) : this.position.y / ENVELOPE.yMax,
      this.position.z < ENVELOPE.zMin ? ENVELOPE.zMin / Math.max(this.position.z, 0.001) : this.position.z / ENVELOPE.zMax,
      Math.abs(this.roll) / ENVELOPE.roll,
    ];
    const ratio = Math.max(...ratios);
    this.maxEnvelopeRatio = Math.max(this.maxEnvelopeRatio, ratio);
    this.envelopeOk = ratio <= 1;
  }

  private applyCamera(): void {
    this.camera.position.copy(this.position);
    this.camera.lookAt(this.target);
    this.lookMatrixQuaternion.copy(this.camera.quaternion);
    this.camera.rotateZ(this.roll);
  }

  snapshot(): CinematicSnapshot {
    const round = (value: number): number => Number(value.toFixed(6));
    return {
      cue: this.cue,
      position: this.position.toArray().map(round) as [number, number, number],
      target: this.target.toArray().map(round) as [number, number, number],
      roll: round(this.roll),
      fov: round(this.camera.fov),
      envelopeOk: this.envelopeOk,
      maxEnvelopeRatio: round(this.maxEnvelopeRatio),
    };
  }
}
