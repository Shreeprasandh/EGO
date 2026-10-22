import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TrackSpline } from './TrackSpline';
import { SHIP_MODEL_SPECS } from '../player/ShipController';

export interface BotRacer {
  id: number;
  name: string;
  gridSlot: number;
  progressT: number;
  lap: number;
  hasCrossedStartLine: boolean;
  forwardSpeed: number;
  targetSpeed: number;
  accel: number;
  laneOffset: number;
  targetLane: number;
  laneChangeTimer: number;
  position: THREE.Vector3;
  yaw: number;
  roll: number;
  pitch: number;
  group: THREE.Group;
  mesh?: THREE.Object3D;
  thrusterFlame?: THREE.Mesh;
  thrusterLight?: THREE.PointLight;
  colorHex: number;
}

export class BotManager {
  public group = new THREE.Group();
  public bots: BotRacer[] = [];
  private loader = new GLTFLoader();

  // 7 Human Competitors (Slots P1, P2, P3, P5, P6, P7, P8 - Player is P4)
  private botProfiles = [
    { id: 1, slot: 1, name: 'VORTEX',   model: '/assets/models/ship2.glb', color: 0xff4400, baseSpeed: 59.0 },
    { id: 2, slot: 2, name: 'CHRONO',   model: '/assets/models/ship3.glb', color: 0x00e5ff, baseSpeed: 57.0 },
    { id: 3, slot: 3, name: 'PHANTOM',  model: '/assets/models/ship4.glb', color: 0xb026ff, baseSpeed: 55.5 },
    { id: 4, slot: 5, name: 'SOLARIS',  model: '/assets/models/ship5.glb', color: 0xffaa00, baseSpeed: 53.0 },
    { id: 5, slot: 6, name: 'KAIZZER',  model: '/assets/models/ship6.glb', color: 0x00ff88, baseSpeed: 51.5 },
    { id: 6, slot: 7, name: 'NEO',      model: '/assets/models/ship7.glb', color: 0x0088ff, baseSpeed: 49.5 },
    { id: 7, slot: 8, name: 'AURA',     model: '/assets/models/ship8.glb', color: 0xff0055, baseSpeed: 48.0 },
  ];

  constructor(private track: TrackSpline) {
    this.group.name = 'BotManagerGroup';
    this.initBots();
  }

  private initBots(): void {
    this.bots = [];

    this.botProfiles.forEach((prof) => {
      const slotData = this.track.getGridSlot(prof.slot);
      const botGroup = new THREE.Group();
      botGroup.position.copy(slotData.position);

      const bot: BotRacer = {
        id: prof.id,
        name: prof.name,
        gridSlot: prof.slot,
        progressT: slotData.progressT,
        lap: 1,
        hasCrossedStartLine: false,
        forwardSpeed: 0,
        targetSpeed: prof.baseSpeed,
        accel: 14.0 + Math.random() * 4.0,
        laneOffset: slotData.laneOffset,
        targetLane: slotData.laneOffset,
        laneChangeTimer: 2.0 + Math.random() * 3.0,
        position: new THREE.Vector3().copy(slotData.position),
        yaw: slotData.yaw,
        roll: 0,
        pitch: 0,
        group: botGroup,
        colorHex: prof.color,
      };

      // 1. Procedural Hovercraft Hull (Fallback while GLTF loads)
      const hullMesh = this.createFallbackHull(prof.color);
      botGroup.add(hullMesh);
      bot.mesh = hullMesh;

      // 2. Thruster Flame & Light
      const flameGeo = new THREE.ConeGeometry(0.16, 1.8, 16);
      flameGeo.translate(0, 0.9, 0);
      flameGeo.rotateX(Math.PI / 2);
      const flameMat = new THREE.MeshBasicMaterial({
        color: prof.color,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(0, 0.1, 1.3);
      botGroup.add(flame);
      bot.thrusterFlame = flame;

      const light = new THREE.PointLight(prof.color, 1.8, 10.0);
      light.position.set(0, 0.1, 1.5);
      botGroup.add(light);
      bot.thrusterLight = light;

      this.group.add(botGroup);
      this.bots.push(bot);

      // Async load actual 3D model
      this.loadBotModel(bot, prof.model);
    });
  }

  private loadBotModel(bot: BotRacer, modelPath: string): void {
    this.loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        const match = modelPath.match(/ship(\d+)\.glb/);
        const shipId = match ? parseInt(match[1], 10) : 1;
        const spec = SHIP_MODEL_SPECS[shipId] || SHIP_MODEL_SPECS[1];

        // Exact 3.6m length normalization matching player fleet
        model.scale.setScalar(spec.scale);
        model.updateMatrixWorld(true);

        if (shipId === 8) {
          model.position.set(0, spec.offsetY, spec.centerZ);
        } else {
          const scaledBox = new THREE.Box3().setFromObject(model);
          model.position.x = -(scaledBox.min.x + scaledBox.max.x) * 0.5;
          model.position.y = -scaledBox.min.y;
          model.position.z = -(scaledBox.min.z + scaledBox.max.z) * 0.5 + spec.centerZ;
        }
        model.updateMatrixWorld(true);

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (mat && mat.isMeshStandardMaterial) {
              mat.metalness = 0.8;
              mat.roughness = 0.25;
            }
          }
        });

