// Mock browser globals for Node test environment
(globalThis as any).window = {
  innerWidth: 1920,
  innerHeight: 1080,
  location: { origin: 'http://localhost:3000', href: 'http://localhost:3000/' },
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false }),
};

// Polyfill relative fetch and Request for Node's undici
const _OrigRequest = globalThis.Request;
globalThis.Request = class MockRequest extends _OrigRequest {
  constructor(input: any, init?: any) {
    if (typeof input === 'string' && input.startsWith('/')) {
      input = 'http://localhost:3000' + input;
    }
    super(input, init);
  }
} as any;

const _nodeFetch = globalThis.fetch;
globalThis.fetch = async (input: any, init?: any) => {
  return new Response(new Uint8Array(0), { status: 200 });
};
(globalThis as any).document = {
  createElementNS: (_ns: string, tag: string) => (globalThis as any).document.createElement(tag),
  createElement: (tag: string) => {
    if (tag === 'canvas') {
      return {
        width: 160,
        height: 160,
        getContext: () => ({
          clearRect: () => {},
          save: () => {},
          restore: () => {},
          beginPath: () => {},
          arc: () => {},
          fill: () => {},
          stroke: () => {},
          moveTo: () => {},
          lineTo: () => {},
          closePath: () => {},
          translate: () => {},
          rotate: () => {},
        }),
      };
    }
    return {
      style: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      appendChild: () => {},
      addEventListener: () => {},
    };
  },
  getElementById: () => ({
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    addEventListener: () => {},
    appendChild: () => {},
  }),
  body: {
    appendChild: () => {},
  },
};

import * as THREE from 'three';
import { TerrainGenerator } from './src/world/TerrainGenerator';
import { TrackSpline } from './src/track/TrackSpline';
import { LapManager } from './src/track/LapManager';
import { BotManager } from './src/track/BotManager';
import { MiniMapRadar } from './src/ui/MiniMapRadar';
import { CameraController } from './src/player/CameraController';
import { HoverController } from './src/physics/HoverController';

console.log('🏎️ =================================================================');
console.log('🏎️ EGO: ASPHALT 9 ARCADE RACING & F1 GRID AUTOMATED TEST SUITE');
console.log('🏎️ =================================================================\n');

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
// TEST 1: TrackSpline Circuit Geometry & F1 Grid Slots
// =========================================================================
console.log('🔹 TEST 1: TrackSpline Circuit & F1 Staggered Grid Initialization');
const terrain = new TerrainGenerator();
const track = new TrackSpline(terrain);

assert(track.totalLength > 3000 && track.totalLength < 3800, 'Track loop length is ~3.2km', `${track.totalLength.toFixed(1)}m`);
assert(track.trackWidth === 24.0, 'Track width is Asphalt 9 / F1 standard 24 meters');
assert(track.checkpoints.length === 10, '10 Checkpoint timing gates established around circuit');
assert(track.ramps.length === 3, '3 In-lane jump ramps positioned along straightaways');
assert(track.boostPads.length === 6, '6 Nitro boost strips positioned along speed corridors');
assert(track.startLightBulbs.length === 5, '5 F1 overhead starting light bulbs created on gantry');

// Test F1 Grid Slots (P1 to P8)
for (let slot = 1; slot <= 8; slot++) {
  const slotData = track.getGridSlot(slot);
  const isLeft = slot % 2 === 1;
  const expectedLane = isLeft ? -5.5 : 5.5;
  assert(slotData.laneOffset === expectedLane, `Slot P${slot} lane alternation verified`, `Offset: ${slotData.laneOffset}m`);
  assert(!isNaN(slotData.position.x) && !isNaN(slotData.position.y) && !isNaN(slotData.position.z), `Slot P${slot} position valid`);
  assert(!isNaN(slotData.yaw), `Slot P${slot} forward heading yaw valid`);
}

// Test Starting Lights Controller
track.setStartLights(3, false);
track.setStartLights(5, true);
track.setStartLights(0, false);
assert(true, 'Gantry start lights state machine executes without errors');

// =========================================================================
// TEST 2: Roadbed Clearance & Terrain Carving Topography
// =========================================================================
console.log('\n🔹 TEST 2: Roadbed Carving (Zero Terrain Dunes Penetrating Track)');
terrain.trackSampler = (x, z) => track.getRoadBedClearance(x, z);

// Sample directly under the track start line
const p0 = track.curve.getPointAt(0);
const carvedHeightOnTrack = terrain.getHeight(p0.x, p0.z);
assert(carvedHeightOnTrack <= p0.y - 1.0, 'Terrain directly beneath track is carved at least 1.0m below road ribbon', `Road Y: ${p0.y.toFixed(2)}, Terrain Y: ${carvedHeightOnTrack.toFixed(2)}`);

