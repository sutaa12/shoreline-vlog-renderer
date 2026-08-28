import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const PLATE_PATH = "/assets/environment/shoreline-plate.webp";
const PLATE_REFERENCE_FOV = 35;
const PLATE_HORIZON_Y = 0.47;

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function createSandTexture(renderer) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: false });
  const image = context.createImageData(size, size);
  const random = seeded(280824);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const ripple = Math.sin(x * 0.15 + Math.sin(y * 0.055) * 2.2) * 4;
      const grain = (random() - 0.5) * 17;
      const damp = 1 - y / size;
      image.data[offset] = 166 + ripple + grain - damp * 8;
      image.data[offset + 1] = 150 + ripple * 0.7 + grain - damp * 6;
      image.data[offset + 2] = 125 + ripple * 0.45 + grain - damp * 3;
      image.data[offset + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function createSand(renderer, quality) {
  const segments = quality === "balanced" ? [64, 40] : [96, 56];
  const geometry = new THREE.PlaneGeometry(21, 11.8, ...segments);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = positions.getZ(index);
    const broad = Math.sin(x * 0.54 + z * 0.17) * 0.022;
    const detail = Math.sin(x * 2.9 - z * 1.7) * 0.008;
    const beachSlope = THREE.MathUtils.smoothstep(-z, 0, 8) * 0.08;
    positions.setY(index, broad + detail + beachSlope - 0.08);
  }

  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: 0xd0b997,
    map: createSandTexture(renderer),
    roughness: 0.88,
    metalness: 0,
    envMapIntensity: 0.45,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = 1.9;
  mesh.receiveShadow = true;
  mesh.name = "real-foreground-sand";
  return mesh;
}

function createWetSeam() {
  const geometry = new THREE.PlaneGeometry(20, 3.35, 72, 16);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = positions.getZ(index);
    const edgeNoise = Math.sin(x * 0.72) * 0.09 + Math.sin(x * 2.1) * 0.025;
    positions.setZ(index, z + edgeNoise);
  }
  geometry.computeVertexNormals();

  const material = new THREE.MeshPhysicalMaterial({
    color: 0x8b9189,
    roughness: 0.22,
    metalness: 0.02,
    clearcoat: 0.72,
    clearcoatRoughness: 0.18,
    transparent: true,
    opacity: 0.53,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0.028, -5.35);
  mesh.receiveShadow = true;
  mesh.name = "moving-wet-seam";
  return mesh;
}

