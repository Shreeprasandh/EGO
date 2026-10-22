import { LapState } from '../track/LapManager';
import { MiniMapRadar } from './MiniMapRadar';

export interface RacingHudData {
  speed: number;           // in m/s (converted to km/h: speed * 3.6)
  lapState: LapState;
  isPaused: boolean;
  cameraModeName: string;
}

export class HudOverlay {
  private container: HTMLElement;
  private pauseModalEl!: HTMLElement;
  private positionEl!: HTMLElement;
  private lapEl!: HTMLElement;
  private lapTimeEl!: HTMLElement;
  private bestTimeEl!: HTMLElement;
  private checkpointBannerEl!: HTMLElement;
  private speedNumberEl!: HTMLElement;
  private nitroFillEl!: HTMLElement;
  private nitroLabelEl!: HTMLElement;
  private topNitroFillEl!: HTMLElement;
  private topNitroPctEl!: HTMLElement;
  private cameraBtnEl!: HTMLElement;

  // F1 Countdown DOM elements
  private countdownOverlayEl!: HTMLElement;
  private countdownNumberEl!: HTMLElement;
  private f1Bulbs: HTMLElement[] = [];

  private onRestartCallback: () => void;
  private onReturnToLobbyCallback: () => void;
  private onTogglePauseCallback: () => void;
  private onCycleCameraCallback: () => void;

  public miniMapContainer!: HTMLElement;

  constructor(
    containerId = 'hud-container',
    onRestart: () => void,
    onReturnToLobby: () => void,
    onTogglePause: () => void,
    onCycleCamera: () => void
  ) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;

    this.onRestartCallback = onRestart;
    this.onReturnToLobbyCallback = onReturnToLobby;
    this.onTogglePauseCallback = onTogglePause;
    this.onCycleCameraCallback = onCycleCamera;

