import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface WorldObstacle {
  position: THREE.Vector3;
  radius: number;
  isRamp: boolean;
  mesh: THREE.Object3D;
  rampCooldown?: number;
  nearMissCooldown?: number;
}

export interface CollectibleItem {
  position: THREE.Vector3;
  mesh: THREE.Object3D;
  collected: boolean;
}

interface ChunkData {
  obstacles: WorldObstacle[];
  collectibles: CollectibleItem[];
  foliage: THREE.Object3D[];
}

export class PropScatterer {
  public group = new THREE.Group();
  public obstacles: WorldObstacle[] = [];
  public collectibles: CollectibleItem[] = [];

  // Track clearance keep-out delegate (guarantees zero props on the race track)
  public trackKeepOutCheck: ((x: number, z: number) => boolean) | null = null;

  // Chunk-keyed storage for zero-leak memory culling
  private chunkDataMap: Map<string, ChunkData> = new Map();

  // Cached loaded prototypes
  private propPrototypes: Map<string, THREE.Object3D> = new Map();
  private loader = new GLTFLoader();

  // Shared static fallback geometries and materials to prevent GPU memory leaks
  private static sharedRockGeo = new THREE.DodecahedronGeometry(1.5, 1);
  private static sharedRockMat = new THREE.MeshStandardMaterial({
    color: 0x8a6d55,
    roughness: 0.9,
    metalness: 0.1,
    flatShading: true,
  });
  private static sharedTreeGeo = new THREE.CylinderGeometry(0.5, 1.0, 9.0, 8);
  private static sharedTreeMat = new THREE.MeshStandardMaterial({
    color: 0x4a3728,
    roughness: 0.95,
  });

  constructor() {
    this.preloadProps();
  }

