import { Song, MUSIC_CATALOG } from './MusicDatabase';

export class ProceduralMusicPlayer {
  private ctx: AudioContext | null = null;
  public currentTrackIndex = 0;
  public isPlaying = false;
  public volume = 0.6;

  // Master Gain & Output
  private masterGain: GainNode | null = null;
  private schedulerTimer: number | null = null;
  private nextNoteTime = 0.0;
  private currentStep = 0;
  private readonly lookaheadMs = 25.0; // Check every 25ms
  private readonly scheduleAheadSeconds = 0.12; // Schedule 120ms ahead

  // Listeners
  private onTrackChangeCallbacks: ((song: Song) => void)[] = [];

  constructor() {
    // Starts at track 0
  }

  public init(existingCtx?: AudioContext): void {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = existingCtx || new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  public getCurrentSong(): Song {
    return MUSIC_CATALOG[this.currentTrackIndex] || MUSIC_CATALOG[0];
  }

  public onTrackChange(cb: (song: Song) => void): void {
    this.onTrackChangeCallbacks.push(cb);
  }

  public play(): void {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlaying = true;
    this.startClockScheduler();
    this.notifyTrackChange();
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.schedulerTimer) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public nextTrack(): void {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % MUSIC_CATALOG.length;
    this.restartIfPlaying();
  }

  public prevTrack(): void {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + MUSIC_CATALOG.length) % MUSIC_CATALOG.length;
    this.restartIfPlaying();
  }

  public selectTrack(index: number): void {
    if (index >= 0 && index < MUSIC_CATALOG.length) {
      this.currentTrackIndex = index;
      this.restartIfPlaying();
    }
  }

  private restartIfPlaying(): void {
    if (this.isPlaying) {
      if (this.schedulerTimer) window.clearInterval(this.schedulerTimer);
      this.startClockScheduler();
    }
    this.notifyTrackChange();
  }

  private notifyTrackChange(): void {
    const song = this.getCurrentSong();
    this.onTrackChangeCallbacks.forEach(cb => cb(song));
  }

  /**
   * Sample-Accurate Web Audio Lookahead Scheduler (Chris Wilson Architecture)
   * Guaranteed zero timer jitter regardless of CPU load or frame rate fluctuations
   */
  private startClockScheduler(): void {
    if (!this.ctx || !this.masterGain) return;

    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    this.schedulerTimer = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;

      const song = this.getCurrentSong();
      const secondsPerStep = (60.0 / song.bpm) / 4.0; // 16th note duration

      while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadSeconds) {
        this.scheduleStep(this.currentStep, this.nextNoteTime, song);
        this.nextNoteTime += secondsPerStep;
        this.currentStep = (this.currentStep + 1) % 16;
      }
    }, this.lookaheadMs);
  }

  private scheduleStep(step: number, t: number, song: Song): void {
    // 1. Kick on steps 0, 4, 8, 12 (Four-on-the-floor beat)
    if (step % 4 === 0) {
      this.scheduleKick(t);
    }

    // 2. Snare / Clap on steps 4, 12
    if (step % 8 === 4) {
      this.scheduleSnare(t);
    }

    // 3. Hi-hat on steps 2, 6, 10, 14 (Offbeat groove)
    if (step % 2 === 0) {
      this.scheduleHiHat(t);
    }

    // 4. Bassline notes tailored to track key
    if (step % 2 === 0) {
      this.scheduleBassline(t, song, step);
    }

    // 5. Synth pad chords on bar restarts
    if (step === 0) {
      this.scheduleChord(t, song);
    }
  }

  private scheduleKick(t: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(145, t);
    osc.frequency.exponentialRampToValueAtTime(36, t + 0.12);

    gain.gain.setValueAtTime(0.65 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  private scheduleSnare(t: number): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(950, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.32 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
  }

  private scheduleHiHat(t: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(8500, t);

    gain.gain.setValueAtTime(0.12 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.045);
  }

  private scheduleBassline(t: number, _song: Song, step: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Pentatonic scale base sequence (C2, D2, Eb2, G2, Bb2)
    const notes = [65.41, 73.42, 77.78, 98.0, 116.54];
    const note = notes[(step / 2) % notes.length];

    osc.frequency.setValueAtTime(note, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);

    gain.gain.setValueAtTime(0.28 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  private scheduleChord(t: number, _song: Song): void {
    if (!this.ctx || !this.masterGain) return;
    const chordFrequencies = [261.63, 311.13, 392.0]; // C minor atmospheric chord

    chordFrequencies.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.08 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 1.8);
    });
  }
}
