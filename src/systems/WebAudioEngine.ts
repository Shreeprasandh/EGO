export class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  // Audio Nodes
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  public windNode: AudioNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private currentMode: 'lobby' | 'flight' | 'crashed' = 'lobby';

  public init(): void {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // 1. Procedural Engine Hum (Sawtooth 80Hz - 220Hz)
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(80, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime); // Start muted in lobby

      // Lowpass filter to sculpt warm turbine rumble
      const engineFilter = this.ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

      this.engineOsc.connect(engineFilter);
      engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);
      this.engineOsc.start();

      // 2. Procedural Wind Roar (White Noise + Bandpass Filter)
      this.setupWindRoar();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio waiting for first interaction:', e);
    }
  }

  private setupWindRoar(): void {
    if (!this.ctx || !this.masterGain) return;

    // Generate 2 seconds of looping white noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);
    this.windFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.001, this.ctx.currentTime); // Start muted

    whiteNoise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    whiteNoise.start();

    this.windNode = whiteNoise;
  }

  public setMode(mode: 'lobby' | 'flight' | 'crashed'): void {
    this.currentMode = mode;
    if (!this.ctx || !this.isInitialized) return;

    const t = this.ctx.currentTime;
    if (mode === 'lobby' || mode === 'crashed') {
      if (this.engineGain) this.engineGain.gain.setTargetAtTime(0.0001, t, 0.15);
      if (this.windGain) this.windGain.gain.setTargetAtTime(0.0001, t, 0.15);
    } else {
      if (this.engineGain) this.engineGain.gain.setTargetAtTime(0.18, t, 0.2);
      if (this.windGain) this.windGain.gain.setTargetAtTime(0.05, t, 0.2);
    }
  }

  /**
   * Update flight audio parameters based on airspeed and EGO
   */
  public update(speed: number, egoMultiplier: number): void {
    if (!this.ctx || !this.isInitialized || this.currentMode !== 'flight') return;

    const t = this.ctx.currentTime;
    const speedRatio = Math.min(1.0, Math.max(0.0, (speed - 30.0) / 90.0));

    // Engine Pitch: 80Hz -> 215Hz
    if (this.engineOsc && this.engineGain) {
      const targetFreq = 80.0 + speedRatio * 135.0 + (egoMultiplier / 50.0) * 22.0;
      this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.05);
      const targetEngineGain = 0.14 + speedRatio * 0.12;
      this.engineGain.gain.setTargetAtTime(targetEngineGain, t, 0.05);
    }

    // Wind Cutoff: 400Hz -> 3900Hz
    if (this.windFilter && this.windGain) {
      const targetCutoff = 420.0 + speedRatio * 3480.0;
      this.windFilter.frequency.setTargetAtTime(targetCutoff, t, 0.05);

      const targetGain = 0.04 + speedRatio * 0.32;
      this.windGain.gain.setTargetAtTime(targetGain, t, 0.05);
    }
  }

  /**
   * Metallic near-miss spark ping
   */
  public playNearMiss(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.09);

    gain.gain.setValueAtTime(0.38, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * Deep sub-bass crash impact thud
   */
  public playCrash(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(26, t + 0.6);

    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  /**
   * Tactile aerospace UI chirps
   */
  public playUiBeep(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(1900, t + 0.04);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  public playUiClick(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.06);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }
}