        // Replace fallback hull with real 3D model
        if (bot.mesh) {
          bot.group.remove(bot.mesh);
        }
        bot.group.add(model);
        bot.mesh = model;
      },
      undefined,
      (err) => {
        console.warn(`Could not load bot model ${modelPath}, using procedural hull`, err);
      }
    );
  }

  private createFallbackHull(colorHex: number): THREE.Mesh {
    const geo = new THREE.BufferGeometry();
    const v = new Float32Array([
       0.0,  0.25, -2.0,
      -1.3, -0.05,  1.2,
       1.3, -0.05,  1.2,

       0.0,  0.25, -2.0,
       1.3, -0.05,  1.2,
       0.0, -0.15,  1.4,

       0.0,  0.25, -2.0,
       0.0, -0.15,  1.4,
      -1.3, -0.05,  1.2,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.85,
      roughness: 0.2,
    });
    return new THREE.Mesh(geo, mat);
  }

  /**
   * Reset All Bots onto Starting Grid Slots (Slots 1, 2, 3, 5, 6, 7, 8)
   */
  public resetToGrid(): void {
    this.bots.forEach((bot) => {
      const slotData = this.track.getGridSlot(bot.gridSlot);
      bot.progressT = slotData.progressT;
      bot.lap = 1;
      bot.hasCrossedStartLine = false;
      bot.forwardSpeed = 0;
      bot.laneOffset = slotData.laneOffset;
      bot.targetLane = slotData.laneOffset;
      bot.position.copy(slotData.position);
      bot.yaw = slotData.yaw;
      bot.roll = 0;
      bot.pitch = 0;

      bot.group.position.copy(bot.position);
      bot.group.rotation.set(0, bot.yaw, 0, 'YXZ');
      if (bot.thrusterFlame) bot.thrusterFlame.scale.set(0.6, 0.6, 0.5);
    });
  }

  /**
   * Update Bot Physics, Racing Lines & Collisions
   */
  public update(dt: number, isRaceActive: boolean, playerPos: THREE.Vector3): void {
    const totalLen = this.track.totalLength || 3200;
    const up = new THREE.Vector3(0, 1, 0);

    this.bots.forEach((bot, idx) => {
      if (!isRaceActive) {
        // Idle on Starting Grid: Gentle engine vibration and breathing
        const t = performance.now() * 0.001;
        const idleVibe = Math.sin(t * 8.0 + idx) * 0.015;
        bot.group.position.y = bot.position.y + idleVibe;
        if (bot.thrusterFlame) {
          const breath = 0.5 + Math.sin(t * 4.0 + idx) * 0.1;
          bot.thrusterFlame.scale.set(0.6, 0.6, breath);
        }
        return;
      }

      // 1. Acceleration towards human target speed (average ~180 - 230 km/h)
      if (bot.forwardSpeed < bot.targetSpeed) {
        bot.forwardSpeed = Math.min(bot.targetSpeed, bot.forwardSpeed + bot.accel * dt);
      }

      // 2. Advance Along Track Spline
      const deltaT = (bot.forwardSpeed * dt) / totalLen;
      const prevT = bot.progressT;
      bot.progressT = (bot.progressT + deltaT) % 1.0;

      // Lap count & starting line crossing check
      if (prevT > 0.85 && bot.progressT < 0.15) {
        if (!bot.hasCrossedStartLine) {
          // Initial roll-off from grid slot (P1-P8 at t ~ 0.94..0.99) across start line into Lap 1
          bot.hasCrossedStartLine = true;
        } else {
          // Genuine full-circuit lap completion
          bot.lap++;
        }
      } else if (!bot.hasCrossedStartLine && bot.progressT >= 0.15 && bot.progressT < 0.5) {
        // Defensive safeguard in case of high speed/frame hitch across the gantry
        bot.hasCrossedStartLine = true;
      }

      // 3. Human-like Lane Choice & Subtle Steering Variations
      bot.laneChangeTimer -= dt;
      if (bot.laneChangeTimer <= 0) {
        bot.laneChangeTimer = 2.5 + Math.random() * 4.0;
        // Human lane pick: inside, center, or outside line (-6m, 0m, +6m)
        const laneChoices = [-5.5, 0.0, 5.5];
        bot.targetLane = laneChoices[Math.floor(Math.random() * laneChoices.length)];
      }

      // Smooth lane transition with slight natural wobble
      const wobble = Math.sin(performance.now() * 0.0015 + bot.id) * 0.4;
      bot.laneOffset += (bot.targetLane + wobble - bot.laneOffset) * Math.min(1.0, 2.5 * dt);

      // Clamp lane within track barriers
      const maxLane = this.track.trackWidth * 0.5 - 2.5;
      bot.laneOffset = Math.max(-maxLane, Math.min(maxLane, bot.laneOffset));

      // 4. Compute 3D Track Position & Orientation
      const centerPt = this.track.curve.getPointAt(bot.progressT);
      const tangent = this.track.curve.getTangentAt(bot.progressT).normalize();
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

      bot.position.copy(centerPt).addScaledVector(right, bot.laneOffset);
      bot.position.y += 0.8;

      bot.yaw = Math.atan2(-tangent.x, -tangent.z);

      // Bank roll based on curvature and lateral drift
      const targetRoll = (bot.targetLane - bot.laneOffset) * 0.06;
      bot.roll += (targetRoll - bot.roll) * Math.min(1.0, 6.0 * dt);

      // 5. Update Visual Transformation
      bot.group.position.copy(bot.position);
      bot.group.rotation.set(0, bot.yaw, bot.roll, 'YXZ');

      // 6. Dynamic Afterburner Flame
      if (bot.thrusterFlame) {
        const speedRatio = Math.min(1.0, bot.forwardSpeed / 60.0);
        const flameLength = 0.6 + speedRatio * 1.5;
        bot.thrusterFlame.scale.set(0.8, 0.8, flameLength);
      }

      // 7. Ship-to-Ship Collision with Player Hovercraft
      const distToPlayer = bot.position.distanceTo(playerPos);
      if (distToPlayer < 3.2) {
        // Soft lateral deflection bump
        const bumpDir = new THREE.Vector3().subVectors(playerPos, bot.position).normalize();
        bumpDir.y = 0;
        playerPos.addScaledVector(bumpDir, 0.15);
        bot.position.addScaledVector(bumpDir, -0.15);
        bot.targetLane += (bumpDir.dot(right) < 0 ? 2.5 : -2.5);
      }
    });
  }

  /**
   * Return 2D track progress (0..1) for Mini-Map Radar blips
   */
  public getBotProgressList(): number[] {
    return this.bots.map((b) => b.progressT);
  }

  /**
   * Compute Player's Dynamic Race Position (1st to 8th) against all 7 AI Bots
   */
  public calculatePlayerPosition(
    playerProgressT: number,
    playerLap: number,
    playerHasCrossedStart: boolean = true
  ): { position: number; totalRacers: number } {
    const playerScore = (!playerHasCrossedStart && playerLap === 1)
      ? (playerProgressT - 1.0)
      : ((playerLap - 1) + playerProgressT);

    let rank = 1;

    for (const bot of this.bots) {
      const botScore = (!bot.hasCrossedStartLine && bot.lap === 1)
        ? (bot.progressT - 1.0)
        : ((bot.lap - 1) + bot.progressT);

      if (botScore > playerScore) {
        rank++;
      }
    }

    return {
      position: Math.min(8, Math.max(1, rank)),
      totalRacers: 8,
    };
  }

  public setVisible(visible: boolean): void {
    this.group.visible = visible;
  }
}
