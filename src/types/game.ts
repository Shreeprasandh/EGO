export type CameraMode = 'nose' | 'cockpit' | 'close_chase' | 'mid_chase' | 'far_chase';

export interface FlightTelemetry {
  speed: number;           // Current forward speed in m/s (30 - 120+)
  altitude: number;        // Height above local terrain in meters
  egoMultiplier: number;   // Current active EGO proximity multiplier (1.0 - 50.0+)
  score: number;           // Current cumulative run score
  distance: number;        // Total distance traveled in meters
  nearMissCount: number;   // Total near-miss sparks triggered
  solarFragments: number;  // Currency collected in current run
  isAirborne: boolean;     // Whether ship is in ramp launch / free-fall
  isCrashed: boolean;      // True if hit obstacle
  celestialTime: number;   // 0.0 to 1.0 representing full day/night cycle
  activeBiome: string;     // Current region name
  pitch?: number;          // Craft pitch in radians
  roll?: number;           // Craft bank roll in radians
  heading?: number;        // Craft heading in radians
}

export interface InputState {
  forward: number;         // -1 to 1 (throttle/brake)
  turn: number;            // -1 to 1 (yaw steering)
  lookX: number;           // Mouse/stick yaw delta
  lookY: number;           // Mouse/stick pitch delta
  activatePower: boolean;  // Trigger/space
  toggleCamera: boolean;   // V / Y button
  brake: boolean;          // Left trigger / S key
  boost: boolean;          // Shift / Right trigger
  drift?: boolean;         // Space / Drift key engaged
}

export interface ShipConfig {
  id: string;
  name: string;
  modelPath: string;
  scale: number;
  baseSpeed: number;       // Base cruising speed (m/s)
  maxSpeed: number;        // Max boost speed (m/s)
  acceleration: number;    // Acceleration (m/s^2)
  turnRate: number;        // Angular velocity (rad/s)
  hoverHeight: number;     // Target hover altitude (m)
  collisionRadius: number; // Swept sphere radius (m)
}

export type PowerType = 'boost_burst' | 'ground_shatter' | 'time_warp' | 'shield_bubble' | 'ego_surge';

export interface PowerState {
  type: PowerType;
  duration: number;        // Total duration (s)
  remaining: number;       // Time remaining (s)
  isActive: boolean;
}
