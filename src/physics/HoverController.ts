import * as THREE from 'three';
import { PHYSICS_CONSTANTS } from '../utils/constants';

const _surfaceNormal = new THREE.Vector3();

export type TerrainHeightSampler = (x: number, z: number) => { height: number; normal: THREE.Vector3 };

export class HoverController {
  // Kinetic State
  public position = new THREE.Vector3(0, 5, 0);
  public velocity = new THREE.Vector3(0, 0, 0);
  public rotation = new THREE.Euler(0, 0, 0, 'YXZ');
  public quaternion = new THREE.Quaternion();

  // Internal Physics State
  public forwardSpeed = 0.0;
  public verticalSpeed = 0.0;
  public yaw = 0.0;
  public roll = 0.0;
  public pitch = 0.0;
  public altitude = 0.5;
  public isAirborne = false;

  // Smoothing & Inertia
  public lateralDrift = 0.0;
  public isDrifting = false;
  private smoothedSteer = 0.0;

  // Kinetic Crash & Tumble State
  public isCrashing = false;
  public crashTimer = 0.0;
  private crashLinearVel = new THREE.Vector3();
  private crashAngularVel = new THREE.Vector3();

  constructor(initialPosition = new THREE.Vector3(0, 5, 0)) {
    this.position.copy(initialPosition);
    this.forwardSpeed = 0.0;
  }

  /**
   * Initiate dynamic Asphalt 9 / Wipeout kinetic crash tumble
   */
  public triggerCrash(impactNormal?: THREE.Vector3): void {
    if (this.isCrashing) return;
    this.isCrashing = true;
    this.crashTimer = 1.2;
    this.isAirborne = true;

    // Angular tumble impulses (barrel roll + cartwheel pitch)
    const rollDir = Math.random() > 0.5 ? 1 : -1;
    this.crashAngularVel.set(
      (Math.random() - 0.5) * 10.0,           // Pitch cartwheel
      (Math.random() - 0.5) * 8.0,            // Yaw spin
      rollDir * (12.0 + Math.random() * 6.0)  // Violent barrel roll
    );

    // Kinetic velocity launch
    const fwdX = -Math.sin(this.yaw);
    const fwdZ = -Math.cos(this.yaw);
    const speed = Math.max(25.0, this.forwardSpeed);

    this.crashLinearVel.set(
      fwdX * speed * 0.75 + (impactNormal ? impactNormal.x * 12.0 : 0),
      6.0 + Math.random() * 4.0, // Upward kinetic pop
      fwdZ * speed * 0.75 + (impactNormal ? impactNormal.z * 12.0 : 0)
    );
  }

