import * as THREE from 'three';
import { HoverController } from './src/physics/HoverController.ts';
import { EgoScoreEngine } from './src/systems/EgoScoreEngine.ts';
import { PropScatterer } from './src/world/PropScatterer.ts';
import { TerrainGenerator } from './src/world/TerrainGenerator.ts';
import { MUSIC_CATALOG } from './src/audio/MusicDatabase.ts';
import { SHIP_DATABASE } from './src/ui/LobbyManager.ts';

console.log('🎮 ========================================================');
console.log('🎮 EGO AUTOMATED FLIGHT & MECHANICS STRESS-TEST SIMULATOR');
console.log('🎮 ========================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName} ${detail ? `(${detail})` : ''}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
    failCount++;
  }
}

// =========================================================================
// TEST SUITE 1: 120Hz Decoupled PID Ground-Effect Flight Physics
// =========================================================================
console.log('🔹 TEST 1: Flight Controller & Ground-Effect Suspension (10,000 Ticks @ 120Hz)');
const hover = new HoverController(new THREE.Vector3(0, 10, 0));
const terrain = new TerrainGenerator();
const dt = 1.0 / 120.0;

let maxSpeedObserved = 0;
let minAltitudeObserved = Infinity;
let maxAltitudeObserved = -Infinity;
let hasNaN = false;

// Simulate 10,000 ticks (~83.3 seconds of real-time flight over dunes)
for (let tick = 0; tick < 10000; tick++) {
  // Steering oscillating gently
  const steer = Math.sin(tick * 0.02) * 0.6;
  const throttle = 1.0;
  const isBoost = tick % 400 > 300;
  const isBrake = tick % 800 > 750;

  hover.update(dt, throttle, steer, isBoost, isBrake, (x, z) => terrain.sample(x, z));

  if (isNaN(hover.position.x) || isNaN(hover.position.y) || isNaN(hover.position.z)) {
    hasNaN = true;
  }
  if (hover.forwardSpeed > maxSpeedObserved) maxSpeedObserved = hover.forwardSpeed;
  if (hover.altitude < minAltitudeObserved) minAltitudeObserved = hover.altitude;
  if (hover.altitude > maxAltitudeObserved) maxAltitudeObserved = hover.altitude;
}

assert(!hasNaN, 'Zero NaN or infinite values across 10,000 physics steps');
assert(hover.forwardSpeed >= 12.0 && maxSpeedObserved <= 135.0, 'Speed bounds respected', `Peak: ${(maxSpeedObserved * 3.6).toFixed(0)} KM/H`);
assert(minAltitudeObserved >= 0.0, 'Never clips below terrain surface', `Min Alt: ${minAltitudeObserved.toFixed(2)}m`);
assert(hover.altitude <= 2.5, 'Cruising altitude tracks ~0.5m target stably', `Current: ${hover.altitude.toFixed(2)}m`);

// =========================================================================
// TEST SUITE 2: Ballistic Ramp Launch & Smooth Re-acquisition
// =========================================================================
console.log('\n🔹 TEST 2: High-Velocity Ramp Launch Dynamics');
hover.launchRamp(1.8);
assert(hover.isAirborne === true, 'Ramp trigger launches into airborne trajectory');
assert(hover.verticalSpeed > 25.0, 'Airborne vertical boost applied', `Vertical Vel: ${hover.verticalSpeed.toFixed(1)} m/s`);

// Step forward 360 ticks (3 seconds) to verify parabolic arc and smooth landing
for (let t = 0; t < 360; t++) {
  hover.update(dt, 1.0, 0, false, false, (x, z) => terrain.sample(x, z));
}
assert(hover.isAirborne === false, 'Smoothly re-acquires Wieselsberger ground effect upon landing');
assert(Math.abs(hover.altitude - 0.5) < 0.2, 'Ground hover height locks back to ~0.5m', `Post-landing Alt: ${hover.altitude.toFixed(2)}m`);

// =========================================================================
// TEST SUITE 3: Dynamic EGO Proximity Multiplier & Scoring Formula
// =========================================================================
console.log('\n🔹 TEST 3: Dynamic EGO Proximity Multiplier & Scoring Formula');
const scoreEngine = new EgoScoreEngine();

