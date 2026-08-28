import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

const VRM_PATH = "/assets/character.vrm";
const TARGET_HEIGHT_METERS = 1.66;

const CONTROLLED_BONES = [
  "hips",
  "spine",
  "chest",
  "upperChest",
  "neck",
  "head",
  "leftUpperArm",
  "rightUpperArm",
  "leftLowerArm",
  "rightLowerArm",
  "leftUpperLeg",
  "rightUpperLeg",
  "leftLowerLeg",
  "rightLowerLeg",
  "leftFoot",
  "rightFoot",
];

function materialsOf(material) {
  return Array.isArray(material) ? material : [material];
}

function configureMToonMaterials(scene) {
  const materials = new Set();
  scene.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    materialsOf(object.material).forEach((material) => materials.add(material));
  });

  let mtoonCount = 0;
  let nativeOutlineCount = 0;
  materials.forEach((material) => {
    if (!material?.isMToonMaterial) return;
    mtoonCount += 1;
    material.outlineWidthMode = "screenCoordinates";
    material.outlineWidthFactor = Math.max(material.outlineWidthFactor ?? 0, 0.0018);
    material.outlineColorFactor?.setRGB(0.018, 0.022, 0.028);
    material.outlineLightingMixFactor = 0.16;
    material.parametricRimFresnelPowerFactor = Math.max(
      material.parametricRimFresnelPowerFactor ?? 1,
      2.1,
    );
    material.parametricRimLiftFactor = Math.max(material.parametricRimLiftFactor ?? 0, 0.08);
    material.needsUpdate = true;
    nativeOutlineCount += 1;
  });

  return { mtoonCount, nativeOutlineCount };
}

function createOutlineMaterial(material) {
  if (material?.isMToonMaterial) {
    const outline = material.clone();
    outline.isOutline = true;
    outline.side = THREE.BackSide;
    outline.outlineWidthMode = "screenCoordinates";
    outline.outlineWidthFactor = Math.max(outline.outlineWidthFactor ?? 0, 0.0026);
    outline.outlineColorFactor?.setRGB(0.012, 0.016, 0.022);
    outline.depthWrite = true;
    outline.colorWrite = true;
    outline.needsUpdate = true;
    return outline;
  }

  return new THREE.MeshBasicMaterial({
    color: 0x10161c,
    side: THREE.BackSide,
    toneMapped: false,
  });
}

function createOutlineShell(sourceScene) {
  const shell = cloneSkeleton(sourceScene);
  let meshCount = 0;
  shell.traverse((object) => {
    if (!object.isMesh) return;
    object.material = Array.isArray(object.material)
      ? object.material.map(createOutlineMaterial)
      : createOutlineMaterial(object.material);
    object.castShadow = false;
    object.receiveShadow = false;
    object.renderOrder = -1;
    meshCount += 1;
  });
  shell.scale.multiplyScalar(1.0015);
  shell.name = "mtoon-native-outline-silhouette-shell";
  return { shell, meshCount };
}

function collectBonePairs(source, clone) {
  const sourceBones = new Map();
  const cloneBones = new Map();
  source.traverse((object) => {
    if (object.isBone && object.name) sourceBones.set(object.name, object);
  });
  clone.traverse((object) => {
    if (object.isBone && object.name) cloneBones.set(object.name, object);
  });
  return [...sourceBones.entries()]
    .filter(([name]) => cloneBones.has(name))
    .map(([name, bone]) => [bone, cloneBones.get(name)]);
}

function normalizedBones(vrm) {
  const bones = new Map();
  CONTROLLED_BONES.forEach((name) => {
    const node = vrm.humanoid?.getNormalizedBoneNode(name);
    if (node) {
      bones.set(name, {
        node,
        quaternion: node.quaternion.clone(),
        position: node.position.clone(),
      });
    }
  });
  return bones;
}

