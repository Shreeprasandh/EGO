export class IntroSequence {
  private container: HTMLElement;
  private onComplete: () => void;
  private audioCtx: AudioContext | null = null;

  // Flame canvas & particle system
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D | null;
  private animFrameId: number | null = null;
  private flameParticles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    alpha: number;
    decay: number;
    color: string;
    seed: number;
  }> = [];

  private flameActive = true;
  private flameScale = 1.0;
  private flameTargetScale = 1.0;
  private flameTime = 0.0;
  private timers: number[] = [];
  private isFinished = false;

  constructor(onComplete: () => void) {
    this.onComplete = onComplete;
    this.container = document.createElement('div');
    this.container.id = 'intro-sequence-overlay';
    document.body.appendChild(this.container);

    this.render();
    this.initFlameCanvas();
    this.runTimeline();
  }

  private render(): void {
    this.container.innerHTML = `
      <style>
        #intro-sequence-overlay {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: #060810;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          -webkit-user-select: none;
          overflow: hidden;
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Flame Canvas Container */
        #flame-canvas {
          position: absolute;
          top: 48%; left: 50%;
          transform: translate(-50%, -58%);
          pointer-events: none;
          z-index: 10;
        }

        /* Phase 1: Cursed Born Subtitle */
        .cursed-born-text {
          position: absolute;
          top: 59%;
          font-family: 'Cinzel', 'Trajan Pro', 'Orbitron', 'Cinzel Decorative', serif, sans-serif;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 9px;
          color: #e2e8f0;
          text-shadow: 0 0 20px rgba(0, 240, 255, 0.65), 0 2px 10px rgba(0, 0, 0, 0.9);
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(16px) scale(0.96);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 12;
          text-align: center;
          white-space: nowrap;
        }
        .cursed-born-text.visible {
          opacity: 1;
          transform: translateY(0px) scale(1);
        }
        .cursed-born-text.absorbed {
          opacity: 0;
          transform: translateY(-80px) scale(0.08);
          color: #00f0ff;
          text-shadow: 0 0 30px #00f0ff, 0 0 60px #0077ff;
          filter: blur(4px) brightness(2.5);
          transition: all 0.85s cubic-bezier(0.55, 0, 1, 0.45);
        }

        /* Phase 2: EGO Game Logo (No harsh flashing lights) */
        .ego-logo-stage {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: scale(0.94);
          transition: opacity 0.95s cubic-bezier(0.16, 1, 0.3, 1), transform 1.0s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
          z-index: 30;
        }
        .ego-logo-stage.visible {
          opacity: 1;
          transform: scale(1);
        }
        .ego-logo-img {
          max-width: 440px;
          width: 68vw;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 14px 45px rgba(0, 0, 0, 0.95));
        }

        /* Bottom Skip Pill Button */
        .skip-btn {
          position: absolute;
          bottom: 28px; right: 36px;
          font-family: 'Orbitron', 'Rajdhani', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2.2px;
          color: rgba(255, 255, 255, 0.8);
          background: rgba(14, 20, 32, 0.6);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 8px 18px;
          cursor: pointer;
          pointer-events: auto;
          z-index: 50;
          opacity: 0;
          transition: all 0.35s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        }
        .skip-btn:hover {
          background: rgba(0, 240, 255, 0.2);
          color: #00f0ff;
          border-color: rgba(0, 240, 255, 0.6);
          transform: translateY(-1px);
        }
        .skip-btn.visible {
          opacity: 1;
        }
      </style>

      <!-- Center Electric Blue Flame Canvas -->
      <canvas id="flame-canvas" width="420" height="420"></canvas>

      <!-- Subtitle: CURSED BORN -->
      <div class="cursed-born-text" id="cursed-born-text">CURSED BORN</div>

      <!-- Stage 2: EGO Game Logo on Deep Obsidian Black -->
      <div class="ego-logo-stage" id="ego-stage">
        <img src="/assets/logos/ego_emblem_transparent.png" class="ego-logo-img" alt="EGO Game Logo" />
      </div>

      <button class="skip-btn" id="skip-btn">SKIP &gt;&gt;</button>
    `;

    // Skip handler: Dedicated Skip Button or Space/Escape with 1.2s grace period
    const startTime = performance.now();
    const keyHandler = (e: KeyboardEvent) => {
      if (performance.now() - startTime < 1200) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        this.finish();
        window.removeEventListener('keydown', keyHandler);
      }
    };

    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.finish();
        window.removeEventListener('keydown', keyHandler);
      });
    }
    window.addEventListener('keydown', keyHandler);
  }

  /**
   * Photorealistic Multi-Mantle Electric-Blue Plasma Flame Engine
   */
  private initFlameCanvas(): void {
    this.canvas = document.getElementById('flame-canvas') as HTMLCanvasElement;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;

    // Retina High-DPI Razor-Sharp Canvas Scale
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    this.canvas.width = 420 * dpr;
    this.canvas.height = 420 * dpr;
    this.canvas.style.width = '420px';
    this.canvas.style.height = '420px';
    this.ctx.scale(dpr, dpr);

    const centerX = 210;
    const centerY = 245;

    const colors = ['#ffffff', '#e8f9ff', '#00f0ff', '#00d5ff', '#0088ff', '#0044ff'];

    // Pre-seed active plasma particles so flame is alive and burning on frame 0
    for (let p = 0; p < 45; p++) {
      const angle = (Math.random() - 0.5) * 0.8 - Math.PI / 2;
      const speed = 1.6 + Math.random() * 3.2;
      this.flameParticles.push({
        x: centerX + (Math.random() - 0.5) * 22,
        y: centerY - Math.random() * 65,
        vx: Math.cos(angle) * speed * 0.6,
        vy: Math.sin(angle) * speed,
        radius: 8.0 + Math.random() * 16.0,
        alpha: 0.45 + Math.random() * 0.5,
        decay: 0.02 + Math.random() * 0.02,
        color: colors[Math.floor(Math.random() * colors.length)],
        seed: Math.random() * 100,
      });
    }

    const renderFlame = () => {
      if (!this.flameActive || !this.ctx) return;

      this.ctx.clearRect(0, 0, 420, 420);
      this.flameTime += 0.042;

      // Smooth scale interpolation towards target
      this.flameScale += (this.flameTargetScale - this.flameScale) * 0.14;

      if (this.flameScale > 0.02) {
        const s = this.flameScale;

        // 1. Soft Blue Convection Ground Dispersion
        const floorGrad = this.ctx.createRadialGradient(
          centerX, centerY + 18, 0,
          centerX, centerY + 18, 65 * s
        );
        floorGrad.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
        floorGrad.addColorStop(0.45, 'rgba(0, 100, 255, 0.18)');
        floorGrad.addColorStop(1, 'rgba(0, 20, 120, 0)');
        this.ctx.fillStyle = floorGrad;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY + 18, 55 * s, 15 * s, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // 2. Spawn continuous flame plasma convection particles
        if (this.flameTargetScale > 0.05) {
          for (let i = 0; i < 4; i++) {
            const angle = (Math.random() - 0.5) * 0.8 - Math.PI / 2;
            const speed = (1.8 + Math.random() * 3.4) * s;
            this.flameParticles.push({
              x: centerX + (Math.random() - 0.5) * 16 * s,
              y: centerY + (Math.random() - 0.5) * 10 * s,
              vx: Math.cos(angle) * speed * 0.55,
              vy: Math.sin(angle) * speed,
              radius: (8.0 + Math.random() * 15.0) * s,
              alpha: 0.95,
              decay: 0.02 + Math.random() * 0.016,
              color: colors[Math.floor(Math.random() * colors.length)],
              seed: Math.random() * 100,
            });
          }

          // Swirling turbulent embers that curl upward into the darkness
          if (Math.random() < 0.75) {
            this.flameParticles.push({
              x: centerX + (Math.random() - 0.5) * 14 * s,
              y: centerY - 18 * s,
              vx: (Math.random() - 0.5) * 1.8,
              vy: -4.0 - Math.random() * 3.0,
              radius: (1.5 + Math.random() * 2.4) * s,
              alpha: 0.98,
              decay: 0.015,
              color: '#00f0ff',
              seed: Math.random() * 100,
            });
          }
        }

        // 3. Layer A: Outer Convective Sheath (Deep Sapphire-Cobalt Blue Envelope)
        const wave1 = Math.sin(this.flameTime * 5.2) * 4.5 * s;
        const wave2 = Math.cos(this.flameTime * 3.8) * 3.5 * s;
        const outerTipY = centerY - 85 * s + wave2;

        this.ctx.save();
        const outerGrad = this.ctx.createLinearGradient(centerX, centerY + 14, centerX, outerTipY);
        outerGrad.addColorStop(0, 'rgba(0, 50, 180, 0.4)');
        outerGrad.addColorStop(0.35, 'rgba(0, 120, 255, 0.6)');
        outerGrad.addColorStop(0.7, 'rgba(0, 220, 255, 0.8)');
        outerGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

        this.ctx.fillStyle = outerGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 24 * s, centerY + 8);
        this.ctx.bezierCurveTo(
          centerX - 32 * s, centerY - 25 * s,
          centerX - 14 * s + wave1, centerY - 55 * s,
          centerX + wave1, outerTipY
        );
        this.ctx.bezierCurveTo(
          centerX + 14 * s + wave1, centerY - 55 * s,
          centerX + 32 * s, centerY - 25 * s,
          centerX + 24 * s, centerY + 8
        );
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();

        // 4. Layer B: Middle Convective Mantle (Pure Electric Cyan)
        const midWave = Math.sin(this.flameTime * 6.5) * 3.0 * s;
        const midTipY = centerY - 68 * s + midWave;

        this.ctx.save();
        const midGrad = this.ctx.createLinearGradient(centerX, centerY + 10, centerX, midTipY);
        midGrad.addColorStop(0, 'rgba(0, 140, 255, 0.85)');
        midGrad.addColorStop(0.4, 'rgba(0, 240, 255, 0.95)');
        midGrad.addColorStop(0.8, 'rgba(180, 245, 255, 0.98)');
        midGrad.addColorStop(1, 'rgba(255, 255, 255, 1)');

        this.ctx.fillStyle = midGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 16 * s, centerY + 6);
        this.ctx.bezierCurveTo(
          centerX - 22 * s, centerY - 22 * s,
          centerX - 8 * s + midWave, centerY - 45 * s,
          centerX + midWave, midTipY
        );
        this.ctx.bezierCurveTo(
          centerX + 8 * s + midWave, centerY - 45 * s,
          centerX + 22 * s, centerY - 22 * s,
          centerX + 16 * s, centerY + 6
        );
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();

        // 5. Layer C: High-Heat Reaction Core (White-Hot Supersonic Core)
        const coreWave = Math.cos(this.flameTime * 7.5) * 1.8 * s;
        const coreTipY = centerY - 46 * s + coreWave;

        this.ctx.save();
        const coreGrad = this.ctx.createLinearGradient(centerX, centerY + 8, centerX, coreTipY);
        coreGrad.addColorStop(0, 'rgba(0, 220, 255, 0.95)');
        coreGrad.addColorStop(0.5, 'rgba(230, 250, 255, 1)');
        coreGrad.addColorStop(1, '#ffffff');

        this.ctx.fillStyle = coreGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 9 * s, centerY + 4);
        this.ctx.bezierCurveTo(
          centerX - 12 * s, centerY - 15 * s,
          centerX - 4 * s + coreWave, centerY - 32 * s,
          centerX + coreWave, coreTipY
        );
        this.ctx.bezierCurveTo(
          centerX + 4 * s + coreWave, centerY - 32 * s,
          centerX + 12 * s, centerY - 15 * s,
          centerX + 9 * s, centerY + 4
        );
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();

        // 6. Update & Draw Particles with Additive Saturated Plasma Glow
        this.ctx.globalCompositeOperation = 'lighter';
        for (let i = this.flameParticles.length - 1; i >= 0; i--) {
          const p = this.flameParticles[i];
          p.x += p.vx + Math.sin(this.flameTime * 4.5 + p.seed) * 0.55;
          p.y += p.vy;
          p.radius *= 0.978;
          p.alpha -= p.decay;

          if (p.alpha <= 0.01 || p.radius <= 0.35) {
            this.flameParticles.splice(i, 1);
            continue;
          }

          const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.35, p.color);
          grad.addColorStop(0.7, '#0055ff');
          grad.addColorStop(1, 'rgba(0, 20, 120, 0)');

          this.ctx.fillStyle = grad;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.globalCompositeOperation = 'source-over';
      }

      this.animFrameId = requestAnimationFrame(renderFlame);
    };

    this.animFrameId = requestAnimationFrame(renderFlame);
  }

  /**
   * Storyboard Timeline:
   * 1. Living Electric-Blue Flame in center
   * 2. CURSED BORN fades in
   * 3. Kinetic Absorption into the flame
   * 4. Flame gathers to singularity
   * 5. EGO Game Logo reveals with sub-bass boom (no blinding lights)
   * 6. Smooth dissolve into 3D Garage Hangar
   */
  private runTimeline(): void {
    const cursedText = document.getElementById('cursed-born-text');
    const egoStage = document.getElementById('ego-stage');
    const skipBtn = document.getElementById('skip-btn');

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      this.timers.push(id);
    };

    // 0. Ignition sound (0.1s)
    schedule(() => {
      this.playIgniteSound();
    }, 100);

    // 1. "CURSED BORN" fades in beneath flame (0.4s)
    schedule(() => {
      cursedText?.classList.add('visible');
    }, 400);

    // 2. Show skip button (1.4s)
    schedule(() => {
      skipBtn?.classList.add('visible');
    }, 1400);

    // 3. Kinetic Absorption: Words drift upward and get absorbed into the flame core (2.4s)
    schedule(() => {
      cursedText?.classList.add('absorbed');
      this.playSuctionSound();
    }, 2400);

    // 4. Flame contracts into singularity point (3.3s)
    schedule(() => {
      this.flameTargetScale = 0.03;
    }, 3300);

    // 5. Singularity vanishes, EGO Game Logo reveals smoothly with acoustic boom (3.6s)
    schedule(() => {
      this.flameActive = false;
      if (this.canvas) this.canvas.style.display = 'none';
      this.playEgoBoom();
      egoStage?.classList.add('visible');
    }, 3600);

    // 6. EGO logo fades into 3D Hangar (5.4s)
    schedule(() => {
      egoStage?.classList.remove('visible');
    }, 5400);

    // 7. Complete Intro & Enter 3D Garage Hangar (6.0s)
    schedule(() => {
      this.finish();
    }, 6000);
  }

  private finish(): void {
    if (this.isFinished) return;
    this.isFinished = true;

    // Clear all pending timers & animations
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers = [];
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.flameActive = false;

    this.container.style.opacity = '0';
    setTimeout(() => {
      this.container.remove();
      this.onComplete();
    }, 600);
  }

  // ==========================================
  // PROCEDURAL WEB AUDIO SYNTHESIS SUITE
  // ==========================================

  private ensureAudio(): AudioContext | null {
    if (!this.audioCtx) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * 1. Electric plasma flame ignition hum
   */
  private playIgniteSound(): void {
    const ctx = this.ensureAudio();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(360, t + 0.8);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.2);
  }

  /**
   * 2. Resonant vacuum whoosh as "CURSED BORN" is absorbed
   */
  private playSuctionSound(): void {
    const ctx = this.ensureAudio();
    if (!ctx) return;
    const t = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 1.0);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(4.0, t);
    filter.frequency.setValueAtTime(160, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.9);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.95);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  }

  /**
   * 3. Cinematic sub-bass boom for EGO logo reveal (warm, deep, zero harsh flash)
   */
  private playEgoBoom(): void {
    const ctx = this.ensureAudio();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, t);
    osc.frequency.exponentialRampToValueAtTime(24, t + 1.8);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 2.0);
  }
}
