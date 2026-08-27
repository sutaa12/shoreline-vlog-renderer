import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { Water } from "three/addons/objects/Water.js";

export type QualityTier = "interactive" | "capture" | "fallback";

export interface SceneSystemState {
  readonly sky: boolean;
  readonly ocean: boolean;
  readonly sand: boolean;
  readonly rocks: boolean;
  readonly shadows: boolean;
  readonly fog: boolean;
  readonly reflections: boolean;
  readonly outline: boolean;
}

export interface ShorelineScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly canvas: HTMLCanvasElement;
  readonly sunDirection: THREE.Vector3;
  readonly qualityTier: QualityTier;
  readonly rockCount: number;
  readonly systems: SceneSystemState;
  setOutlinedObjects(objects: THREE.Object3D[]): void;
  update(time: number): void;
  render(): void;
  resize(): void;
  dispose(): void;
}

const COAST_FOG_COLOR = new THREE.Color(0x8fa9ae);
const OCEAN_LEVEL = -0.12;

function deterministicNoise(x: number, z: number): number {
  return (
    Math.sin(x * 0.41 + z * 0.13) * 0.52 +
    Math.sin(x * -0.17 + z * 0.53 + 1.7) * 0.3 +
    Math.sin(x * 0.87 + z * -0.71 + 0.4) * 0.18
  );
}

export function shorelineHeight(x: number, z: number): number {
  const shorelineMask = THREE.MathUtils.smoothstep(z, -3.8, 2.2);
  const duneRise = THREE.MathUtils.smoothstep(z, 0.5, 18) * 0.42;
  const longDunes = Math.sin(x * 0.13 + z * 0.085) * 0.085;
  const unevenSurface = deterministicNoise(x * 0.72, z * 0.72) * 0.042;
  const dryBeach = -0.015 + duneRise + longDunes + unevenSurface;
  const submergedShelf = -0.34 + Math.max(0, z + 3.8) * 0.038;
  return THREE.MathUtils.lerp(submergedShelf, dryBeach, shorelineMask);
}

function createEnvironmentTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Procedural environment texture: 2D canvas context is unavailable.");

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#7f9da9");
  gradient.addColorStop(0.42, "#b7c8c6");
  gradient.addColorStop(0.52, "#e8d5b8");
  gradient.addColorStop(0.62, "#607f83");
  gradient.addColorStop(1, "#1b3d45");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const glow = context.createRadialGradient(402, 112, 2, 402, 112, 74);
  glow.addColorStop(0, "rgba(255,244,208,0.96)");
  glow.addColorStop(0.18, "rgba(255,221,164,0.48)");
  glow.addColorStop(1, "rgba(255,207,144,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createSandTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Procedural sand texture: 2D canvas context is unavailable.");

  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      let hash = (Math.imul(x + 11, 374761393) ^ Math.imul(y + 37, 668265263)) >>> 0;
      hash = Math.imul(hash ^ (hash >>> 13), 1274126177) >>> 0;
      const randomGrain = ((hash & 1023) / 1023 - 0.5) * 12;
      const periodicRipple = Math.sin(((x + y * 0.35) * Math.PI * 2) / 64) * 2.2;
      const grain = randomGrain + periodicRipple;
      image.data[index] = 151 + grain;
      image.data[index + 1] = 141 + grain;
      image.data[index + 2] = 121 + grain * 0.7;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(28, 18);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createAnalyticSky(sunDirection: THREE.Vector3): THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> {
  const geometry = new THREE.SphereGeometry(118, 64, 32);
  const material = new THREE.ShaderMaterial({
    uniforms: { uSunDirection: { value: sunDirection.clone() } },
    vertexShader: /* glsl */ `
      varying vec3 vSkyDirection;
      void main() {
        vSkyDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunDirection;
      varying vec3 vSkyDirection;
      void main() {
        vec3 direction = normalize(vSkyDirection);
        float elevation = clamp(direction.y, 0.0, 1.0);
        float horizon = pow(1.0 - elevation, 3.0);
        vec3 zenithColor = vec3(0.10, 0.32, 0.48);
        vec3 horizonColor = vec3(0.60, 0.69, 0.70);
        vec3 color = mix(horizonColor, zenithColor, pow(elevation, 0.58));
        float sunAlignment = max(dot(direction, normalize(uSunDirection)), 0.0);
        float sunGlow = pow(sunAlignment, 18.0) * horizon;
        float sunDisc = pow(sunAlignment, 720.0);
        color += vec3(0.68, 0.35, 0.15) * sunGlow * 0.58;
        color += vec3(1.0, 0.82, 0.55) * sunDisc * 2.2;
        float hazeBand = exp(-abs(direction.y) * 13.0);
        color = mix(color, vec3(0.66, 0.70, 0.67), hazeBand * 0.26);
        float cloudField = sin(direction.x * 19.0 + direction.z * 8.0)
          + sin(direction.x * -31.0 + direction.z * 17.0) * 0.45
          + sin(direction.x * 57.0 + direction.z * -23.0) * 0.18;
        float cloudBand = smoothstep(0.52, 1.18, cloudField)
          * smoothstep(0.04, 0.20, elevation)
          * (1.0 - smoothstep(0.62, 0.88, elevation));
        color = mix(color, vec3(0.73, 0.77, 0.76), cloudBand * 0.32);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: true,
    fog: false,
  });
  const sky = new THREE.Mesh(geometry, material);
  sky.name = "analytic-coastal-sky";
  sky.renderOrder = -1000;
  return sky;
}

function createSand(): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> {
  const geometry = new THREE.PlaneGeometry(64, 42, 192, 128);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position!;
  const colors: number[] = [];

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const worldZ = positions.getZ(index) + 9;
    const height = shorelineHeight(x, worldZ);
    positions.setY(index, height);

    const wetness = 1 - THREE.MathUtils.smoothstep(worldZ, -0.8, 4.2);
    const variation = deterministicNoise(x * 1.5, worldZ * 1.5) * 0.035;
    const dry = new THREE.Color(0xa89a7e);
    const wet = new THREE.Color(0x586360);
    const color = dry.lerp(wet, wetness * 0.82).offsetHSL(0, 0, variation * 0.5);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    map: createSandTexture(),
    vertexColors: true,
    roughness: 0.94,
    metalness: 0.02,
    envMapIntensity: 0.52,
  });
  const sand = new THREE.Mesh(geometry, material);
  sand.position.z = 9;
  sand.receiveShadow = true;
  sand.name = "procedural-sand-beach";
  return sand;
}

function createWaterNormals(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Procedural water normal texture: 2D canvas context is unavailable.");
  const image = context.createImageData(size, size);
  const heightAt = (x: number, y: number): number => (
    Math.sin((x * Math.PI * 2) / 32 + (y * Math.PI * 2) / 91) * 0.58
    + Math.sin((x * Math.PI * 2) / 73 - (y * Math.PI * 2) / 41) * 0.29
    + Math.sin((x * Math.PI * 2) / 17 + (y * Math.PI * 2) / 29) * 0.13
  );
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = heightAt((x + 1) % size, y) - heightAt((x - 1 + size) % size, y);
      const dy = heightAt(x, (y + 1) % size) - heightAt(x, (y - 1 + size) % size);
      const normal = new THREE.Vector3(-dx * 0.22, -dy * 0.22, 1).normalize();
      const index = (y * size + x) * 4;
      image.data[index] = (normal.x * 0.5 + 0.5) * 255;
      image.data[index + 1] = (normal.y * 0.5 + 0.5) * 255;
      image.data[index + 2] = normal.z * 255;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

function createOcean(sunDirection: THREE.Vector3, qualityTier: QualityTier): Water {
  const geometry = new THREE.PlaneGeometry(200, 200);
  const reflectionResolution = qualityTier === "fallback" ? 256 : 512;
  const ocean = new Water(geometry, {
    textureWidth: reflectionResolution,
    textureHeight: reflectionResolution,
    waterNormals: createWaterNormals(),
    sunDirection,
    sunColor: 0xffd7a0,
    waterColor: 0x123f4a,
    distortionScale: 0.48,
    alpha: 1,
    fog: true,
  });
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(0, OCEAN_LEVEL, -80);
  ocean.receiveShadow = true;
  ocean.name = "procedural-moving-ocean";
  return ocean;
}

function createRockField(): { group: THREE.Group; count: number } {
  const group = new THREE.Group();
  group.name = "uneven-rock-field";
  let geometry = new THREE.IcosahedronGeometry(1, 3);
  const rockPositions = geometry.attributes.position!;
  for (let index = 0; index < rockPositions.count; index += 1) {
    const x = rockPositions.getX(index);
    const y = rockPositions.getY(index);
    const z = rockPositions.getZ(index);
    const radialVariation = 1 + deterministicNoise(x * 3.1 + y, z * 3.7 - y) * 0.14;
    rockPositions.setXYZ(index, x * radialVariation, y * radialVariation, z * radialVariation);
  }
  geometry = mergeVertices(geometry, 0.0001) as THREE.IcosahedronGeometry;
  geometry.computeVertexNormals();
  const materials = [
    new THREE.MeshStandardMaterial({ color: 0x404843, roughness: 0.9, metalness: 0.03, envMapIntensity: 0.58 }),
    new THREE.MeshStandardMaterial({ color: 0x5b5d56, roughness: 0.94, metalness: 0.01, envMapIntensity: 0.46 }),
    new THREE.MeshStandardMaterial({ color: 0x344341, roughness: 0.84, metalness: 0.04, envMapIntensity: 0.66 }),
  ];

  const anchors: readonly [number, number, number][] = [
    [-12.6, -0.5, -0.8],
    [-8.8, -0.7, -2.4],
    [8.6, -0.3, -0.9],
    [12.2, -0.6, -3.2],
    [16.4, -0.8, -5.8],
    [-17.2, -0.8, -6.4],
  ];
  let count = 0;

  for (let cluster = 0; cluster < anchors.length; cluster += 1) {
    const anchor = anchors[cluster]!;
    const pieces = cluster % 2 === 0 ? 5 : 4;
    for (let piece = 0; piece < pieces; piece += 1) {
      const mesh = new THREE.Mesh(geometry, materials[(cluster + piece) % materials.length]!);
      const angle = piece * 2.17 + cluster * 0.63;
      const radius = piece === 0 ? 0 : 0.8 + piece * 0.48;
      const scale = 0.62 + ((cluster * 7 + piece * 11) % 9) * 0.17;
      mesh.position.set(anchor[0] + Math.cos(angle) * radius, anchor[1], anchor[2] + Math.sin(angle) * radius);
      mesh.scale.set(scale * (1.1 + 0.24 * Math.sin(angle)), scale * (0.72 + 0.13 * piece), scale * (0.86 + 0.22 * Math.cos(angle)));
      mesh.rotation.set(piece * 0.31, angle * 0.72, cluster * 0.19 - 0.28);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = `coastal-rock-${cluster}-${piece}`;
      group.add(mesh);
      count += 1;
    }
  }
  return { group, count };
}

function setRendererSize(renderer: THREE.WebGLRenderer, composer: EffectComposer, quality: QualityTier): void {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const maxPixelRatio = quality === "capture" ? 1 : quality === "fallback" ? 1 : 1.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
  renderer.setSize(width, height, false);
  composer.setSize(width, height);
}

export function createShorelineScene(container: HTMLElement, qualityTier: QualityTier): ShorelineScene {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.78;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.dataset.renderer = "shoreline-webgl2";
  renderer.domElement.setAttribute("aria-label", "Animated coastal cinematic");
  container.append(renderer.domElement);

  if (!renderer.capabilities.isWebGL2) {
    renderer.dispose();
    renderer.domElement.remove();
    throw new Error("WebGL2 is required. Open this demo in a current desktop browser with WebGL2 enabled.");
  }

  const scene = new THREE.Scene();
  scene.background = COAST_FOG_COLOR;
  scene.fog = new THREE.Fog(COAST_FOG_COLOR, 30, 92);
  const environmentTexture = createEnvironmentTexture();
  scene.environment = environmentTexture;

  const camera = new THREE.PerspectiveCamera(42, 1, 0.08, 160);
  camera.position.set(6, 3, 8);

  const sunDirection = new THREE.Vector3(-0.36, 0.61, -0.7).normalize();
  const sky = createAnalyticSky(sunDirection);
  scene.add(sky);

  const hemisphere = new THREE.HemisphereLight(0xb5cdd2, 0x5a4c3d, 1.0);
  hemisphere.name = "coastal-sky-fill";
  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight(0xffdfad, 3.25);
  sun.position.copy(sunDirection).multiplyScalar(34);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(qualityTier === "fallback" ? 1024 : 2048);
  sun.shadow.camera.left = -15;
  sun.shadow.camera.right = 15;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -8;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 78;
  sun.shadow.bias = -0.00018;
  sun.shadow.normalBias = 0.022;
  sun.name = "shared-sun-key";
  scene.add(sun, sun.target);

  const sand = createSand();
  const ocean = createOcean(sunDirection, qualityTier);
  const rockField = createRockField();
  scene.add(sand, ocean, rockField.group);

  const renderPass = new RenderPass(scene, camera);
  const outlinePass = new OutlinePass(new THREE.Vector2(1, 1), scene, camera);
  outlinePass.edgeStrength = 2.4;
  outlinePass.edgeGlow = 0.08;
  outlinePass.edgeThickness = 1.05;
  outlinePass.pulsePeriod = 0;
  outlinePass.visibleEdgeColor.set(0x161c1d);
  outlinePass.hiddenEdgeColor.set(0x293536);
  const outputPass = new OutputPass();
  const composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(outlinePass);
  composer.addPass(outputPass);

  const resize = (): void => {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    setRendererSize(renderer, composer, qualityTier);
  };
  resize();
  window.addEventListener("resize", resize, { passive: true });

  const systems: SceneSystemState = {
    sky: true,
    ocean: true,
    sand: true,
    rocks: rockField.count >= 20,
    shadows: renderer.shadowMap.enabled && sun.castShadow,
    fog: scene.fog !== null,
    reflections: scene.environment !== null,
    outline: true,
  };

  return {
    renderer,
    scene,
    camera,
    canvas: renderer.domElement,
    sunDirection,
    qualityTier,
    rockCount: rockField.count,
    systems,
    setOutlinedObjects(objects: THREE.Object3D[]): void {
      outlinePass.selectedObjects = objects;
    },
    update(time: number): void {
      ocean.material.uniforms.time!.value = time * 0.55;
    },
    render(): void {
      composer.render();
    },
    resize,
    dispose(): void {
      window.removeEventListener("resize", resize);
      composer.dispose();
      environmentTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