const motionQuaternion = new THREE.Quaternion();
const motionEuler = new THREE.Euler(0, 0, 0, "XYZ");

function applyRotation(bones, name, x = 0, y = 0, z = 0) {
  const entry = bones.get(name);
  if (!entry) return;
  motionEuler.set(x, y, z);
  motionQuaternion.setFromEuler(motionEuler);
  entry.node.quaternion.copy(entry.quaternion).multiply(motionQuaternion);
}

function resetBones(bones) {
  bones.forEach((entry) => {
    entry.node.quaternion.copy(entry.quaternion);
    entry.node.position.copy(entry.position);
  });
}

function expressionNames(vrm) {
  const manager = vrm.expressionManager;
  if (!manager) return [];
  if (manager.expressionMap) return Object.keys(manager.expressionMap);
  if (Array.isArray(manager.expressions)) {
    return manager.expressions.map((expression) => expression.expressionName).filter(Boolean);
  }
  return [];
}

function springJointCount(vrm) {
  const manager = vrm.springBoneManager;
  if (!manager) return 0;
  if (Array.isArray(manager.joints)) return manager.joints.length;
  if (manager.joints?.size !== undefined) return manager.joints.size;
  if (Array.isArray(manager._joints)) return manager._joints.length;
  return 1;
}