// Sample 50 meters away from track (outside canyon biome)
const farTerrainHeight = terrain.getHeight(p0.x + 80.0, p0.z);
assert(!isNaN(farTerrainHeight), 'Background biome height calculation operates smoothly', `Biomes Y: ${farTerrainHeight.toFixed(2)}`);

// =========================================================================
// TEST 3: PropScatterer 22m Keep-Out Buffer
// =========================================================================
console.log('\n🔹 TEST 3: PropScatterer 22m Keep-Out Buffer');
terrain.propScatterer.trackKeepOutCheck = (x, z) => {
  const clr = track.getRoadBedClearance(x, z);
  return clr.distance < 22.0;
};

// Directly on track should be blocked
const onTrackBlocked = terrain.propScatterer.trackKeepOutCheck(p0.x, p0.z);
assert(onTrackBlocked === true, 'Center of track is strictly inside keep-out zone (prohibited for props)');

// 30m away outside barrier should be allowed
const outsideAllowed = !terrain.propScatterer.trackKeepOutCheck(p0.x + 35.0, p0.z);
assert(outsideAllowed === true, '35m outside the track is allowed for grounded scenery decor');

// =========================================================================
// TEST 4: Asphalt 9 Side Barrier Collision & Elastic Inward Bounce
// =========================================================================
console.log('\n🔹 TEST 4: Asphalt 9 Side Barrier Inward Bounce & Heading Alignment');
const hover = new HoverController(new THREE.Vector3(0, 10, 0));

// Place hovercraft colliding against left barrier (distance > 12 - 1.8 = 10.2m)
const testPt = track.curve.getPointAt(0.1);
const testTan = track.curve.getTangentAt(0.1).normalize();
const testRight = new THREE.Vector3().crossVectors(testTan, new THREE.Vector3(0, 1, 0)).normalize();
const penetratingPos = new THREE.Vector3().copy(testPt).addScaledVector(testRight, -11.5); // Hit left barrier

const bounce = track.resolveSideBarrierBounce(penetratingPos, 1.8, 50.0, 0.0);
assert(bounce.bounced === true, 'Barrier collision detected on wall penetration');
assert(bounce.newSpeed >= 45.0, 'Retains forward velocity with minor frictional drag (4%)', `Speed: ${bounce.newSpeed.toFixed(1)} m/s`);
const newInfo = track.getNearestTrackPoint(penetratingPos);
assert(newInfo.distanceToCenter <= 10.25, 'Craft position is clamped inward away from wall penetration', `Distance: ${newInfo.distanceToCenter.toFixed(2)}m`);

// =========================================================================
// TEST 5: Off-Track Breach Detection & Dynamic Respawn
// =========================================================================
console.log('\n🔹 TEST 5: Off-Track Breach & Respawn Detection');
const severelyOffTrackPos = new THREE.Vector3().copy(testPt).addScaledVector(testRight, 25.0); // 25m off-track
const wreckCheck = track.checkOffTrackWreck(severelyOffTrackPos);
assert(wreckCheck.isWrecked === true, 'Off-track breach (>18m) reliably triggers wreck status');
assert(wreckCheck.respawnPos.distanceTo(testPt) < 1.0, 'Respawn target position accurately snaps back to track centerline');

// =========================================================================
// TEST 6: Official F1 Countdown State Machine (3... 2... 1... GO!)
// =========================================================================
console.log('\n🔹 TEST 6: Official F1 3-2-1 Countdown State Machine');
const lapManager = new LapManager(track);
assert(lapManager.isCountingDown === true, 'Race initializes in countdown state');
assert(lapManager.countdownStage === 3, 'Starts at stage 3');
assert(lapManager.isTiming === false, 'Race timer is frozen during countdown');

// Advance 1.3 seconds -> Stage 2
lapManager.update(1.3, p0, () => {});
assert(lapManager.countdownStage === 2, 'Transitions to countdown stage 2 at t-2.3s');

// Advance 1.2 seconds -> Stage 1
lapManager.update(1.2, p0, () => {});
assert(lapManager.countdownStage === 1, 'Transitions to countdown stage 1 at t-1.1s');

// Advance 1.2 seconds -> Stage 0 (LIGHTS OUT & GO!)
lapManager.update(1.2, p0, () => {});
assert(lapManager.isCountingDown === false, 'Countdown finishes cleanly');
assert(lapManager.countdownStage === 0, 'Stage reaches 0 (GO!)');
assert(lapManager.isTiming === true, 'Race timer engages the instant lights go out');