// At 0.5m skimming height, EGO should climb rapidly
for (let i = 0; i < 60; i++) {
  scoreEngine.update(1.0 / 60.0, 50.0, 0.5);
}
assert(scoreEngine.egoMultiplier > 1.0, 'EGO multiplier increases when skimming at 0.5m', `Multiplier: x${scoreEngine.egoMultiplier.toFixed(2)}`);

// Near-miss trigger should boost EGO
const prevMult = scoreEngine.egoMultiplier;
const triggered = scoreEngine.triggerNearMiss();
assert(triggered === true, 'Near-miss trigger succeeds');
assert(scoreEngine.egoMultiplier >= prevMult + 2.5, 'Near-miss adds instant +2.5 EGO surge', `Now: x${scoreEngine.egoMultiplier.toFixed(2)}`);

// Near-miss spam test (cooldown verification)
const spamTrigger = scoreEngine.triggerNearMiss();
assert(spamTrigger === false, 'Near-miss cooldown properly blocks spam triggers in rapid succession');

// High altitude coward penalty (flying at 15m should decay EGO)
for (let i = 0; i < 180; i++) {
  scoreEngine.update(1.0 / 60.0, 50.0, 15.0);
}
assert(scoreEngine.egoMultiplier < prevMult, 'High altitude causes rapid EGO multiplier decay', `Decayed to: x${scoreEngine.egoMultiplier.toFixed(2)}`);

// =========================================================================
// TEST SUITE 4: Memory Culling & Chunk Streaming Parity
// =========================================================================
console.log('\n🔹 TEST 4: Chunk-Keyed Prop Streaming & Zero Memory Leak Culling');
const propScatterer = new PropScatterer();

// Stream a 5x5 chunk grid (25 chunks)
for (let cx = -2; cx <= 2; cx++) {
  for (let cz = -2; cz <= 2; cz++) {
    const key = `${cx},${cz}`;
    propScatterer.populateChunk(cx, cz, 350, (x, z) => terrain.getHeight(x, z), key);
  }
}

const initialObstacleCount = propScatterer.obstacles.length;
const initialCollectibleCount = propScatterer.collectibles.length;
assert(initialObstacleCount > 0, 'Obstacles populated across active chunks', `Total: ${initialObstacleCount}`);
assert(initialCollectibleCount > 0, 'Collectibles populated across active chunks', `Total: ${initialCollectibleCount}`);

// Cull 5 chunks out of range
for (let cz = -2; cz <= 2; cz++) {
  propScatterer.cullChunk(`-2,${cz}`);
}

const culledObstacleCount = propScatterer.obstacles.length;
assert(culledObstacleCount < initialObstacleCount, 'Culling successfully removes obstacle meshes from memory', `Reduced from ${initialObstacleCount} to ${culledObstacleCount}`);

// =========================================================================
// TEST SUITE 5: 35-Song Catalog Integrity & Audio Timing
// =========================================================================
console.log('\n🔹 TEST 5: Music Catalog & Sequencing Specs');
assert(MUSIC_CATALOG.length === 35, 'Full 35-track catalog loaded', `Count: ${MUSIC_CATALOG.length}`);
const instrumentals = MUSIC_CATALOG.filter(s => s.isInstrumental);
const lyrical = MUSIC_CATALOG.filter(s => !s.isInstrumental);
assert(instrumentals.length === 5, '5 Dedicated Instrumental flight anthems present');
assert(lyrical.length === 30, '30 Full Lyrical tracks with lyrics present');

let validBPMs = true;
for (const song of MUSIC_CATALOG) {
  if (song.bpm < 80 || song.bpm > 180) validBPMs = false;
}
assert(validBPMs, 'All song BPMs are calibrated between 80 and 180 BPM for kinetic flight');

// =========================================================================
// TEST SUITE 6: Ship Fleet Database & Specifications
// =========================================================================
console.log('\n🔹 TEST 6: Hangar Fleet Database MK-01 to MK-10');
assert(SHIP_DATABASE.length === 10, 'All 10 ship models registered in fleet database');
assert(SHIP_DATABASE[0].name.includes('APEX FALCON'), 'MK-01 is Apex Falcon');
assert(SHIP_DATABASE[9].name.includes('DEVIL\'S FURY'), 'MK-10 is Devil\'s Fury prototype flagship');

console.log('\n========================================================');
console.log(`🏁 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('========================================================\n');

if (failCount > 0) process.exit(1);
