import * as THREE from 'three';
import { initialState, nextPhase, refuel, type GameState } from './state';

const WORLD_RADIUS = 58;
const CAMP_SAFE_RADIUS = 10;
const PLAYER_SPEED = 7.2;
type ResourceKind = 'wood' | 'scraps';
type MoveVector = { x: number; y: number };

type Resource = {
  root: THREE.Group;
  kind: ResourceKind;
  phase: number;
};

type Mireling = {
  root: THREE.Group;
  phase: number;
  speed: number;
};

export type GameEventMap = {
  'broono:move': MoveVector;
  'broono:action': undefined;
  'broono:state': GameState & { message?: string };
};

type Handler<T> = (payload: T) => void;

export class GameEvents {
  private readonly listeners = new Map<keyof GameEventMap, Set<Handler<never>>>();

  on<K extends keyof GameEventMap>(event: K, handler: Handler<GameEventMap[K]>) {
    const handlers = this.listeners.get(event) ?? new Set<Handler<never>>();
    handlers.add(handler as Handler<never>);
    this.listeners.set(event, handlers);
  }

  off<K extends keyof GameEventMap>(event: K, handler: Handler<GameEventMap[K]>) {
    this.listeners.get(event)?.delete(handler as Handler<never>);
  }

  emit<K extends keyof GameEventMap>(event: K, payload?: GameEventMap[K]) {
    this.listeners.get(event)?.forEach((handler) => handler(payload as never));
  }

  clear() {
    this.listeners.clear();
  }
}

export class SurvivalScene {
  readonly events = new GameEvents();

  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(54, 1, 0.1, 180);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly clock = new THREE.Clock();
  private readonly broono = new THREE.Group();
  private readonly broonoVisual = new THREE.Group();
  private readonly resources: Resource[] = [];
  private readonly enemies: Mireling[] = [];
  private readonly movement = new THREE.Vector2();
  private readonly keyboard = new Set<string>();
  private readonly sun = new THREE.DirectionalLight(0xffe2ad, 2.6);
  private readonly skyLight = new THREE.HemisphereLight(0x9bc9d4, 0x162013, 2.2);
  private readonly campLight = new THREE.PointLight(0xff7628, 28, 28, 1.7);
  private readonly flames = new THREE.Group();
  private readonly stars = new THREE.Points();
  private readonly cameraTarget = new THREE.Vector3();
  private readonly cameraPosition = new THREE.Vector3();
  private readonly dayColor = new THREE.Color(0x86a99d);
  private readonly nightColor = new THREE.Color(0x07101a);
  private readonly dayFog = new THREE.Color(0x719084);
  private readonly nightFog = new THREE.Color(0x081019);
  private readonly fog = new THREE.FogExp2(this.dayFog, 0.016);
  private readonly onResize = () => this.resize();
  private readonly onKeyDown = (event: KeyboardEvent) => this.keyboard.add(event.code);
  private readonly onKeyUp = (event: KeyboardEvent) => this.keyboard.delete(event.code);

  private state: GameState = initialState();
  private frame = 0;
  private elapsed = 0;
  private spawnElapsed = 0;
  private damageCooldown = 0;
  private running = true;
  private walkCycle = 0;
  private legs: THREE.Group[] = [];
  private tail!: THREE.Group;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(container.clientWidth, container.clientHeight, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.domElement.setAttribute('aria-label', 'Broono survival game');
    container.replaceChildren(this.renderer.domElement);

    this.scene.background = this.dayColor.clone();
    this.scene.fog = this.fog;
    this.buildLighting();
    this.buildTerrain();
    this.buildForest();
    this.buildCamp();
    this.buildBroono();
    this.seedResources();
    this.buildStars();

    this.broono.position.set(5.5, 0, 2);
    this.camera.position.set(12, 10, 15);
    this.camera.lookAt(0, 1.3, 0);

    this.events.on('broono:move', this.setMove);
    this.events.on('broono:action', this.action);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.resize();
    this.emitState();
    this.frame = requestAnimationFrame(this.animate);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.events.off('broono:move', this.setMove);
    this.events.off('broono:action', this.action);
    this.events.clear();
    this.renderer.dispose();
    this.container.replaceChildren();
  }