function createWater(quality) {
  const segments = quality === "balanced" ? [56, 24] : [88, 36];
  const geometry = new THREE.PlaneGeometry(28, 8, ...segments);
  const uniforms = {
    uTime: { value: 0 },
    uFogColor: { value: new THREE.Color(0xa8bdc2) },
    uSunDirection: { value: new THREE.Vector3(-0.45, 0.74, 0.5).normalize() },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vWave;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;

      void main() {
        vUv = uv;
        vec3 transformed = position;
        float waveA = sin(position.x * 0.72 + position.y * 0.86 + uTime * 1.15);
        float waveB = sin(position.x * -1.12 + position.y * 0.43 + uTime * 1.72);
        float waveC = sin(position.x * 2.55 - position.y * 1.82 + uTime * 2.24);
        vWave = waveA * 0.48 + waveB * 0.34 + waveC * 0.18;
        transformed.z += vWave * 0.055;
        vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
        vWorldPosition = worldPosition.xyz;
        vec3 localNormal = normalize(vec3(
          -0.04 * cos(position.x * 0.72 + position.y * 0.86 + uTime * 1.15),
          -0.04 * cos(position.x * -1.12 + position.y * 0.43 + uTime * 1.72),
          1.0
        ));
        vWorldNormal = normalize(mat3(modelMatrix) * localNormal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uFogColor;
      uniform vec3 uSunDirection;
      varying vec2 vUv;
      varying float vWave;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;

      void main() {
        vec3 normal = normalize(vWorldNormal);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.2);
        float distanceFade = smoothstep(0.0, 1.0, vUv.y);
        vec3 shallow = vec3(0.16, 0.34, 0.37);
        vec3 deep = vec3(0.04, 0.18, 0.22);
        vec3 color = mix(shallow, deep, distanceFade * 0.82);
        color += vec3(0.13, 0.19, 0.2) * fresnel;
        float glint = pow(max(dot(reflect(-uSunDirection, normal), viewDirection), 0.0), 72.0);
        color += vec3(1.0, 0.91, 0.72) * glint * 1.3;
        float crossing = abs(sin((vUv.x * 24.0) + (vUv.y * 17.0) - uTime * 1.7));
        float foam = smoothstep(0.955, 1.0, crossing + vWave * 0.06) * smoothstep(0.84, 0.24, vUv.y);
        float microRipple = sin(vUv.x * 113.0 + uTime * 2.2) * sin(vUv.y * 91.0 - uTime * 1.6);
        color += vec3(0.018, 0.026, 0.027) * microRipple;
        color = mix(color, vec3(0.88, 0.94, 0.92), foam * 0.15);
        float fog = smoothstep(18.0, 42.0, distance(cameraPosition, vWorldPosition));
        color = mix(color, uFogColor, fog * 0.48);
        float edgeFade = smoothstep(0.0, 0.1, vUv.y) * (1.0 - smoothstep(0.68, 1.0, vUv.y));
        float alpha = (mix(0.2, 0.34, fresnel) + foam * 0.02) * edgeFade;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.1, -8.35);
  mesh.name = "moving-reflective-water";
  return { mesh, uniforms };
}

function createFoamRibbons() {
  const group = new THREE.Group();
  const ribbons = [];
  for (let ribbonIndex = 0; ribbonIndex < 3; ribbonIndex += 1) {
    const geometry = new THREE.PlaneGeometry(18, 0.045 + ribbonIndex * 0.012, 72, 1);
    const positions = geometry.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const y = positions.getY(index);
      positions.setY(index, y + Math.sin(x * (0.9 + ribbonIndex * 0.11) + ribbonIndex) * 0.12);
    }
    const material = new THREE.MeshBasicMaterial({
      color: 0xeaf4ef,
      transparent: true,
      opacity: 0.28 - ribbonIndex * 0.045,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ribbon = new THREE.Mesh(geometry, material);
    ribbon.rotation.x = -Math.PI / 2;
    ribbon.position.set(0, 0.08 + ribbonIndex * 0.004, -4.15 - ribbonIndex * 0.52);
    ribbon.userData.baseZ = ribbon.position.z;
    ribbons.push(ribbon);
    group.add(ribbon);
  }
  group.name = "animated-foam-lines";
  return { group, ribbons };
}

function createRockGeometry(seed, detail) {
  const geometry = mergeVertices(new THREE.IcosahedronGeometry(1, detail));
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const random = seeded(seed);
  const tint = new THREE.Color();

  for (let index = 0; index < positions.count; index += 1) {
    const point = new THREE.Vector3().fromBufferAttribute(positions, index);
    const ridge =
      Math.sin(point.x * 5.7 + seed * 0.07) * 0.08 +
      Math.sin(point.y * 8.9 - point.z * 4.1 + seed) * 0.055 +
      (random() - 0.5) * 0.11;
    point.multiplyScalar(1 + ridge);
    point.y *= 0.76 + random() * 0.14;
    positions.setXYZ(index, point.x, point.y, point.z);
    const lightness = 0.68 + random() * 0.18 + Math.max(0, point.y) * 0.018;
    tint.setHSL(0.1, 0.06 + random() * 0.06, lightness);
    colors[index * 3] = tint.r;
    colors[index * 3 + 1] = tint.g;
    colors[index * 3 + 2] = tint.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function createRockTextures(renderer) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  const image = context.createImageData(size, size);
  const random = seeded(196503);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const grain = (random() - 0.5) * 72;
      const mineral = Math.sin(x * 0.71 + y * 0.37) * 7 + Math.sin(x * 1.93 - y * 1.21) * 4;
      const paleFleck = random() > 0.992 ? 58 : 0;
      const value = Math.max(38, Math.min(196, 105 + grain + mineral + paleFleck));
      image.data[offset] = value * 0.96;
      image.data[offset + 1] = value;
      image.data[offset + 2] = value * 0.94;
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const color = new THREE.CanvasTexture(canvas);
  color.wrapS = THREE.RepeatWrapping;
  color.wrapT = THREE.RepeatWrapping;
  color.repeat.set(2.4, 1.7);
  color.colorSpace = THREE.SRGBColorSpace;
  color.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const bump = color.clone();
  bump.colorSpace = THREE.NoColorSpace;
  bump.needsUpdate = true;
  return { color, bump };
}

function createRocks(renderer, quality) {
  const group = new THREE.Group();
  const detail = quality === "balanced" ? 2 : 3;
  const placements = [
    [-4.55, 0.17, 0.25, 0.74, 0.48, 0.58],
    [-5.7, 0.24, -2.2, 0.98, 0.68, 0.82],
    [-3.9, 0.12, -3.75, 0.52, 0.36, 0.63],
    [-6.85, 0.32, -5.6, 1.28, 0.78, 1.04],
    [4.55, 0.16, 0.15, 0.68, 0.45, 0.55],
    [5.75, 0.26, -2.35, 1.04, 0.71, 0.86],
    [4.05, 0.13, -4.15, 0.5, 0.38, 0.68],
    [6.9, 0.34, -5.8, 1.32, 0.82, 1.08],
    [-2.85, 0.13, 2.15, 0.42, 0.24, 0.55],
    [3.1, 0.14, 1.85, 0.48, 0.27, 0.62],
  ];
  const textures = createRockTextures(renderer);
  const material = new THREE.MeshStandardMaterial({
    color: 0xaeb3ad,
    map: textures.color,
    bumpMap: textures.bump,
    bumpScale: 0.045,
    roughness: 0.92,
    metalness: 0.03,
    vertexColors: true,
  });

  placements.forEach((placement, index) => {
    const [x, y, z, sx, sy, sz] = placement;
    const rock = new THREE.Mesh(createRockGeometry(177 + index * 97, detail), material);
    rock.position.set(x, y, z);
    rock.scale.set(sx, sy, sz);
    rock.rotation.set(index * 0.21, index * 0.73, index * -0.13);
    rock.castShadow = true;
    rock.receiveShadow = true;
    rock.name = `weathered-rock-${String(index + 1).padStart(2, "0")}`;
    group.add(rock);
  });
  group.name = "irregular-detailed-rocks";
  return group;
}

function createContactCues() {
  const group = new THREE.Group();
  const contact = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 48),
    new THREE.MeshBasicMaterial({
      color: 0x172227,
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
    }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.scale.set(0.78, 0.3, 1);
  contact.position.y = 0.018;
  contact.name = "character-contact-shadow";

  const reflection = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 48),
    new THREE.MeshBasicMaterial({
      color: 0x36515a,
      transparent: true,
      opacity: 0.045,
      depthWrite: false,
    }),
  );
  reflection.rotation.x = -Math.PI / 2;
  reflection.scale.set(0.38, 1.35, 1);
  reflection.position.y = 0.023;
  reflection.name = "wet-sand-reflection-cue";
  group.add(contact, reflection);
  return { group, contact, reflection };
}

function createPlate(camera) {
  const distance = 88;
  const coverageFov = 44;
  const height = 2 * Math.tan(THREE.MathUtils.degToRad(coverageFov / 2)) * distance;
  const width = height * (16 / 9);
  const geometry = new THREE.PlaneGeometry(width, height);
  const fallbackMaterial = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        vec3 sky = mix(vec3(0.46, 0.66, 0.76), vec3(0.76, 0.82, 0.81), smoothstep(0.45, 0.64, 1.0 - vUv.y));
        vec3 sea = mix(vec3(0.08, 0.27, 0.32), vec3(0.25, 0.45, 0.47), vUv.y);
        vec3 sand = vec3(0.58, 0.52, 0.43);
        vec3 color = vUv.y > 0.53 ? sky : (vUv.y > 0.37 ? sea : sand);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, fallbackMaterial);
  mesh.position.set(0, (0.5 - PLATE_HORIZON_Y) * height, -distance);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  mesh.name = "calibrated-photographic-far-field";
  camera.add(mesh);

  const load = async () => {
    const texture = await new THREE.TextureLoader().loadAsync(PLATE_PATH);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      depthTest: false,
      depthWrite: false,
      fog: false,
      toneMapped: true,
    });
    mesh.material = material;
    fallbackMaterial.dispose();
    return texture;
  };

  return { mesh, load };
}

