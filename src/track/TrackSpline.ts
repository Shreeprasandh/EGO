import * as THREE from 'three';
import { TerrainGenerator } from '../world/TerrainGenerator';

export interface TrackPointResult {
  point: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  right: THREE.Vector3;
  distanceToCenter: number;
  signedDistance: number;
  progressT: number;
  isOffTrack: boolean;
}

export interface TrackRampItem {
  t: number;
  position: THREE.Vector3;
  laneOffset: number; // -6 (left), 0 (center), +6 (right)
  mesh: THREE.Object3D;
  size: THREE.Vector3;
}

export interface BoostPadItem {
  t: number;
  position: THREE.Vector3;
  laneOffset: number;
  mesh: THREE.Object3D;
  size: THREE.Vector2;
  lastTriggered: number;
}

export interface GridSlotData {
  slot: number;
  position: THREE.Vector3;
  yaw: number;
  progressT: number;
  laneOffset: number;
}

interface CachedTrackNode {
  t: number;
  point: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  right: THREE.Vector3;
}

export class TrackSpline {
  public curve: THREE.CatmullRomCurve3;
  public group = new THREE.Group();
  public checkpoints: THREE.Vector3[] = [];
  public totalLength = 0;
  public trackWidth = 24.0; // 24m wide F1/Asphalt standard 3-lane circuit

  private roadMesh!: THREE.Mesh;
  private leftBarrierMesh!: THREE.Mesh;
  private rightBarrierMesh!: THREE.Mesh;
  private leftRailLine!: THREE.Line;
  private rightRailLine!: THREE.Line;

  public ramps: TrackRampItem[] = [];
  public boostPads: BoostPadItem[] = [];
  public startLightBulbs: THREE.Mesh[] = [];

  // Precomputed Spatial Acceleration Cache for sub-microsecond O(1) track lookup
  private cachedNodes: CachedTrackNode[] = [];
  private spatialGrid: Map<string, number[]> = new Map();
  private readonly gridCellSize = 50;
  private minTrackX = -450;
  private maxTrackX = 640;
  private minTrackZ = -630;
  private maxTrackZ = 730;

  constructor(terrain: TerrainGenerator) {
    this.group.name = 'TrackSplineGroup';

    // 14 Key Circuit Waypoints forming the 3.2km Canyon Grand Prix closed loop
    const rawWaypoints = [
      new THREE.Vector2(0, 0),         // 0: Start / Finish Gantry
      new THREE.Vector2(0, 240),       // 1: Main Straightaway
      new THREE.Vector2(70, 460),      // 2: Sweeper Entry
      new THREE.Vector2(240, 640),     // 3: Sector 1 Rise
      new THREE.Vector2(450, 680),     // 4: East Banked Ridge
      new THREE.Vector2(590, 500),     // 5: Turn 1 Hairpin Crest
      new THREE.Vector2(500, 270),     // 6: Canyon Drop Downhill
      new THREE.Vector2(540, 50),      // 7: Sector 2 Tunnel Entrance
      new THREE.Vector2(380, -230),    // 8: Ridge High-Speed Run
      new THREE.Vector2(180, -480),    // 9: South Basin Hairpin Entry
      new THREE.Vector2(-90, -580),    // 10: South Basin Apex
      new THREE.Vector2(-300, -440),   // 11: West Canyon Climbing Esses
      new THREE.Vector2(-400, -190),   // 12: Sector 3 Chicane
      new THREE.Vector2(-210, -40),    // 13: Final Curve to Start Straight
    ];

    // Conform each waypoint height smoothly to terrain with clearance
    const splinePoints: THREE.Vector3[] = rawWaypoints.map((pt, idx) => {
      const { height } = terrain.sample(pt.x, pt.y);
      const elevationBonus = (idx === 4 || idx === 8) ? 7.0 : 2.2;
      return new THREE.Vector3(pt.x, height + elevationBonus, pt.y);
    });

    // Create closed centripetal Catmull-Rom curve
    this.curve = new THREE.CatmullRomCurve3(splinePoints, true, 'centripetal');
    this.totalLength = this.curve.getLength();

    // 1. Build Physical Asphalt Road Ribbon
    this.buildTrackRibbon();

    // 2. Build F1 Red-and-White Zebra Rumble Kerbs on Apexes
    this.buildF1ApexKerbs();

    // 3. Build Staggered F1 Starting Grid Slots (P1 - P8)
    this.buildStartingGrid();

    // 4. Build 3D Solid Stone & Metal Guardrail Barriers on Both Edges
    this.buildSideBarriers();

    // 5. Start / Finish Line Gantry with 5 F1 Starting Light Bulbs
    this.buildStartFinishGantry();

    // 6. 10 Holographic Checkpoint Gates
    this.buildCheckpointArches();

    // 7. Precisely Placed Jump Ramps & Nitro Boost Pads inside Track
    this.buildTrackFeatures();

    // 8. Curated Static Scenery along Outside Margins (>22m buffer)
    this.buildStaticSceneryDecor();
  }

