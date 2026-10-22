import * as THREE from 'three';
import { TrackSpline } from './TrackSpline';

export interface LapState {
  currentLap: number;
  totalLaps: number;
  currentLapTimeStr: string;
  bestLapTimeStr: string;
  totalRaceTimeStr: string;
  positionStr: string;
  nitroAmount: number;
  nitroTier: number; // 0=off, 1=yellow, 2=blue, 3=shockwave
  isWrecked: boolean;
  isGhost: boolean;
  isFinished: boolean;
  lastCheckpointMessage: string;
  isCountingDown: boolean;
  countdownStage: number; // 3, 2, 1, 0 (0 = GO!)
}

export class LapManager {
  public totalLaps = 3;
  public currentLap = 1;
  public hasCrossedStartLine = false;
  public isFinished = false;

  // Official F1 / Asphalt 9 Starting Grid Countdown
  public isCountingDown = true;
  public countdownTimer = 3.6;
  public countdownStage = 3;

  // Checkpoints
  private nextCheckpoint = 1; // 0 is start/finish, gates are 1..9
  private totalCheckpoints = 10;
  public lastCheckpointMessage = '';
  private checkpointMsgTimer = 0;

  // Timers (seconds)
  public currentLapTime = 0.0;
  public bestLapTime: number | null = null;
  public totalRaceTime = 0.0;
  public isTiming = false;

  // Wreck & Respawn
  public isWrecked = false;
  private wreckTimer = 0.0;
  public isGhost = false;
  private ghostTimer = 0.0;

  // Nitro System (Asphalt 9 3-Tier)
  public nitroAmount = 60.0; // 0 to 100
  public nitroTier = 0;      // 0: Off, 1: Yellow, 2: Blue Perfect, 3: Shockwave
  private lastTapTime = 0;

  // Dynamic Race Position against live AI Bots
  public position = 4; // Starts at P4

  constructor(private track: TrackSpline) {
    this.resetRace();
  }

  public resetRace(): void {
    this.currentLap = 1;
    this.hasCrossedStartLine = false;
    this.isFinished = false;
    this.nextCheckpoint = 1;
    this.currentLapTime = 0.0;
    this.bestLapTime = null;
    this.totalRaceTime = 0.0;
    this.isTiming = false;
    this.isWrecked = false;
    this.wreckTimer = 0.0;
    this.isGhost = false;
    this.ghostTimer = 0.0;
    this.nitroAmount = 65.0;
    this.nitroTier = 0;
    this.position = 4;

    // Start 3-second official countdown sequence
    this.isCountingDown = true;
    this.countdownTimer = 3.6;
    this.countdownStage = 3;
    this.lastCheckpointMessage = '';
    this.checkpointMsgTimer = 0;
  }

  /**
   * Handle Nitro Key Tap (Asphalt 9 Style Tap/Double-Tap Mechanics)
   */
  public triggerNitroTap(): void {
    if (this.isCountingDown || this.isFinished || this.isWrecked) return;

    const now = performance.now();
    const timeSinceLastTap = now - this.lastTapTime;
    this.lastTapTime = now;

    if (this.nitroAmount < 12.0) {
      this.nitroTier = 0;
      return;
    }

    if (this.nitroTier === 0) {
      if (this.nitroAmount >= 95.0) {
        this.nitroTier = 3; // Super Nitro when full charge
        this.lastCheckpointMessage = 'SUPER NITRO ACTIVE';
        this.checkpointMsgTimer = 1.4;
      } else {
        this.nitroTier = 1; // Standard Nitro Boost
        this.lastCheckpointMessage = 'NITRO SURGE ENGAGED';
        this.checkpointMsgTimer = 1.2;
      }
    } else if (this.nitroTier === 1) {
      if (timeSinceLastTap > 200 && timeSinceLastTap < 900) {
        this.nitroTier = 2; // Perfect Nitro
        this.lastCheckpointMessage = 'PERFECT NITRO';
        this.checkpointMsgTimer = 1.4;
      } else {
        this.nitroTier = this.nitroAmount > 40.0 ? 3 : 2;
      }
    } else if (this.nitroTier === 2) {
      if (this.nitroAmount > 25.0) {
        this.nitroTier = 3;
        this.lastCheckpointMessage = 'SUPER NITRO ACTIVE';
        this.checkpointMsgTimer = 1.5;
      } else {
        this.nitroTier = 0;
      }
    } else {
      this.nitroTier = 0;
    }
  }

  public refillNitro(amount: number): void {
    this.nitroAmount = Math.min(100.0, this.nitroAmount + amount);
  }

