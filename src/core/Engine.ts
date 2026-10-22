import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HoverController } from '../physics/HoverController';
import { InputManager } from '../player/InputManager';
import { CameraController } from '../player/CameraController';
import { ShipController } from '../player/ShipController';
import { TerrainGenerator } from '../world/TerrainGenerator';
import { CelestialEngine } from '../systems/CelestialEngine';
import { WebAudioEngine } from '../systems/WebAudioEngine';
import { ProceduralMusicPlayer } from '../audio/ProceduralMusicPlayer';
import { HudOverlay } from '../ui/HudOverlay';
import { LobbyManager } from '../ui/LobbyManager';
import { IntroSequence } from '../ui/IntroSequence';
import { TouchControls } from '../ui/TouchControls';
import { GarageHangar } from '../world/GarageHangar';
import { TrackSpline } from '../track/TrackSpline';
import { LapManager } from '../track/LapManager';
import { BotManager } from '../track/BotManager';
import { MiniMapRadar } from '../ui/MiniMapRadar';
import { PHYSICS_CONSTANTS } from '../utils/constants';

export class Engine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private canvas: HTMLCanvasElement;

  // Subsystems
  public terrain: TerrainGenerator;
  public track: TrackSpline;
  public botManager: BotManager;
  public lapManager: LapManager;
  public miniMap: MiniMapRadar;
  public garage: GarageHangar;
  public hover: HoverController;
  public ship: ShipController;
  public cameraCtrl: CameraController;
  public input: InputManager;
  public celestial: CelestialEngine;
  public audio: WebAudioEngine;
  public musicPlayer: ProceduralMusicPlayer;
  public hud: HudOverlay;
  public lobby: LobbyManager;
  public touchControls: TouchControls;
  public intro?: IntroSequence;
  public THREE = THREE;
  public studioEnvMap!: THREE.Texture;

  // Speed Dust Particle System
  private speedParticles: THREE.Points;
  private particleCount = 750;

  // Crash Explosion VFX Particle Burst
  private crashVFXGroup = new THREE.Group();
  private crashParticles: Array<{
    mesh: THREE.Object3D;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    isRing?: boolean;
  }> = [];

  // Boost Pickup VFX System
  private boostVFXGroup = new THREE.Group();
  private boostVFXItems: Array<{
    mesh: THREE.Object3D;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    isRing?: boolean;
  }> = [];

  private transitionCurtainEl!: HTMLElement;

  // State
  private lastTime = performance.now();
  private accumulator = 0.0;
  private isFlightActive = false;
  private isPaused = false;
  private lobbyCameraAngle = 0.5;

  constructor() {
    // 0. Start Cursed Born Intro Sequence Immediately on Frame 0
    this.intro = new IntroSequence(() => {
      console.log('🎬 Cursed Born Studio intro completed. 3D Garage Hangar active.');
    });

    this.canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
    if (!this.canvas) throw new Error('Canvas element not found');

    // 1. WebGL2 Renderer Setup with Resilient Context Fallback
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch (e1) {
      console.warn('⚠️ WebGL high-performance context failed, falling back to default:', e1);
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: false,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      });
    }
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;

    // 1b. Synchronous Frame-0 Studio Environment Map for Photorealistic Hangar PBR
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment(this.renderer);
    this.studioEnvMap = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 2. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060912);
    this.scene.environment = this.studioEnvMap; // Frame-0 Studio IBL Active!

    // 3. Audio & Music Players
    this.audio = new WebAudioEngine();
    this.musicPlayer = new ProceduralMusicPlayer();

    // 5. Track, Terrain & Roadbed Carving Subsystems
    this.terrain = new TerrainGenerator();
    this.scene.add(this.terrain.group);

    // 4a. 3.2km Circuit Track Ribbon, Apex Kerbs & Starting Grid
    this.track = new TrackSpline(this.terrain);
    this.scene.add(this.track.group);
    this.track.group.visible = false; // Hidden during lobby

    // Connect roadbed carving & strict 22m scenery keep-out buffer
    this.terrain.trackSampler = (x, z) => this.track.getRoadBedClearance(x, z);
    this.terrain.propScatterer.trackKeepOutCheck = (x, z) => {
      const clr = this.track.getRoadBedClearance(x, z);
      return clr.distance < 22.0; // Strictly keep out props within 22m of track
    };

    // Instantiate lush alpine pine forests and granite boulder fields
    this.terrain.createInstancedForest();

    // 4b. AI Bot Competitors (7 Human-like Rivals)
    this.botManager = new BotManager(this.track);
    this.scene.add(this.botManager.group);
    this.botManager.setVisible(false);

    // 4c. 3D Enclosed Garage Hangar situated in living Alpine Forest environment
    this.garage = new GarageHangar(this.scene);
    this.garage.setVisible(true, this.scene);
    this.terrain.group.visible = true; // Natural outdoor alpine forest visible through garage blast doors

    // 4d. Anti-Gravity Hover Craft & Ship Controller
    this.hover = new HoverController(new THREE.Vector3(0, 10, 0));
    this.ship = new ShipController('/assets/models/ship1.glb');
    this.ship.setLobbyMode(true); // 25% larger in lobby inspection
    this.scene.add(this.ship.group);
    this.scene.add(this.ship.trailGroup);
    this.scene.add(this.crashVFXGroup);
    this.scene.add(this.boostVFXGroup);

    // Smooth Cinematic Scene Transition Curtain
    this.transitionCurtainEl = document.createElement('div');
    this.transitionCurtainEl.id = 'scene-transition-curtain';
    const curtainStyle = document.createElement('style');
    curtainStyle.innerHTML = `
      #scene-transition-curtain {
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: radial-gradient(circle at center, rgba(6, 12, 24, 0.98) 0%, rgba(3, 5, 10, 1) 100%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        z-index: 9999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      }
      #scene-transition-curtain.active {
        opacity: 1;
        pointer-events: auto;
      }
    `;
    document.head.appendChild(curtainStyle);
    document.body.appendChild(this.transitionCurtainEl);

    // 4e. Camera & Input
    this.cameraCtrl = new CameraController();
    this.input = new InputManager(this.canvas);
    this.celestial = new CelestialEngine(this.scene);
    this.celestial.setOutdoorLightingVisible(false, this.scene, this.studioEnvMap);

    // 4f. Racing Lap Manager & 2D MiniMap Radar
    this.lapManager = new LapManager(this.track);
    this.miniMap = new MiniMapRadar(this.track.getSpline2DPoints(90));

    // 5. Racing HUD Overlay & Pause Controller
    this.hud = new HudOverlay(
      'hud-container',
      () => this.restartGame(),
      () => this.returnToLobby(),
      () => this.togglePause(),
      () => this.cameraCtrl.toggleMode()
    );
    this.hud.mountMiniMap(this.miniMap);

    // Guarantee strict UI separation: In-game HUD hidden during lobby
    this.hud.setVisible(false);

    // 6. Interactive 3D Lobby
    this.lobby = new LobbyManager(
      () => this.onLaunchFromLobby(),
      (shipIdx) => this.ship.setShipByIndex(shipIdx),
      (colorHex) => this.ship.setTrailColor(colorHex),
      () => this.audio.playUiBeep(),
      () => this.audio.playUiClick()
    );

    // 7. Touch Controls (strictly mobile/tablet only, hidden on laptops)
    this.touchControls = new TouchControls(this.input);
    this.touchControls.setVisible(false);

    // Initialize ship customization from saved profile
    this.ship.setShipByIndex(this.lobby.profile.selectedShipIndex);
    this.ship.setTrailColor(this.lobby.profile.trailColorHex);

    // 8. Volumetric Speed Dust Particles
    this.speedParticles = this.createSpeedParticles();
    this.scene.add(this.speedParticles);

    // Window resize handler
    window.addEventListener('resize', () => this.onResize());

    // Initialize Web Audio on first user interaction
    const initAudio = () => {
      this.audio.init();
      this.musicPlayer.init();
    };
    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });
  }

  private onLaunchFromLobby(): void {
    // 0. Engage smooth cinematic curtain
    this.transitionCurtainEl.classList.add('active');

    setTimeout(() => {
      this.isFlightActive = true;
      this.isPaused = false;
      this.garage.setVisible(false, this.scene);
      this.terrain.group.visible = true;
      this.track.group.visible = true;
      this.celestial.setOutdoorLightingVisible(true, this.scene, this.studioEnvMap);

      this.hud.setVisible(true);

      // Scale ship to normal 100% racing size
      this.ship.setLobbyMode(false);
      this.ship.showLandingPad(false);

      // Reset 7 AI Bots onto Grid Slots P1, P2, P3, P5, P6, P7, P8
      this.botManager.setVisible(true);
      this.botManager.resetToGrid();

      // Place Player craft onto Starting Grid Slot P4
      const p4Slot = this.track.getGridSlot(4);
      this.hover.reset(p4Slot.position.x, p4Slot.position.z, p4Slot.position.y);
      this.hover.yaw = p4Slot.yaw;

      // Reset race timing & official 3-2-1-GO countdown
      this.lapManager.resetRace();
      this.track.setStartLights(0, false);

      this.touchControls.setVisible(true);
      this.audio.setMode('flight');
      this.audio.playNearMiss();

      // Dissolve curtain smoothly onto race track
      setTimeout(() => {
        this.transitionCurtainEl.classList.remove('active');
      }, 50);
    }, 320);
  }

  private returnToLobby(): void {
    this.transitionCurtainEl.classList.add('active');

    setTimeout(() => {
      this.isFlightActive = false;
      this.isPaused = false;
      this.garage.setVisible(true, this.scene);
      this.terrain.group.visible = true;
      this.track.group.visible = false;
      this.botManager.setVisible(false);
      this.celestial.setOutdoorLightingVisible(false, this.scene, this.studioEnvMap);
      this.scene.environment = this.studioEnvMap;
      this.scene.background = new THREE.Color(0x060912);

      this.hud.setVisible(false);

      // 25% bigger size in garage lobby
      this.ship.setLobbyMode(true);
      this.ship.showLandingPad(false);
      this.touchControls.setVisible(false);
      this.audio.setMode('lobby');

      this.lobby.returnToLobby();

      setTimeout(() => {
        this.transitionCurtainEl.classList.remove('active');
      }, 50);
    }, 320);
  }

  private togglePause(): void {
    if (!this.isFlightActive) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.audio.setMode('lobby');
    } else {
      this.audio.setMode('flight');
    }
  }

  private restartGame(): void {
    this.isPaused = false;
    this.botManager.resetToGrid();

    const p4Slot = this.track.getGridSlot(4);
    this.hover.reset(p4Slot.position.x, p4Slot.position.z, p4Slot.position.y);
    this.hover.yaw = p4Slot.yaw;

    this.lapManager.resetRace();
    this.track.setStartLights(0, false);
    this.audio.setMode('flight');
  }

  private createSpeedParticles(): THREE.Points {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 1] = Math.random() * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.28,
      transparent: true,
      opacity: 0.55,
    });

    return new THREE.Points(geo, mat);
  }

  private updateSpeedParticles(centerPos: THREE.Vector3): void {
    const posAttr = this.speedParticles.geometry.attributes.position;
    const speedRatio = Math.min(1.0, this.hover.forwardSpeed / 120.0);
    (this.speedParticles.material as THREE.PointsMaterial).size = 0.22 + speedRatio * 0.35;
    (this.speedParticles.material as THREE.PointsMaterial).opacity = 0.35 + speedRatio * 0.45;

    for (let i = 0; i < this.particleCount; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);

      if (Math.abs(x - centerPos.x) > 45) x = centerPos.x + (Math.random() - 0.5) * 90;
      if (Math.abs(z - centerPos.z) > 45) z = centerPos.z + (Math.random() - 0.5) * 90;
      if (Math.abs(y - centerPos.y) > 18) y = centerPos.y + (Math.random() - 0.5) * 25;

      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  }

  /**
   * Spawn upgraded 3D multi-stage explosion sparks & shockwave on crash
   */
  private spawnCrashBurst(pos: THREE.Vector3): void {
    // 1. Expanding Ground Shockwave Ring
    const ringGeo = new THREE.RingGeometry(0.5, 1.4, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(pos);
    ringMesh.position.y += 0.2;
    this.crashVFXGroup.add(ringMesh);
    this.crashParticles.push({
      mesh: ringMesh,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0.45,
      maxLife: 0.45,
      isRing: true,
    });

    // 2. 54 Multi-Hue High-Energy Ballistic Fire & Plasma Sparks
    const colors = [0xffffff, 0xffff44, 0xff7700, 0xff2200, 0x00f0ff];
    for (let i = 0; i < 54; i++) {
      const size = 0.10 + Math.random() * 0.14;
      const sparkGeo = new THREE.SphereGeometry(size, 6, 6);
      const sparkMat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.copy(pos);

      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.25) * Math.PI;
      const spd = 8.0 + Math.random() * 22.0;
      const vel = new THREE.Vector3(
        Math.cos(theta) * Math.cos(phi) * spd,
        Math.sin(phi) * spd + 6.0,
        Math.sin(theta) * Math.cos(phi) * spd
      );
      this.crashVFXGroup.add(spark);
      this.crashParticles.push({
        mesh: spark,
        velocity: vel,
        life: 0.7 + Math.random() * 0.6,
        maxLife: 1.3,
      });
    }
  }

  private updateCrashVFX(dt: number): void {
    for (let i = this.crashParticles.length - 1; i >= 0; i--) {
      const p = this.crashParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.crashVFXGroup.remove(p.mesh);
        (p.mesh as THREE.Mesh).geometry.dispose();
        ((p.mesh as THREE.Mesh).material as THREE.Material).dispose();
        this.crashParticles.splice(i, 1);
      } else {
        const alpha = p.life / p.maxLife;
        if (p.isRing) {
          const s = 1.0 + (1.0 - alpha) * 4.2;
          p.mesh.scale.set(s, s, s);
          ((p.mesh as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = alpha * 0.85;
        } else {
          p.velocity.y -= 22.0 * dt; // Gravity
          p.mesh.position.addScaledVector(p.velocity, dt);
          ((p.mesh as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = alpha;
          p.mesh.scale.setScalar(alpha);
        }
      }
    }
  }

  /**
   * Spawn 3D glowing holographic energy shockwave & particles on catching nitro boost
   */
  private spawnBoostPickupVFX(pos: THREE.Vector3): void {
    // 1. Expanding Holographic Torus Ring
    const ringGeo = new THREE.TorusGeometry(1.6, 0.08, 8, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(pos);
    this.boostVFXGroup.add(ringMesh);
    this.boostVFXItems.push({
      mesh: ringMesh,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0.5,
      maxLife: 0.5,
      isRing: true,
    });

    // 2. 24 Swirling glowing plasma particles
    const pGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < 24; i++) {
      const spark = new THREE.Mesh(pGeo, pMat.clone());
      spark.position.copy(pos);
      const theta = (i / 24) * Math.PI * 2;
      const spd = 6.0 + Math.random() * 8.0;
      const vel = new THREE.Vector3(
        Math.cos(theta) * spd,
        3.0 + Math.random() * 5.0,
        Math.sin(theta) * spd
      );
      this.boostVFXGroup.add(spark);
      this.boostVFXItems.push({
        mesh: spark,
        velocity: vel,
        life: 0.65 + Math.random() * 0.35,
        maxLife: 1.0,
      });
    }
  }

  private updateBoostPickupVFX(dt: number): void {
    for (let i = this.boostVFXItems.length - 1; i >= 0; i--) {
      const p = this.boostVFXItems[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.boostVFXGroup.remove(p.mesh);
        (p.mesh as THREE.Mesh).geometry.dispose();
        ((p.mesh as THREE.Mesh).material as THREE.Material).dispose();
        this.boostVFXItems.splice(i, 1);
      } else {
        const ratio = p.life / p.maxLife;
        if (p.isRing) {
          const s = 1.0 + (1.0 - ratio) * 4.5;
          p.mesh.scale.set(s, s, s);
          ((p.mesh as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = ratio * 0.9;
        } else {
          p.velocity.y += 4.0 * dt; // Upward convection
          p.mesh.position.addScaledVector(p.velocity, dt);
          ((p.mesh as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = ratio;
          p.mesh.scale.setScalar(ratio);
        }
      }
    }
  }

  public start(): void {
    this.lastTime = performance.now();
    this.animate();
  }

  private onResize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.cameraCtrl.handleResize();
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const frameTime = Math.min((now - this.lastTime) / 1000.0, 0.1);
    this.lastTime = now;

    if (this.lobby.isInLobby) {
      // ==========================================
      // LOBBY MODE: 3D Enclosed Garage Inspection
      // ==========================================
      if (this.scene.environment !== this.studioEnvMap) {
        this.scene.environment = this.studioEnvMap;
        this.scene.background = new THREE.Color(0x060912);
      }
      this.hover.position.copy(this.garage.parkingPadCenter);

      if (!this.lobby.isDragging) {
        this.lobby.turntableRotation += frameTime * 0.032;
        this.lobbyCameraAngle += frameTime * 0.02;
      }
      const shipQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.lobby.turntableRotation);
      this.ship.update(this.hover.position, shipQuat, 0, false);

      const camDist = 5.2;
      const camHeight = 2.1;
      this.cameraCtrl.camera.position.set(
        Math.sin(this.lobbyCameraAngle) * camDist,
        camHeight,
        Math.cos(this.lobbyCameraAngle) * camDist
      );
      this.cameraCtrl.camera.lookAt(0, 0.75, 0);

    } else {
      // ==========================================
      // FLIGHT ACTIVE / RACE TRACK MODE
      // ==========================================
      if (this.isFlightActive && !this.isPaused) {
        const inputState = this.input.update();

        // 1. Camera Toggle (V / C keys)
        if (this.input.consumeCameraToggle()) {
          this.cameraCtrl.toggleMode();
        }

        // 2. Asphalt 9 Nitro Tap (Space / Shift)
        if (this.input.consumePowerTrigger()) {
          this.lapManager.triggerNitroTap();
          if (this.lapManager.nitroTier > 0) {
            this.audio.playNearMiss();
          }
        }

        // 3. F1 Gantry Lights Sync
        const isCountdown = this.lapManager.isCountingDown;
        if (isCountdown) {
          const stage = this.lapManager.countdownStage;
          if (stage === 3) this.track.setStartLights(3, false);
          else if (stage === 2) this.track.setStartLights(4, false);
          else if (stage === 1) this.track.setStartLights(5, false);
          else this.track.setStartLights(5, true);
        } else {
          this.track.setStartLights(0, false);
        }

        // 4. Fixed Timestep Physics Simulation with anti-freeze clamp
        const dt = PHYSICS_CONSTANTS.FIXED_TIME_STEP;
        this.accumulator = Math.min(this.accumulator + frameTime, dt * PHYSICS_CONSTANTS.MAX_SUB_STEPS);

        let nitroSpeedBoost = 0;
        if (this.lapManager.nitroTier === 1) nitroSpeedBoost = 16.0;
        else if (this.lapManager.nitroTier === 2) nitroSpeedBoost = 30.0;
        else if (this.lapManager.nitroTier === 3) nitroSpeedBoost = 48.0;

        let subSteps = 0;
        const _probePos = new THREE.Vector3();

        while (this.accumulator >= dt && subSteps < PHYSICS_CONSTANTS.MAX_SUB_STEPS) {
          if (isCountdown) {
            // Locked on Starting Grid: can rev engine for afterburners, but velocity is zero
            this.hover.forwardSpeed = 0;
            this.hover.update(
              dt,
              0, // Zero throttle movement during countdown
              0,
              false,
              true,
              (x, z) => {
                const terrainH = this.terrain.getHeight(x, z);
                _probePos.set(x, this.hover.position.y, z);
                return this.track.getTrackSurface(_probePos, terrainH);
              }
            );
          } else {
            // Live Race: Full Flight & Nitro Controls
            const isBoosting = inputState.boost || this.lapManager.nitroTier > 0;

            this.hover.update(
              dt,
              inputState.forward,
              inputState.turn,
              isBoosting,
              inputState.brake,
              (x, z) => {
                const terrainH = this.terrain.getHeight(x, z);
                _probePos.set(x, this.hover.position.y, z);
                return this.track.getTrackSurface(_probePos, terrainH);
              },
              inputState.drift || false
            );

            if (nitroSpeedBoost > 0) {
              this.hover.forwardSpeed = Math.min(130.0, this.hover.forwardSpeed + nitroSpeedBoost * dt * 3.5);
            }

            // Side Barrier Collision & Bounce
            const bounce = this.track.resolveSideBarrierBounce(
              this.hover.position,
              1.8,
              this.hover.forwardSpeed,
              this.hover.yaw
            );
            if (bounce.bounced) {
              this.hover.yaw = bounce.newYaw;
              this.hover.forwardSpeed = bounce.newSpeed;
              this.hover.lateralDrift = 0; // Cancel outward lateral drift momentum to stop barrier jitter
              this.cameraCtrl.triggerTrauma(0.25);
              this.audio.playNearMiss();
            }

            // Jump Ramp Interaction
            const rampCheck = this.track.checkJumpRamp(this.hover.position);
            if (rampCheck.hit) {
              this.hover.launchRamp(1.4);
              this.lapManager.refillNitro(18.0);
              this.audio.playNearMiss();
            }

            // Nitro Boost Pad Interaction
            if (this.track.checkBoostPad(this.hover.position)) {
              this.lapManager.refillNitro(PHYSICS_CONSTANTS.NITRO_CRYSTAL_REFILL);
              this.spawnBoostPickupVFX(this.hover.position);
              this.audio.playNearMiss();
            }

            // Off-Track Breach Detection & Respawn
            const wreckCheck = this.track.checkOffTrackWreck(this.hover.position);
            if (wreckCheck.isWrecked) {
              if (!this.lapManager.isWrecked && !this.lapManager.isGhost) {
                this.hover.triggerCrash();
                this.spawnCrashBurst(this.hover.position);
                this.cameraCtrl.triggerTrauma(0.9);
                this.lapManager.triggerWreck();
                this.hud.showCrash();
                this.audio.playCrash();
              }
            }

            // Scenery Obstacle Check (rocks, ruins, trees outside track)
            // Strictly check obstacles ONLY if craft has breached past the track boundaries
            const nearestInfo = this.track.getNearestTrackPoint(this.hover.position);
            const isOutsideBarriers = nearestInfo.distanceToCenter > (this.track.trackWidth * 0.5);

            if (isOutsideBarriers) {
              this.terrain.propScatterer.checkInteractions(
                this.hover.position,
                1.4,
                () => {
                  if (!this.lapManager.isWrecked && !this.lapManager.isGhost) {
                    this.hover.triggerCrash();
                    this.spawnCrashBurst(this.hover.position);
                    this.cameraCtrl.triggerTrauma(0.9);
                    this.lapManager.triggerWreck();
                    this.hud.showCrash();
                    this.audio.playCrash();
                  }
                },
                () => this.audio.playNearMiss(),
                () => this.hover.launchRamp(1.4),
                () => this.lapManager.refillNitro(25.0)
              );
            }
          }

          this.accumulator -= dt;
          subSteps++;
        }

        // 5. Update 7 AI Bot Drivers
        this.botManager.update(frameTime, !isCountdown, this.hover.position);

        // 6. Calculate Dynamic Leaderboard Position against AI Bots
        const nearest = this.track.getNearestTrackPoint(this.hover.position);
        if (!this.lapManager.hasCrossedStartLine && this.lapManager.currentLap === 1) {
          if (nearest.progressT < 0.25 && nearest.progressT > 0.0) {
            this.lapManager.hasCrossedStartLine = true;
          }
        }
        const rankInfo = this.botManager.calculatePlayerPosition(
          nearest.progressT,
          this.lapManager.currentLap,
          this.lapManager.hasCrossedStartLine
        );

        // 7. Update Lap Progress, Laps & Nitro Timers
        this.lapManager.update(
          frameTime,
          this.hover.position,
          (respawnPos, respawnYaw) => {
            this.hover.reset(respawnPos);
            this.hover.yaw = respawnYaw;
          },
          rankInfo.position
        );

        // 8. Update 2D MiniMap Radar with Player & AI Bot blips
        this.miniMap.update(
          this.hover.position,
          this.hover.yaw,
          this.botManager.getBotProgressList()
        );
      }

      // Update camera with terrain/track surface clearance
      this.cameraCtrl.update(
        frameTime,
        this.hover.position,
        this.hover.yaw,
        this.hover.pitch,
        this.hover.roll,
        this.hover.forwardSpeed,
        this.input.state.lookX,
        this.input.state.lookY,
        (x, z) => this.track.getTrackSurface(this.hover.position, this.terrain.getHeight(x, z)).height
      );

      const isNight = this.celestial.timeOfDay > 0.5;
      this.ship.setGhostMode(this.lapManager.isGhost);
      this.ship.update(this.hover.position, this.hover.quaternion, this.hover.forwardSpeed, isNight);
      this.updateSpeedParticles(this.hover.position);
      this.updateCrashVFX(frameTime);
      this.updateBoostPickupVFX(frameTime);
      this.track.updateAnimatedFeatures(frameTime, now * 0.001);
      this.audio.update(this.hover.forwardSpeed, 1.0);

      // Pass rich telemetry to Asphalt 9 HUD Overlay
      this.hud.update({
        speed: this.hover.forwardSpeed,
        lapState: this.lapManager.getState(),
        isPaused: this.isPaused,
        cameraModeName: this.cameraCtrl.getModeName(),
      });
    }

    // Celestial Day/Night Simulation
    this.celestial.update(frameTime, this.hover.position, this.scene);

    // Stream Procedural Terrain around player and animate living wildlife
    this.terrain.update(this.hover.position.x, this.hover.position.z, frameTime, now * 0.001);

    // Render Scene
    this.renderer.render(this.scene, this.cameraCtrl.camera);
  };
}
