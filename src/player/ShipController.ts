import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface ShipModelSpec {
  scale: number;
  offsetY: number;
  centerZ: number;
  nozzlePos: THREE.Vector3;
  nozzleScale: number;
}

export const SHIP_MODEL_SPECS: Record<number, ShipModelSpec> = {
  1:  { scale: 3.6 / 36.93, offsetY: 0.28, centerZ: 0.10, nozzlePos: new THREE.Vector3(0, 0.40, 1.70), nozzleScale: 1.0 },
  2:  { scale: 3.6 / 27.57, offsetY: 0.35, centerZ: 0.22, nozzlePos: new THREE.Vector3(0, 0.45, 1.65), nozzleScale: 0.95 },
  3:  { scale: 3.6 / 24.99, offsetY: 0.56, centerZ: -0.08, nozzlePos: new THREE.Vector3(0, 0.55, 1.75), nozzleScale: 1.05 },
  4:  { scale: 3.6 / 32.76, offsetY: 0.50, centerZ: -0.01, nozzlePos: new THREE.Vector3(0, 0.55, 1.75), nozzleScale: 1.0 },
  5:  { scale: 3.6 / 527.90, offsetY: 0.46, centerZ: 0.00, nozzlePos: new THREE.Vector3(0, 0.45, 1.75), nozzleScale: 1.1 },
  6:  { scale: 3.6 / 1.86, offsetY: 0.56, centerZ: 0.00, nozzlePos: new THREE.Vector3(0, 0.50, 1.75), nozzleScale: 0.9 },
  7:  { scale: 3.6 / 4.71, offsetY: 0.20, centerZ: 0.00, nozzlePos: new THREE.Vector3(0, 0.18, 1.00), nozzleScale: 0.85 },
  8:  { scale: 3.6 / 27.372, offsetY: 0.12, centerZ: 0.00, nozzlePos: new THREE.Vector3(0, 0.22, 1.72), nozzleScale: 0.95 },
  9:  { scale: 3.6 / 8.51, offsetY: 0.22, centerZ: 0.04, nozzlePos: new THREE.Vector3(0, 0.28, 1.25), nozzleScale: 0.9 },
  10: { scale: 3.6 / 7.64, offsetY: 0.48, centerZ: 0.07, nozzlePos: new THREE.Vector3(0, 0.50, 1.70), nozzleScale: 1.05 },
};

export class ShipController {
  public group = new THREE.Group();
  public trailGroup = new THREE.Group(); // World-space trail group attached to main scene
  public mesh: THREE.Object3D | null = null;
  public thrusterLight = new THREE.PointLight(0x00f0ff, 3.5, 18.0);
  public thrusterGroup = new THREE.Group();
  public thrusterFlare: THREE.Object3D;
  private coreFlame!: THREE.Mesh;
  private outerFlame!: THREE.Mesh;
  private machDiamonds: THREE.Mesh[] = [];
  private nozzleRing!: THREE.Mesh;
  public isLoaded = false;
  public trailColorHex = 0x00f0ff;

  private loader = new GLTFLoader();
  private maxTrailPoints = 35;
  private landingPad: THREE.Mesh;

  // Ribbon Trail buffers (World Space)
  private leftTrailPoints: THREE.Vector3[] = [];
  private rightTrailPoints: THREE.Vector3[] = [];
  private leftTrailLine!: THREE.Line;
  private rightTrailLine!: THREE.Line;

  // Local Wingtip offsets
  private leftWingOffset = new THREE.Vector3(-1.45, 0.05, 1.1);
  private rightWingOffset = new THREE.Vector3(1.45, 0.05, 1.1);
  private _tempWorldPos = new THREE.Vector3();

  constructor(modelPath = '/assets/models/ship1.glb') {
    this.createProceduralFallback();
    this.setupThrusters();
    this.thrusterFlare = this.thrusterGroup;

    this.setupTrails();
    this.landingPad = this.createLandingPad();
    this.group.add(this.landingPad);
    this.loadGLTF(modelPath);
  }

  private createLandingPad(): THREE.Mesh {
    const geo = new THREE.RingGeometry(1.6, 2.4, 32);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.set(0, -0.45, 0);
    return ring;
  }

