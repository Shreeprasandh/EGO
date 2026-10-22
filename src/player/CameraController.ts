import * as THREE from 'three';
import { CameraMode } from '../types/game';
import { CAMERA_CONSTANTS } from '../utils/constants';

const _targetCamPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _upVector = new THREE.Vector3(0, 1, 0);

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = 'mid_chase';

  private modes: CameraMode[] = ['nose', 'cockpit', 'close_chase', 'mid_chase', 'far_chase'];
  private currentModeIndex = 3; // default 'mid_chase'

  // Smooth interpolation tracking
  private currentPos = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();
  private headBobTimer = 0.0;
  private trauma = 0.0;

  constructor(fov = CAMERA_CONSTANTS.FOV_MIN, aspect = window.innerWidth / window.innerHeight) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 4000.0);
    this.currentPos.set(0, 10, 20);
    this.camera.position.copy(this.currentPos);
  }

  public toggleMode(): void {
    this.currentModeIndex = (this.currentModeIndex + 1) % this.modes.length;
    this.mode = this.modes[this.currentModeIndex];
  }

  public setMode(mode: CameraMode): void {
    this.mode = mode;
    this.currentModeIndex = Math.max(0, this.modes.indexOf(mode));
  }

  public getModeName(): string {
    switch (this.mode) {
      case 'nose': return 'NOSE BUMPER';
      case 'cockpit': return 'COCKPIT';
      case 'close_chase': return 'CLOSE CHASE';
      case 'mid_chase': return 'MID CHASE';
      case 'far_chase': return 'FAR CHASE';
      default: return 'CHASE';
    }
  }

  /**
   * Trigger cinematic camera shake trauma (e.g. on collision or crash impact)
   */
  public triggerTrauma(amount = 0.8): void {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public update(
    dt: number,
    shipPos: THREE.Vector3,
    shipYaw: number,
    shipPitch: number,
    shipRoll: number,
    speed: number,
    lookDeltaX = 0,
    _lookDeltaY = 0,
    getTerrainHeight?: (x: number, z: number) => number
  ): void {
    // 1. Dynamic Speed-Based FOV Scaling
    const speedRatio = Math.min(1.0, Math.max(0.0, (speed - 30.0) / 80.0));
    let baseFov = CAMERA_CONSTANTS.FOV_MIN;
    if (this.mode === 'nose') baseFov = 75;
    else if (this.mode === 'cockpit') baseFov = 68;
    else if (this.mode === 'far_chase') baseFov = 62;

    const targetFov = baseFov + speedRatio * 18.0;
    this.camera.fov += (targetFov - this.camera.fov) * CAMERA_CONSTANTS.FOV_LERP_FACTOR;
    this.camera.updateProjectionMatrix();

    if (this.mode === 'nose') {
      // 1. Front Nose Bumper View (Skimming asphalt)
      _targetCamPos.set(
        shipPos.x - Math.sin(shipYaw) * 2.2,
        shipPos.y + 0.35 + Math.sin(shipPitch) * 0.4,
        shipPos.z - Math.cos(shipYaw) * 2.2
      );
      this.camera.position.copy(_targetCamPos);

      _lookTarget.set(
        shipPos.x - Math.sin(shipYaw) * 60.0,
        shipPos.y + 0.35 + Math.sin(shipPitch) * 25.0,
        shipPos.z - Math.cos(shipYaw) * 60.0
      );
      const rollAmount = shipRoll * 0.7;
      _upVector.set(Math.sin(-rollAmount), Math.cos(-rollAmount), 0).normalize();
      this.camera.up.copy(_upVector);
      this.camera.lookAt(_lookTarget);

    } else if (this.mode === 'cockpit') {
      // 2. Cockpit First-Person
      this.headBobTimer += dt * (speed * 0.35);
      const bob = Math.sin(this.headBobTimer) * 0.02;

      _targetCamPos.set(
        shipPos.x - Math.sin(shipYaw) * 0.4,
        shipPos.y + 0.85 + bob,
        shipPos.z - Math.cos(shipYaw) * 0.4
      );
      this.camera.position.copy(_targetCamPos);

      _lookTarget.set(
        shipPos.x - Math.sin(shipYaw) * 55.0,
        shipPos.y + 0.85 + Math.sin(shipPitch) * 20.0,
        shipPos.z - Math.cos(shipYaw) * 55.0
      );
      const rollAmount = shipRoll * 0.8;
      _upVector.set(Math.sin(-rollAmount), Math.cos(-rollAmount), 0).normalize();
      this.camera.up.copy(_upVector);
      this.camera.lookAt(_lookTarget);

    } else {
      // 3. 3rd-Person Chase Variants (close_chase, mid_chase, far_chase)
      let armDist = 8.2;
      let armHeight = 2.4;
      let lagLerp = 0.12;

      if (this.mode === 'close_chase') {
        armDist = 5.2;
        armHeight = 1.6;
        lagLerp = 0.22; // Minimal camera drag / tight tracking
      } else if (this.mode === 'far_chase') {
        armDist = 14.5;
        armHeight = 4.2;
        lagLerp = 0.08; // Long cinematic drag
      }

      const totalYaw = shipYaw + lookDeltaX;
      _offset.set(
        Math.sin(totalYaw) * armDist,
        armHeight - Math.sin(shipPitch) * 2.2,
        Math.cos(totalYaw) * armDist
      );

      _targetCamPos.copy(shipPos).add(_offset);

      // Anti-terrain clipping
      if (getTerrainHeight) {
        const groundH = getTerrainHeight(_targetCamPos.x, _targetCamPos.z);
        if (_targetCamPos.y < groundH + 0.8) {
          _targetCamPos.y = groundH + 0.8;
        }
      }

      this.currentPos.lerp(_targetCamPos, lagLerp);
      this.camera.position.copy(this.currentPos);

      _lookTarget.set(
        shipPos.x - Math.sin(shipYaw) * CAMERA_CONSTANTS.LOOK_AHEAD_DISTANCE,
        shipPos.y + 0.75 + Math.sin(shipPitch) * 3.0,
        shipPos.z - Math.cos(shipYaw) * CAMERA_CONSTANTS.LOOK_AHEAD_DISTANCE
      );

      this.currentLookAt.lerp(_lookTarget, 0.18);

      const rollAmount = shipRoll * 0.35;
      _upVector.set(Math.sin(-rollAmount), Math.cos(-rollAmount), 0).normalize();
      this.camera.up.copy(_upVector);
      this.camera.lookAt(this.currentLookAt);
    }

    // 4. Non-linear trauma shake (shake = trauma^2)
    if (this.trauma > 0.001) {
      const intensity = this.trauma * this.trauma;
      const shakeOffset = new THREE.Vector3(
        (Math.random() - 0.5) * 1.6 * intensity,
        (Math.random() - 0.5) * 1.4 * intensity,
        (Math.random() - 0.5) * 1.6 * intensity
      );
      this.camera.position.add(shakeOffset);
      this.trauma = Math.max(0.0, this.trauma - dt * 1.4);
    }
  }

  public handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