  /**
   * Fixed 120Hz Physics Simulation Step
   */
  public update(
    dt: number,
    throttleInput: number,
    steerInput: number,
    isBoosting: boolean,
    isBraking: boolean,
    sampleTerrain: TerrainHeightSampler,
    isDriftMode = false
  ): void {
    // 0. Handle Full Kinetic Crash Tumble State
    if (this.isCrashing) {
      this.crashTimer -= dt;

      // Angular tumble integration
      this.roll += this.crashAngularVel.z * dt;
      this.pitch += this.crashAngularVel.x * dt;
      this.yaw += this.crashAngularVel.y * dt;
      this.crashAngularVel.multiplyScalar(Math.max(0.0, 1.0 - 1.2 * dt));

      // Linear motion
      this.position.addScaledVector(this.crashLinearVel, dt);
      this.crashLinearVel.x *= Math.max(0.0, 1.0 - 1.4 * dt);
      this.crashLinearVel.z *= Math.max(0.0, 1.0 - 1.4 * dt);
      this.crashLinearVel.y -= 26.0 * dt; // Gravity in tumble

      // Ground bounce & friction
      const { height: groundH } = sampleTerrain(this.position.x, this.position.z);
      if (this.position.y <= groundH + 0.35) {
        this.position.y = groundH + 0.35;
        if (this.crashLinearVel.y < -2.0) {
          this.crashLinearVel.y = -this.crashLinearVel.y * 0.35; // Kinetic rebound
          this.crashAngularVel.x += (Math.random() - 0.5) * 8.0;
        } else {
          this.crashLinearVel.y = 0;
        }
      }

      this.forwardSpeed = Math.hypot(this.crashLinearVel.x, this.crashLinearVel.z);
      this.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
      this.quaternion.setFromEuler(this.rotation);
      return;
    }

    this.isDrifting = isDriftMode;

    // 1. Air vs Ground Steering Authority with smooth analog filter and speed stability
    this.smoothedSteer += (steerInput - this.smoothedSteer) * Math.min(1.0, 14.0 * dt);
    const steerAuthority = this.isAirborne ? 0.65 : 1.0;
    const baseTurn = this.isDrifting ? PHYSICS_CONSTANTS.DRIFT_TURN_RATE : PHYSICS_CONSTANTS.TURN_RATE_BASE;
    // Speed stabilization: slight reduction at ultra-high speed (300+ km/h) prevents twitchiness while preserving responsiveness
    const speedStabilizer = 1.0 / (1.0 + (this.forwardSpeed / PHYSICS_CONSTANTS.SPEED_MAX_NORMAL) * 0.28);
    const steerSpeed = baseTurn * steerAuthority * speedStabilizer;
    const curvedSteer = Math.sign(this.smoothedSteer) * Math.pow(Math.abs(this.smoothedSteer), 1.25);
    this.yaw -= curvedSteer * steerSpeed * dt;

    // 2. Realistic Lateral Drift Inertia
    const driftCoeff = this.isDrifting ? 0.28 : 0.14;
    const targetDrift = -curvedSteer * (this.forwardSpeed * driftCoeff);
    this.lateralDrift += (targetDrift - this.lateralDrift) * Math.min(1.0, (this.isDrifting ? 10.0 : 6.0) * dt);

    // 3. Visual & Kinetic Bank Roll (dynamic banking into turns)
    const bankMultiplier = this.isDrifting ? 1.35 : 1.0;
    const targetRoll = -curvedSteer * PHYSICS_CONSTANTS.MAX_BANK_ANGLE * bankMultiplier;
    this.roll += (targetRoll - this.roll) * Math.min(1.0, PHYSICS_CONSTANTS.BANK_SPRING_STIFFNESS * dt);

    // 4. Forward Speed Dynamics (Throttle / Coast / Brake / Boost)
    let targetSpeed = 0.0;
    let accelRate = PHYSICS_CONSTANTS.ACCELERATION;

    if (isBoosting) {
      targetSpeed = PHYSICS_CONSTANTS.SPEED_MAX_BOOST;
      accelRate = 45.0;
    } else if (isBraking) {
      targetSpeed = 0.0;
      accelRate = PHYSICS_CONSTANTS.BRAKE_DECELERATION;
    } else if (throttleInput > 0.05) {
      targetSpeed = 38.0 + throttleInput * (PHYSICS_CONSTANTS.SPEED_MAX_NORMAL - 38.0);
      accelRate = PHYSICS_CONSTANTS.ACCELERATION;
    } else {
      // Natural aerodynamic coasting deceleration when releasing throttle
      targetSpeed = 0.0;
      accelRate = 12.0;
    }

    if (this.forwardSpeed < targetSpeed) {
      this.forwardSpeed = Math.min(targetSpeed, this.forwardSpeed + accelRate * dt);
    } else if (this.forwardSpeed > targetSpeed) {
      this.forwardSpeed = Math.max(targetSpeed, this.forwardSpeed - accelRate * dt);
    }

    // Clamped speed boundaries
    this.forwardSpeed = Math.max(0.0, Math.min(PHYSICS_CONSTANTS.SPEED_MAX_BOOST + 10.0, this.forwardSpeed));

    // 5. Update Horizontal Position along Heading + Drift
    const moveDist = this.forwardSpeed * dt;
    const headingX = -Math.sin(this.yaw);
    const headingZ = -Math.cos(this.yaw);

    // Lateral right vector
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    this.position.x += headingX * moveDist + rightX * (this.lateralDrift * dt);
    this.position.z += headingZ * moveDist + rightZ * (this.lateralDrift * dt);

    // 6. Sample Terrain & Ground-Effect Suspension
    const { height: groundH, normal: groundN } = sampleTerrain(this.position.x, this.position.z);
    const targetHoverY = groundH + PHYSICS_CONSTANTS.HOVER_HEIGHT_TARGET;

    if (!this.isAirborne) {
      // Ground-Effect Cushion: Eager active suspension with zero relaxation delay
      const heightDiff = targetHoverY - this.position.y;
      
      // Fast, silky smooth following on climbs (32.0) and downhill contours (36.0)
      const springRate = heightDiff > 0 ? 32.0 : 36.0;
      this.position.y += heightDiff * Math.min(1.0, springRate * dt);
      this.verticalSpeed = 0.0;
      this.altitude = Math.max(0.0, this.position.y - groundH);

      // Only enter airborne on true cliff launches or high ramps (>12.0m vertical displacement)
      if (this.position.y - targetHoverY > 12.0) {
        this.isAirborne = true;
      }
    } else {
      // Airborne State: Punchy kinetic gravity with aerodynamic forward lift
      const aeroLift = (this.forwardSpeed / PHYSICS_CONSTANTS.SPEED_MAX_NORMAL) * 4.0;
      const netGravity = Math.max(8.0, PHYSICS_CONSTANTS.GRAVITY - aeroLift);
      
      this.verticalSpeed -= netGravity * dt;
      this.position.y += this.verticalSpeed * dt;
      this.altitude = Math.max(0.0, this.position.y - groundH);

      // Smooth Ground Re-acquisition
      if (this.position.y <= targetHoverY) {
        this.position.y = targetHoverY;
        this.verticalSpeed = 0.0;
        this.isAirborne = false;
        this.altitude = PHYSICS_CONSTANTS.HOVER_HEIGHT_TARGET;
      }
    }

    // 7. Surface Pitch Conformity (dynamic angle on slopes)
    _surfaceNormal.copy(groundN);
    const forwardSlope = Math.sin(this.yaw) * _surfaceNormal.x + Math.cos(this.yaw) * _surfaceNormal.z;
    const targetPitch = this.isAirborne 
      ? Math.max(-0.4, Math.min(0.4, this.verticalSpeed * 0.025)) 
      : -forwardSlope * 0.42;
    this.pitch += (targetPitch - this.pitch) * Math.min(1.0, 10.0 * dt);

    // 8. Rebuild Quaternion Rotation (YXZ order)
    this.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
    this.quaternion.setFromEuler(this.rotation);
  }

