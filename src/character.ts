import { Box3, Color, Group, MathUtils, Mesh, Object3D, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRM, VRMHumanBoneName, VRMLoaderPlugin } from '@pixiv/three-vrm';
import type { CharacterSnapshot, FrameState } from './contracts';

const VRM_PATH = '/assets/character.vrm';

type BoneKey = 'hips' | 'spine' | 'chest' | 'upperChest' | 'neck' | 'head' | 'leftUpperArm' | 'rightUpperArm' | 'leftLowerArm' | 'rightLowerArm' | 'leftHand' | 'rightHand' | 'leftUpperLeg' | 'rightUpperLeg' | 'leftLowerLeg' | 'rightLowerLeg' | 'leftFoot' | 'rightFoot';

export class CharacterSystem {
  readonly group = new Group();
  vrm: VRM | null = null;
  loaded = false;
  mtoonMaterials = 0;
  outlineActive = false;
  springSystems = 0;
  private bones = new Map<BoneKey, Object3D>();
  private secondaryYaw = 0;
  private secondaryVelocity = 0;
  private poseValues = [0, 0, 0, 0, 0, 0];

  async initialize(): Promise<void> {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    const gltf = await loader.loadAsync(VRM_PATH);
    const vrm = gltf.userData.vrm as VRM | undefined;
    if (!vrm) throw new Error(`VRM parse failed at ${VRM_PATH}. Restore the recorded VRM asset and reload.`);
    this.vrm = vrm;
    this.group.add(vrm.scene);
    vrm.scene.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        const candidate = material as typeof material & {
          isMToonMaterial?: boolean;
          color?: Color;
          shadeColorFactor?: { copy(value: unknown): { multiply(value: Color): void } };
          shadingShiftFactor?: number;
          shadingToonyFactor?: number;
          giEqualizationFactor?: number;
          rimLightingMixFactor?: number;
          needsUpdate?: boolean;
        };
        if (candidate?.isMToonMaterial) {
          this.mtoonMaterials += 1;
          candidate.color?.multiplyScalar(0.74);
          if (candidate.color && candidate.shadeColorFactor) {
            candidate.shadeColorFactor.copy(candidate.color).multiply(new Color(0.58, 0.48, 0.42));
          }
          candidate.shadingShiftFactor = -0.28;
          candidate.shadingToonyFactor = 0.18;
          candidate.giEqualizationFactor = 0.16;
          candidate.rimLightingMixFactor = 0.08;
          candidate.needsUpdate = true;
        }
      }
    });
    if (this.mtoonMaterials === 0) throw new Error(`MToon validation failed for ${VRM_PATH}. Use the recorded VRM with loader-provided MToon materials.`);
    this.cacheBone('hips', VRMHumanBoneName.Hips);
    this.cacheBone('spine', VRMHumanBoneName.Spine);
    this.cacheBone('chest', VRMHumanBoneName.Chest);
    this.cacheBone('upperChest', VRMHumanBoneName.UpperChest);
    this.cacheBone('neck', VRMHumanBoneName.Neck);
    this.cacheBone('head', VRMHumanBoneName.Head);
    this.cacheBone('leftUpperArm', VRMHumanBoneName.LeftUpperArm);
    this.cacheBone('rightUpperArm', VRMHumanBoneName.RightUpperArm);
    this.cacheBone('leftLowerArm', VRMHumanBoneName.LeftLowerArm);
    this.cacheBone('rightLowerArm', VRMHumanBoneName.RightLowerArm);
    this.cacheBone('leftHand', VRMHumanBoneName.LeftHand);
    this.cacheBone('rightHand', VRMHumanBoneName.RightHand);
    this.cacheBone('leftUpperLeg', VRMHumanBoneName.LeftUpperLeg);
    this.cacheBone('rightUpperLeg', VRMHumanBoneName.RightUpperLeg);
    this.cacheBone('leftLowerLeg', VRMHumanBoneName.LeftLowerLeg);
    this.cacheBone('rightLowerLeg', VRMHumanBoneName.RightLowerLeg);
    this.cacheBone('leftFoot', VRMHumanBoneName.LeftFoot);
    this.cacheBone('rightFoot', VRMHumanBoneName.RightFoot);

    const bounds = new Box3().setFromObject(vrm.scene);
    const height = Math.max(0.01, bounds.max.y - bounds.min.y);
    vrm.scene.scale.setScalar(1.68 / height);
    vrm.scene.updateMatrixWorld(true);
    const scaledBounds = new Box3().setFromObject(vrm.scene);
    vrm.scene.position.y -= scaledBounds.min.y;
    vrm.scene.rotation.y = 0;
    this.group.position.set(0, 0, 0);
    this.springSystems = vrm.springBoneManager ? 1 : 0;
    this.loaded = true;
    this.outlineActive = true;
  }

  private cacheBone(key: BoneKey, name: VRMHumanBoneName): void {
    const node = this.vrm?.humanoid.getNormalizedBoneNode(name);
    if (node) this.bones.set(key, node);
  }

  update(state: FrameState): void {
    if (!this.vrm) return;
    const turn = state.phase01 * Math.PI * 2;
    const phase = state.phaseSeconds;
    const quietCenter = 19.5 / 24;
    const wrapped = Math.atan2(Math.sin(turn - quietCenter * Math.PI * 2), Math.cos(turn - quietCenter * Math.PI * 2));
    const quiet = Math.exp(-(wrapped * wrapped) / 0.62);
    const life = 1 - quiet * 0.78;
    const transfer = MathUtils.smoothstep(phase, 10.05, 11.20) * (1 - MathUtils.smoothstep(phase, 12.95, 14.25));
    const gazeAnticipation = MathUtils.smoothstep(phase, 9.25, 10.05) * (1 - MathUtils.smoothstep(phase, 10.95, 11.75));
    const armIntent = MathUtils.smoothstep(phase, 10.35, 11.25) * (1 - MathUtils.smoothstep(phase, 13.05, 14.20));
    const counterIntent = MathUtils.smoothstep(phase, 10.90, 11.75) * (1 - MathUtils.smoothstep(phase, 13.30, 14.45));
    const leftRelease = MathUtils.smoothstep(phase, 10.80, 11.55) * (1 - MathUtils.smoothstep(phase, 12.15, 13.20));
    const settle = MathUtils.smoothstep(phase, 14.00, 14.80) * (1 - MathUtils.smoothstep(phase, 16.80, 18.00));
    const weight = transfer * 0.165 - settle * 0.012;
    const breath = Math.sin(turn * 3 - 0.8) * (0.022 + quiet * 0.018);
    const gazeTarget = gazeAnticipation * 0.34 + transfer * 0.18 - settle * 0.10 - quiet * 0.08;
    this.secondaryVelocity += (gazeTarget - this.secondaryYaw) * state.deltaSeconds * 3.8;
    this.secondaryVelocity *= Math.exp(-state.deltaSeconds * 1.72);
    this.secondaryYaw += this.secondaryVelocity * state.deltaSeconds;

    const hips = this.bones.get('hips');
    if (hips) {
      hips.rotation.x = transfer * 0.025 - leftRelease * 0.018;
      hips.rotation.z = -transfer * 0.19 + settle * 0.025;
      hips.rotation.y = transfer * 0.075 + gazeAnticipation * 0.025;
    }
    this.group.position.x = weight;
    this.group.position.y = leftRelease * 0.010 - transfer * 0.006;
    this.group.rotation.y = gazeAnticipation * 0.060 + transfer * 0.115 - settle * 0.030 - quiet * 0.018;
    const spine = this.bones.get('spine');
    if (spine) {
      spine.rotation.x = 0.018 + breath;
      spine.rotation.z = transfer * 0.135 - settle * 0.020;
      spine.rotation.y = -transfer * 0.105 - gazeAnticipation * 0.035;
    }
    const chest = this.bones.get('chest');
    if (chest) {
      chest.rotation.x = breath * 0.6;
      chest.rotation.y = -transfer * 0.080 + counterIntent * 0.045;
      chest.rotation.z = transfer * 0.075 - settle * 0.016;
    }
    const upperChest = this.bones.get('upperChest');
    if (upperChest) upperChest.rotation.x = -0.012 + breath * 0.35;
    const neck = this.bones.get('neck');
    if (neck) {
      neck.rotation.y = this.secondaryYaw * 0.58;
      neck.rotation.z = -transfer * 0.025 + settle * 0.010;
    }
    const head = this.bones.get('head');
    if (head) {
      head.rotation.y = this.secondaryYaw * 1.38;
      head.rotation.x = -0.025 + breath * 0.38 - quiet * 0.018;
      head.rotation.z = -transfer * 0.050 + settle * 0.018;
    }
    this.relaxArm('leftUpperArm', 0.14 + transfer * 0.040, 0.05 + transfer * 0.090, -1.28 + armIntent * 0.28);
    this.relaxArm('rightUpperArm', -0.14 - transfer * 0.025, -0.05 - counterIntent * 0.040, 1.28 + counterIntent * 0.10);
    this.relaxArm('leftLowerArm', -0.16 - armIntent * 0.48, -0.10 + armIntent * 0.08, -0.09 - armIntent * 0.28);
    this.relaxArm('rightLowerArm', -0.16 + counterIntent * 0.13, 0.10 - counterIntent * 0.07, 0.09 + counterIntent * 0.06);
    this.relaxArm('leftHand', -0.055 - armIntent * 0.24, -0.045 + armIntent * 0.035, -0.025 - armIntent * 0.20);
    this.relaxArm('rightHand', -0.025 + counterIntent * 0.08, 0.025 - counterIntent * 0.025, 0.018 + counterIntent * 0.07);
    const leftLeg = this.bones.get('leftUpperLeg');
    const rightLeg = this.bones.get('rightUpperLeg');
    const leftLowerLeg = this.bones.get('leftLowerLeg');
    const rightLowerLeg = this.bones.get('rightLowerLeg');
    const leftFoot = this.bones.get('leftFoot');
    const rightFoot = this.bones.get('rightFoot');
    if (leftLeg) {
      leftLeg.rotation.x = leftRelease * 0.18;
      leftLeg.rotation.z = transfer * 0.070 + leftRelease * 0.045;
    }
    if (rightLeg) {
      rightLeg.rotation.x = -transfer * 0.055;
      rightLeg.rotation.z = -transfer * 0.165;
    }
    if (leftLowerLeg) leftLowerLeg.rotation.x = -leftRelease * 0.34;
    if (rightLowerLeg) rightLowerLeg.rotation.x = -transfer * 0.21;
    if (leftFoot) leftFoot.rotation.x = leftRelease * 0.22;
    if (rightFoot) rightFoot.rotation.x = -transfer * 0.085;

    const blinkWave = Math.max(0, Math.cos(turn * 5 + 0.35));
    const blink = MathUtils.smoothstep(blinkWave, 0.965, 1.0);
    this.vrm.expressionManager?.setValue('blink', blink);
    this.poseValues = [weight, breath, this.secondaryYaw, this.secondaryVelocity, life, blink];
    this.vrm.update(state.deltaSeconds);
  }

  private relaxArm(key: BoneKey, x: number, y: number, z: number): void {
    const bone = this.bones.get(key);
    if (!bone) return;
    bone.rotation.set(x, y, z);
  }

  snapshot(): CharacterSnapshot {
    const round = (value: number): number => Number(value.toFixed(6));
    return {
      loaded: this.loaded,
      mtoonMaterials: this.mtoonMaterials,
      outlineActive: this.outlineActive,
      springSystems: this.springSystems,
      pose: this.poseValues.map(round),
      secondary: [round(this.secondaryYaw), round(this.secondaryVelocity)],
    };
  }
}
