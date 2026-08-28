import {
  AmbientLight,
  BackSide,
  BufferAttribute,
  CircleGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  FogExp2,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three';
import type { EnvironmentSnapshot, FrameState, QualityTier } from './contracts';

const PLATE_PATH = '/assets/environment/iteration-03/shoreline-plate.webp';

function hideOutline(material: { userData: Record<string, unknown> }): void {
  material.userData.outlineParameters = { visible: false };
}

function seeded(index: number): number {
  const x = Math.sin(index * 91.173 + 17.31) * 43758.5453;
  return x - Math.floor(x);
}

export class EnvironmentSystem {
  readonly group = new Group();
  readonly sun: DirectionalLight;
  readonly ambient: AmbientLight;
  plateLoaded = false;
  oceanActive = false;
  sandActive = false;
  rocksActive = false;
  fogBridgeActive = false;
  reflectionActive = false;
  contactShadow = false;
  private oceanMaterial: ShaderMaterial | null = null;
  private shorelineMaterial: ShaderMaterial | null = null;
  private platePhase = { value: 0 };
  private footContacts: Mesh[] = [];
  private waterEdge = 0;
  private qualityTier: QualityTier;

  constructor(private scene: Scene, qualityTier: QualityTier) {
    this.qualityTier = qualityTier;
    this.sun = new DirectionalLight(0xffd5a8, 4.10);
    this.sun.position.set(-7.8, 8.9, 1.6);
    this.sun.target.position.set(0, 0.6, -1.8);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(qualityTier === 'high' ? 2048 : 1024, qualityTier === 'high' ? 2048 : 1024);
    this.sun.shadow.camera.left = -7;
    this.sun.shadow.camera.right = 7;
    this.sun.shadow.camera.top = 7;
    this.sun.shadow.camera.bottom = -5;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 24;
    this.sun.shadow.bias = -0.00028;
    this.sun.shadow.normalBias = 0.025;
    this.sun.shadow.intensity = 0.54;
    this.ambient = new AmbientLight(0x8b9ca6, 0.40);
  }

  async initialize(): Promise<void> {
    this.scene.fog = new FogExp2(0xc9c6bc, 0.0125);
    this.scene.background = new Color(0xc7c3b8);
    this.scene.add(this.group, this.sun, this.sun.target, this.ambient);
    await this.createPlate();
    this.createSand();
    this.createFootContact();
    this.createOcean();
    this.createShorelineMotionCue();
    this.createFogBridge();
    this.createRocks();
  }

  private async createPlate(): Promise<void> {
    const texture = await new TextureLoader().loadAsync(PLATE_PATH);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = this.qualityTier === 'high' ? 8 : 4;
    const material = new MeshBasicMaterial({ map: texture, fog: false, toneMapped: false });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uPlatePhase = this.platePhase;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_pars_vertex>',
        '#include <uv_pars_vertex>\nvarying vec2 vPlateUv;',
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        '#include <uv_vertex>\nvPlateUv = uv;',
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <uv_pars_fragment>',
        '#include <uv_pars_fragment>\nvarying vec2 vPlateUv;\nuniform float uPlatePhase;',
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
          float plateX = vPlateUv.x;
          float plateY = vPlateUv.y;
          float shoreEdge = 0.385 + plateX * 0.155
            + 0.009 * sin(plateX * 25.0 + 0.4)
            + 0.004 * sin(plateX * 57.0 - 0.8);
          float shoreMask = smoothstep(shoreEdge + 0.030, shoreEdge + 0.075, plateY);
          float horizonMask = 1.0 - smoothstep(0.755, 0.805, plateY);
          float rockExclusion = 1.0 - smoothstep(0.40, 0.52, plateX);
          float waterMask = shoreMask * horizonMask * rockExclusion;
          vec2 microDrift = vec2(
            sin(plateY * 118.0 + plateX * 31.0 + uPlatePhase * 4.0),
            cos(plateX * 87.0 - plateY * 42.0 - uPlatePhase * 3.0)
          ) * vec2(0.00245, 0.00145) * waterMask;
          vec4 sampledDiffuseColor = texture2D(map, vPlateUv + microDrift);
          float bandAEdge = shoreEdge + 0.056
            + 0.009 * sin(plateX * 18.0 + uPlatePhase * 4.0)
            + 0.004 * sin(plateX * 47.0 - uPlatePhase * 7.0);
          float bandBEdge = shoreEdge + 0.118
            + 0.012 * sin(plateX * 13.0 - uPlatePhase * 3.0);
          float bandA = exp(-pow((plateY - bandAEdge) / 0.0095, 2.0));
          float bandB = exp(-pow((plateY - bandBEdge) / 0.0135, 2.0));
          float breakup = smoothstep(0.12, 0.82,
            0.5 + 0.5 * sin(plateX * 76.0 + uPlatePhase * 6.0)
              * sin(plateX * 39.0 - uPlatePhase * 4.0));
          float liveGlint = waterMask * (bandA * (0.10 + 0.12 * breakup) + bandB * 0.075);
          sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, vec3(0.90, 0.88, 0.82), liveGlint);
          diffuseColor *= sampledDiffuseColor;
        `,
      );
    };
    material.customProgramCacheKey = () => 'shoreline-live-plate-cycle-2';
    hideOutline(material);
    const plate = new Mesh(new PlaneGeometry(90, 50.625), material);
    plate.position.set(0, -3.0, -26.5);
    plate.renderOrder = -10;
    plate.frustumCulled = false;
    this.group.add(plate);
    this.plateLoaded = true;
  }

  private createSand(): void {
    const geometry = new PlaneGeometry(50, 50, 64, 64);
    const positions = geometry.attributes.position as BufferAttribute;
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const y = positions.getY(index);
      const lift = 0.025 * Math.sin(x * 1.7 + y * 0.6) + 0.014 * Math.sin(x * 4.1 - y * 1.3);
      positions.setZ(index, lift);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.rotateX(-Math.PI / 2);
    const material = new MeshStandardMaterial({
      color: 0xa7957d,
      roughness: 0.98,
      metalness: 0,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    });
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace('#include <uv_pars_vertex>', '#include <uv_pars_vertex>\nvarying vec2 vSandUv;');
      shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvSandUv = uv;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <uv_pars_fragment>', '#include <uv_pars_fragment>\nvarying vec2 vSandUv;');
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        'float shoreNoise = 0.025 * sin(vSandUv.x * 37.0) + 0.012 * sin(vSandUv.x * 83.0);\nfloat sandFade = 1.0 - smoothstep(0.52 + shoreNoise, 0.74 + shoreNoise, vSandUv.y);\ngl_FragColor.a *= sandFade;\n#include <dithering_fragment>',
      );
    };
    hideOutline(material);
    const sand = new Mesh(geometry, material);
    sand.position.set(0, -0.04, -8.0);
    sand.receiveShadow = true;
    sand.renderOrder = 1;
    this.group.add(sand);
    this.sandActive = true;
    this.contactShadow = true;
  }

  private createFootContact(): void {
    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: new Color(0x766756) },
        uOpacity: { value: 0.30 },
      },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColor;
        uniform float uOpacity;
        void main(){
          vec2 p = (vUv - 0.5) * 2.0;
          float radial = dot(p, p);
          float feather = 1.0 - smoothstep(0.015, 1.0, radial);
          float grain = 0.98 + 0.02 * sin((p.x + p.y) * 31.0);
          gl_FragColor = vec4(uColor, feather * grain * uOpacity);
        }
      `,
    });
    hideOutline(material);
    for (const x of [-0.085, 0.085]) {
      const contact = new Mesh(new CircleGeometry(1, 40), material);
      contact.rotation.x = -Math.PI / 2;
      contact.scale.set(0.255, 0.128, 1);
      contact.position.set(x, 0.011, 0.035);
      contact.renderOrder = 5;
      this.group.add(contact);
      this.footContacts.push(contact);
    }
  }

  private createOcean(): void {
    const geometry = new PlaneGeometry(40, 25, 96, 64);
    geometry.rotateX(-Math.PI / 2);
    this.oceanMaterial = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uSun: { value: new Color(0xffe4b1) },
        uWater: { value: new Color(0x9ea9a6) },
        uOpacity: { value: this.qualityTier === 'high' ? 0.10 : 0.075 },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vWave;
        varying vec3 vWorld;
        void main() {
          vUv = uv;
          vec3 p = position;
          float broad = sin(p.x * 0.42 + uTime * 0.76) * 0.055;
          float cross = sin(p.x * 1.15 - p.z * 0.82 + uTime * 1.16) * 0.028;
          float ripples = sin(p.x * 2.75 + p.z * 1.38 + uTime * 1.84) * 0.012;
          float shore = smoothstep(0.06, 0.34, uv.y);
          p.y += (broad + cross + ripples) * shore;
          vWave = broad + cross + ripples;
          vec4 world = modelMatrix * vec4(p, 1.0);
          vWorld = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uSun;
        uniform vec3 uWater;
        uniform float uOpacity;
        varying vec2 vUv;
        varying float vWave;
        varying vec3 vWorld;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main() {
          float diagonal = 0.045 * sin(vUv.x * 16.0 + 0.5) + 0.018 * sin(vUv.x * 43.0);
          float shore = smoothstep(0.065 + diagonal, 0.24 + diagonal, vUv.y);
          float horizon = 1.0 - smoothstep(0.73, 0.96, vUv.y);
          float fine = sin(vUv.x * 180.0 + vUv.y * 95.0 + uTime * 2.1) * 0.5 + 0.5;
          float glint = pow(max(0.0, fine * (0.52 + vWave * 4.0)), 7.0);
          float foamTravel = 0.17 + 0.026 * sin(uTime * 1.55 + vUv.x * 4.5);
          float foamBand = exp(-pow((vUv.y - foamTravel - diagonal) * 22.0, 2.0));
          float flow = 0.5 + 0.5 * sin(vUv.x * 28.0 + vUv.y * 13.0 - uTime * 1.25);
          vec3 color = mix(uWater, uSun, glint * 0.42 + foamBand * 0.34);
          float alpha = shore * horizon * (uOpacity + flow * 0.075 + glint * 0.15 + foamBand * 0.20);
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
    hideOutline(this.oceanMaterial);
    const ocean = new Mesh(geometry, this.oceanMaterial);
    ocean.position.set(0, 0.015, -22.8);
    ocean.renderOrder = 2;
    ocean.frustumCulled = false;
    this.group.add(ocean);
    this.oceanActive = true;
    this.reflectionActive = true;
  }

  private createShorelineMotionCue(): void {
    this.shorelineMaterial = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uPhase: { value: 0 },
        uFoam: { value: new Color(0xe8e3d8) },
        uWet: { value: new Color(0x9aa19d) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uPhase;
        uniform vec3 uFoam;
        uniform vec3 uWet;
        varying vec2 vUv;
        void main() {
          float x = vUv.x;
          float irregular = 0.010 * sin(x * 27.0 + 0.7) + 0.005 * sin(x * 61.0 - 0.4);
          float travel = 0.012 * sin(uPhase * 6.0 + x * 9.0)
            + 0.005 * sin(uPhase * 11.0 - x * 23.0);
          float edge = 0.365 + x * 0.165 + irregular + travel;
          float distanceToEdge = vUv.y - edge;
          float foam = exp(-pow(distanceToEdge / 0.0075, 2.0));
          float wet = exp(-pow((distanceToEdge + 0.027) / 0.052, 2.0));
          float broken = max(0.0, 0.65 * sin(x * 96.0 + uPhase * 8.0)
            + 0.35 * sin(x * 41.0 - uPhase * 5.0));
          broken = pow(broken, 2.2);
          float sideFade = smoothstep(0.015, 0.09, x) * (1.0 - smoothstep(0.73, 0.91, x));
          float alpha = sideFade * foam * (0.015 + broken * 0.24);
          vec3 color = mix(uWet, uFoam, clamp(foam * 1.8, 0.0, 1.0));
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
    hideOutline(this.shorelineMaterial);
    const cue = new Mesh(new PlaneGeometry(90, 50.625), this.shorelineMaterial);
    cue.position.set(0, -3.0, -26.38);
    cue.renderOrder = -9;
    cue.frustumCulled = false;
    this.group.add(cue);
  }

  private createFogBridge(): void {
    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: BackSide,
      uniforms: { uColor: { value: new Color(0xc8c6bd) } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `
        varying vec2 vUv; uniform vec3 uColor;
        void main(){
          float vertical = sin(3.14159265 * vUv.y);
          float edge = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));
          gl_FragColor = vec4(uColor, 0.075 * vertical * edge);
        }
      `,
    });
    hideOutline(material);
    const bridge = new Mesh(new PlaneGeometry(52, 5.6), material);
    bridge.position.set(0, 1.25, -23.8);
    bridge.rotation.y = Math.PI;
    bridge.renderOrder = 3;
    this.group.add(bridge);
    this.fogBridgeActive = true;
  }

  private createRocks(): void {
    const placements: Array<[number, number, number, number]> = [
      [-8.25, -0.02, -0.4, 0.42],
      [8.40, -0.04, -1.2, 0.48],
    ];
    placements.forEach(([x, y, z, scale], rockIndex) => {
      const geometry = new SphereGeometry(1, 32, 20);
      const positions = geometry.attributes.position as BufferAttribute;
      const normal = new Vector3();
      for (let index = 0; index < positions.count; index += 1) {
        normal.fromBufferAttribute(positions, index).normalize();
        const uneven = 0.90 + 0.10 * Math.sin(normal.x * 5.7 + rockIndex) * Math.cos(normal.z * 6.2 - rockIndex * 0.7) + 0.045 * Math.sin(normal.y * 11.0 + normal.x * 4.0);
        positions.setXYZ(index, normal.x * uneven, normal.y * uneven * 0.72, normal.z * uneven * 1.18);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      const material = new MeshStandardMaterial({
        color: new Color().setHSL(0.075, 0.08, 0.13 + rockIndex * 0.01),
        roughness: 0.76,
        metalness: 0.008,
      });
      hideOutline(material);
      const rock = new Mesh(geometry, material);
      rock.position.set(x, y + scale * 0.38, z);
      rock.scale.set(scale * 1.25, scale * 0.68, scale);
      rock.rotation.set(0.08 * seeded(rockIndex + 4), seeded(rockIndex + 19) * Math.PI, -0.07 * seeded(rockIndex + 31));
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
    });
    this.rocksActive = true;
  }

  update(state: FrameState): void {
    if (this.oceanMaterial) this.oceanMaterial.uniforms.uTime.value = state.elapsedSeconds;
    const turn = state.phase01 * Math.PI * 2;
    this.platePhase.value = turn;
    if (this.shorelineMaterial) this.shorelineMaterial.uniforms.uPhase.value = turn;
    const phase = state.phaseSeconds;
    const transfer = MathUtils.smoothstep(phase, 10.05, 11.20) * (1 - MathUtils.smoothstep(phase, 12.95, 14.25));
    const leftRelease = MathUtils.smoothstep(phase, 10.80, 11.55) * (1 - MathUtils.smoothstep(phase, 12.15, 13.20));
    const settle = MathUtils.smoothstep(phase, 14.00, 14.80) * (1 - MathUtils.smoothstep(phase, 16.80, 18.00));
    const rootTravel = transfer * 0.165 - settle * 0.012;
    this.footContacts.forEach((contact, index) => {
      const left = index === 0;
      contact.position.x = left
        ? rootTravel - 0.085 + leftRelease * 0.025
        : rootTravel + 0.085 - transfer * 0.145;
      contact.position.z = left ? 0.035 + leftRelease * 0.020 : 0.035;
      contact.scale.x = 0.255 * (left ? 1 - leftRelease * 0.24 : 1 + transfer * 0.22);
      contact.scale.y = 0.128 * (left ? 1 - leftRelease * 0.18 : 1 + transfer * 0.16);
    });
    this.waterEdge = 0.17 + 0.009 * Math.sin(turn * 3) + 0.004 * Math.sin(turn * 7 + 0.4);
  }

  snapshot(): EnvironmentSnapshot {
    return {
      plateLoaded: this.plateLoaded,
      oceanActive: this.oceanActive,
      sandActive: this.sandActive,
      rocksActive: this.rocksActive,
      fogBridgeActive: this.fogBridgeActive,
      reflectionActive: this.reflectionActive,
      oceanPhase: this.oceanMaterial ? Number((this.oceanMaterial.uniforms.uTime.value % 24).toFixed(6)) : 0,
      waterEdge: Number(this.waterEdge.toFixed(6)),
    };
  }
}