  /**
   * Launch craft into high airborne trajectory upon hitting a ramp
   */
  public launchRamp(impulseMultiplier = 1.0): void {
    this.verticalSpeed = PHYSICS_CONSTANTS.RAMP_VERTICAL_BOOST * impulseMultiplier;
    this.isAirborne = true;
  }

  /**
   * Reset craft position and cancel all crash tumbling
   */
  public reset(spawnX: number | THREE.Vector3 = 0, spawnZ = 0, spawnY = 5): void {
    if (spawnX && typeof spawnX === 'object' && 'x' in spawnX && 'y' in spawnX && 'z' in spawnX) {
      this.position.copy(spawnX as THREE.Vector3);
    } else {
      this.position.set(spawnX as number, spawnY, spawnZ);
    }
    this.velocity.set(0, 0, 0);
    this.forwardSpeed = 0.0;
    this.verticalSpeed = 0.0;
    this.yaw = 0.0;
    this.roll = 0.0;
    this.pitch = 0.0;
    this.altitude = 0.5;
    this.isAirborne = false;
    this.lateralDrift = 0.0;
    this.isDrifting = false;
    this.smoothedSteer = 0.0;

    // Reset crash state
    this.isCrashing = false;
    this.crashTimer = 0.0;
    this.crashLinearVel.set(0, 0, 0);
    this.crashAngularVel.set(0, 0, 0);
  }
}