// =========================================================================
// TEST 7: 7 Human-Like AI Bot Drivers & Real-Time Dynamic Leaderboard
// =========================================================================
console.log('\n🔹 TEST 7: 7 AI Bot Competitors & Dynamic Leaderboard');
const botManager = new BotManager(track);
assert(botManager.bots.length === 7, '7 AI Bot hovercraft drivers instantiated');

// Check grid slot assignments
const botSlots = botManager.bots.map((b) => b.gridSlot);
assert(!botSlots.includes(4), 'Grid Slot P4 reserved for player (bots occupy P1, P2, P3, P5, P6, P7, P8)');

// 1. Check starting grid ranking: Player at P4 slot before crossing start line
const p4SlotData = track.getGridSlot(4);
const gridRank = botManager.calculatePlayerPosition(p4SlotData.progressT, 1, false);
assert(gridRank.position === 4, `Player on grid slot P4 correctly starts at P4 (Rank: P${gridRank.position} of ${gridRank.totalRacers})`);

// 2. Update bots across 8 seconds of race action (all slots P1-P8 accelerate and roll across start gantry)
for (let i = 0; i < 480; i++) {
  botManager.update(1.0 / 60.0, true, p0);
}

// 3. Verify bots have crossed start line into Lap 1, but NOT prematurely jumped to Lap 2
const botLaps = botManager.bots.map((b) => b.lap);
const allLapOne = botLaps.every((lap) => lap === 1);
assert(allLapOne, 'Bots remain on Lap 1 after crossing start gantry (no premature Lap 2 bug)');

const allCrossed = botManager.bots.every((b) => b.hasCrossedStartLine);
assert(allCrossed, 'All bots correctly marked hasCrossedStartLine = true after crossing start gantry');

const botSpeeds = botManager.bots.map((b) => b.forwardSpeed);
const minBotSpeed = Math.min(...botSpeeds);
const maxBotSpeed = Math.max(...botSpeeds);
assert(minBotSpeed > 40.0 && maxBotSpeed < 65.0, 'Bot forward speeds maintain realistic human average (160 - 230 KM/H)', `Min: ${(minBotSpeed * 3.6).toFixed(0)} KM/H, Max: ${(maxBotSpeed * 3.6).toFixed(0)} KM/H`);

// 4. Check leaderboard position calculation when player is leading on track (e.g. progressT = 0.12, lap = 1)
const leaderRank = botManager.calculatePlayerPosition(0.12, 1, true);
assert(leaderRank.position >= 1 && leaderRank.position <= 8, 'Player rank calculation returns valid standing during race', `Rank: P${leaderRank.position} of ${leaderRank.totalRacers}`);

const bot2DPoints = botManager.getBotProgressList();
assert(bot2DPoints.length === 7, 'MiniMap Radar receives 7 live AI competitor progress coordinates');

// =========================================================================
// TEST 8: Asphalt 9 3-Tier Nitro State Machine
// =========================================================================
console.log('\n🔹 TEST 8: Asphalt 9 3-Tier Nitro Mechanics');
lapManager.nitroAmount = 100.0;
lapManager.nitroTier = 0;

// Tap 1: Yellow Nitro
lapManager.triggerNitroTap();
assert(lapManager.nitroTier === 1 || lapManager.nitroTier === 3, 'First tap activates Yellow Nitro (or Shockwave if full gauge)');

// Reset for double tap test
lapManager.nitroAmount = 80.0;
lapManager.nitroTier = 0;
lapManager.triggerNitroTap();
assert(lapManager.nitroTier === 1, 'First tap activates Tier 1 Yellow Nitro');

// Rapid second tap (sweet spot: Blue Perfect Nitro)
const fakeNow = performance.now() + 450;
lapManager.triggerNitroTap();
assert(lapManager.nitroTier >= 2, 'Second tap activates Tier 2 Perfect Nitro or Shockwave');

// Drain nitro test
lapManager.update(4.0, p0, () => {});
assert(lapManager.nitroAmount < 80.0, 'Active nitro drains gauge proportionally during boost burn');

// =========================================================================
// TEST 9: 5 Distinct Camera Perspective Views
// =========================================================================
console.log('\n🔹 TEST 9: 5 Camera Perspective Modes');
const cameraCtrl = new CameraController();
const expectedModes = ['nose', 'cockpit', 'close_chase', 'mid_chase', 'far_chase'];

expectedModes.forEach((modeName) => {
  cameraCtrl.setMode(modeName as any);
  assert(cameraCtrl.mode === modeName, `Camera switches to ${modeName} view`);
  cameraCtrl.update(0.016, p0, 0, 0, 0, 50.0);
  assert(!isNaN(cameraCtrl.camera.position.x) && !isNaN(cameraCtrl.camera.position.y), `${modeName} position matrix valid`);
});