export async function loadCharacter(scene) {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));

  let gltf;
  try {
    gltf = await loader.loadAsync(VRM_PATH);
  } catch (error) {
    throw new Error(`VRM asset failed to load: ${VRM_PATH}`, { cause: error });
  }

  const vrm = gltf.userData.vrm;
  if (!vrm?.scene || !vrm.humanoid) {
    throw new Error(`VRM asset is invalid or missing humanoid data: ${VRM_PATH}`);
  }

  VRMUtils.rotateVRM0(vrm);
  const materialDiagnostics = configureMToonMaterials(vrm.scene);
  if (materialDiagnostics.mtoonCount === 0) {
    throw new Error(`VRM asset has no MToon materials: ${VRM_PATH}`);
  }

  vrm.scene.updateMatrixWorld(true);
  const initialBounds = new THREE.Box3().setFromObject(vrm.scene);
  const initialHeight = initialBounds.max.y - initialBounds.min.y;
  if (!Number.isFinite(initialHeight) || initialHeight <= 0.1) {
    throw new Error(`VRM asset has invalid model bounds: ${VRM_PATH}`);
  }

  const scale = TARGET_HEIGHT_METERS / initialHeight;
  vrm.scene.scale.setScalar(scale);
  vrm.scene.updateMatrixWorld(true);
  const scaledBounds = new THREE.Box3().setFromObject(vrm.scene);
  vrm.scene.position.y -= scaledBounds.min.y;
  vrm.scene.updateMatrixWorld(true);

  const outline = createOutlineShell(vrm.scene);
  const bonePairs = collectBonePairs(vrm.scene, outline.shell);
  const container = new THREE.Group();
  container.name = "animated-vrm-character";
  container.add(outline.shell, vrm.scene);
  scene.add(container);

  const bones = normalizedBones(vrm);
  const expressions = expressionNames(vrm);
  let lastTime = 0;
  const secondarySpring = { value: 0, velocity: 0 };

  function update(timelineState, deltaSeconds) {
    const state = timelineState.character;
    const safeDelta = Math.max(0, Math.min(deltaSeconds, 1 / 20));
    resetBones(bones);

    const walkSin = Math.sin(state.walkPhase) * state.walkAmount;
    const walkCos = Math.cos(state.walkPhase) * state.walkAmount;
    const breath = state.breathing;
    const quiet = state.quietAmount;
    const weight = state.weightShift;
    const springTarget = walkSin * 0.042 + state.gazeAmount * 0.014;
    const springAcceleration =
      (springTarget - secondarySpring.value) * 34 - secondarySpring.velocity * 10.5;
    secondarySpring.velocity += springAcceleration * safeDelta;
    secondarySpring.value += secondarySpring.velocity * safeDelta;

    const hips = bones.get("hips");
    if (hips) {
      hips.node.position.copy(hips.position);
      hips.node.position.y += Math.abs(walkCos) * 0.016 + breath * 0.004;
      hips.node.position.x += weight * 0.012;
    }

    applyRotation(bones, "hips", 0, 0, weight * 0.035);
    applyRotation(bones, "spine", breath * 0.016, 0, -weight * 0.018);
    applyRotation(
      bones,
      "chest",
      breath * 0.025,
      state.gazeAmount * -0.025,
      weight * 0.026 + secondarySpring.value * 0.42,
    );
    applyRotation(
      bones,
      "upperChest",
      breath * 0.018,
      state.gazeAmount * -0.035,
      weight * 0.015 + secondarySpring.value,
    );
    applyRotation(bones, "neck", -0.015 - quiet * 0.025, state.gazeAmount * -0.14, 0);
    applyRotation(
      bones,
      "head",
      quiet * 0.035 + Math.sin(timelineState.time * 0.63) * 0.009,
      state.gazeAmount * -0.19,
      Math.sin(timelineState.time * 0.47) * 0.012,
    );

    applyRotation(bones, "leftUpperLeg", walkSin * 0.42, 0, -0.015);
    applyRotation(bones, "rightUpperLeg", -walkSin * 0.42, 0, 0.015);
    applyRotation(bones, "leftLowerLeg", Math.max(0, -walkSin) * 0.42, 0, 0);
    applyRotation(bones, "rightLowerLeg", Math.max(0, walkSin) * 0.42, 0, 0);
    applyRotation(bones, "leftFoot", Math.max(0, walkSin) * -0.16, 0, 0);
    applyRotation(bones, "rightFoot", Math.max(0, -walkSin) * -0.16, 0, 0);

    const leftArmRest = -1.04 - quiet * 0.055;
    const rightArmRest = 1.04 + quiet * 0.055;
    applyRotation(bones, "leftUpperArm", -walkSin * 0.28, 0, leftArmRest);
    applyRotation(bones, "rightUpperArm", walkSin * 0.28, 0, rightArmRest);
    applyRotation(bones, "leftLowerArm", -0.18 - Math.max(0, walkSin) * 0.12, 0, 0.04);
    applyRotation(bones, "rightLowerArm", -0.18 - Math.max(0, -walkSin) * 0.12, 0, -0.04);

    container.position.fromArray(state.position);
    container.rotation.y = state.yaw;

    if (vrm.expressionManager) {
      vrm.expressionManager.setValue("blink", state.blink);
    }

    vrm.update(safeDelta);
    bonePairs.forEach(([sourceBone, outlineBone]) => {
      outlineBone.position.copy(sourceBone.position);
      outlineBone.quaternion.copy(sourceBone.quaternion);
      outlineBone.scale.copy(sourceBone.scale);
    });
    outline.shell.updateMatrixWorld(true);
    lastTime = timelineState.time;
  }

  return {
    update,
    diagnostics: {
      path: VRM_PATH,
      validVrm: true,
      humanoid: true,
      controlledBoneCount: bones.size,
      mtoonMaterialCount: materialDiagnostics.mtoonCount,
      nativeOutlineMaterialCount: materialDiagnostics.nativeOutlineCount,
      silhouetteShellMeshCount: outline.meshCount,
      expressionNames: expressions,
      springBoneManager: Boolean(vrm.springBoneManager),
      springJointCount: springJointCount(vrm),
      authoredSecondarySpring: true,
      targetHeightMeters: TARGET_HEIGHT_METERS,
      sourceMeta: {
        name: vrm.meta?.name ?? null,
        version: vrm.meta?.version ?? null,
        authors: vrm.meta?.authors ?? [],
      },
    },
    get lastTime() {
      return lastTime;
    },
  };
}
