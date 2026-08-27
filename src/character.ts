import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils, type VRM } from "@pixiv/three-vrm";
import { shorelineHeight } from "./scene";

const CHARACTER_ASSET_URL = "/assets/character.vrm";

export interface CharacterDiagnostics {
  readonly assetUrl: string;
  readonly modelName: string;
  readonly author: string;
  readonly mtoonMaterialCount: number;
  readonly nativeOutlineMaterialCount: number;
  readonly outlineMode: "mtoon-native" | "postprocess-fallback";
  readonly skinnedMeshCount: number;
  readonly springBonesSupported: boolean;
  readonly expressionsSupported: boolean;
  readonly height: number;
}

export interface CharacterRuntime {
  readonly root: THREE.Group;
  readonly vrm: VRM;
  readonly renderables: THREE.Object3D[];
  readonly diagnostics: CharacterDiagnostics;
  readonly subjectPosition: THREE.Vector3;
  update(time: number, deltaSeconds: number): void;
  dispose(): void;
}

function loadVrm(url: string, onProgress?: (loaded: number, total: number) => void): Promise<VRM> {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser, { autoUpdateHumanBones: true }));

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM | undefined;
        if (!vrm) {
          reject(new Error(`VRM parser did not return a valid model for ${url}.`));
          return;
        }
        resolve(vrm);
      },
      (event) => onProgress?.(event.loaded, event.total),
      (cause) => {
        const detail = cause instanceof Error ? cause.message : String(cause);
        reject(new Error(`Unable to load required character asset ${url}: ${detail}`));
      },
    );
  });
}

function quaternionTuple(x: number, y: number, z: number): [number, number, number, number] {
  const value = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, "XYZ"));
  return [value.x, value.y, value.z, value.w];
}

function quietBeatWeight(time: number): number {
  const local = ((time % 24) + 24) % 24;
  const enter = THREE.MathUtils.smoothstep(local, 13.2, 14.1);
  const leave = 1 - THREE.MathUtils.smoothstep(local, 16.5, 17.3);
  return enter * leave;
}

function blinkWeight(time: number): number {
  const blinkCycle = ((time + 0.7) % 4.1 + 4.1) % 4.1;
  if (blinkCycle > 0.22) return 0;
  const centered = Math.abs(blinkCycle / 0.22 - 0.5) * 2;
  return 1 - THREE.MathUtils.smoothstep(centered, 0.28, 1);
}