  private setupThrusters(): void {
    this.thrusterLight.position.set(0, 0.1, 1.8);
    this.group.add(this.thrusterLight);

    this.thrusterGroup.position.set(0, 0.1, 1.4);

    // 1. White-hot supersonic inner plasma core (Anchored at base z=0)
    const coreHeight = 1.8;
    const coreGeo = new THREE.ConeGeometry(0.12, coreHeight, 20);
    coreGeo.translate(0, coreHeight * 0.5, 0);
    coreGeo.rotateX(Math.PI / 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.coreFlame = new THREE.Mesh(coreGeo, coreMat);
    this.coreFlame.position.set(0, 0, 0);
    this.thrusterGroup.add(this.coreFlame);

    // 2. Outer aerodynamic expansion plume tinted with plasma color (Anchored at base z=0)
    const outerHeight = 2.6;
    const outerGeo = new THREE.ConeGeometry(0.24, outerHeight, 20);
    outerGeo.translate(0, outerHeight * 0.5, 0);
    outerGeo.rotateX(Math.PI / 2);
    const outerMat = new THREE.MeshBasicMaterial({
      color: this.trailColorHex,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.outerFlame = new THREE.Mesh(outerGeo, outerMat);
    this.outerFlame.position.set(0, 0, 0);
    this.thrusterGroup.add(this.outerFlame);

    // 3. Supersonic Mach shock diamonds along exhaust centerline
    this.machDiamonds = [];
    const diamondStations = [0.22, 0.42, 0.65, 0.88];
    diamondStations.forEach((ratio) => {
      const dGeo = new THREE.OctahedronGeometry(0.065, 0);
      dGeo.scale(1.0, 1.0, 1.6);
      const dMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const diamond = new THREE.Mesh(dGeo, dMat);
      diamond.position.set(0, 0, outerHeight * ratio);
      diamond.userData = { baseRatio: ratio };
      this.thrusterGroup.add(diamond);
      this.machDiamonds.push(diamond);
    });

    // 4. Nozzle rim collar glow
    const nozzleGeo = new THREE.TorusGeometry(0.22, 0.035, 12, 24);
    const nozzleMat = new THREE.MeshBasicMaterial({
      color: this.trailColorHex,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.nozzleRing = new THREE.Mesh(nozzleGeo, nozzleMat);
    this.thrusterGroup.add(this.nozzleRing);

    this.group.add(this.thrusterGroup);
  }

  public showLandingPad(visible: boolean): void {
    this.landingPad.visible = visible;
  }

  public setLobbyMode(inLobby: boolean): void {
    // 1:1 scale normalization across both hangar and race
    const scale = 1.0;
    this.group.scale.set(scale, scale, scale);

    // Completely extinguish afterburner flames, point light, and trails in garage lobby
    this.thrusterGroup.visible = !inLobby;
    this.thrusterLight.visible = !inLobby;
    this.trailGroup.visible = !inLobby;
  }

  /**
   * Set ghost mode (translucent pulsing hologram after respawn)
   */
  public setGhostMode(isGhost: boolean): void {
    if (!this.mesh) return;
    const opacity = isGhost ? (0.35 + Math.sin(performance.now() * 0.015) * 0.25) : 1.0;
    this.mesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.transparent = isGhost;
          mat.opacity = opacity;
          mat.depthWrite = !isGhost;
        }
      }
    });
  }

  private createProceduralFallback(): void {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
       0.0,  0.25, -2.2,
      -1.4, -0.05,  1.2,
       1.4, -0.05,  1.2,

       0.0,  0.25, -2.2,
       1.4, -0.05,  1.2,
       0.0, -0.15,  1.4,

       0.0,  0.25, -2.2,
       0.0, -0.15,  1.4,
      -1.4, -0.05,  1.2,

       0.0, -0.15, -2.1,
       1.3, -0.05,  1.1,
      -1.3, -0.05,  1.1,
    ]);

    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x161820,
      metalness: 0.92,
      roughness: 0.22,
      flatShading: true,
    });

    const fallbackMesh = new THREE.Mesh(geo, mat);
    fallbackMesh.castShadow = true;
    fallbackMesh.receiveShadow = true;
    this.mesh = fallbackMesh;
    this.group.add(fallbackMesh);
  }

  private setupTrails(): void {
    const createLine = () => {
      const geo = new THREE.BufferGeometry();
      const posArray = new Float32Array(this.maxTrailPoints * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const mat = new THREE.LineBasicMaterial({
        color: this.trailColorHex,
        transparent: true,
        opacity: 0.85,
        linewidth: 2,
      });
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      return line;
    };

    this.leftTrailLine = createLine();
    this.rightTrailLine = createLine();

    this.trailGroup.add(this.leftTrailLine);
    this.trailGroup.add(this.rightTrailLine);
  }

  public setTrailColor(colorHex: number): void {
    this.trailColorHex = colorHex;
    this.thrusterLight.color.setHex(colorHex);
    (this.landingPad.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    if (this.outerFlame) (this.outerFlame.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    if (this.nozzleRing) (this.nozzleRing.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    (this.leftTrailLine.material as THREE.LineBasicMaterial).color.setHex(colorHex);
    (this.rightTrailLine.material as THREE.LineBasicMaterial).color.setHex(colorHex);
  }

  public setShipByIndex(index: number): void {
    const modelPath = `/assets/models/ship${index}.glb`;
    this.loadGLTF(modelPath);
  }

  public loadGLTF(path: string): void {
    this.isLoaded = false;
    this.loader.load(
      path,
      (gltf) => {
        if (this.mesh) {
          this.group.remove(this.mesh);
        }

        const model = gltf.scene;
        const match = path.match(/ship(\d+)\.glb/);
        const shipId = match ? parseInt(match[1], 10) : 1;
        const spec = SHIP_MODEL_SPECS[shipId] || SHIP_MODEL_SPECS[1];

        // Exact 3.6m length normalization for all ships
        model.scale.setScalar(spec.scale);
        model.updateMatrixWorld(true);

        if (shipId === 8) {
          // Precise center and grounding for MK-08 SkinnedMesh: bottom rests at Y = 0.0
          model.position.set(0, spec.offsetY, spec.centerZ);
        } else {
          // Precise automatic belly grounding for all standard ships:
          // Center X and Z so thrust aligns along origin, and ground lowest vertex cleanly at Y = 0.0
          const scaledBox = new THREE.Box3().setFromObject(model);
          model.position.x = -(scaledBox.min.x + scaledBox.max.x) * 0.5;
          model.position.y = -scaledBox.min.y; // Lowest point of hull sits at EXACTLY Y = 0.0!
          model.position.z = -(scaledBox.min.z + scaledBox.max.z) * 0.5 + spec.centerZ;
        }
        model.updateMatrixWorld(true);

        // Calibrate nozzle position to matching ship ID
        this.thrusterGroup.position.copy(spec.nozzlePos);
        this.thrusterGroup.scale.setScalar(spec.nozzleScale);
        this.thrusterLight.position.set(spec.nozzlePos.x, spec.nozzlePos.y, spec.nozzlePos.z + 0.35);

        // Calibrate materials for high-fidelity photorealism
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (mat && mat.isMeshStandardMaterial) {
              mat.metalness = Math.max(mat.metalness || 0.8, 0.75);
              mat.roughness = Math.min(mat.roughness || 0.3, 0.35);
              mat.envMapIntensity = 1.4;
            }
          }
        });

        this.mesh = model;
        this.group.add(model);
        this.isLoaded = true;
      },
      undefined,
      (err) => {
        console.warn('GLTF load fallback active for', path, 'err:', err);
      }
    );
  }

  /**
   * Update wingtip trail ribbons in world space
   */
  private updateTrails(): void {
    // Left Wingtip World Pos
    this._tempWorldPos.copy(this.leftWingOffset).applyMatrix4(this.group.matrixWorld);
    this.leftTrailPoints.unshift(this._tempWorldPos.clone());
    if (this.leftTrailPoints.length > this.maxTrailPoints) this.leftTrailPoints.pop();

    // Right Wingtip World Pos
    this._tempWorldPos.copy(this.rightWingOffset).applyMatrix4(this.group.matrixWorld);
    this.rightTrailPoints.unshift(this._tempWorldPos.clone());
    if (this.rightTrailPoints.length > this.maxTrailPoints) this.rightTrailPoints.pop();

    // Update left buffer
    const leftPosAttr = this.leftTrailLine.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.maxTrailPoints; i++) {
      const pt = this.leftTrailPoints[i] || (this.leftTrailPoints[0] || this.group.position);
      leftPosAttr.setXYZ(i, pt.x, pt.y, pt.z);
    }
    leftPosAttr.needsUpdate = true;

    // Update right buffer
    const rightPosAttr = this.rightTrailLine.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.maxTrailPoints; i++) {
      const pt = this.rightTrailPoints[i] || (this.rightTrailPoints[0] || this.group.position);
      rightPosAttr.setXYZ(i, pt.x, pt.y, pt.z);
    }
    rightPosAttr.needsUpdate = true;
  }

  public update(pos: THREE.Vector3, quat: THREE.Quaternion, speed: number, isNight: boolean): void {
    this.group.position.copy(pos);
    this.group.quaternion.copy(quat);
    this.group.updateMatrixWorld();

    const baseColor = isNight ? 0x9cb8ff : this.trailColorHex;
    this.thrusterLight.color.setHex(baseColor);
    this.thrusterLight.intensity = 2.2 + (speed / 100.0) * 5.0;

    // Supersonic realistic afterburner animation (smooth aerodynamic breathing, zero jitter)
    const t = performance.now() * 0.001;
    const breathing = 1.0 + Math.sin(t * 3.5) * 0.025 + Math.cos(t * 7.0) * 0.015;
    const speedRatio = Math.min(1.0, Math.max(0.0, speed / 110.0));
    const lengthScale = (0.55 + speedRatio * 1.65) * breathing;
    const widthScale = (0.75 + speedRatio * 0.45) * breathing;

    if (this.coreFlame && this.outerFlame) {
      this.coreFlame.scale.set(widthScale, widthScale, lengthScale);
      this.outerFlame.scale.set(widthScale * 1.15, widthScale * 1.15, lengthScale * 1.25);
    }

    // Mach diamonds positioned dynamically along the stretched core
    const outerHeight = 2.6;
    this.machDiamonds.forEach((d, i) => {
      const baseRatio = (d.userData as { baseRatio: number })?.baseRatio ?? (0.2 + i * 0.2);
      const targetZ = outerHeight * baseRatio * lengthScale;
      d.position.z = targetZ;

      const pulse = 0.9 + Math.sin(t * 4.0 + i * 1.3) * 0.1;
      d.scale.set(pulse * widthScale, pulse * widthScale, pulse * widthScale * 1.2);
    });

    // Update ribbon trails
    this.updateTrails();
  }
}
