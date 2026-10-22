export const PHYSICS_CONSTANTS = {
  // Ground-effect PID Controller
  HOVER_HEIGHT_TARGET: 1.1,     // meters above terrain surface (clean visual clearance)
  PID_KP: 150.0,                // Proportional spring constant
  PID_KI: 0.0,                  // Integral constant
  PID_KD: 35.0,                 // Derivative damping constant
  
  // Speed & Movement
  SPEED_BASE: 35.0,             // Cruising speed (m/s) ~126 km/h
  SPEED_MAX_NORMAL: 85.0,       // High EGO max speed (m/s) ~306 km/h
  SPEED_MAX_BOOST: 125.0,       // Boost burst max speed (m/s) ~450 km/h
  ACCELERATION: 18.0,           // Base acceleration (m/s^2)
  BRAKE_DECELERATION: 40.0,     // Hard brake deceleration (m/s^2)
  
  // Banking & Turning
  TURN_RATE_BASE: 1.80,         // Smooth progressive yaw turn rate (rad/s)
  DRIFT_TURN_RATE: 2.65,        // Snappy apex drift turn rate (rad/s)
  MAX_BANK_ANGLE: 0.65,         // Dynamic visual roll tilt (~37 degrees)
  BANK_SPRING_STIFFNESS: 18.0,  // Crisp roll return spring speed
  
  // Nitro Dynamics
  NITRO_CRYSTAL_REFILL: 35.0,   // Percentage filled on catching 3D nitro crystal
  NITRO_BOOST_DRAIN_RATE: 22.0, // Percentage drained per second during active boost
  NITRO_SURGE_SPEED: 130.0,     // Peak nitro surge speed (m/s) ~468 km/h
  
  // Gravity & Ramp Launches
  GRAVITY: 22.0,                // Kinetic racing gravity for responsive, punchy ballistic jumps (m/s^2)
  RAMP_VERTICAL_BOOST: 17.5,    // Vertical impulse on ramp hit (m/s)
  AIR_DRAG: 0.02,               // Airborne aerodynamic drag
  
  // Collision & Proximity
  COLLISION_RADIUS: 1.1,        // Swept sphere radius (m)
  NEAR_MISS_RADIUS: 2.5,        // Near-miss spark detection threshold (m)
  NEAR_MISS_COOLDOWN: 0.35,     // Minimum time between sparks (s)
  
  // Fixed Physics Loop
  FIXED_TIME_STEP: 1.0 / 120.0, // 120Hz physics simulation tick
  MAX_SUB_STEPS: 4,
};

export const SCORING_COEFFICIENTS = {
  K1_DISTANCE: 0.1,
  K2_REGIONS: 5000.0,
  K3_NEAR_MISS: 250.0,
  K4_CURRENCY: 1.0,
  
  // EGO Multiplier Bounds
  EGO_MIN: 1.0,
  EGO_MAX: 50.0,
  EGO_ALTITUDE_THRESHOLD: 4.0,  // Above this altitude, EGO decays
  EGO_GROWTH_RATE: 2.8,         // Multiplier growth per second at 0.5m
  EGO_DECAY_RATE: 4.5,          // Multiplier decay per second in high air
};

export const CAMERA_CONSTANTS = {
  // 3rd Person Spring-Arm
  ARM_DISTANCE: 7.2,            // Distance behind craft (m)
  ARM_HEIGHT: 2.4,              // Height above craft (m)
  LOOK_AHEAD_DISTANCE: 14.0,    // Target focus ahead of craft (m)
  LAG_LERP_FACTOR: 0.085,       // Smooth camera position damping
  
  // Dynamic FOV
  FOV_MIN: 65.0,                // Idle / low speed FOV
  FOV_MAX: 88.0,                // High speed / boost FOV
  FOV_LERP_FACTOR: 0.05,
  
  // 1st Person Cockpit
  COCKPIT_OFFSET_Y: 0.35,
  COCKPIT_OFFSET_Z: -0.2,
  COCKPIT_FOV: 84.0,
};

export const CELESTIAL_CONSTANTS = {
  CYCLE_DURATION_SECONDS: 600.0, // 10 minutes per full day/night cycle
  SUN_ORBIT_RADIUS: 1000.0,
  COLOR_DAYLIGHT: 0xfff2d4,     // Warm 5500K sunlight
  COLOR_SUNSET: 0xff7b24,       // Deep amber golden hour
  COLOR_MOONLIGHT: 0x9cb8ff,    // Silver-blue lunar light
  COLOR_NIGHT_AMBIENT: 0x080c18,
};