  private preloadProps(): void {
    const propPaths = [
      // Stones / Sandstone formations
      '/assets/props/stone1.glb',
      '/assets/props/stone2.glb',
      '/assets/props/stone3.glb',
      '/assets/props/stone4.glb',
      '/assets/props/stone5.glb',
      '/assets/props/stone6.glb',
      '/assets/props/stone7.glb',
      // Ruins & Ramps
      '/assets/props/ruin1.glb',
      '/assets/props/ramp1.glb',
      // Desert Trees
      '/assets/props/tree1.glb',
      '/assets/props/tree2.glb',
      '/assets/props/tree3.glb',
      '/assets/props/tree4.glb',
      '/assets/props/tree5.glb',
      '/assets/props/tree6.glb',
      // Foliage & Branches (Non-collidable atmospheric detail)
      '/assets/props/grass1.glb',
      '/assets/props/grass2.glb',
      '/assets/props/grass3.glb',
      '/assets/props/grass4.glb',
      '/assets/props/brokenbranch1.glb',
      '/assets/props/brokenbranch2.glb',
      '/assets/props/brokenbranch3.glb',
    ];

    propPaths.forEach((path) => {
      this.loader.load(
        path,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Measure exact unscaled 3D bounds for realistic proportional scaling
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          model.userData.nativeHeight = size.y > 0.01 ? size.y : 1.0;
          model.userData.nativeMaxDim = Math.max(size.x, size.y, size.z) > 0.01 ? Math.max(size.x, size.y, size.z) : 1.0;
          model.userData.boxMinY = box.min.y;

          this.propPrototypes.set(path, model);
        },
        undefined,
        (err) => console.warn(`Could not preload ${path}:`, err)
      );
    });
  }

  /**
   * Populate a newly generated chunk with rocks, ruins, ramps, foliage, and solar fragments
   */
  public populateChunk(
    chunkX: number,
    chunkZ: number,
    chunkSize: number,
    getHeight: (x: number, z: number) => number,
    chunkKey: string
  ): void {
    // If chunk already exists, don't duplicate
    if (this.chunkDataMap.has(chunkKey)) return;

    const chunkData: ChunkData = {
      obstacles: [],
      collectibles: [],
      foliage: [],
    };

    const worldX = chunkX * chunkSize;
    const worldZ = chunkZ * chunkSize;

    // Pseudo-random deterministic placement using chunk coordinates
    const seed = Math.sin(chunkX * 12.9898 + chunkZ * 78.233) * 43758.5453;
    const count = 7 + Math.floor(Math.abs(seed) % 8); // 7-14 items per chunk

    for (let i = 0; i < count; i++) {
      const offsetX = ((Math.sin(seed + i * 1.7) * 0.5 + 0.5) * 0.82 + 0.09) * chunkSize;
      const offsetZ = ((Math.cos(seed + i * 2.3) * 0.5 + 0.5) * 0.82 + 0.09) * chunkSize;

      const px = worldX - chunkSize / 2 + offsetX;
      const pz = worldZ - chunkSize / 2 + offsetZ;

      // Strict Keep-Out: Zero biome props may spawn inside or encroaching the race track
      if (this.trackKeepOutCheck && this.trackKeepOutCheck(px, pz)) {
        continue;
      }

      const py = getHeight(px, pz);

      // Do not spawn on extreme height extremes
      if (py > 65 || py < -35) continue;

      const typePick = (Math.abs(seed + i * 3.7) * 100) % 10;

      if (typePick < 4.5) {
        // 1. Natural Sandstone Boulders / Cliff Monoliths (Realistic scale: 4m - 8m)
        const stoneIdx = (Math.floor(Math.abs(seed + i)) % 7) + 1;
        const rockObs = this.createRockObstacle(px, py, pz, stoneIdx);
        chunkData.obstacles.push(rockObs);
        this.obstacles.push(rockObs);
        this.group.add(rockObs.mesh);
      } else if (typePick < 8.0) {
        // 2. Desert Acacia Trees & Palms (Realistic scale: 8m - 12m height)
        const treeIdx = (Math.floor(Math.abs(seed + i)) % 6) + 1;
        const treeObs = this.createTreeObstacle(px, py, pz, treeIdx);
        chunkData.obstacles.push(treeObs);
        this.obstacles.push(treeObs);
        this.group.add(treeObs.mesh);
      } else {
        // 3. Desert Foliage & Grass Tufts (Atmospheric, non-collidable)
        const foliageMesh = this.createFoliage(px, py, pz, Math.floor(typePick * 10) % 7);
        if (foliageMesh) {
          chunkData.foliage.push(foliageMesh);
          this.group.add(foliageMesh);
        }
      }
    }

    this.chunkDataMap.set(chunkKey, chunkData);
  }

  /**
   * Cull a chunk when it streams out of range (zero memory leak)
   */
  public cullChunk(chunkKey: string): void {
    const data = this.chunkDataMap.get(chunkKey);
    if (!data) return;

    // Remove obstacles
    for (const obs of data.obstacles) {
      this.group.remove(obs.mesh);
      const idx = this.obstacles.indexOf(obs);
      if (idx !== -1) this.obstacles.splice(idx, 1);
    }

    // Remove collectibles
    for (const col of data.collectibles) {
      this.group.remove(col.mesh);
      const idx = this.collectibles.indexOf(col);
      if (idx !== -1) this.collectibles.splice(idx, 1);
    }

    // Remove atmospheric foliage
    for (const fol of data.foliage) {
      this.group.remove(fol);
    }

    this.chunkDataMap.delete(chunkKey);
  }

  private createRockObstacle(x: number, y: number, z: number, stoneIdx: number): WorldObstacle {
    const protoKey = `/assets/props/stone${stoneIdx}.glb`;
    const proto = this.propPrototypes.get(protoKey);

    let mesh: THREE.Object3D;
    // Natural boulders: 1.8m to 4.5m wide
    const targetDim = 1.8 + (stoneIdx % 4) * 0.7 + Math.random() * 0.6;
    const radius = targetDim * 0.45;

    if (proto) {
      mesh = proto.clone();
      const nativeMax = (proto.userData.nativeMaxDim as number) || 4.0;
      const scale = targetDim / nativeMax;
      mesh.scale.setScalar(scale);

      const boxMinY = (proto.userData.boxMinY as number) || 0;
      mesh.position.set(x, y - boxMinY * scale - 0.25, z);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      mesh.rotation.x = (Math.random() - 0.5) * 0.2;
      mesh.rotation.z = (Math.random() - 0.5) * 0.2;
    } else {
      // Reusable procedural rock boulder fallback
      mesh = new THREE.Mesh(PropScatterer.sharedRockGeo, PropScatterer.sharedRockMat);
      mesh.scale.setScalar(targetDim * 0.35);
      mesh.position.set(x, y + targetDim * 0.35, z);
      mesh.rotation.set(Math.random(), Math.random(), Math.random());
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }

    return {
      position: new THREE.Vector3(x, y + 0.8, z),
      radius,
      isRamp: false,
      mesh,
    };
  }

  private createTreeObstacle(x: number, y: number, z: number, treeIdx: number): WorldObstacle {
    const protoKey = `/assets/props/tree${treeIdx}.glb`;
    const proto = this.propPrototypes.get(protoKey) || this.propPrototypes.get('/assets/props/ruin1.glb');

    let mesh: THREE.Object3D;
    // Desert acacia / palm trees: strictly 7.0m to 11.0m tall
    const targetHeight = 7.0 + (treeIdx % 3) * 1.5 + Math.random() * 1.0;
    const radius = 1.6;

    if (proto) {
      mesh = proto.clone();
      const nativeH = (proto.userData.nativeHeight as number) || 10.0;
      const scale = targetHeight / nativeH;
      mesh.scale.setScalar(scale);

      const boxMinY = (proto.userData.boxMinY as number) || 0;
      mesh.position.set(x, y - boxMinY * scale - 0.35, z);
      mesh.rotation.y = Math.random() * Math.PI * 2;
    } else {
      mesh = new THREE.Mesh(PropScatterer.sharedTreeGeo, PropScatterer.sharedTreeMat);
      mesh.scale.set(1.0, targetHeight / 9.0, 1.0);
      mesh.position.set(x, y + targetHeight * 0.5 - 0.2, z);
      mesh.castShadow = true;
    }

    return {
      position: new THREE.Vector3(x, y + 1.2, z),
      radius,
      isRamp: false,
      mesh,
    };
  }

  private createFoliage(x: number, y: number, z: number, pick: number): THREE.Object3D | null {
    const foliageKeys = [
      '/assets/props/grass1.glb',
      '/assets/props/grass2.glb',
      '/assets/props/grass3.glb',
      '/assets/props/grass4.glb',
      '/assets/props/brokenbranch1.glb',
      '/assets/props/brokenbranch2.glb',
      '/assets/props/brokenbranch3.glb',
    ];
    const key = foliageKeys[pick % foliageKeys.length];
    const proto = this.propPrototypes.get(key);
    if (!proto) return null;

    const mesh = proto.clone();
    const isBranch = key.includes('branch');
    const targetDim = isBranch ? (1.2 + Math.random() * 0.8) : (0.7 + Math.random() * 0.5);
    const nativeMax = (proto.userData.nativeMaxDim as number) || 2.0;
    const scale = targetDim / nativeMax;
    mesh.scale.setScalar(scale);

    const boxMinY = (proto.userData.boxMinY as number) || 0;
    mesh.position.set(x, y - boxMinY * scale - 0.08, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    return mesh;
  }

  /**
   * Check interactions (collisions, near-misses, ramp launches, crystal pickups)
   */
  public checkInteractions(
    shipPos: THREE.Vector3,
    shipRadius: number,
    onCrash: () => void,
    onNearMiss: () => void,
    onRampLaunch: () => void,
    onCollect: () => void
  ): void {
    const now = performance.now();

    // 1. Check Obstacles & Ramps
    for (const obs of this.obstacles) {
      const dist = shipPos.distanceTo(obs.position);
      const combinedRadius = shipRadius + obs.radius;

      if (dist < combinedRadius) {
        if (obs.isRamp) {
          if (!obs.rampCooldown || now - obs.rampCooldown > 1200) {
            obs.rampCooldown = now;
            onRampLaunch();
          }
        } else {
          onCrash();
          return;
        }
      } else if (dist < combinedRadius + 2.8 && !obs.isRamp) {
        if (!obs.nearMissCooldown || now - obs.nearMissCooldown > 1500) {
          obs.nearMissCooldown = now;
          onNearMiss();
        }
      }
    }

    // 2. Check Collectibles
    for (const col of this.collectibles) {
      if (col.collected) continue;

      // Idle crystal floating rotation
      col.mesh.rotation.y += 0.035;
      col.mesh.rotation.x += 0.015;

      const dist = shipPos.distanceTo(col.position);
      if (dist < shipRadius + 1.4) {
        col.collected = true;
        this.group.remove(col.mesh);
        onCollect();
      }
    }
  }

  public clear(): void {
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.obstacles = [];
    this.collectibles = [];
    this.chunkDataMap.clear();
  }
}
