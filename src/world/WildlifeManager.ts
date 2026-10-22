import * as THREE from 'three';

export interface DeerEntity {
  group: THREE.Group;
  head: THREE.Object3D;
  baseY: number;
  phase: number;
}

export interface BirdEntity {
  mesh: THREE.Object3D;
  center: THREE.Vector3;
  radius: number;
  speed: number;
  angle: number;
  height: number;
  wingFlapPhase: number;
}

export class WildlifeManager {
  public group = new THREE.Group();
  private deerList: DeerEntity[] = [];
  private birdsList: BirdEntity[] = [];

  constructor(sampleTerrain: (x: number, z: number) => number) {
    this.group.name = 'WildlifeGroup';
    this.spawnDeerHerd(sampleTerrain);
    this.spawnFlockOfBirds();
  }

  /**
   * Procedural Alpine Forest Deer / Stags grazing in peaceful meadows
   */
  private spawnDeerHerd(sampleTerrain: (x: number, z: number) => number): void {
    // Deer pasture spots safely in meadows away from the track
    const herdPositions = [
      new THREE.Vector2(-65, 85),
      new THREE.Vector2(-78, 98),
      new THREE.Vector2(-50, 115),
      new THREE.Vector2(120, -90),
      new THREE.Vector2(142, -108),
      new THREE.Vector2(-120, -160),
      new THREE.Vector2(-140, -180),
      new THREE.Vector2(85, 210),
    ];

    const deerMat = new THREE.MeshStandardMaterial({
      color: 0x8a5a36, // Warm chestnut deer coat
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });

    const antlerMat = new THREE.MeshStandardMaterial({
      color: 0xddd0b8, // Bone ivory antlers
      roughness: 0.65,
      metalness: 0.1,
    });

    herdPositions.forEach((pos, idx) => {
      const terrainY = sampleTerrain(pos.x, pos.y);
      if (terrainY < -1.5) return; // Don't spawn under lakes

      const deerGroup = new THREE.Group();
      deerGroup.position.set(pos.x, terrainY, pos.y);
      deerGroup.rotation.y = (idx * 1.37) % (Math.PI * 2);

      // 1. Torso
      const bodyGeo = new THREE.BoxGeometry(0.7, 0.75, 1.4);
      bodyGeo.translate(0, 1.2, 0);
      const body = new THREE.Mesh(bodyGeo, deerMat);
      body.castShadow = true;
      deerGroup.add(body);

      // 2. Four Legs
      const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.95, 6);
      legGeo.translate(0, 0.48, 0);
      const legOffsets = [
        [-0.26, 0.45],
        [0.26, 0.45],
        [-0.26, -0.45],
        [0.26, -0.45],
      ];
      legOffsets.forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, deerMat);
        leg.position.set(lx, 0, lz);
        leg.castShadow = true;
        deerGroup.add(leg);
      });

      // 3. Neck & Head with grazing pivot
      const headPivot = new THREE.Group();
      headPivot.position.set(0, 1.5, 0.65);

      const neckGeo = new THREE.BoxGeometry(0.3, 0.65, 0.35);
      neckGeo.translate(0, 0.25, 0.15);
      const neck = new THREE.Mesh(neckGeo, deerMat);
      headPivot.add(neck);

      const headGeo = new THREE.BoxGeometry(0.32, 0.35, 0.55);
      headGeo.translate(0, 0.55, 0.35);
      const head = new THREE.Mesh(headGeo, deerMat);
      head.castShadow = true;
      headPivot.add(head);

      // 4. Regal Antlers (for mature stags)
      if (idx % 2 === 0) {
        const antlerGeo = new THREE.CylinderGeometry(0.025, 0.04, 0.6, 5);
        antlerGeo.translate(0, 0.3, 0);

        const leftAntler = new THREE.Mesh(antlerGeo, antlerMat);
        leftAntler.position.set(-0.14, 0.7, 0.25);
        leftAntler.rotation.set(-0.2, 0, -0.4);
        headPivot.add(leftAntler);

        const rightAntler = new THREE.Mesh(antlerGeo, antlerMat);
        rightAntler.position.set(0.14, 0.7, 0.25);
        rightAntler.rotation.set(-0.2, 0, 0.4);
        headPivot.add(rightAntler);
      }

      deerGroup.add(headPivot);
      this.group.add(deerGroup);

      this.deerList.push({
        group: deerGroup,
        head: headPivot,
        baseY: terrainY,
        phase: idx * 1.5,
      });
    });
  }

  /**
   * Soaring eagles wheeling high above the alpine forest canopy
   */
  private spawnFlockOfBirds(): void {
    const birdMat = new THREE.MeshBasicMaterial({
      color: 0x181c24, // Dark silhouette against the sky
      side: THREE.DoubleSide,
    });

    // Sleek predatory wing geometry
    const wingShape = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Left Wing
      0, 0, 0,
      -1.4, 0.2, 0.4,
      -0.4, 0, 0.7,

      // Right Wing
      0, 0, 0,
      0.4, 0, 0.7,
      1.4, 0.2, 0.4,

      // Tail & Beak
      0, 0, 0,
      0, 0.05, -0.7,
      0, -0.05, 0.8,
    ]);
    wingShape.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    wingShape.computeVertexNormals();

    const centers = [
      new THREE.Vector3(0, 65, 50),
      new THREE.Vector3(250, 75, 200),
      new THREE.Vector3(-180, 70, -120),
      new THREE.Vector3(80, 80, -220),
    ];

    centers.forEach((center, flockIdx) => {
      const birdsInFlock = 3;
      for (let i = 0; i < birdsInFlock; i++) {
        const birdMesh = new THREE.Mesh(wingShape, birdMat);
        birdMesh.scale.setScalar(1.2 + Math.random() * 0.4);
        this.group.add(birdMesh);

        this.birdsList.push({
          mesh: birdMesh,
          center: center.clone(),
          radius: 50 + i * 18 + Math.random() * 10,
          speed: 0.28 + Math.random() * 0.08,
          angle: (i * (Math.PI * 2)) / birdsInFlock + flockIdx,
          height: center.y + (Math.random() - 0.5) * 8,
          wingFlapPhase: Math.random() * Math.PI * 2,
        });
      }
    });
  }

  public update(dt: number, timeSeconds: number): void {
    // 1. Update Deer Idle Grazing & Breathing
    this.deerList.forEach((d) => {
      // Natural grazing cycle: head dips down to chew grass, then looks up alertly
      const grazeCycle = Math.sin(timeSeconds * 0.45 + d.phase);
      const targetHeadPitch = grazeCycle > 0.1 ? 0.65 : -0.15;
      d.head.rotation.x += (targetHeadPitch - d.head.rotation.x) * Math.min(1.0, 2.5 * dt);

      // Subtle breathing body heave
      d.group.position.y = d.baseY + Math.sin(timeSeconds * 1.8 + d.phase) * 0.015;
    });

    // 2. Update Soaring Birds Flight Paths & Banking
    this.birdsList.forEach((b) => {
      b.angle += b.speed * dt;
      b.wingFlapPhase += 5.0 * dt;

      const px = b.center.x + Math.cos(b.angle) * b.radius;
      const pz = b.center.z + Math.sin(b.angle) * b.radius;
      b.mesh.position.set(px, b.height, pz);

      // Tangent heading angle
      const headingAngle = b.angle + Math.PI / 2;
      b.mesh.rotation.y = -headingAngle;

      // Realistic inward bank roll as bird turns along its orbital circle
      b.mesh.rotation.z = -0.32;

      // Gentle wing flexion
      const flap = Math.sin(b.wingFlapPhase) * 0.12;
      b.mesh.rotation.x = flap;
    });
  }
}
