import { SCORING_COEFFICIENTS } from '../utils/constants';

export class EgoScoreEngine {
  public egoMultiplier = 1.0;
  public totalScore = 0;
  public distanceTraveled = 0;
  public nearMissCount = 0;
  public regionsDiscovered = 1;
  public solarFragments = 0;

  private egoSamplesSum = 0;
  private egoSampleCount = 0;
  private nearMissTimer = 0.0;

  public update(dt: number, speed: number, altitude: number): void {
    // 1. Distance accumulation
    const distDelta = speed * dt;
    this.distanceTraveled += distDelta;

    // 2. Dynamic EGO Proximity Multiplier Calculation
    // Ideal skimming height is 0.5m. Above threshold (4m), multiplier decays.
    if (altitude <= SCORING_COEFFICIENTS.EGO_ALTITUDE_THRESHOLD) {
      // Proximity intensity: closer to 0.5m = faster growth
      const proximityFactor = Math.max(0.1, 1.0 - (altitude - 0.5) / 3.5);
      this.egoMultiplier = Math.min(
        SCORING_COEFFICIENTS.EGO_MAX,
        this.egoMultiplier + SCORING_COEFFICIENTS.EGO_GROWTH_RATE * proximityFactor * dt
      );
    } else {
      // In high air / coward altitude: multiplier decays rapidly
      this.egoMultiplier = Math.max(
        SCORING_COEFFICIENTS.EGO_MIN,
        this.egoMultiplier - SCORING_COEFFICIENTS.EGO_DECAY_RATE * dt
      );
    }

    // 3. Track Average EGO Multiplier
    this.egoSamplesSum += this.egoMultiplier;
    this.egoSampleCount++;
    const avgEgo = this.egoSamplesSum / (this.egoSampleCount || 1);

    // 4. Option E Hybrid Score Formula
    this.totalScore = Math.floor(
      (this.distanceTraveled * SCORING_COEFFICIENTS.K1_DISTANCE) * avgEgo +
      (this.regionsDiscovered * SCORING_COEFFICIENTS.K2_REGIONS) +
      (this.nearMissCount * SCORING_COEFFICIENTS.K3_NEAR_MISS) +
      (this.solarFragments * SCORING_COEFFICIENTS.K4_CURRENCY)
    );

    // 5. Cooldowns
    if (this.nearMissTimer > 0) {
      this.nearMissTimer -= dt;
    }
  }

  /**
   * Trigger near-miss spark bonus
   */
  public triggerNearMiss(): boolean {
    if (this.nearMissTimer <= 0) {
      this.nearMissCount++;
      this.nearMissTimer = 0.35; // Cooldown
      // Instant EGO surge bump
      this.egoMultiplier = Math.min(SCORING_COEFFICIENTS.EGO_MAX, this.egoMultiplier + 2.5);
      return true;
    }
    return false;
  }

  public reset(): void {
    this.egoMultiplier = 1.0;
    this.totalScore = 0;
    this.distanceTraveled = 0;
    this.nearMissCount = 0;
    this.regionsDiscovered = 1;
    this.solarFragments = 0;
    this.egoSamplesSum = 0;
    this.egoSampleCount = 0;
  }
}
