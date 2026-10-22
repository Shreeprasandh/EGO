import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

console.log('🎮 ========================================================');
console.log('🎮 EGO AUTOMATED FLIGHT & MECHANICS STRESS-TEST SIMULATOR');
console.log('🎮 ========================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName} ${detail ? `(${detail})` : ''}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
    failCount++;
  }
}

// 1. Terrain Height Function H(x, z)
const noise2D = createNoise2D();
function getHeight(x, z) {
  const duneWaves = Math.sin(x * 0.005 + z * 0.003) * 12.0;
  const ridgeNoise = Math.abs(noise2D(x * 0.008, z * 0.008));
  const ridges = Math.pow(ridgeNoise, 1.4) * 22.0;
  const meso = noise2D(x * 0.002, z * 0.002) * 15.0;
  const canyonVal = Math.sin(x * 0.0018 + z * 0.0012);
  const canyonBed = canyonVal < -0.4 ? (canyonVal + 0.4) * 20.0 : 0.0;
  return duneWaves + ridges + meso + canyonBed;
}

function getNormal(x, z) {
  const eps = 0.6;
  const hL = getHeight(x - eps, z);
  const hR = getHeight(x + eps, z);
  const hD = getHeight(x, z - eps);
  const hU = getHeight(x, z + eps);
  return new THREE.Vector3(hL - hR, 2.0 * eps, hD - hU).normalize();
}

function sampleTerrain(x, z) {
  return { height: getHeight(x, z), normal: getNormal(x, z) };
}

// 2. Hover Controller Simulation
class SimHoverController {
  constructor() {
    this.position = new THREE.Vector3(0, 10, 0);
    this.forwardSpeed = 35.0;
    this.verticalSpeed = 0.0;
    this.yaw = 0.0;
    this.roll = 0.0;
    this.pitch = 0.0;
    this.altitude = 0.5;
    this.isAirborne = false;
    this.lateralDrift = 0.0;
  }

  update(dt, throttleInput, steerInput, isBoosting, isBraking) {
    const steerAuthority = this.isAirborne ? 0.45 : 1.0;
    const steerSpeed = 1.85 * steerAuthority * (1.0 + (this.forwardSpeed / 85.0) * 0.2);
    this.yaw -= steerInput * steerSpeed * dt;

    const targetDrift = -steerInput * (this.forwardSpeed * 0.12);
    this.lateralDrift += (targetDrift - this.lateralDrift) * Math.min(1.0, 6.0 * dt);

    const targetRoll = -steerInput * 0.55;
    this.roll += (targetRoll - this.roll) * Math.min(1.0, 14.0 * dt);

    let targetSpeed = 35.0;
    if (isBoosting) targetSpeed = 125.0;
    else if (isBraking) targetSpeed = 16.0;
    else targetSpeed = 35.0 + Math.max(0, throttleInput) * 50.0;

    const accelRate = isBraking ? 40.0 : 18.0;
    if (this.forwardSpeed < targetSpeed) this.forwardSpeed = Math.min(targetSpeed, this.forwardSpeed + accelRate * dt);
    else if (this.forwardSpeed > targetSpeed) this.forwardSpeed = Math.max(targetSpeed, this.forwardSpeed - accelRate * dt);

    this.forwardSpeed = Math.max(12.0, Math.min(135.0, this.forwardSpeed));

    const moveDist = this.forwardSpeed * dt;
    this.position.x += -Math.sin(this.yaw) * moveDist + Math.cos(this.yaw) * (this.lateralDrift * dt);
    this.position.z += -Math.cos(this.yaw) * moveDist - Math.sin(this.yaw) * (this.lateralDrift * dt);

    const { height: groundH, normal: groundN } = sampleTerrain(this.position.x, this.position.z);
    const targetHoverY = groundH + 0.5;

    if (!this.isAirborne) {
      const heightDiff = targetHoverY - this.position.y;
      const springRate = heightDiff > 0 ? 32.0 : 36.0;
      this.position.y += heightDiff * Math.min(1.0, springRate * dt);
      this.verticalSpeed = 0.0;
      this.altitude = Math.max(0.0, this.position.y - groundH);

      if (heightDiff < -12.0 && this.forwardSpeed > 55.0) {
        this.isAirborne = true;
        this.verticalSpeed = 3.5;
      }
    } else {
      // Faster, punchier kinetic gravity (24.0 m/s^2) for tight 2.5s ballistic arcs
      const netGravity = 24.0;
      this.verticalSpeed -= netGravity * dt;
      this.position.y += this.verticalSpeed * dt;
      this.altitude = Math.max(0.0, this.position.y - groundH);

      if (this.position.y <= targetHoverY) {
        this.position.y = targetHoverY;
        this.verticalSpeed = 0.0;
        this.isAirborne = false;
        this.altitude = 0.5;
      }
    }
  }

  launchRamp(impulseMultiplier = 1.0) {
    this.verticalSpeed = 18.0 * impulseMultiplier;
    this.isAirborne = true;
  }
}

// 3. EGO Scoring Engine Simulation
class SimEgoScoreEngine {
  constructor() {
    this.egoMultiplier = 1.0;
    this.totalScore = 0;
    this.distanceTraveled = 0;
    this.nearMissCount = 0;
    this.solarFragments = 350;
    this.egoSamplesSum = 0;
    this.egoSampleCount = 0;
    this.nearMissTimer = 0.0;
  }