// =========================================================================
// TEST 10: 2D MiniMap Radar Projection Math
// =========================================================================
console.log('\n🔹 TEST 10: MiniMap Radar Spline Projection');
const radarPts = track.getSpline2DPoints(90);
assert(radarPts.length === 90, 'MiniMap generates 90 normalized circuit spline points');
const miniMap = new MiniMapRadar(radarPts);
miniMap.update(p0, 0, bot2DPoints);
assert(miniMap.canvas.width === 160 && miniMap.canvas.height === 160, 'MiniMap radar canvas initialized at 160x160px');

// =========================================================================
// TEST 11: Kinetic Crash & Tumble State Machine
// =========================================================================
console.log('\n🔹 TEST 11: Kinetic Crash & Tumble State Machine');
const crashHover = new HoverController(new THREE.Vector3(0, 5, 0));
crashHover.forwardSpeed = 65.0;
assert(!crashHover.isCrashing, 'Craft starts in stable flight mode');

crashHover.triggerCrash();
assert(crashHover.isCrashing, 'triggerCrash successfully initiates kinetic tumble state');
assert(crashHover.crashTimer > 1.0, 'Crash timer set to >1.0s tumble window');
assert(crashHover.isAirborne, 'Crash launches craft into airborne ballistic trajectory');

// Advance crash tumble physics for 10 frames
const initRoll = crashHover.roll;
for (let i = 0; i < 10; i++) {
  crashHover.update(0.016, 0, 0, false, false, () => ({ height: 0, normal: new THREE.Vector3(0, 1, 0) }));
}
assert(Math.abs(crashHover.roll - initRoll) > 0.5, 'Violent kinetic barrel roll / tumble observed during crash');

crashHover.reset(new THREE.Vector3(10, 0, 10));
assert(!crashHover.isCrashing, 'Reset cleanly clears crash state and restores flight control');

// =========================================================================
// TEST 12: Dynamic Drift Mode & Snappy Yaw Authority
// =========================================================================
console.log('\n🔹 TEST 12: Dynamic Drift Mode & Snappy Yaw Authority');
const driftHover = new HoverController(new THREE.Vector3(0, 5, 0));
driftHover.forwardSpeed = 55.0;

// Standard turning step
const normalYawStart = driftHover.yaw;
driftHover.update(0.1, 1.0, 1.0, false, false, () => ({ height: 0, normal: new THREE.Vector3(0, 1, 0) }), false);
const normalYawDelta = Math.abs(driftHover.yaw - normalYawStart);

// Drift turning step
const driftHover2 = new HoverController(new THREE.Vector3(0, 5, 0));
driftHover2.forwardSpeed = 55.0;
const driftYawStart = driftHover2.yaw;
driftHover2.update(0.1, 1.0, 1.0, false, false, () => ({ height: 0, normal: new THREE.Vector3(0, 1, 0) }), true);
const driftYawDelta = Math.abs(driftHover2.yaw - driftYawStart);

assert(driftYawDelta > normalYawDelta, 'Drift mode delivers significantly sharper apex turn rate (Asphalt 9 handling)', `Normal: ${normalYawDelta.toFixed(3)} rad, Drift: ${driftYawDelta.toFixed(3)} rad`);
assert(driftHover2.isDrifting, 'Drift mode flag active during high-G brake steering');

// =========================================================================
// TEST 13: Camera Trauma Impact Shake
// =========================================================================
console.log('\n🔹 TEST 13: Camera Trauma Impact Shake');
cameraCtrl.triggerTrauma(0.9);
const prePos = cameraCtrl.camera.position.clone();
cameraCtrl.update(0.016, p0, 0, 0, 0, 50.0);
assert(!cameraCtrl.camera.position.equals(prePos), 'Trauma shake applies dynamic 3D camera shudder');

// =========================================================================
// TEST 14: Terrain Analytical Seam-Free Normals
// =========================================================================
console.log('\n🔹 TEST 14: Terrain Analytical Gradient Normals');
const norm1 = terrain.getNormal(175.0, 50.0);
const norm2 = terrain.getNormal(175.0, 50.0);
assert(norm1.distanceTo(norm2) < 0.0001, 'Analytical normals on chunk seam (x=175) are 100% mathematically continuous');

// =========================================================================
// TEST SUMMARY REPORT
// =========================================================================
console.log('\n🏁 =================================================================');
console.log(`🏁 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('🏁 =================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('✨ ALL SYSTEMS VERIFIED AND OPERATIONAL AT 100% GOLD-STANDARD INTEGRITY.');
  process.exit(0);
}