  /**
   * Update Race Progress, Checkpoints, Laps, Countdown & Nitro
   */
  public update(
    dt: number,
    shipPos: THREE.Vector3,
    onRespawn: (pos: THREE.Vector3, yaw: number) => void,
    livePosition?: number
  ): void {
    if (this.isFinished) return;

    // 1. Official Starting Countdown Sequence (3... 2... 1... GO!)
    if (this.isCountingDown) {
      this.countdownTimer -= dt;
      if (this.countdownTimer > 2.4) {
        this.countdownStage = 3;
      } else if (this.countdownTimer > 1.2) {
        this.countdownStage = 2;
      } else if (this.countdownTimer > 0.0) {
        this.countdownStage = 1;
      } else {
        this.isCountingDown = false;
        this.countdownStage = 0;
        this.isTiming = true;
        this.lastCheckpointMessage = 'LIGHTS OUT & GO!';
        this.checkpointMsgTimer = 1.8;
      }
      return; // Physics & race timer frozen until countdown reaches 0
    }

    if (this.isTiming) {
      this.currentLapTime += dt;
      this.totalRaceTime += dt;
    }

    if (!this.hasCrossedStartLine && (this.nextCheckpoint > 1 || this.currentLap > 1)) {
      this.hasCrossedStartLine = true;
    }

    if (livePosition !== undefined) {
      this.position = livePosition;
    }

    // Checkpoint message fade timer
    if (this.checkpointMsgTimer > 0) {
      this.checkpointMsgTimer -= dt;
      if (this.checkpointMsgTimer <= 0) {
        this.lastCheckpointMessage = '';
      }
    }

    // Ghost timer countdown
    if (this.isGhost) {
      this.ghostTimer -= dt;
      if (this.ghostTimer <= 0) {
        this.isGhost = false;
      }
    }

    // Wreck countdown and respawn
    if (this.isWrecked) {
      this.wreckTimer -= dt;
      if (this.wreckTimer <= 0) {
        this.isWrecked = false;
        this.isGhost = true;
        this.ghostTimer = 2.0;

        const trackPt = this.track.getNearestTrackPoint(shipPos);
        const respawnPos = new THREE.Vector3().copy(trackPt.point);
        respawnPos.y += 0.8;
        const respawnYaw = Math.atan2(-trackPt.tangent.x, -trackPt.tangent.z);
        onRespawn(respawnPos, respawnYaw);

        this.lastCheckpointMessage = 'RESET TO TRACK';
        this.checkpointMsgTimer = 1.5;
        this.refillNitro(30.0);
      }
      return;
    }

    // 2. Drain Nitro if active
    if (this.nitroTier > 0) {
      const drainRates = [0, 20.0, 24.0, 30.0];
      const rate = drainRates[this.nitroTier] || 22.0;
      this.nitroAmount -= rate * dt;

      if (this.nitroAmount <= 0) {
        this.nitroAmount = 0;
        this.nitroTier = 0;
      }
    } else {
      this.nitroAmount = Math.min(100.0, this.nitroAmount + 0.9 * dt);
    }

    // 3. Check Checkpoints along track
    const targetGate = this.nextCheckpoint;
    const gatePos = this.track.checkpoints[targetGate];

    if (gatePos) {
      const distToGate = shipPos.distanceTo(gatePos);
      if (distToGate < 24.0) {
        if (targetGate === 0) {
          // Completed Lap!
          if (this.bestLapTime === null || this.currentLapTime < this.bestLapTime) {
            this.bestLapTime = this.currentLapTime;
          }

          if (this.currentLap >= this.totalLaps) {
            this.isFinished = true;
            this.lastCheckpointMessage = `FINISH: ${this.position === 1 ? '1ST PLACE!' : `P${this.position}`}`;
            this.checkpointMsgTimer = 6.0;
          } else {
            this.currentLap++;
            this.lastCheckpointMessage = `LAP ${this.currentLap} / ${this.totalLaps}`;
            this.checkpointMsgTimer = 2.2;
            this.currentLapTime = 0.0;
            this.refillNitro(30.0);
          }
          this.nextCheckpoint = 1;
        } else {
          this.lastCheckpointMessage = `CHECKPOINT ${targetGate} / 10`;
          this.checkpointMsgTimer = 1.2;
          this.refillNitro(10.0);
          this.nextCheckpoint = (this.nextCheckpoint + 1) % this.totalCheckpoints;
        }
      }
    }
  }

  /**
   * Trigger Asphalt 9 Style Wreck & Respawn
   */
  public triggerWreck(): void {
    if (this.isWrecked || this.isGhost || this.isCountingDown) return;
    this.isWrecked = true;
    this.wreckTimer = 1.0;
    this.nitroTier = 0;
    this.lastCheckpointMessage = '💥 WRECKED!';
    this.checkpointMsgTimer = 1.2;
  }

  public getState(): LapState {
    const posSuffixes = ['ST', 'ND', 'RD', 'TH', 'TH', 'TH', 'TH', 'TH'];
    const sfx = posSuffixes[this.position - 1] || 'TH';

    return {
      currentLap: this.currentLap,
      totalLaps: this.totalLaps,
      currentLapTimeStr: this.formatTime(this.currentLapTime),
      bestLapTimeStr: this.bestLapTime !== null ? this.formatTime(this.bestLapTime) : '--:--.--',
      totalRaceTimeStr: this.formatTime(this.totalRaceTime),
      positionStr: `${this.position}${sfx}`,
      nitroAmount: Math.round(this.nitroAmount),
      nitroTier: this.nitroTier,
      isWrecked: this.isWrecked,
      isGhost: this.isGhost,
      isFinished: this.isFinished,
      lastCheckpointMessage: this.lastCheckpointMessage,
      isCountingDown: this.isCountingDown,
      countdownStage: this.countdownStage,
    };
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds * 100) % 100);
    const mStr = mins < 10 ? `0${mins}` : `${mins}`;
    const sStr = secs < 10 ? `0${secs}` : `${secs}`;
    const msStr = ms < 10 ? `0${ms}` : `${ms}`;
    return `${mStr}:${sStr}.${msStr}`;
  }
}