  private buildLighting() {
    this.scene.add(this.skyLight);
    this.sun.position.set(-24, 38, 18);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.left = -28;
    this.sun.shadow.camera.right = 28;
    this.sun.shadow.camera.top = 28;
    this.sun.shadow.camera.bottom = -28;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 90;
    this.sun.shadow.bias = -0.0003;
    this.scene.add(this.sun);
  }

  private buildTerrain() {
    const geometry = new THREE.PlaneGeometry(132, 132, 54, 54);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.attributes.position;
    if (positions) {
      for (let index = 0; index < positions.count; index += 1) {
        const x = positions.getX(index);
        const z = positions.getZ(index);
        const distance = Math.hypot(x, z);
        const clearing = THREE.MathUtils.smoothstep(distance, 7, 18);
        const height = (
          Math.sin(x * 0.16) * 0.75
          + Math.cos(z * 0.13) * 0.55
          + Math.sin((x + z) * 0.31) * 0.18
        ) * clearing;
        positions.setY(index, height);
      }
      positions.needsUpdate = true;
    }
    geometry.computeVertexNormals();
    const ground = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0x304b32,
        roughness: 1,
        metalness: 0,
      }),
    );
    ground.receiveShadow = true;
    this.scene.add(ground);

    const clearing = new THREE.Mesh(
      new THREE.CircleGeometry(11.5, 48),
      new THREE.MeshStandardMaterial({ color: 0x44573a, roughness: 1 }),
    );
    clearing.rotation.x = -Math.PI / 2;
    clearing.position.y = 0.025;
    clearing.receiveShadow = true;
    this.scene.add(clearing);

    const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x66543a, roughness: 1 });
    for (let index = 0; index < 20; index += 1) {
      const stone = new THREE.Mesh(
        new THREE.CircleGeometry(0.4 + (index % 3) * 0.11, 7),
        pathMaterial,
      );
      stone.rotation.x = -Math.PI / 2;
      stone.rotation.z = index * 1.7;
      stone.scale.set(1.5, 0.7 + (index % 4) * 0.12, 1);
      stone.position.set(
        Math.sin(index * 0.62) * (2.6 + index * 0.58),
        0.045,
        Math.cos(index * 0.31) * 1.8 + index * 0.58,
      );
      stone.receiveShadow = true;
      this.scene.add(stone);
    }
  }

  private buildForest() {
    const random = mulberry32(9917);
    const trunkGeometry = new THREE.CylinderGeometry(0.34, 0.55, 4.6, 7);
    const lowerGeometry = new THREE.ConeGeometry(2.15, 4.8, 7);
    const upperGeometry = new THREE.ConeGeometry(1.55, 4.1, 7);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2b20, roughness: 1 });
    const lowerMaterial = new THREE.MeshStandardMaterial({ color: 0x173425, roughness: 0.98 });
    const upperMaterial = new THREE.MeshStandardMaterial({ color: 0x24513a, roughness: 0.98 });
    const count = 118;
    const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, count);
    const lower = new THREE.InstancedMesh(lowerGeometry, lowerMaterial, count);
    const upper = new THREE.InstancedMesh(upperGeometry, upperMaterial, count);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let index = 0; index < count; index += 1) {
      const angle = random() * Math.PI * 2;
      const radius = 13 + Math.pow(random(), 0.72) * 47;
      const size = 0.72 + random() * 0.78;
      position.set(Math.cos(angle) * radius, 2.3 * size - 0.08, Math.sin(angle) * radius);
      rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * Math.PI);
      scale.set(size, size, size);
      matrix.compose(position, rotation, scale);
      trunks.setMatrixAt(index, matrix);

      position.y = 5.05 * size;
      scale.set(size, size, size);
      matrix.compose(position, rotation, scale);
      lower.setMatrixAt(index, matrix);

      position.y = 7.4 * size;
      scale.set(size * 0.78, size * 0.88, size * 0.78);
      matrix.compose(position, rotation, scale);
      upper.setMatrixAt(index, matrix);
    }
    trunks.castShadow = true;
    trunks.receiveShadow = true;
    lower.castShadow = true;
    lower.receiveShadow = true;
    upper.castShadow = true;
    this.scene.add(trunks, lower, upper);

    const rockGeometry = new THREE.DodecahedronGeometry(0.75, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x4b5148, roughness: 0.95 });
    const rocks = new THREE.InstancedMesh(rockGeometry, rockMaterial, 70);
    for (let index = 0; index < 70; index += 1) {
      const angle = random() * Math.PI * 2;
      const radius = 11 + random() * 48;
      const size = 0.3 + random() * 0.95;
      position.set(Math.cos(angle) * radius, size * 0.35, Math.sin(angle) * radius);
      rotation.setFromEuler(new THREE.Euler(random(), random() * Math.PI, random()));
      scale.set(size * (1 + random()), size * 0.7, size);
      matrix.compose(position, rotation, scale);
      rocks.setMatrixAt(index, matrix);
    }
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    this.scene.add(rocks);

    const grassMaterial = new THREE.MeshBasicMaterial({
      color: 0x587447,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.72,
    });
    const grassGeometry = new THREE.ConeGeometry(0.28, 0.9, 3);
    const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, 190);
    for (let index = 0; index < 190; index += 1) {
      const angle = random() * Math.PI * 2;
      const radius = 8 + random() * 48;
      position.set(Math.cos(angle) * radius, 0.4, Math.sin(angle) * radius);
      rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * Math.PI);
      const size = 0.45 + random() * 0.8;
      scale.set(size, size, size);
      matrix.compose(position, rotation, scale);
      grass.setMatrixAt(index, matrix);
    }
    this.scene.add(grass);
  }

  private buildCamp() {
    const camp = new THREE.Group();
    const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x504b43, roughness: 0.9 });
    const logMaterial = new THREE.MeshStandardMaterial({ color: 0x4b2618, roughness: 0.95 });
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 0), stoneMaterial);
      stone.position.set(Math.cos(angle) * 2.05, 0.38, Math.sin(angle) * 2.05);
      stone.scale.set(1.2, 0.75, 0.9);
      stone.rotation.set(index * 0.2, angle, index * 0.11);
      stone.castShadow = true;
      stone.receiveShadow = true;
      camp.add(stone);
    }
    for (const angle of [Math.PI / 4, -Math.PI / 4, Math.PI / 2]) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.31, 3.3, 8), logMaterial);
      log.position.y = 0.52;
      log.rotation.set(Math.PI / 2, 0, angle);
      log.castShadow = true;
      camp.add(log);
    }

    const flameMaterials = [
      new THREE.MeshBasicMaterial({ color: 0xffe073, transparent: true, opacity: 0.92 }),
      new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.82 }),
      new THREE.MeshBasicMaterial({ color: 0xe63c1b, transparent: true, opacity: 0.68 }),
    ];
    flameMaterials.forEach((material, index) => {
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.72 + index * 0.2, 2.9 - index * 0.38, 7),
        material,
      );
      flame.position.set((index - 1) * 0.33, 1.65 - index * 0.04, (index % 2) * 0.22);
      flame.rotation.z = (index - 1) * 0.13;
      this.flames.add(flame);
    });
    camp.add(this.flames);
    this.campLight.position.set(0, 3.2, 0);
    this.campLight.castShadow = true;
    this.campLight.shadow.mapSize.set(512, 512);
    camp.add(this.campLight);

    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(CAMP_SAFE_RADIUS, 64),
      new THREE.MeshBasicMaterial({
        color: 0xf6a43a,
        transparent: true,
        opacity: 0.055,
        depthWrite: false,
      }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.07;
    camp.add(glow);
    this.scene.add(camp);
  }

  private buildBroono() {
    const fur = new THREE.MeshStandardMaterial({ color: 0x678c4d, roughness: 0.92 });
    const darkFur = new THREE.MeshStandardMaterial({ color: 0x314d30, roughness: 0.95 });
    const muzzle = new THREE.MeshStandardMaterial({ color: 0x8baa69, roughness: 0.9 });
    const bone = new THREE.MeshStandardMaterial({ color: 0xd8d3b7, roughness: 0.8 });
    const leather = new THREE.MeshStandardMaterial({ color: 0x5a2c23, roughness: 0.72 });
    const metal = new THREE.MeshStandardMaterial({ color: 0xc69a47, roughness: 0.35, metalness: 0.55 });
    const eyeGlow = new THREE.MeshBasicMaterial({ color: 0xffc34d });

    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 9, 6), fur);
    body.scale.set(1.15, 0.82, 1.65);
    body.position.y = 1.55;
    body.castShadow = true;
    this.broonoVisual.add(body);

    const chestPatch = new THREE.Mesh(new THREE.SphereGeometry(0.55, 7, 5), darkFur);
    chestPatch.scale.set(1, 1.05, 0.45);
    chestPatch.position.set(0, 1.55, -1.36);
    this.broonoVisual.add(chestPatch);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.95, 8, 6), fur);
    head.scale.set(0.95, 0.95, 1.02);
    head.position.set(0, 2.55, -1.45);
    head.castShadow = true;
    this.broonoVisual.add(head);

    const muzzleMesh = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 5), muzzle);
    muzzleMesh.scale.set(0.92, 0.62, 0.9);
    muzzleMesh.position.set(0, 2.28, -2.16);
    muzzleMesh.castShadow = true;
    this.broonoVisual.add(muzzleMesh);

    const nose = new THREE.Mesh(new THREE.DodecahedronGeometry(0.23, 0), darkFur);
    nose.scale.set(1.15, 0.72, 0.72);
    nose.position.set(0, 2.4, -2.62);
    this.broonoVisual.add(nose);

    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.35, 5), darkFur);
      ear.position.set(side * 0.68, 2.95, -1.28);
      ear.rotation.set(side * 0.2, 0, side * 0.56);
      ear.castShadow = true;
      this.broonoVisual.add(ear);

      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(side === -1 ? 0.18 : 0.13, 8, 6),
        side === -1 ? eyeGlow : darkFur,
      );
      eye.position.set(side * 0.38, 2.68, -2.19);
      this.broonoVisual.add(eye);
      if (side === -1) {
        const eyeLight = new THREE.PointLight(0xffa52c, 1.6, 3);
        eyeLight.position.copy(eye.position);
        this.broonoVisual.add(eyeLight);
      }
    }

    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.71, 0.12, 6, 20), leather);
    collar.rotation.x = Math.PI / 2;
    collar.scale.set(1, 1, 1.12);
    collar.position.set(0, 2.04, -0.93);
    this.broonoVisual.add(collar);
    const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 8), metal);
    tag.rotation.x = Math.PI / 2;
    tag.position.set(0, 1.83, -1.68);
    this.broonoVisual.add(tag);

    this.legs = [];
    for (const [x, z] of [[-0.64, -0.82], [0.64, -0.82], [-0.64, 0.88], [0.64, 0.88]] as const) {
      const legRoot = new THREE.Group();
      legRoot.position.set(x, 1.18, z);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.25, 7), fur);
      leg.position.y = -0.54;
      leg.castShadow = true;
      legRoot.add(leg);
      const paw = new THREE.Mesh(new THREE.SphereGeometry(0.3, 7, 5), darkFur);
      paw.scale.set(1, 0.5, 1.3);
      paw.position.set(0, -1.15, -0.1);
      legRoot.add(paw);
      this.legs.push(legRoot);
      this.broonoVisual.add(legRoot);
    }

    this.tail = new THREE.Group();
    this.tail.position.set(0, 1.75, 1.48);
    const tailMesh = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.8, 7), fur);
    tailMesh.rotation.x = -Math.PI / 2;
    tailMesh.position.z = 0.85;
    tailMesh.castShadow = true;
    this.tail.add(tailMesh);
    this.broonoVisual.add(this.tail);

    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.07, 5, 16, Math.PI * 1.3), bone);
    rib.rotation.set(Math.PI / 2, 0.25, Math.PI / 2);
    rib.position.set(0.94, 1.57, 0.12);
    this.broonoVisual.add(rib);

    this.broono.add(this.broonoVisual);
    this.scene.add(this.broono);
  }

  private seedResources() {
    const random = mulberry32(198);
    for (let index = 0; index < 42; index += 1) {
      const kind: ResourceKind = index % 5 === 0 ? 'scraps' : 'wood';
      const angle = random() * Math.PI * 2;
      const radius = 13 + random() * 39;
      const root = kind === 'wood' ? this.createLogPile() : this.createScrapCache();
      root.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      root.rotation.y = random() * Math.PI * 2;
      this.resources.push({ root, kind, phase: random() * Math.PI * 2 });
      this.scene.add(root);
    }
  }

  private createLogPile() {
    const group = new THREE.Group();
    const bark = new THREE.MeshStandardMaterial({ color: 0x60371f, roughness: 1 });
    const cut = new THREE.MeshStandardMaterial({ color: 0xc38a4b, roughness: 0.9 });
    for (let index = 0; index < 3; index += 1) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8), [
        bark,
        cut,
        cut,
      ]);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = index * 0.14;
      log.position.set(0, 0.36 + index * 0.42, (index - 1) * 0.42);
      log.castShadow = true;
      group.add(log);
    }
    const beacon = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.045, 5, 28),
      new THREE.MeshBasicMaterial({ color: 0xffd16c, transparent: true, opacity: 0.5 }),
    );
    beacon.rotation.x = Math.PI / 2;
    beacon.position.y = 0.08;
    group.add(beacon);
    return group;
  }

  private createScrapCache() {
    const group = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({ color: 0x728084, roughness: 0.45, metalness: 0.65 });
    const copper = new THREE.MeshStandardMaterial({ color: 0xa15d32, roughness: 0.48, metalness: 0.5 });
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.72, 1.15), copper);
    crate.position.y = 0.4;
    crate.castShadow = true;
    group.add(crate);
    const gear = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.13, 6, 10), steel);
    gear.rotation.x = Math.PI / 2;
    gear.position.set(0.12, 0.91, 0);
    gear.castShadow = true;
    group.add(gear);
    const beacon = new THREE.Mesh(
      new THREE.TorusGeometry(1.05, 0.045, 5, 28),
      new THREE.MeshBasicMaterial({ color: 0x9fe7e3, transparent: true, opacity: 0.52 }),
    );
    beacon.rotation.x = Math.PI / 2;
    beacon.position.y = 0.08;
    group.add(beacon);
    return group;
  }

  private buildStars() {
    const positions = new Float32Array(180 * 3);
    const random = mulberry32(1949);
    for (let index = 0; index < 180; index += 1) {
      const radius = 70;
      const theta = random() * Math.PI * 2;
      const phi = 0.18 + random() * 1.2;
      positions[index * 3] = Math.cos(theta) * Math.sin(phi) * radius;
      positions[index * 3 + 1] = Math.cos(phi) * radius;
      positions[index * 3 + 2] = Math.sin(theta) * Math.sin(phi) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.stars.geometry = geometry;
    this.stars.material = new THREE.PointsMaterial({
      color: 0xd7ecff,
      size: 0.32,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.scene.add(this.stars);
  }

  private readonly animate = () => {
    if (!this.running) return;
    const delta = Math.min(this.clock.getDelta(), 0.04);
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.animate);
  };

  private update(delta: number) {
    const keyboardX = Number(this.keyboard.has('ArrowRight') || this.keyboard.has('KeyD'))
      - Number(this.keyboard.has('ArrowLeft') || this.keyboard.has('KeyA'));
    const keyboardY = Number(this.keyboard.has('ArrowDown') || this.keyboard.has('KeyS'))
      - Number(this.keyboard.has('ArrowUp') || this.keyboard.has('KeyW'));
    const input = keyboardX || keyboardY
      ? new THREE.Vector2(keyboardX, keyboardY).normalize()
      : this.movement;

    const cameraForward = new THREE.Vector3();
    this.camera.getWorldDirection(cameraForward);
    cameraForward.y = 0;
    cameraForward.normalize();
    const cameraRight = new THREE.Vector3().crossVectors(cameraForward, THREE.Object3D.DEFAULT_UP).normalize();
    const desired = cameraRight.multiplyScalar(input.x)
      .addScaledVector(cameraForward, -input.y);
    if (desired.lengthSq() > 0.01) {
      desired.normalize();
      this.broono.position.addScaledVector(desired, PLAYER_SPEED * delta);
      const distance = Math.hypot(this.broono.position.x, this.broono.position.z);
      if (distance > WORLD_RADIUS) {
        this.broono.position.multiplyScalar(WORLD_RADIUS / distance);
      }
      const targetAngle = Math.atan2(desired.x, desired.z) + Math.PI;
      this.broono.rotation.y = dampAngle(this.broono.rotation.y, targetAngle, 11, delta);
      this.walkCycle += delta * 10.5;
      this.broonoVisual.position.y = 0.06 + Math.abs(Math.sin(this.walkCycle)) * 0.08;
      this.legs.forEach((leg, index) => {
        leg.rotation.x = Math.sin(this.walkCycle + (index % 2) * Math.PI) * 0.42;
      });
      this.tail.rotation.x = -0.65;
      this.tail.rotation.y = Math.sin(this.walkCycle * 1.3) * 0.5;
    } else {
      this.broonoVisual.position.y = Math.sin(performance.now() * 0.0028) * 0.035;
      this.legs.forEach((leg) => { leg.rotation.x *= 0.82; });
      this.tail.rotation.y = Math.sin(performance.now() * 0.004) * 0.22;
    }

    this.collectNearby();
    this.updateResources(delta);
    this.updateEnemies(delta);
    this.updateCamera(delta);
    this.updateAtmosphere(delta);
    this.updateCampfire(delta);

    this.elapsed += delta;
    this.spawnElapsed += delta;
    this.damageCooldown = Math.max(0, this.damageCooldown - delta);
    if (this.elapsed >= 1) {
      this.elapsed -= 1;
      this.tick();
    }
    const spawnDelay = Math.max(2.8, 7 - this.state.night * 0.09);
    if (this.state.phase === 'night' && this.spawnElapsed >= spawnDelay) {
      this.spawnElapsed = 0;
      this.spawnEnemy();
    }
  }

  private updateCamera(delta: number) {
    this.cameraPosition.set(
      this.broono.position.x + 10.5,
      9.2,
      this.broono.position.z + 13.5,
    );
    this.camera.position.lerp(this.cameraPosition, 1 - Math.exp(-5.5 * delta));
    this.cameraTarget.set(this.broono.position.x, 1.4, this.broono.position.z);
    this.camera.lookAt(this.cameraTarget);
  }

  private updateResources(delta: number) {
    const time = performance.now() * 0.001;
    this.resources.forEach((resource) => {
      resource.root.position.y = 0.12 + Math.sin(time * 2 + resource.phase) * 0.08;
      resource.root.rotation.y += delta * 0.18;
    });
  }

  private collectNearby() {
    for (let index = this.resources.length - 1; index >= 0; index -= 1) {
      const resource = this.resources[index];
      if (!resource || resource.root.position.distanceTo(this.broono.position) > 1.75) continue;
      this.resources.splice(index, 1);
      this.scene.remove(resource.root);
      this.state = { ...this.state, [resource.kind]: this.state[resource.kind] + 1 };
      this.emitState(resource.kind === 'wood' ? '+1 wood collected' : '+1 scrap recovered');
    }
  }

  private updateEnemies(delta: number) {
    const target = this.broono.position;
    const time = performance.now() * 0.001;
    for (const enemy of this.enemies) {
      const direction = target.clone().sub(enemy.root.position).setY(0);
      const distance = direction.length();
      if (distance > 0.01) {
        direction.normalize();
        enemy.root.position.addScaledVector(direction, enemy.speed * delta);
        enemy.root.lookAt(target.x, enemy.root.position.y, target.z);
        enemy.root.rotateY(Math.PI);
      }
      enemy.root.position.y = 0.08 + Math.abs(Math.sin(time * 4 + enemy.phase)) * 0.18;
      if (distance < 1.65 && this.damageCooldown <= 0) this.takeDamage();
    }
  }

  private updateAtmosphere(delta: number) {
    const isNight = this.state.phase === 'night';
    const blend = isNight ? 1 : 0;
    const targetBackground = this.dayColor.clone().lerp(this.nightColor, blend);
    const background = this.scene.background;
    if (background instanceof THREE.Color) background.lerp(targetBackground, 1 - Math.exp(-0.7 * delta));
    const targetFog = this.dayFog.clone().lerp(this.nightFog, blend);
    this.fog.color.lerp(targetFog, 1 - Math.exp(-0.7 * delta));
    this.fog.density = THREE.MathUtils.lerp(this.fog.density, isNight ? 0.027 : 0.016, 1 - Math.exp(-0.8 * delta));
    this.sun.intensity = THREE.MathUtils.lerp(this.sun.intensity, isNight ? 0.12 : 2.6, 1 - Math.exp(-0.9 * delta));
    this.skyLight.intensity = THREE.MathUtils.lerp(this.skyLight.intensity, isNight ? 0.42 : 2.2, 1 - Math.exp(-0.9 * delta));
    const starsMaterial = this.stars.material;
    if (starsMaterial instanceof THREE.PointsMaterial) {
      starsMaterial.opacity = THREE.MathUtils.lerp(starsMaterial.opacity, isNight ? 0.9 : 0, 1 - Math.exp(-0.9 * delta));
    }
  }

  private updateCampfire(delta: number) {
    const strength = 0.42 + this.state.fire / 100;
    const time = performance.now() * 0.008;
    this.flames.children.forEach((flame, index) => {
      flame.scale.set(
        strength * (0.8 + Math.sin(time + index * 2.1) * 0.08),
        strength * (0.88 + Math.sin(time * 1.3 + index) * 0.15),
        strength * (0.8 + Math.cos(time + index) * 0.08),
      );
      flame.rotation.y += delta * (index % 2 ? 0.7 : -0.55);
    });
    this.campLight.intensity = (this.state.phase === 'night' ? 36 : 18) * strength
      + Math.sin(time * 2.7) * 2.2;
  }

  private spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const root = this.createMireling();
    root.position.set(
      this.broono.position.x + Math.cos(angle) * 27,
      0,
      this.broono.position.z + Math.sin(angle) * 27,
    );
    this.enemies.push({
      root,
      phase: Math.random() * Math.PI * 2,
      speed: 2.1 + this.state.night * 0.055,
    });
    this.scene.add(root);
  }

  private createMireling() {
    const root = new THREE.Group();
    const shadow = new THREE.MeshStandardMaterial({
      color: 0x17131d,
      roughness: 0.9,
      emissive: 0x130d1a,
      emissiveIntensity: 0.7,
    });
    const eye = new THREE.MeshBasicMaterial({ color: 0xce6cff });
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 0), shadow);
    body.scale.set(0.85, 1.35, 0.75);
    body.position.y = 1.4;
    body.castShadow = true;
    root.add(body);
    const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), shadow);
    head.position.set(0, 2.63, -0.22);
    root.add(head);
    for (const side of [-1, 1]) {
      const eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), eye);
      eyeMesh.position.set(side * 0.22, 2.7, -0.75);
      root.add(eyeMesh);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.7, 5), shadow);
      arm.position.set(side * 0.84, 1.42, 0);
      arm.rotation.z = side * 0.45;
      root.add(arm);
    }
    return root;
  }

  private takeDamage() {
    this.damageCooldown = 0.95;
    this.state = { ...this.state, health: Math.max(0, this.state.health - 8) };
    const original = this.camera.position.clone();
    this.camera.position.x += (Math.random() - 0.5) * 0.45;
    this.camera.position.z += (Math.random() - 0.5) * 0.45;
    window.setTimeout(() => this.camera.position.lerp(original, 0.5), 80);
    this.emitState('A mireling struck Broono');
  }

  private tick() {
    const fireDrain = this.state.phase === 'night' ? 1.25 : 0.35;
    const hunger = Math.max(0, this.state.hunger - 0.35);
    const fire = Math.max(0, this.state.fire - fireDrain);
    const secondsRemaining = this.state.secondsRemaining - 1;
    const distanceFromCamp = Math.hypot(this.broono.position.x, this.broono.position.z);
    const exposed = this.state.phase === 'night' && distanceFromCamp > CAMP_SAFE_RADIUS;
    const health = Math.max(0, this.state.health - (hunger === 0 ? 1 : 0) - (exposed ? 0.25 : 0));
    this.state = { ...this.state, fire, hunger, health, secondsRemaining };
    if (secondsRemaining <= 0) {
      this.state = nextPhase(this.state);
      if (this.state.phase === 'day') {
        this.enemies.forEach((enemy) => this.scene.remove(enemy.root));
        this.enemies.length = 0;
      }
    }
    this.emitState();
  }

  private readonly setMove = (vector: MoveVector) => {
    this.movement.set(vector.x, vector.y);
    if (this.movement.lengthSq() > 1) this.movement.normalize();
  };

  private readonly action = () => {
    const atCamp = Math.hypot(this.broono.position.x, this.broono.position.z) < CAMP_SAFE_RADIUS;
    if (!atCamp) {
      this.emitState('Return to the campfire or keep searching');
      return;
    }
    const next = refuel(this.state);
    const changed = next !== this.state;
    this.state = next;
    this.emitState(changed ? 'The campfire roars back to life' : 'Collect 2 wood to feed the fire');
  };

  private resize() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private emitState(message?: string) {
    this.events.emit('broono:state', { ...this.state, message });
  }
}

const mulberry32 = (seed: number) => () => {
  let value = seed += 0x6d2b79f5;
  value = Math.imul(value ^ value >>> 15, value | 1);
  value ^= value + Math.imul(value ^ value >>> 7, value | 61);
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
};

const dampAngle = (current: number, target: number, smoothing: number, delta: number) => {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * (1 - Math.exp(-smoothing * delta));
};