    this.render();
  }

  public setVisible(visible: boolean): void {
    if (this.container) {
      this.container.style.display = visible ? 'block' : 'none';
    }
  }

  public mountMiniMap(miniMap: MiniMapRadar): void {
    if (this.miniMapContainer) {
      this.miniMapContainer.innerHTML = '';
      this.miniMapContainer.appendChild(miniMap.canvas);
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <style>
        .racing-hud-root {
          font-family: 'Orbitron', 'Rajdhani', sans-serif;
          user-select: none;
          -webkit-user-select: none;
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          pointer-events: none;
          z-index: 50;
        }

        /* 1. Top-Left: Position, Lap, Timer */
        .hud-race-stats-top-left {
          position: absolute;
          top: 24px;
          left: 28px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: auto;
        }

        .race-pos-card {
          background: rgba(7, 12, 22, 0.72);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(0, 240, 255, 0.35);
          clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
          padding: 8px 18px;
          display: flex;
          align-items: baseline;
          gap: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
        }

        .race-pos-num {
          font-size: 32px;
          font-weight: 900;
          font-style: italic;
          color: #ffe277;
          text-shadow: 0 0 16px rgba(255, 226, 119, 0.6);
          line-height: 1;
        }

        .race-pos-total {
          font-size: 13px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 1.5px;
        }

        .race-lap-box {
          background: rgba(7, 12, 22, 0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 240, 255, 0.25);
          border-radius: 4px;
          padding: 6px 14px;
          display: flex;
          gap: 16px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .lap-counter-text {
          color: #00f0ff;
        }

        .lap-timer-text {
          color: #ffffff;
          font-family: monospace;
          font-size: 13px;
        }

        .best-lap-text {
          color: rgba(255, 226, 119, 0.85);
          font-size: 10px;
        }

        /* 2. Top-Center: Dynamic Banner Notifications */
        .hud-checkpoint-banner {
          position: absolute;
          top: 36px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 18px;
          font-weight: 900;
          font-style: italic;
          letter-spacing: 2.5px;
          color: #00f0ff;
          text-shadow: 0 0 20px #00f0ff;
          opacity: 0;
          transition: opacity 0.25s ease, transform 0.25s ease;
          background: rgba(4, 8, 16, 0.8);
          border: 1px solid rgba(0, 240, 255, 0.4);
          padding: 8px 24px;
          clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
        }

        .hud-checkpoint-banner.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(10px);
        }

        /* 3. Top-Right: Pause Button & MiniMap */
        .hud-top-right-group {
          position: absolute;
          top: 24px;
          right: 28px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 14px;
          pointer-events: auto;
        }

        .hud-pause-btn {
          background: rgba(7, 12, 22, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 240, 255, 0.4);
          clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
          padding: 8px 18px;
          font-family: 'Orbitron', sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #00f0ff;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        }

        .hud-pause-btn:hover {
          background: rgba(0, 240, 255, 0.25);
          border-color: #00f0ff;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.6);
          transform: translateY(-2px);
        }

        .hud-minimap-container {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);
        }

        /* 3b. Sleek Top-Center Minimalist Nitro Bar */
        .hud-top-nitro-wrapper {
          position: absolute;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          width: 280px;
          pointer-events: none;
          z-index: 55;
        }

        .hud-top-nitro-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 0 4px;
        }

        .hud-top-nitro-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #00f0ff;
          text-shadow: 0 0 10px rgba(0, 240, 255, 0.6);
        }

        .hud-top-nitro-hint {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: rgba(255, 255, 255, 0.6);
          background: rgba(0, 240, 255, 0.12);
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 3px;
          padding: 1px 6px;
        }

        .hud-top-nitro-pct {
          font-family: monospace;
          font-size: 11px;
          font-weight: 800;
          color: #ffffff;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
        }

        .hud-top-nitro-track {
          width: 100%;
          height: 6px;
          background: rgba(5, 10, 20, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 240, 255, 0.35);
          border-radius: 3px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.7);
          position: relative;
        }

        .hud-top-nitro-fill {
          height: 100%;
          width: 60%;
          background: linear-gradient(90deg, #0066ff, #00f0ff);
          box-shadow: 0 0 12px #00f0ff;
          border-radius: 2px;
          transition: width 0.08s linear, background 0.2s ease, box-shadow 0.2s ease;
        }

        .hud-top-nitro-fill.active {
          background: linear-gradient(90deg, #00d5ff, #ffffff);
          box-shadow: 0 0 16px #00f0ff, 0 0 8px #ffffff;
        }

        /* 4. Bottom-Center: Speedometer & Asphalt 9 3-Tier Nitro */
        .hud-bottom-center-cluster {
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          pointer-events: none;
        }

        .speedometer-block {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .speedometer-num {
          font-size: 54px;
          font-weight: 900;
          font-style: italic;
          color: #ffffff;
          line-height: 1;
          letter-spacing: -1px;
          text-shadow: 0 0 20px rgba(0, 240, 255, 0.7);
        }

        .speedometer-unit {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #00f0ff;
        }

        /* 3-Tier Nitro Bar */
        .nitro-bar-container {
          width: 320px;
          height: 14px;
          background: rgba(6, 10, 20, 0.85);
          border: 1px solid rgba(0, 240, 255, 0.4);
          clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
          padding: 2px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
          position: relative;
        }

        .nitro-bar-fill {
          height: 100%;
          width: 60%;
          background: linear-gradient(90deg, #00c8ff, #00f0ff);
          box-shadow: 0 0 14px #00f0ff;
          transition: width 0.1s linear, background 0.2s ease, box-shadow 0.2s ease;
        }

        .nitro-bar-fill.tier-1 {
          background: linear-gradient(90deg, #ff9900, #ffdd00);
          box-shadow: 0 0 16px #ffdd00;
        }

        .nitro-bar-fill.tier-2 {
          background: linear-gradient(90deg, #0077ff, #00f0ff);
          box-shadow: 0 0 18px #00f0ff;
        }

        .nitro-bar-fill.tier-3 {
          background: linear-gradient(90deg, #9900ff, #e600ff);
          box-shadow: 0 0 24px #e600ff;
        }

        .nitro-status-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          color: rgba(255, 255, 255, 0.7);
          text-shadow: 0 0 8px rgba(0, 240, 255, 0.4);
        }

        /* 5. Official F1 / Asphalt Starting Grid Countdown Overlay */
        .f1-countdown-overlay {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          pointer-events: none;
          z-index: 60;
        }

        .f1-countdown-overlay.active {
          display: flex;
        }

        .f1-lights-row {
          display: flex;
          gap: 14px;
          padding: 12px 24px;
          background: rgba(6, 10, 20, 0.85);
          border: 2px solid rgba(0, 240, 255, 0.35);
          border-radius: 40px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
        }

        .f1-bulb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #1a0505;
          border: 2px solid rgba(255, 255, 255, 0.15);
          transition: all 0.12s ease;
        }

        .f1-bulb.red {
          background: #ff1122;
          box-shadow: 0 0 20px #ff1122, inset 0 0 8px #ffffff;
        }

        .f1-bulb.green {
          background: #00ff66;
          box-shadow: 0 0 24px #00ff66, inset 0 0 8px #ffffff;
        }

        .f1-countdown-number {
          font-size: 88px;
          font-weight: 900;
          font-style: italic;
          color: #ff1122;
          text-shadow: 0 0 32px #ff1122;
          line-height: 1;
          letter-spacing: 2px;
          transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .f1-countdown-number.go {
          font-size: 56px;
          color: #00ff66;
          text-shadow: 0 0 36px #00ff66;
          letter-spacing: 4px;
        }

        .f1-countdown-hint {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 3px;
          color: rgba(0, 240, 255, 0.8);
          text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
        }

        /* 6. Pause Modal Window */
        .race-pause-modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(3, 6, 14, 0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 100;
          pointer-events: auto;
        }

        .race-pause-modal-overlay.active {
          display: flex;
        }

        .pause-card-content {
          width: 440px;
          background: rgba(9, 14, 25, 0.88);
          border: 1px solid rgba(0, 240, 255, 0.35);
          clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
          padding: 32px 36px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8), inset 0 0 24px rgba(0, 240, 255, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .pause-header-title {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 3px;
          color: #00f0ff;
          text-shadow: 0 0 16px rgba(0, 240, 255, 0.6);
        }

        .pause-circuit-subtitle {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
        }

        .pause-action-btn {
          width: 100%;
          padding: 12px 20px;
          background: rgba(14, 22, 38, 0.7);
          border: 1px solid rgba(0, 240, 255, 0.3);
          clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
          color: #ffffff;
          font-family: 'Orbitron', sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pause-action-btn:hover {
          background: rgba(0, 240, 255, 0.25);
          border-color: #00f0ff;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
          transform: translateY(-2px);
          color: #00f0ff;
        }

        .pause-action-btn.primary {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 119, 255, 0.3));
          border-color: #00f0ff;
          color: #00f0ff;
        }
      </style>

      <div class="racing-hud-root">
        <!-- Top-Left: Position, Lap, Timer -->
        <div class="hud-race-stats-top-left">
          <div class="race-pos-card">
            <span class="race-pos-num" id="hud-race-pos">4TH</span>
            <span class="race-pos-total">/ 8</span>
          </div>

          <div class="race-lap-box">
            <span class="lap-counter-text" id="hud-lap-counter">LAP 1 / 3</span>
            <span class="lap-timer-text" id="hud-lap-timer">00:00.00</span>
            <span class="best-lap-text" id="hud-best-timer">BEST: --:--.--</span>
          </div>
        </div>

        <!-- Top-Center: Sleek Minimalist Nitro Gauge Bar -->
        <div class="hud-top-nitro-wrapper" id="hud-top-nitro-wrapper">
          <div class="hud-top-nitro-header">
            <span class="hud-top-nitro-title">NITRO BOOST</span>
            <span class="hud-top-nitro-hint">[SPACE]</span>
            <span class="hud-top-nitro-pct" id="hud-top-nitro-pct">60%</span>
          </div>
          <div class="hud-top-nitro-track">
            <div class="hud-top-nitro-fill" id="hud-top-nitro-fill"></div>
          </div>
        </div>

        <!-- Top-Center: Checkpoint Flash Notification -->
        <div class="hud-checkpoint-banner" id="hud-checkpoint-banner">
          CHECKPOINT 1 / 10
        </div>

        <!-- Top-Right: Pause Button & MiniMap -->
        <div class="hud-top-right-group">
          <button class="hud-pause-btn" id="hud-pause-btn">PAUSE (ESC)</button>
          <div class="hud-minimap-container" id="hud-minimap-container"></div>
        </div>

        <!-- Bottom-Center: Speedometer & Nitro Bar -->
        <div class="hud-bottom-center-cluster">
          <div class="speedometer-block">
            <span class="speedometer-num" id="hud-speedometer-num">0</span>
            <span class="speedometer-unit">KM/H</span>
          </div>

          <div class="nitro-bar-container">
            <div class="nitro-bar-fill" id="hud-nitro-fill"></div>
          </div>

          <div class="nitro-status-label" id="hud-nitro-label">
            [SPACE / SHIFT] TAP NITRO
          </div>
        </div>

        <!-- Official F1 Starting Grid Countdown Overlay -->
        <div class="f1-countdown-overlay" id="f1-countdown-overlay">
          <div class="f1-lights-row">
            <div class="f1-bulb" id="f1-bulb-0"></div>
            <div class="f1-bulb" id="f1-bulb-1"></div>
            <div class="f1-bulb" id="f1-bulb-2"></div>
            <div class="f1-bulb" id="f1-bulb-3"></div>
            <div class="f1-bulb" id="f1-bulb-4"></div>
          </div>
          <div class="f1-countdown-number" id="f1-countdown-number">3</div>
          <div class="f1-countdown-hint" id="f1-countdown-hint">REV ENGINE • PREPARE FOR LAUNCH</div>
        </div>

        <!-- Pause Modal Overlay -->
        <div class="race-pause-modal-overlay" id="race-pause-modal">
          <div class="pause-card-content">
            <div class="pause-header-title">// RACE PAUSED</div>
            <div class="pause-circuit-subtitle">CANYON GRAND PRIX • 3.2 KM CIRCUIT</div>

            <button class="pause-action-btn primary" id="pause-resume-btn">RESUME RACE (ESC)</button>
            <button class="pause-action-btn" id="pause-restart-btn">RESTART RACE (R)</button>
            <button class="pause-action-btn" id="pause-camera-btn">CAMERA: MID CHASE (C)</button>
            <button class="pause-action-btn" id="pause-garage-btn">RETURN TO GARAGE</button>
          </div>
        </div>
      </div>
    `;

    this.bindDomElements();
    this.hookListeners();
  }

  private bindDomElements(): void {
    this.positionEl = document.getElementById('hud-race-pos')!;
    this.lapEl = document.getElementById('hud-lap-counter')!;
    this.lapTimeEl = document.getElementById('hud-lap-timer')!;
    this.bestTimeEl = document.getElementById('hud-best-timer')!;
    this.checkpointBannerEl = document.getElementById('hud-checkpoint-banner')!;
    this.speedNumberEl = document.getElementById('hud-speedometer-num')!;
    this.nitroFillEl = document.getElementById('hud-nitro-fill')!;
    this.nitroLabelEl = document.getElementById('hud-nitro-label')!;
    this.topNitroFillEl = document.getElementById('hud-top-nitro-fill')!;
    this.topNitroPctEl = document.getElementById('hud-top-nitro-pct')!;
    this.pauseModalEl = document.getElementById('race-pause-modal')!;
    this.miniMapContainer = document.getElementById('hud-minimap-container')!;
    this.cameraBtnEl = document.getElementById('pause-camera-btn')!;

    // F1 Countdown Elements
    this.countdownOverlayEl = document.getElementById('f1-countdown-overlay')!;
    this.countdownNumberEl = document.getElementById('f1-countdown-number')!;
    this.f1Bulbs = [
      document.getElementById('f1-bulb-0')!,
      document.getElementById('f1-bulb-1')!,
      document.getElementById('f1-bulb-2')!,
      document.getElementById('f1-bulb-3')!,
      document.getElementById('f1-bulb-4')!,
    ];
  }

  private hookListeners(): void {
    const pauseBtn = document.getElementById('hud-pause-btn');
    pauseBtn?.addEventListener('click', () => this.onTogglePauseCallback());

    const resumeBtn = document.getElementById('pause-resume-btn');
    resumeBtn?.addEventListener('click', () => this.onTogglePauseCallback());

    const restartBtn = document.getElementById('pause-restart-btn');
    restartBtn?.addEventListener('click', () => this.onRestartCallback());

    const cameraBtn = document.getElementById('pause-camera-btn');
    cameraBtn?.addEventListener('click', () => this.onCycleCameraCallback());

    const garageBtn = document.getElementById('pause-garage-btn');
    garageBtn?.addEventListener('click', () => this.onReturnToLobbyCallback());

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        this.onTogglePauseCallback();
      } else if (e.code === 'KeyR' && this.pauseModalEl.classList.contains('active')) {
        this.onRestartCallback();
      } else if (e.code === 'KeyC') {
        this.onCycleCameraCallback();
      }
    });
  }

  public update(data: RacingHudData): void {
    const ls = data.lapState;

    // 1. F1 Starting Grid Countdown Logic
    if (ls.isCountingDown) {
      this.countdownOverlayEl.classList.add('active');
      const stage = ls.countdownStage;

      if (stage === 3) {
        this.countdownNumberEl.innerText = '3';
        this.countdownNumberEl.className = 'f1-countdown-number';
        this.setBulbs(3, false);
      } else if (stage === 2) {
        this.countdownNumberEl.innerText = '2';
        this.countdownNumberEl.className = 'f1-countdown-number';
        this.setBulbs(4, false);
      } else if (stage === 1) {
        this.countdownNumberEl.innerText = '1';
        this.countdownNumberEl.className = 'f1-countdown-number';
        this.setBulbs(5, false);
      } else {
        this.countdownNumberEl.innerText = 'LIGHTS OUT & GO!';
        this.countdownNumberEl.className = 'f1-countdown-number go';
        this.setBulbs(5, true);
      }
    } else {
      if (this.countdownOverlayEl.classList.contains('active')) {
        // Fade out
        this.countdownOverlayEl.classList.remove('active');
      }
    }

    // 2. Speedometer in KM/H
    const kmh = Math.round(data.speed * 3.6);
    if (this.speedNumberEl) this.speedNumberEl.innerText = `${kmh}`;

    // 3. Lap & Position
    if (this.positionEl) this.positionEl.innerText = ls.positionStr;
    if (this.lapEl) this.lapEl.innerText = `LAP ${ls.currentLap} / ${ls.totalLaps}`;
    if (this.lapTimeEl) this.lapTimeEl.innerText = ls.currentLapTimeStr;
    if (this.bestTimeEl) this.bestTimeEl.innerText = `BEST: ${ls.bestLapTimeStr}`;

    // 4. Dynamic Checkpoint Notifications
    if (ls.lastCheckpointMessage) {
      this.checkpointBannerEl.innerText = ls.lastCheckpointMessage;
      this.checkpointBannerEl.classList.add('visible');
    } else {
      this.checkpointBannerEl.classList.remove('visible');
    }

    // 5. Sleek Top-Center & Bottom Nitro Synchronization
    const pctClamped = Math.max(0, Math.min(100, ls.nitroAmount));
    if (this.topNitroFillEl) {
      this.topNitroFillEl.style.width = `${pctClamped}%`;
      if (ls.nitroTier > 0) {
        this.topNitroFillEl.classList.add('active');
      } else {
        this.topNitroFillEl.classList.remove('active');
      }
    }
    if (this.topNitroPctEl) {
      this.topNitroPctEl.innerText = `${Math.round(pctClamped)}%`;
    }

    if (this.nitroFillEl) {
      this.nitroFillEl.style.width = `${pctClamped}%`;
      this.nitroFillEl.className = 'nitro-bar-fill';
      if (ls.nitroTier === 1) {
        this.nitroFillEl.classList.add('tier-1');
        this.nitroLabelEl.innerText = 'NITRO SURGE ACTIVE';
      } else if (ls.nitroTier === 2) {
        this.nitroFillEl.classList.add('tier-2');
        this.nitroLabelEl.innerText = 'PERFECT BLUE NITRO';
      } else if (ls.nitroTier === 3) {
        this.nitroFillEl.classList.add('tier-3');
        this.nitroLabelEl.innerText = 'SUPER NITRO ACTIVE';
      } else {
        this.nitroLabelEl.innerText = ls.isCountingDown ? 'LOCKED • REV ENGINE' : '[SPACE] NITRO BOOST';
      }
    }

    // 6. Pause Modal Visibility
    if (data.isPaused) {
      this.pauseModalEl.classList.add('active');
    } else {
      this.pauseModalEl.classList.remove('active');
    }

    // 7. Camera Button Label
    if (this.cameraBtnEl) {
      this.cameraBtnEl.innerText = `CAMERA: ${data.cameraModeName} (C)`;
    }
  }

  private setBulbs(activeCount: number, isGreen: boolean): void {
    this.f1Bulbs.forEach((bulb, idx) => {
      if (!bulb) return;
      if (isGreen) {
        bulb.className = 'f1-bulb green';
      } else if (idx < activeCount) {
        bulb.className = 'f1-bulb red';
      } else {
        bulb.className = 'f1-bulb';
      }
    });
  }

  public showCrash(): void {
    this.checkpointBannerEl.innerText = 'WRECKED — RECOVERING TO TRACK';
    this.checkpointBannerEl.classList.add('visible');
  }
}