  /**
   * Procedural High-Detail FIA Asphalt Racing Surface Texture
   */
  private createAsphaltTexture(): THREE.Texture | null {
    if (typeof document === 'undefined') return null;
    try {
      const canvas = document.createElement('canvas');
      if (!canvas || !canvas.getContext) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx || typeof ctx.fillRect !== 'function') return null;

      // 1. Dark high-grade FIA asphalt tarmac base
      ctx.fillStyle = '#141824';
      ctx.fillRect(0, 0, 1024, 1024);

      // 2. Fine aggregate asphalt gravel texture
      const imgData = ctx.getImageData(0, 0, 1024, 1024);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 22;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise + 3));
      }
      ctx.putImageData(imgData, 0, 0);

      // 3. Crisp FIA White Track Edge Boundary Lines
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(28, 0, 16, 1024); // Left edge line
      ctx.fillRect(980, 0, 16, 1024); // Right edge line

      // 4. Subtle Neon Guide Glow on Shoulders
      ctx.fillStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.fillRect(44, 0, 4, 1024);
      ctx.fillStyle = 'rgba(255, 120, 0, 0.45)';
      ctx.fillRect(976, 0, 4, 1024);

      // 5. 3-Lane White Dashed Dividing Markings (Asphalt 9 / F1 Standard)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const dashH = 52;
      const gapH = 44;
      for (let y = 0; y < 1024; y += dashH + gapH) {
        ctx.fillRect(344, y, 8, dashH); // Lane 1 / Lane 2 divider
        ctx.fillRect(672, y, 8, dashH); // Lane 2 / Lane 3 divider
      }

      // 6. High-G Racing Line Rubber Skid Marks
      const skidGrad = ctx.createLinearGradient(0, 0, 1024, 0);
      skidGrad.addColorStop(0.3, 'rgba(0, 0, 0, 0)');
      skidGrad.addColorStop(0.37, 'rgba(6, 8, 12, 0.45)');
      skidGrad.addColorStop(0.44, 'rgba(0, 0, 0, 0)');
      skidGrad.addColorStop(0.66, 'rgba(0, 0, 0, 0)');
      skidGrad.addColorStop(0.73, 'rgba(6, 8, 12, 0.45)');
      skidGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = skidGrad;
      ctx.fillRect(0, 0, 1024, 1024);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 140);
      tex.anisotropy = 8;
      return tex;
    } catch {
      return null;
    }
  }

  /**
   * Extrude high-tech dark asphalt ribbon with lane lines, glowing apex kerbs & spatial cache
   */
  private buildTrackRibbon(): void {
    const segments = 500;
    const halfW = this.trackWidth * 0.5;

    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const leftRailPts: THREE.Vector3[] = [];
    const rightRailPts: THREE.Vector3[] = [];

    const up = new THREE.Vector3(0, 1, 0);

    this.cachedNodes = [];
    this.spatialGrid.clear();

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const norm = new THREE.Vector3().crossVectors(right, tangent).normalize();

      if (i < segments) {
        this.cachedNodes.push({ t, point, tangent, normal: norm, right });
        const gx = Math.floor(point.x / this.gridCellSize);
        const gz = Math.floor(point.z / this.gridCellSize);
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            const key = `${gx + dx},${gz + dz}`;
            let list = this.spatialGrid.get(key);
            if (!list) {
              list = [];
              this.spatialGrid.set(key, list);
            }
            list.push(i);
          }
        }

        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minZ = Math.min(minZ, point.z);
        maxZ = Math.max(maxZ, point.z);
      }

      const leftPos = new THREE.Vector3().copy(point).addScaledVector(right, -halfW);
      const rightPos = new THREE.Vector3().copy(point).addScaledVector(right, halfW);

      vertices.push(leftPos.x, leftPos.y, leftPos.z);
      vertices.push(rightPos.x, rightPos.y, rightPos.z);

      normals.push(norm.x, norm.y, norm.z);
      normals.push(norm.x, norm.y, norm.z);

      const vDist = (t * this.totalLength) / 10.0;
      uvs.push(0.0, vDist);
      uvs.push(1.0, vDist);

      leftRailPts.push(new THREE.Vector3(leftPos.x, leftPos.y + 0.5, leftPos.z));
      rightRailPts.push(new THREE.Vector3(rightPos.x, rightPos.y + 0.5, rightPos.z));

      if (i < segments) {
        const row1 = i * 2;
        const row2 = (i + 1) * 2;
        indices.push(row1, row1 + 1, row2);
        indices.push(row1 + 1, row2 + 1, row2);
      }
    }

    this.minTrackX = minX;
    this.maxTrackX = maxX;
    this.minTrackZ = minZ;
    this.maxTrackZ = maxZ;

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);

    const asphaltTexture = this.createAsphaltTexture();
    const matParams: THREE.MeshStandardMaterialParameters = {
      color: 0x141824,
      roughness: 0.45,
      metalness: 0.25,
      side: THREE.DoubleSide,
    };
    if (asphaltTexture) matParams.map = asphaltTexture;
    const roadMat = new THREE.MeshStandardMaterial(matParams);

    this.roadMesh = new THREE.Mesh(roadGeo, roadMat);
    this.roadMesh.receiveShadow = true;
    this.group.add(this.roadMesh);

    // Glowing Neon Top Kerbs (Cyan Left Rail, Orange Right Rail)
    const leftRailGeo = new THREE.BufferGeometry().setFromPoints(leftRailPts);
    this.leftRailLine = new THREE.Line(
      leftRailGeo,
      new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 })
    );
    this.group.add(this.leftRailLine);

    const rightRailGeo = new THREE.BufferGeometry().setFromPoints(rightRailPts);
    this.rightRailLine = new THREE.Line(
      rightRailGeo,
      new THREE.LineBasicMaterial({ color: 0xff6600, linewidth: 2 })
    );
    this.group.add(this.rightRailLine);
  }

  /**
   * Build F1 Red-and-White Zebra Rumble Kerbs on Corner Apexes
   */
  private buildF1ApexKerbs(): void {
    const up = new THREE.Vector3(0, 1, 0);
    const apexSectors = [
      { startT: 0.16, endT: 0.22, side: -1 }, // Turn 1 inside kerb
      { startT: 0.35, endT: 0.42, side: 1 },  // East ridge inside kerb
      { startT: 0.56, endT: 0.63, side: -1 }, // Hairpin inside kerb
      { startT: 0.77, endT: 0.83, side: 1 },  // Ridge esses inside kerb
      { startT: 0.92, endT: 0.96, side: -1 }, // Final chicane inside kerb
    ];

    apexSectors.forEach((sec) => {
      const steps = 24;
      const stepT = (sec.endT - sec.startT) / steps;
      const halfW = this.trackWidth * 0.5;

      for (let s = 0; s < steps; s++) {
        const t = sec.startT + s * stepT;
        const pt = this.curve.getPointAt(t);
        const tan = this.curve.getTangentAt(t).normalize();
        const right = new THREE.Vector3().crossVectors(tan, up).normalize();

        const kerbPos = new THREE.Vector3().copy(pt).addScaledVector(right, sec.side * (halfW - 1.0));
        kerbPos.y += 0.08;

        const isRed = s % 2 === 0;
        const kerbGeo = new THREE.BoxGeometry(2.0, 0.16, 3.2);
        const kerbMat = new THREE.MeshStandardMaterial({
          color: isRed ? 0xee1122 : 0xf4f4f4,
          roughness: 0.6,
          metalness: 0.2,
        });

        const kerb = new THREE.Mesh(kerbGeo, kerbMat);
        kerb.position.copy(kerbPos);
        kerb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
        this.group.add(kerb);
      }
    });
  }

  /**
   * Staggered F1 Starting Grid (P1 to P8) painted on the tarmac
   */
  private buildStartingGrid(): void {
    const up = new THREE.Vector3(0, 1, 0);

    for (let slot = 1; slot <= 8; slot++) {
      const slotData = this.getGridSlot(slot);
      const pt = this.curve.getPointAt(slotData.progressT);
      const tan = this.curve.getTangentAt(slotData.progressT).normalize();
      const right = new THREE.Vector3().crossVectors(tan, up).normalize();

      const boxPos = new THREE.Vector3().copy(pt).addScaledVector(right, slotData.laneOffset);
      boxPos.y += 0.06;

      // Painted Grid Box Outline (White Rectangular Box)
      const boxGeo = new THREE.PlaneGeometry(4.6, 7.2);
      boxGeo.rotateX(-Math.PI / 2);
      const boxMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        wireframe: true,
      });

      const gridBox = new THREE.Mesh(boxGeo, boxMat);
      gridBox.position.copy(boxPos);
      gridBox.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
      this.group.add(gridBox);

      // Yellow Pole Slot Line on Front
      const frontLineGeo = new THREE.PlaneGeometry(4.6, 0.4);
      frontLineGeo.rotateX(-Math.PI / 2);
      const frontLineMat = new THREE.MeshBasicMaterial({
        color: slot === 1 ? 0xffdd00 : 0xffffff,
      });
      const frontLine = new THREE.Mesh(frontLineGeo, frontLineMat);
      const frontPos = new THREE.Vector3().copy(boxPos).addScaledVector(tan, 3.6);
      frontLine.position.copy(frontPos);
      frontLine.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
      this.group.add(frontLine);
    }
  }

  /**
   * Retrieve exact 3D spawn coordinates and orientation for Grid Slot P1 to P8
   */
  public getGridSlot(slot: number): GridSlotData {
    const clampedSlot = Math.max(1, Math.min(8, slot));
    // Staggered: P1 is left, P2 is right, etc.
    const isLeft = clampedSlot % 2 === 1;
    const laneOffset = isLeft ? -5.5 : 5.5;

    // Progress T backwards from start line (t=0 / 1.0)
    // 0.993 is ~22m behind gantry, each slot spaced ~16m apart along 3.2km track
    const progressT = (1.0 - 0.007 * clampedSlot + 1.0) % 1.0;

    const pt = this.curve.getPointAt(progressT);
    const tan = this.curve.getTangentAt(progressT).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(tan, up).normalize();

    const position = new THREE.Vector3().copy(pt).addScaledVector(right, laneOffset);
    position.y += 0.8;
    const yaw = Math.atan2(-tan.x, -tan.z);

    return {
      slot: clampedSlot,
      position,
      yaw,
      progressT,
      laneOffset,
    };
  }

  /**
   * Build 3D Solid Stone & Carbon Guardrail Barriers on Both Edges
   */
  private buildSideBarriers(): void {
    const segments = 500;
    const halfW = this.trackWidth * 0.5;
    const barrierHeight = 1.6;
    const barrierThick = 0.85;

    const up = new THREE.Vector3(0, 1, 0);

    const leftVerts: number[] = [];
    const leftIndices: number[] = [];
    const rightVerts: number[] = [];
    const rightIndices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const lInnerBase = new THREE.Vector3().copy(point).addScaledVector(right, -halfW);
      const lInnerTop = new THREE.Vector3().copy(lInnerBase).add(new THREE.Vector3(0, barrierHeight, 0));
      const lOuterBase = new THREE.Vector3().copy(point).addScaledVector(right, -(halfW + barrierThick));
      const lOuterTop = new THREE.Vector3().copy(lOuterBase).add(new THREE.Vector3(0, barrierHeight, 0));

      leftVerts.push(
        lInnerBase.x, lInnerBase.y, lInnerBase.z,
        lInnerTop.x, lInnerTop.y, lInnerTop.z,
        lOuterTop.x, lOuterTop.y, lOuterTop.z,
        lOuterBase.x, lOuterBase.y, lOuterBase.z
      );

      const rInnerBase = new THREE.Vector3().copy(point).addScaledVector(right, halfW);
      const rInnerTop = new THREE.Vector3().copy(rInnerBase).add(new THREE.Vector3(0, barrierHeight, 0));
      const rOuterBase = new THREE.Vector3().copy(point).addScaledVector(right, halfW + barrierThick);
      const rOuterTop = new THREE.Vector3().copy(rOuterBase).add(new THREE.Vector3(0, barrierHeight, 0));

      rightVerts.push(
        rInnerBase.x, rInnerBase.y, rInnerBase.z,
        rInnerTop.x, rInnerTop.y, rInnerTop.z,
        rOuterTop.x, rOuterTop.y, rOuterTop.z,
        rOuterBase.x, rOuterBase.y, rOuterBase.z
      );

      if (i < segments) {
        const baseIdx = i * 4;
        const nextIdx = (i + 1) * 4;

        leftIndices.push(baseIdx + 0, baseIdx + 1, nextIdx + 0);
        leftIndices.push(nextIdx + 0, baseIdx + 1, nextIdx + 1);

        leftIndices.push(baseIdx + 1, baseIdx + 2, nextIdx + 1);
        leftIndices.push(nextIdx + 1, baseIdx + 2, nextIdx + 2);

        leftIndices.push(baseIdx + 2, baseIdx + 3, nextIdx + 2);
        leftIndices.push(nextIdx + 2, baseIdx + 3, nextIdx + 3);

        rightIndices.push(baseIdx + 0, nextIdx + 0, baseIdx + 1);
        rightIndices.push(nextIdx + 0, nextIdx + 1, baseIdx + 1);

        rightIndices.push(baseIdx + 1, nextIdx + 1, baseIdx + 2);
        rightIndices.push(nextIdx + 1, nextIdx + 2, baseIdx + 2);

        rightIndices.push(baseIdx + 2, nextIdx + 2, baseIdx + 3);
        rightIndices.push(nextIdx + 2, nextIdx + 3, baseIdx + 3);
      }
    }

    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0x222a38,
      roughness: 0.8,
      metalness: 0.4,
      side: THREE.DoubleSide,
    });

    const leftGeo = new THREE.BufferGeometry();
    leftGeo.setAttribute('position', new THREE.Float32BufferAttribute(leftVerts, 3));
    leftGeo.setIndex(leftIndices);
    leftGeo.computeVertexNormals();
    this.leftBarrierMesh = new THREE.Mesh(leftGeo, barrierMat);
    this.leftBarrierMesh.receiveShadow = true;
    this.leftBarrierMesh.castShadow = true;
    this.group.add(this.leftBarrierMesh);

    const rightGeo = new THREE.BufferGeometry();
    rightGeo.setAttribute('position', new THREE.Float32BufferAttribute(rightVerts, 3));
    rightGeo.setIndex(rightIndices);
    rightGeo.computeVertexNormals();
    this.rightBarrierMesh = new THREE.Mesh(rightGeo, barrierMat);
    this.rightBarrierMesh.receiveShadow = true;
    this.rightBarrierMesh.castShadow = true;
    this.group.add(this.rightBarrierMesh);
  }

  /**
   * Start / Finish Line Overhead Gantry Arch with 5 F1 Start Lights
   */
  private buildStartFinishGantry(): void {
    const gantry = new THREE.Group();
    const p0 = this.curve.getPointAt(0);
    const tan = this.curve.getTangentAt(0).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(tan, up).normalize();

    // Arch Columns
    const colGeo = new THREE.BoxGeometry(1.6, 12.0, 1.6);
    const colMat = new THREE.MeshStandardMaterial({ color: 0x0a101d, metalness: 0.85, roughness: 0.2 });

    const leftCol = new THREE.Mesh(colGeo, colMat);
    leftCol.position.copy(p0).addScaledVector(right, -13.5);
    leftCol.position.y += 6.0;
    gantry.add(leftCol);

    const rightCol = new THREE.Mesh(colGeo, colMat);
    rightCol.position.copy(p0).addScaledVector(right, 13.5);
    rightCol.position.y += 6.0;
    gantry.add(rightCol);

    // Overhead Checkered Timing Bar
    const beamGeo = new THREE.BoxGeometry(28.0, 2.4, 2.2);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00a2cc, emissiveIntensity: 0.6 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.copy(p0);
    beam.position.y += 11.2;
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), right);
    gantry.add(beam);

    // 5 F1 Starting Light Bulbs on Overhead Beam
    this.startLightBulbs = [];
    const bulbGeo = new THREE.SphereGeometry(0.55, 16, 16);
    for (let i = 0; i < 5; i++) {
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0x1a0505 });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      const offset = (i - 2) * 2.2;
      bulb.position.copy(p0).addScaledVector(right, offset);
      bulb.position.y += 9.6;
      gantry.add(bulb);
      this.startLightBulbs.push(bulb);
    }

    // Glowing Finish Line Ribbon on Road
    const finishLineGeo = new THREE.PlaneGeometry(this.trackWidth, 3.2);
    finishLineGeo.rotateX(-Math.PI / 2);
    const finishMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    const finishLine = new THREE.Mesh(finishLineGeo, finishMat);
    finishLine.position.copy(p0);
    finishLine.position.y += 0.08;
    finishLine.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), right);
    gantry.add(finishLine);

    this.group.add(gantry);
  }

  /**
   * Set F1 Gantry Start Lights (0 to 5 Red, or Green Lights Out)
   */
  public setStartLights(redCount: number, isGreen = false): void {
    this.startLightBulbs.forEach((bulb, idx) => {
      const mat = bulb.material as THREE.MeshBasicMaterial;
      if (isGreen) {
        mat.color.setHex(0x00ff66);
      } else if (idx < redCount) {
        mat.color.setHex(0xff1122);
      } else {
        mat.color.setHex(0x1a0505);
      }
    });
  }

  /**
   * 10 Checkpoint Gates around the track
   */
  private buildCheckpointArches(): void {
    const gateCount = 10;
    this.checkpoints = [];

    for (let i = 0; i < gateCount; i++) {
      const t = i / gateCount;
      const pt = this.curve.getPointAt(t);
      this.checkpoints.push(pt);

      if (i === 0) continue; // Start/finish gantry handles gate 0

      const tan = this.curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

      const ringGeo = new THREE.TorusGeometry(13.5, 0.35, 8, 32, Math.PI);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.75,
      });
      const arch = new THREE.Mesh(ringGeo, ringMat);
      arch.position.copy(pt);
      arch.position.y += 0.1;
      arch.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), right);
      this.group.add(arch);
    }
  }

  /**
   * Precisely Placed Jump Ramps & Nitro Boost Strips inside the track
   */
  private buildTrackFeatures(): void {
    const up = new THREE.Vector3(0, 1, 0);

    const rampLocations = [
      { t: 0.12, lane: 5.5 },   // Right lane main straightaway
      { t: 0.44, lane: -5.5 },  // Left lane before canyon leap
      { t: 0.76, lane: 0.0 },   // Center lane ridge drop
    ];

    rampLocations.forEach((loc) => {
      const pt = this.curve.getPointAt(loc.t);
      const tan = this.curve.getTangentAt(loc.t).normalize();
      const right = new THREE.Vector3().crossVectors(tan, up).normalize();

      const rampPos = new THREE.Vector3().copy(pt).addScaledVector(right, loc.lane);
      const rampW = 6.2;
      const rampH = 2.4;
      const rampL = 9.5;

      const rampGeo = new THREE.BufferGeometry();
      const halfW = rampW * 0.5;
      const v = new Float32Array([
        -halfW, 0,     -rampL * 0.5,
         halfW, 0,     -rampL * 0.5,
         halfW, rampH,  rampL * 0.5,

        -halfW, 0,     -rampL * 0.5,
         halfW, rampH,  rampL * 0.5,
        -halfW, rampH,  rampL * 0.5,

        -halfW, rampH, rampL * 0.5,
         halfW, rampH, rampL * 0.5,
         halfW, 0,     rampL * 0.5,

        -halfW, rampH, rampL * 0.5,
         halfW, 0,     rampL * 0.5,
        -halfW, 0,     rampL * 0.5,
      ]);

      rampGeo.setAttribute('position', new THREE.BufferAttribute(v, 3));
      rampGeo.computeVertexNormals();

      const rampMat = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff3300,
        emissiveIntensity: 0.6,
        roughness: 0.4,
        metalness: 0.6,
      });

      const rampMesh = new THREE.Mesh(rampGeo, rampMat);
      rampMesh.position.copy(rampPos);
      rampMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
      this.group.add(rampMesh);

      this.ramps.push({
        t: loc.t,
        position: rampPos,
        laneOffset: loc.lane,
        mesh: rampMesh,
        size: new THREE.Vector3(rampW, rampH, rampL),
      });
    });

    const boostLocations = [
      { t: 0.05, lane: 0.0 },
      { t: 0.22, lane: 4.5 },
      { t: 0.38, lane: -4.5 },
      { t: 0.54, lane: 0.0 },
      { t: 0.70, lane: 4.5 },
      { t: 0.88, lane: -4.5 },
    ];

    boostLocations.forEach((loc) => {
      const pt = this.curve.getPointAt(loc.t);
      const tan = this.curve.getTangentAt(loc.t).normalize();
      const right = new THREE.Vector3().crossVectors(tan, up).normalize();

      const padPos = new THREE.Vector3().copy(pt).addScaledVector(right, loc.lane);
      padPos.y += 1.2; // Hover cleanly above the roadbed

      // 3D Floating Holographic Nitro Crystal Group
      const boostGroup = new THREE.Group();

      // 1. Central Rotating Octahedron Diamond Crystal
      const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00c4ee,
        emissiveIntensity: 1.4,
        roughness: 0.2,
        metalness: 0.8,
        wireframe: false,
      });
      const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
      boostGroup.add(crystalMesh);

      // 2. Spinning Outer Holographic Energy Ring
      const ringGeo = new THREE.TorusGeometry(1.8, 0.1, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.85,
        wireframe: true,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 4;
      boostGroup.add(ringMesh);

      // 3. Ground Light Disc Indicator
      const discGeo = new THREE.CircleGeometry(2.4, 24);
      discGeo.rotateX(-Math.PI / 2);
      const discMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
      });
      const discMesh = new THREE.Mesh(discGeo, discMat);
      discMesh.position.y = -1.15;
      boostGroup.add(discMesh);

      boostGroup.position.copy(padPos);
      this.group.add(boostGroup);

      this.boostPads.push({
        t: loc.t,
        position: padPos,
        laneOffset: loc.lane,
        mesh: boostGroup,
        size: new THREE.Vector2(5.0, 12.0),
        lastTriggered: 0,
      });
    });
  }

  /**
   * Animate floating 3D track boost crystals
   */
  public updateAnimatedFeatures(dt: number, timeSec: number): void {
    for (const pad of this.boostPads) {
      if (pad.mesh) {
        pad.mesh.rotation.y += dt * 2.8;
        pad.mesh.position.y = pad.position.y + Math.sin(timeSec * 3.6 + pad.t * 12.0) * 0.22;
      }
    }
  }

  /**
   * Curated Static Scenery along Outside Margins (>22m buffer)
   */
  private buildStaticSceneryDecor(): void {
    const up = new THREE.Vector3(0, 1, 0);
    const stoneGeo = new THREE.DodecahedronGeometry(5.0, 1);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x5a483a,
      roughness: 0.9,
      metalness: 0.1,
    });

    const decorT = [0.18, 0.32, 0.48, 0.62, 0.82, 0.94];
    decorT.forEach((t) => {
      const pt = this.curve.getPointAt(t);
      const tan = this.curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tan, up).normalize();

      // Left outside cliff (>24m away)
      const leftRock = new THREE.Mesh(stoneGeo, stoneMat);
      leftRock.position.copy(pt).addScaledVector(right, -(this.trackWidth * 0.5 + 14.0 + Math.random() * 8.0));
      leftRock.position.y += Math.random() * 4.0;
      leftRock.scale.set(2.0 + Math.random(), 3.0 + Math.random() * 2.0, 2.0 + Math.random());
      this.group.add(leftRock);

      // Right outside cliff (>24m away)
      const rightRock = new THREE.Mesh(stoneGeo, stoneMat);
      rightRock.position.copy(pt).addScaledVector(right, (this.trackWidth * 0.5 + 14.0 + Math.random() * 8.0));
      rightRock.position.y += Math.random() * 4.0;
      rightRock.scale.set(2.0 + Math.random(), 3.0 + Math.random() * 2.0, 2.0 + Math.random());
      this.group.add(rightRock);
    });
  }

  /**
   * Roadbed clearance helper for TerrainGenerator and PropScatterer with AABB rejection
   */
  public getRoadBedClearance(x: number, z: number): { distance: number; roadY: number } {
    if (x < this.minTrackX - 45 || x > this.maxTrackX + 45 || z < this.minTrackZ - 45 || z > this.maxTrackZ + 45) {
      return { distance: 999.0, roadY: 0 };
    }
    const info = this.getNearestTrackPoint(new THREE.Vector3(x, 0, z));
    return {
      distance: info.distanceToCenter,
      roadY: info.point.y,
    };
  }

  /**
   * Compute nearest track point, tangent, distance, and bounds via Spatial Acceleration Cache
   */
  public getNearestTrackPoint(pos: THREE.Vector3): TrackPointResult {
    const total = this.cachedNodes.length;
    let bestIdx = 0;
    let minDistSq = Infinity;

    if (total > 0) {
      const gx = Math.floor(pos.x / this.gridCellSize);
      const gz = Math.floor(pos.z / this.gridCellSize);
      const key = `${gx},${gz}`;
      const candidates = this.spatialGrid.get(key);

      if (candidates && candidates.length > 0) {
        for (let i = 0; i < candidates.length; i++) {
          const idx = candidates[i];
          const node = this.cachedNodes[idx];
          const dx = pos.x - node.point.x;
          const dz = pos.z - node.point.z;
          const distSq = dx * dx + dz * dz;
          if (distSq < minDistSq) {
            minDistSq = distSq;
            bestIdx = idx;
          }
        }
      } else {
        // Fast coarse sweep across all cached nodes (step by 4)
        for (let i = 0; i < total; i += 4) {
          const node = this.cachedNodes[i];
          const dx = pos.x - node.point.x;
          const dz = pos.z - node.point.z;
          const distSq = dx * dx + dz * dz;
          if (distSq < minDistSq) {
            minDistSq = distSq;
            bestIdx = i;
          }
        }
      }

      // Local 1-step analytical neighbor refinement
      const prevIdx = (bestIdx - 1 + total) % total;
      const nextIdx = (bestIdx + 1) % total;
      const prevNode = this.cachedNodes[prevIdx];
      const nextNode = this.cachedNodes[nextIdx];

      const distPrev = (pos.x - prevNode.point.x) ** 2 + (pos.z - prevNode.point.z) ** 2;
      const distNext = (pos.x - nextNode.point.x) ** 2 + (pos.z - nextNode.point.z) ** 2;

      if (distPrev < minDistSq) {
        bestIdx = prevIdx;
      } else if (distNext < minDistSq) {
        bestIdx = nextIdx;
      }

      const node = this.cachedNodes[bestIdx];
      const toPos = new THREE.Vector3().subVectors(pos, node.point);
      const signedDistance = toPos.dot(node.right);
      const distanceToCenter = Math.abs(signedDistance);
      const isOffTrack = distanceToCenter > this.trackWidth * 0.5;

      return {
        point: node.point,
        tangent: node.tangent,
        normal: node.normal,
        right: node.right,
        distanceToCenter,
        signedDistance,
        progressT: node.t,
        isOffTrack,
      };
    }

    // Direct fallback if cache is somehow uninitialized
    const point = this.curve.getPointAt(0);
    const tangent = this.curve.getTangentAt(0).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const normal = new THREE.Vector3().crossVectors(right, tangent).normalize();

    return {
      point,
      tangent,
      normal,
      right,
      distanceToCenter: 0,
      signedDistance: 0,
      progressT: 0,
      isOffTrack: false,
    };
  }

  /**
   * Sample road surface elevation & normal
   */
  public getTrackSurface(pos: THREE.Vector3, fallbackTerrainHeight: number): { height: number; normal: THREE.Vector3; isOnTrack: boolean } {
    const info = this.getNearestTrackPoint(pos);
    const halfW = this.trackWidth * 0.5;

    if (info.distanceToCenter <= halfW + 1.5) {
      return {
        height: Math.max(info.point.y, fallbackTerrainHeight),
        normal: info.normal,
        isOnTrack: true,
      };
    }

    return {
      height: fallbackTerrainHeight,
      normal: new THREE.Vector3(0, 1, 0),
      isOnTrack: false,
    };
  }

  /**
   * Asphalt 9 Side Barrier Bounce & Alignment
   */
  public resolveSideBarrierBounce(
    pos: THREE.Vector3,
    craftRadius: number,
    forwardSpeed: number,
    yaw: number
  ): { bounced: boolean; newYaw: number; sparkPos?: THREE.Vector3; newSpeed: number } {
    const info = this.getNearestTrackPoint(pos);
    const halfW = this.trackWidth * 0.5;
    const maxSafeDist = halfW - craftRadius;

    if (info.distanceToCenter > maxSafeDist) {
      const sideSign = Math.sign(info.signedDistance);

      // Clamp craft back inside boundary while preserving current altitude
      const clampedOffset = sideSign * maxSafeDist;
      const currentY = pos.y;
      pos.copy(info.point).addScaledVector(info.right, clampedOffset);
      pos.y = Math.max(currentY, info.point.y + 0.8);

      // Soft align yaw towards track heading
      const tangentYaw = Math.atan2(-info.tangent.x, -info.tangent.z);
      const yawDiff = tangentYaw - yaw;
      const normalizedDiff = Math.atan2(Math.sin(yawDiff), Math.cos(yawDiff));
      const correctedYaw = yaw + normalizedDiff * 0.45;

      const correctedSpeed = Math.max(20.0, forwardSpeed * 0.95);
      const sparkPos = new THREE.Vector3().copy(pos).addScaledVector(info.right, sideSign * craftRadius);

      return {
        bounced: true,
        newYaw: correctedYaw,
        sparkPos,
        newSpeed: correctedSpeed,
      };
    }

    return {
      bounced: false,
      newYaw: yaw,
      newSpeed: forwardSpeed,
    };
  }

  public checkJumpRamp(pos: THREE.Vector3): { hit: boolean; impulse: number } {
    for (const ramp of this.ramps) {
      const dist = pos.distanceTo(ramp.position);
      if (dist < 4.2) {
        return { hit: true, impulse: 18.0 };
      }
    }
    return { hit: false, impulse: 0 };
  }

  public checkBoostPad(pos: THREE.Vector3): boolean {
    const now = performance.now();
    for (const pad of this.boostPads) {
      const dist = pos.distanceTo(pad.position);
      if (dist < 3.8 && now - pad.lastTriggered > 1200) {
        pad.lastTriggered = now;
        return true;
      }
    }
    return false;
  }

  public checkOffTrackWreck(pos: THREE.Vector3): { isWrecked: boolean; respawnPos: THREE.Vector3; respawnYaw: number } {
    const info = this.getNearestTrackPoint(pos);

    // Strictly trigger wreck only if craft has breached past the track shoulders (> 20.0m from centerline)
    // or plunged deeply below the track elevation (> 12.0m below roadbed)
    if (info.distanceToCenter > 20.0 || (pos.y < info.point.y - 12.0)) {
      const respawnPt = new THREE.Vector3().copy(info.point);
      respawnPt.y += 0.5;
      const respawnYaw = Math.atan2(-info.tangent.x, -info.tangent.z);

      return {
        isWrecked: true,
        respawnPos: respawnPt,
        respawnYaw,
      };
    }

    return {
      isWrecked: false,
      respawnPos: pos,
      respawnYaw: 0,
    };
  }

  public getSpline2DPoints(count = 90): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const p = this.curve.getPointAt(t);
      pts.push({ x: p.x, y: p.z });
    }
    return pts;
  }
}