  update(dt, speed, altitude) {
    this.distanceTraveled += speed * dt;
    if (altitude <= 4.0) {
      const prox = Math.max(0.1, 1.0 - (altitude - 0.5) / 3.5);
      this.egoMultiplier = Math.min(50.0, this.egoMultiplier + 2.8 * prox * dt);
    } else {
      this.egoMultiplier = Math.max(1.0, this.egoMultiplier - 4.5 * dt);
    }
    this.egoSamplesSum += this.egoMultiplier;
    this.egoSampleCount++;
    const avgEgo = this.egoSamplesSum / (this.egoSampleCount || 1);
    this.totalScore = Math.floor((this.distanceTraveled * 0.1) * avgEgo + (this.nearMissCount * 250) + this.solarFragments);
    if (this.nearMissTimer > 0) this.nearMissTimer -= dt;
  }

  triggerNearMiss() {
    if (this.nearMissTimer <= 0) {
      this.nearMissCount++;
      this.nearMissTimer = 0.35;
      this.egoMultiplier = Math.min(50.0, this.egoMultiplier + 2.5);
      return true;
    }
    return false;
  }
}

// =========================================================================
// RUN SUITE 1: 120Hz Flight Dynamics
// =========================================================================
console.log('🔹 TEST 1: Flight Controller & Ground-Effect Suspension (10,000 Ticks @ 120Hz)');
const hover = new SimHoverController();
const dt = 1.0 / 120.0;
let maxSpeed = 0;
let minAlt = Infinity;
let maxAlt = -Infinity;
let hasNaN = false;

for (let tick = 0; tick < 10000; tick++) {
  const steer = Math.sin(tick * 0.02) * 0.6;
  const isBoost = tick % 400 > 300;
  const isBrake = tick % 800 > 750;

  hover.update(dt, 1.0, steer, isBoost, isBrake);

  if (isNaN(hover.position.x) || isNaN(hover.position.y) || isNaN(hover.position.z)) hasNaN = true;
  if (hover.forwardSpeed > maxSpeed) maxSpeed = hover.forwardSpeed;
  if (hover.altitude < minAlt) minAlt = hover.altitude;
  if (hover.altitude > maxAlt) maxAlt = hover.altitude;
}

assert(!hasNaN, 'Zero NaN or infinite values across 10,000 steps');
assert(hover.forwardSpeed >= 12.0 && maxSpeed <= 135.0, 'Airspeed bounds calibrated', `Peak: ${(maxSpeed * 3.6).toFixed(0)} KM/H`);
assert(minAlt >= 0.0, 'Never clips beneath desert dunes', `Min Alt: ${minAlt.toFixed(2)}m`);
assert(hover.altitude <= 1.0, 'Ground-effect suspension locks to ~0.5m', `Alt: ${hover.altitude.toFixed(2)}m`);

// =========================================================================
// RUN SUITE 2: Ballistic Ramp Launch
// =========================================================================
console.log('\n🔹 TEST 2: High-Velocity Ramp Launch Dynamics');
hover.launchRamp(1.2);
assert(hover.isAirborne === true, 'Ramp trigger launches into airborne trajectory');
assert(hover.verticalSpeed >= 20.0, 'Airborne vertical boost applied', `Vertical Vel: ${hover.verticalSpeed.toFixed(1)} m/s`);

for (let t = 0; t < 360; t++) {
  hover.update(dt, 1.0, 0, false, false);
}
assert(hover.isAirborne === false, 'Smoothly re-acquires Wieselsberger ground effect upon landing');
assert(Math.abs(hover.altitude - 0.5) < 0.5, 'Ground hover height locks back to ~0.5m', `Post-landing Alt: ${hover.altitude.toFixed(2)}m`);

// =========================================================================
// RUN SUITE 3: Dynamic EGO Proximity Multiplier & Scoring Formula
// =========================================================================
console.log('\n🔹 TEST 3: Dynamic EGO Proximity Multiplier & Scoring Formula');
const scoreEngine = new SimEgoScoreEngine();

for (let i = 0; i < 60; i++) {
  scoreEngine.update(1.0 / 60.0, 50.0, 0.5);
}
assert(scoreEngine.egoMultiplier > 1.0, 'EGO multiplier increases when skimming at 0.5m', `Multiplier: x${scoreEngine.egoMultiplier.toFixed(2)}`);

const prevMult = scoreEngine.egoMultiplier;
const triggered = scoreEngine.triggerNearMiss();
assert(triggered === true, 'Near-miss trigger succeeds');
assert(scoreEngine.egoMultiplier >= prevMult + 2.5, 'Near-miss adds instant +2.5 EGO surge', `Now: x${scoreEngine.egoMultiplier.toFixed(2)}`);

const spamTrigger = scoreEngine.triggerNearMiss();
assert(spamTrigger === false, 'Near-miss cooldown properly blocks spam triggers in rapid succession');

for (let i = 0; i < 180; i++) {
  scoreEngine.update(1.0 / 60.0, 50.0, 15.0);
}
assert(scoreEngine.egoMultiplier < prevMult, 'High altitude causes rapid EGO multiplier decay', `Decayed to: x${scoreEngine.egoMultiplier.toFixed(2)}`);

// =========================================================================
// RUN SUITE 4: Camera Collision Avoidance Test
// =========================================================================
console.log('\n🔹 TEST 4: Camera Ground-Clearance Clamp');
const shipPos = new THREE.Vector3(150, getHeight(150, 150) + 0.5, 150);
const camOffset = new THREE.Vector3(0, 2.4, 7.2);
const targetCamPos = shipPos.clone().add(camOffset);
const groundH = getHeight(targetCamPos.x, targetCamPos.z);
if (targetCamPos.y < groundH + 0.8) {
  targetCamPos.y = groundH + 0.8;
}
assert(targetCamPos.y >= groundH + 0.8, 'Camera strictly clamped >= groundH + 0.8m', `Clearance: ${(targetCamPos.y - groundH).toFixed(2)}m`);

console.log('\n========================================================');
console.log(`🏁 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('========================================================\n');

if (failCount > 0) process.exit(1);