export async function loadCharacter(
  parent: THREE.Scene,
  onProgress?: (loaded: number, total: number) => void,
): Promise<CharacterRuntime> {
  const vrm = await loadVrm(CHARACTER_ASSET_URL, onProgress);
  VRMUtils.removeUnnecessaryVertices(vrm.scene);
  VRMUtils.combineSkeletons(vrm.scene);
  if (vrm.meta.metaVersion === "0") VRMUtils.rotateVRM0(vrm);

  const root = new THREE.Group();
  root.name = "animated-vrm-character-root";
  root.add(vrm.scene);
  parent.add(root);

  vrm.scene.updateMatrixWorld(true);
  const initialBounds = new THREE.Box3().setFromObject(vrm.scene);
  if (initialBounds.isEmpty()) {
    root.remove(vrm.scene);
    parent.remove(root);
    throw new Error(`Required character asset ${CHARACTER_ASSET_URL} contains no renderable geometry.`);
  }
  vrm.scene.position.y -= initialBounds.min.y;
  vrm.scene.updateMatrixWorld(true);
  const groundedBounds = new THREE.Box3().setFromObject(vrm.scene);

  const renderables: THREE.Object3D[] = [];
  const uniqueMToonMaterials = new Set<THREE.Material>();
  const uniqueOutlineMaterials = new Set<THREE.Material>();
  let skinnedMeshCount = 0;

  vrm.scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    renderables.push(mesh);
    if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) skinnedMeshCount += 1;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      const candidate = material as THREE.Material & { isMToonMaterial?: boolean; isOutline?: boolean };
      if (candidate.isMToonMaterial) uniqueMToonMaterials.add(material);
      if (candidate.isMToonMaterial && candidate.isOutline) uniqueOutlineMaterials.add(material);
    }
  });

  if (uniqueMToonMaterials.size === 0) {
    parent.remove(root);
    throw new Error(`Required character asset ${CHARACTER_ASSET_URL} has no MToon-compatible material.`);
  }
  if (skinnedMeshCount === 0) {
    parent.remove(root);
    throw new Error(`Required character asset ${CHARACTER_ASSET_URL} has no skinned character mesh.`);
  }

  const gazeTarget = new THREE.Object3D();
  gazeTarget.name = "character-attention-target";
  parent.add(gazeTarget);
  if (vrm.lookAt) {
    vrm.lookAt.target = gazeTarget;
    vrm.lookAt.autoUpdate = true;
  }

  const subjectPosition = new THREE.Vector3();
  const meta = vrm.meta as unknown as { authors?: string[]; author?: string; name?: string; title?: string };
  const author = Array.isArray(meta.authors) ? meta.authors.join(", ") : (meta.author ?? "Unknown");
  const diagnostics: CharacterDiagnostics = {
    assetUrl: CHARACTER_ASSET_URL,
    modelName: meta.name ?? meta.title ?? "Unnamed VRM",
    author,
    mtoonMaterialCount: uniqueMToonMaterials.size,
    nativeOutlineMaterialCount: uniqueOutlineMaterials.size,
    outlineMode: uniqueOutlineMaterials.size > 0 ? "mtoon-native" : "postprocess-fallback",
    skinnedMeshCount,
    springBonesSupported: vrm.springBoneManager !== undefined,
    expressionsSupported: vrm.expressionManager !== undefined,
    height: groundedBounds.max.y - groundedBounds.min.y,
  };

  return {
    root,
    vrm,
    renderables,
    diagnostics,
    subjectPosition,
    update(time: number, deltaSeconds: number): void {
      const quiet = quietBeatWeight(time);
      const motion = 1 - quiet * 0.86;
      const stride = Math.sin(time * 2.35) * motion;
      const breathing = Math.sin(time * 1.08);
      const pathPhase = (time / 24) * Math.PI * 2;
      const x = Math.sin(pathPhase) * 0.82;
      const z = 2.15 + Math.sin(pathPhase * 2 + 0.65) * 0.22;
      const ground = shorelineHeight(x, z);

      root.position.set(x, ground, z);
      root.rotation.y = Math.sin(pathPhase) * 0.14;
      subjectPosition.set(x, ground, z);

      const pose = {
        hips: {
          position: [0, Math.abs(stride) * 0.018 + breathing * 0.006, 0] as [number, number, number],
          rotation: quaternionTuple(stride * 0.018, Math.sin(pathPhase) * 0.035, -stride * 0.028),
        },
        spine: { rotation: quaternionTuple(breathing * 0.012, -stride * 0.015, stride * 0.018) },
        chest: { rotation: quaternionTuple(-breathing * 0.009, stride * 0.022, -stride * 0.015) },
        head: {
          rotation: quaternionTuple(
            -0.025 + Math.sin(time * 0.54) * 0.026,
            Math.sin(time * 0.37 + 0.8) * 0.085 + quiet * 0.075,
            Math.sin(time * 0.62) * 0.018,
          ),
        },
        leftUpperArm: { rotation: quaternionTuple(stride * 0.24, 0, -1.08 - quiet * 0.04) },
        rightUpperArm: { rotation: quaternionTuple(-stride * 0.24, 0, 1.08 + quiet * 0.04) },
        leftLowerArm: { rotation: quaternionTuple(-0.14 - Math.max(0, -stride) * 0.1, 0, -0.04) },
        rightLowerArm: { rotation: quaternionTuple(-0.14 - Math.max(0, stride) * 0.1, 0, 0.04) },
        leftUpperLeg: { rotation: quaternionTuple(-stride * 0.28, 0, 0.015) },
        rightUpperLeg: { rotation: quaternionTuple(stride * 0.28, 0, -0.015) },
        leftLowerLeg: { rotation: quaternionTuple(Math.max(0, stride) * 0.22, 0, 0) },
        rightLowerLeg: { rotation: quaternionTuple(Math.max(0, -stride) * 0.22, 0, 0) },
        leftFoot: { rotation: quaternionTuple(Math.max(0, -stride) * 0.08, 0, 0) },
        rightFoot: { rotation: quaternionTuple(Math.max(0, stride) * 0.08, 0, 0) },
      };
      vrm.humanoid.setNormalizedPose(pose);

      gazeTarget.position.set(
        x + Math.sin(time * 0.29) * 0.55,
        ground + 1.48 + Math.sin(time * 0.41) * 0.06,
        z + 4.2,
      );

      const expressions = vrm.expressionManager;
      if (expressions) {
        expressions.setValue("blink", blinkWeight(time));
        expressions.setValue("relaxed", quiet * 0.34);
        expressions.setValue("happy", (1 - quiet) * 0.08);
      }
      vrm.update(Math.max(0, Math.min(deltaSeconds, 1 / 15)));
    },
    dispose(): void {
      parent.remove(gazeTarget);
      parent.remove(root);
      VRMUtils.deepDispose(vrm.scene);
    },
  };
}