export function createEnvironment({ scene, camera, renderer, quality = "high" }) {
  scene.background = new THREE.Color(0x91b3c3);
  scene.fog = new THREE.FogExp2(0xa8bdc2, 0.022);

  const hemisphere = new THREE.HemisphereLight(0xbfdcf0, 0x6e5e4e, 1.35);
  const sun = new THREE.DirectionalLight(0xffefd0, 3.25);
  sun.position.set(-6.5, 9.5, 5.4);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(quality === "balanced" ? 1024 : 2048);
  sun.shadow.camera.left = -7.5;
  sun.shadow.camera.right = 7.5;
  sun.shadow.camera.top = 7.5;
  sun.shadow.camera.bottom = -5;
  sun.shadow.camera.near = 0.2;
  sun.shadow.camera.far = 28;
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 0.022;
  sun.target.position.set(0, 0.4, -1.5);
  scene.add(hemisphere, sun, sun.target);

  const stage = new THREE.Group();
  stage.name = "real-threejs-contact-stage";
  const sand = createSand(renderer, quality);
  const wetSeam = createWetSeam();
  const water = createWater(quality);
  const foam = createFoamRibbons();
  const rocks = createRocks(renderer, quality);
  const contact = createContactCues();
  stage.add(sand, wetSeam, water.mesh, foam.group, rocks, contact.group);
  scene.add(stage);

  const plate = createPlate(camera);

  function update(timeSeconds, characterState) {
    water.uniforms.uTime.value = timeSeconds;
    wetSeam.position.z = -5.35 + Math.sin(timeSeconds * 0.62) * 0.08;
    wetSeam.material.opacity = 0.5 + Math.sin(timeSeconds * 0.78) * 0.035;
    foam.ribbons.forEach((ribbon, index) => {
      ribbon.position.z = ribbon.userData.baseZ + Math.sin(timeSeconds * (0.52 + index * 0.08) + index) * 0.12;
      ribbon.material.opacity = 0.29 + Math.sin(timeSeconds * 0.82 + index * 1.7) * 0.07;
    });

    if (characterState) {
      contact.contact.position.x = characterState.position[0];
      contact.contact.position.z = characterState.position[2];
      contact.contact.scale.x = 1 + characterState.walkAmount * 0.16;
      contact.reflection.position.x = characterState.position[0] + 0.06;
      contact.reflection.position.z = Math.min(-1.43, characterState.position[2] - 1.56);
      contact.reflection.material.opacity = 0.028 + characterState.quietAmount * 0.022;
    }
  }

  return {
    loadPlate: plate.load,
    update,
    diagnostics: {
      platePath: PLATE_PATH,
      plateCalibration: {
        referenceFovDegrees: PLATE_REFERENCE_FOV,
        horizonNormalizedY: PLATE_HORIZON_Y,
        lateralEnvelopeMeters: 0.65,
        depthEnvelopeMeters: 0.35,
      },
      foregroundSand: true,
      movingWater: true,
      movingWetSeam: true,
      irregularRockCount: rocks.children.length,
      fog: true,
      shadows: true,
      reflectionCue: true,
      contactShadow: true,
      shadowMapSize: sun.shadow.mapSize.x,
    },
  };
}
