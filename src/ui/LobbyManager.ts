export interface ShipSpec {
  id: number;
  name: string;
  speed: string;
  agility: string;
  mass: string;
  role: string;
}

export interface PilotProfile {
  callsign: string;
  bestScore: number;
  solarFragments: number;
  selectedShipIndex: number;
  trailColorHex: number;
}

export const SHIP_DATABASE: ShipSpec[] = [
  { id: 1, name: 'MK-01 AEON BLADE', speed: '920 KM/H', agility: '9.4', mass: '1,250 KG', role: 'Interceptor' },
  { id: 2, name: 'MK-02 VORTEX DRIFTER', speed: '880 KM/H', agility: '9.8', mass: '1,120 KG', role: 'Drift Prototype' },
  { id: 3, name: 'MK-03 HYPERION STRIKE', speed: '960 KM/H', agility: '8.9', mass: '1,420 KG', role: 'Heavy Enforcer' },
  { id: 4, name: 'MK-04 PHANTOM REAPER', speed: '940 KM/H', agility: '9.2', mass: '1,300 KG', role: 'Stealth Scout' },
  { id: 5, name: 'MK-05 CHRONO SPECTRE', speed: '910 KM/H', agility: '9.5', mass: '1,280 KG', role: 'Tactical Recon' },
  { id: 6, name: 'MK-06 SOLIS WARP', speed: '975 KM/H', agility: '8.7', mass: '1,510 KG', role: 'Supersonic Assault' },
  { id: 7, name: 'MK-07 NEBULA GLIDER', speed: '890 KM/H', agility: '9.7', mass: '1,190 KG', role: 'Aero Specialist' },
  { id: 8, name: 'MK-08 APEX PREDATOR', speed: '955 KM/H', agility: '9.1', mass: '1,380 KG', role: 'Combat Interceptor' },
  { id: 9, name: 'MK-09 ZENITH WING', speed: '930 KM/H', agility: '9.3', mass: '1,340 KG', role: 'Endurance Racer' },
  { id: 10, name: 'MK-10 OMEGA ECLIPSE', speed: '990 KM/H', agility: '9.9', mass: '1,050 KG', role: 'Master Prototype' },
];

const ICONS = {
  garage: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  customize: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  race: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  multiplayer: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
};

export class LobbyManager {
  private container: HTMLElement;
  public isInLobby = true;
  public profile: PilotProfile;
  public activeTab: 'garage' | 'customize' | 'race' | 'multiplayer' = 'garage';

  // Turntable interaction
  public turntableRotation = 0.0;
  public isDragging = false;
  private previousMouseX = 0;

  // Callbacks
  private onLaunchCallback: () => void;
  private onShipChangeCallback: (shipIndex: number) => void;
  private onTrailColorChangeCallback: (colorHex: number) => void;
  private onAudioBeep?: () => void;
  private onAudioClick?: () => void;

  constructor(
    onLaunch: () => void,
    onShipChange: (shipIndex: number) => void,
    onTrailColorChange: (colorHex: number) => void,
    onAudioBeep?: () => void,
    onAudioClick?: () => void
  ) {
    this.onLaunchCallback = onLaunch;
    this.onShipChangeCallback = onShipChange;
    this.onTrailColorChangeCallback = onTrailColorChange;
    this.onAudioBeep = onAudioBeep;
    this.onAudioClick = onAudioClick;

    this.profile = this.loadProfile();

    this.container = document.createElement('div');
    this.container.id = 'lobby-container';
    document.body.appendChild(this.container);

    this.render();
    this.setupTurntableControls();
  }

  private loadProfile(): PilotProfile {
    const saved = localStorage.getItem('EGO_PILOT_PROFILE');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return {
      callsign: 'KAIZZCER-01',
      bestScore: 0,
      solarFragments: 150,
      selectedShipIndex: 1,
      trailColorHex: 0x00f0ff,
    };
  }

  public saveProfile(): void {
    localStorage.setItem('EGO_PILOT_PROFILE', JSON.stringify(this.profile));
  }

  public render(): void {
    const activeShip = SHIP_DATABASE.find(s => s.id === this.profile.selectedShipIndex) || SHIP_DATABASE[0];

    this.container.innerHTML = `
      <style>
        #lobby-container {
          position: fixed;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
          z-index: 25;
          pointer-events: none;
          font-family: 'Rajdhani', sans-serif;
          color: #ffffff;
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Top Pilot Command Bar */
        .hangar-top-bar {
          position: absolute;
          top: 24px; left: 32px; right: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .hangar-glass-panel {
          background: rgba(14, 20, 32, 0.42);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 10px 22px;
          display: flex;
          align-items: center;
          gap: 18px;
          pointer-events: auto;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .pilot-avatar-badge {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: linear-gradient(135deg, #00e5ff, #0055ff);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 15px;
          color: #040812;
          box-shadow: 0 0 18px rgba(0, 229, 255, 0.5);
        }

        .callsign-input {
          background: none;
          border: none;
          outline: none;
          color: #00f0ff;
          font-family: 'Orbitron', sans-serif;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 1.5px;
          cursor: text;
          width: 140px;
          border-bottom: 1px dashed rgba(0, 240, 255, 0.4);
        }
        .callsign-input:focus {
          border-bottom: 1px solid #00f0ff;
        }

        /* Top Center Mode Navigation Tabs */
        .hangar-nav-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: auto;
        }

        .hangar-tab-btn {
          background: rgba(14, 20, 32, 0.42);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.8);
          font-family: 'Orbitron', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.8px;
          padding: 10px 18px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        }
        .hangar-tab-btn:hover {
          color: #00f0ff;
          border-color: rgba(0, 240, 255, 0.5);
          background: rgba(0, 240, 255, 0.12);
        }
        .hangar-tab-btn.active {
          color: #040812;
          background: #00f0ff;
          border-color: #00f0ff;
          box-shadow: 0 0 24px rgba(0, 240, 255, 0.7);
        }

        /* Center Inspection Hint */
        .turntable-hint {
          position: absolute;
          top: 86px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          letter-spacing: 3px;
          color: rgba(0, 240, 255, 0.75);
          text-transform: uppercase;
          background: rgba(14, 20, 32, 0.42);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        /* Bottom Command Console */
        .hangar-console-bottom {
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          width: 90%;
          max-width: 960px;
          pointer-events: auto;
        }

        .console-tab-card {
          width: 100%;
          background: rgba(14, 20, 32, 0.48);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 16px;
          padding: 20px 28px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.18);
        }

        /* [GARAGE TAB] Content */
        .ship-selector-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ship-arrow-btn {
          background: rgba(0, 240, 255, 0.12);
          border: 1px solid rgba(0, 240, 255, 0.35);
          color: #00f0ff;
          font-size: 20px;
          width: 38px; height: 38px;
          border-radius: 6px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
        }
        .ship-arrow-btn:hover {
          background: #00f0ff;
          color: #040810;
          box-shadow: 0 0 18px rgba(0, 240, 255, 0.8);
        }

        .ship-model-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 3px;
          color: #ffffff;
          text-shadow: 0 0 15px rgba(0, 240, 255, 0.5);
        }

        .specs-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 14px;
        }

        .spec-item {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 8px 14px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
        }

        .spec-label {
          font-size: 10px;
          letter-spacing: 1.5px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
        }

        .spec-value {
          font-family: 'Orbitron', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #00f0ff;
          margin-top: 2px;
        }

        /* [CUSTOMIZE TAB] Content */
        .customize-section-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 11px;
          letter-spacing: 2.2px;
          color: rgba(0, 240, 255, 0.8);
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .plasma-color-grid {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .plasma-color-card {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .plasma-color-card:hover {
          border-color: rgba(0, 240, 255, 0.6);
        }
        .plasma-color-card.active {
          border-color: #00f0ff;
          background: rgba(0, 240, 255, 0.15);
          box-shadow: 0 0 16px rgba(0, 240, 255, 0.4);
        }

        .plasma-color-dot {
          width: 14px; height: 14px;
          border-radius: 50%;
        }

        /* [RACE TAB] Content */
        .race-options-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 14px;
          align-items: center;
        }

        .race-select-box {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(0, 240, 255, 0.3);
          padding: 8px 12px;
          border-radius: 4px;
          color: #00f0ff;
          font-family: 'Orbitron', sans-serif;
          font-size: 13px;
          font-weight: 700;
          outline: none;
          width: 100%;
        }

        /* Launch Flight Button */
        .launch-engagement-btn {
          width: 100%;
          max-width: 440px;
          padding: 15px 0;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #00f0ff, #0077ff);
          font-family: 'Orbitron', sans-serif;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 3px;
          color: #040810;
          cursor: pointer;
          box-shadow: 0 0 40px rgba(0, 240, 255, 0.7), 0 10px 25px rgba(0, 0, 0, 0.5);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .launch-engagement-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 0 60px rgba(0, 240, 255, 0.95);
        }

        .keybindings-micro-legend {
          font-size: 10px;
          letter-spacing: 2px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
        }
      </style>

      <!-- Top Pilot Info Bar -->
      <div class="hangar-top-bar">
        <div class="hangar-glass-panel">
          <div class="pilot-avatar-badge">CB</div>
          <div>
            <div style="font-size:9px; letter-spacing:1.5px; opacity:0.5;">PILOT CALLSIGN</div>
            <input type="text" class="callsign-input" id="hangar-callsign-input" value="${this.profile.callsign}" maxlength="16" />
          </div>
          <div style="width:1px; height:24px; background:rgba(0,240,255,0.2);"></div>
          <div>
            <div style="font-size:9px; letter-spacing:1.5px; opacity:0.5;">SOLAR FRAGMENTS</div>
            <div style="font-size:15px; font-weight:900; color:#00f0ff;" id="hangar-solar-frags">${this.profile.solarFragments}</div>
          </div>
          <div style="width:1px; height:24px; background:rgba(0,240,255,0.2);"></div>
          <div>
            <div style="font-size:9px; letter-spacing:1.5px; opacity:0.5;">BEST RECORD</div>
            <div style="font-size:15px; font-weight:900; color:#ffe277;" id="hangar-best-score">${this.profile.bestScore.toLocaleString()}</div>
          </div>
        </div>

        <!-- Mode Navigation Tabs -->
        <div class="hangar-nav-tabs">
          <button class="hangar-tab-btn ${this.activeTab === 'garage' ? 'active' : ''}" data-tab="garage">${ICONS.garage} GARAGE</button>
          <button class="hangar-tab-btn ${this.activeTab === 'customize' ? 'active' : ''}" data-tab="customize">${ICONS.customize} CUSTOMIZE</button>
          <button class="hangar-tab-btn ${this.activeTab === 'race' ? 'active' : ''}" data-tab="race">${ICONS.race} RACE</button>
          <button class="hangar-tab-btn ${this.activeTab === 'multiplayer' ? 'active' : ''}" data-tab="multiplayer">${ICONS.multiplayer} MULTIPLAYER</button>
        </div>
      </div>

      <!-- Bottom Hangar Console -->
      <div class="hangar-console-bottom">
        <div class="console-tab-card" id="hangar-tab-content">
          ${this.getTabHTML(activeShip)}
        </div>

        <!-- Launch Flight Button -->
        <button class="launch-engagement-btn" id="hangar-launch-btn">
          ENGAGE FLIGHT
        </button>
      </div>
    `;

    this.hookListeners();
  }

  private getTabHTML(activeShip: ShipSpec): string {
    if (this.activeTab === 'garage') {
      return `
        <div class="ship-selector-bar">
          <button class="ship-arrow-btn" id="hangar-ship-prev">&ltrif;</button>
          <div class="ship-model-title" id="hangar-ship-title">${activeShip.name}</div>
          <button class="ship-arrow-btn" id="hangar-ship-next">&rtrif;</button>
        </div>
        <div class="specs-metrics-grid">
          <div class="spec-item">
            <span class="spec-label">Top Airspeed</span>
            <span class="spec-value" id="hangar-spec-speed">${activeShip.speed}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Agility Index</span>
            <span class="spec-value" id="hangar-spec-agility">${activeShip.agility}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Kinetic Mass</span>
            <span class="spec-value" id="hangar-spec-mass">${activeShip.mass}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Combat Role</span>
            <span class="spec-value" style="color:#ffffff;" id="hangar-spec-role">${activeShip.role}</span>
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'customize') {
      const colors = [
        { name: 'Cyan Nova', hex: 0x00f0ff, css: '#00f0ff' },
        { name: 'Solar Amber', hex: 0xff9900, css: '#ff9900' },
        { name: 'Crimson Core', hex: 0xff2244, css: '#ff2244' },
        { name: 'Void Purple', hex: 0xa020f0, css: '#a020f0' },
        { name: 'Toxic Jade', hex: 0x00e676, css: '#00e676' },
        { name: 'Cryo White', hex: 0xffffff, css: '#ffffff' },
      ];

      return `
        <div class="customize-section-title">VOLUMETRIC AFTERBURNER PLASMA CORE</div>
        <div class="plasma-color-grid">
          ${colors
            .map(
              (c) => `
            <div class="plasma-color-card ${this.profile.trailColorHex === c.hex ? 'active' : ''}" data-color="${c.hex}">
              <div class="plasma-color-dot" style="background:${c.css}; box-shadow:0 0 10px ${c.css};"></div>
              <span style="font-size:12px; font-weight:700;">${c.name}</span>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }

    if (this.activeTab === 'race') {
      return `
        <div style="display: flex; gap: 20px; align-items: center;">
          <!-- Vector Track Schematic Blueprint -->
          <div style="flex: 1.1; background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 10px; padding: 12px; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #00f0ff;">CIRCUIT BLUEPRINT &bull; 3.6 KM</span>
              <span style="font-size: 9px; letter-spacing: 1px; color: rgba(255,255,255,0.5);">ASPHALT 9 &bull; F1 SPEC</span>
            </div>
            <svg viewBox="0 0 340 130" style="width: 100%; height: 110px; display: block; filter: drop-shadow(0 0 8px rgba(0,240,255,0.3));">
              <defs>
                <linearGradient id="track-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#00f0ff" />
                  <stop offset="45%" stop-color="#0077ff" />
                  <stop offset="100%" stop-color="#00f0ff" />
                </linearGradient>
              </defs>
              <!-- Circuit Roadbed Base Ribbon -->
              <path d="M 120 65 C 130 25, 200 15, 260 30 C 310 45, 320 80, 290 100 C 260 120, 200 115, 150 105 C 90 95, 50 120, 30 90 C 15 65, 45 25, 80 30 C 100 35, 110 80, 120 65 Z" 
                    fill="none" stroke="rgba(0, 240, 255, 0.12)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
              <!-- Circuit Racing Line Glow -->
              <path d="M 120 65 C 130 25, 200 15, 260 30 C 310 45, 320 80, 290 100 C 260 120, 200 115, 150 105 C 90 95, 50 120, 30 90 C 15 65, 45 25, 80 30 C 100 35, 110 80, 120 65 Z" 
                    fill="none" stroke="url(#track-grad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
              <!-- Start / Finish Line Gantry -->
              <circle cx="120" cy="65" r="4" fill="#ffffff" stroke="#00f0ff" stroke-width="1.5" />
              <text x="127" y="62" fill="#ffffff" font-size="8" font-family="Orbitron" font-weight="900" letter-spacing="1">START / FINISH</text>
              <!-- Apex Turn Markers -->
              <circle cx="260" cy="30" r="2.5" fill="#ffe277" />
              <text x="264" y="27" fill="#ffe277" font-size="7" font-family="Orbitron">T1 SECTOR 1</text>
              <circle cx="290" cy="100" r="2.5" fill="#ffe277" />
              <text x="250" y="118" fill="#ffe277" font-size="7" font-family="Orbitron">SECTOR 2</text>
              <circle cx="30" cy="90" r="2.5" fill="#ffe277" />
              <text x="12" y="108" fill="#ffe277" font-size="7" font-family="Orbitron">CHICANE</text>
            </svg>
            <div style="display: flex; justify-content: space-between; font-size: 9px; letter-spacing: 1px; color: rgba(255,255,255,0.6); margin-top: 4px;">
              <span>14 APEXES &bull; 8 RIGHT / 6 LEFT</span>
              <span style="color: #ffe277;">RECORD: 1:18.420</span>
            </div>
          </div>

          <!-- Circuit Configuration & Setup -->
          <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
            <div class="race-options-grid" style="grid-template-columns: 1fr 1fr;">
              <div>
                <div class="spec-label" style="margin-bottom:6px;">SELECT RACE TRACK</div>
                <select class="race-select-box" id="race-track-select">
                  <option value="canyon">CANYON GRAND PRIX (3.6 KM)</option>
                  <option value="desert">ALPINE VALLEY SPRINT (2.4 KM)</option>
                </select>
              </div>
              <div>
                <div class="spec-label" style="margin-bottom:6px;">RACE DISTANCE</div>
                <select class="race-select-box" id="race-laps-select">
                  <option value="1">1 LAP (SPRINT)</option>
                  <option value="3" selected>3 LAPS (STANDARD)</option>
                  <option value="5">5 LAPS (ENDURANCE)</option>
                </select>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.06);">
              <div><span class="spec-label">LENGTH</span><div style="font-family:'Orbitron',sans-serif; font-size:13px; color:#00f0ff;">3,601 M</div></div>
              <div><span class="spec-label">ELEVATION</span><div style="font-family:'Orbitron',sans-serif; font-size:13px; color:#ffffff;">34 M &Delta;</div></div>
              <div><span class="spec-label">SPEED CEILING</span><div style="font-family:'Orbitron',sans-serif; font-size:13px; color:#00f0ff;">990 KM/H</div></div>
            </div>
          </div>
        </div>
      `;
    }

    // Multiplayer
    return `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
        <div style="flex:1;">
          <div class="spec-label" style="margin-bottom:6px;">ROOM STATUS</div>
          <div style="font-family:'Orbitron', sans-serif; font-size:15px; color:#00f0ff;">ROOM CODE: CB-7402</div>
          <div style="font-size:11px; opacity:0.6; margin-top:2px;">SUPABASE REALTIME BROADCAST ENGINE CONNECTED</div>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="hangar-tab-btn active" style="padding:8px 14px; font-size:11px;">LIVE CONTACT</button>
          <button class="hangar-tab-btn" style="padding:8px 14px; font-size:11px;">GHOST MODE</button>
        </div>
      </div>
    `;
  }

  private hookListeners(): void {
    // Navigation Tabs
    document.querySelectorAll('.hangar-tab-btn[data-tab]').forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        this.onAudioBeep?.();
        const tab = tabBtn.getAttribute('data-tab') as any;
        if (tab) {
          this.activeTab = tab;
          this.render();
        }
      });
    });

    // Callsign
    const nameInput = document.getElementById('hangar-callsign-input') as HTMLInputElement;
    nameInput?.addEventListener('change', () => {
      this.profile.callsign = nameInput.value.toUpperCase().trim() || 'KAIZZCER-01';
      this.saveProfile();
    });

    // Ship Switching
    document.getElementById('hangar-ship-prev')?.addEventListener('click', () => {
      this.onAudioBeep?.();
      this.cycleShip(-1);
    });

    document.getElementById('hangar-ship-next')?.addEventListener('click', () => {
      this.onAudioBeep?.();
      this.cycleShip(1);
    });

    // Plasma Color Selection
    document.querySelectorAll('.plasma-color-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.onAudioBeep?.();
        document.querySelectorAll('.plasma-color-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        const colorHex = parseInt(card.getAttribute('data-color') || '0x00f0ff', 10);
        this.profile.trailColorHex = colorHex;
        this.saveProfile();
        this.onTrailColorChangeCallback(colorHex);
      });
    });

    // Launch
    document.getElementById('hangar-launch-btn')?.addEventListener('click', () => {
      this.onAudioClick?.();
      this.launch();
    });
  }

  private cycleShip(direction: number): void {
    let nextIdx = this.profile.selectedShipIndex + direction;
    if (nextIdx < 1) nextIdx = 10;
    if (nextIdx > 10) nextIdx = 1;

    this.profile.selectedShipIndex = nextIdx;
    this.saveProfile();

    const activeShip = SHIP_DATABASE.find((s) => s.id === nextIdx) || SHIP_DATABASE[0];

    const titleEl = document.getElementById('hangar-ship-title');
    const speedEl = document.getElementById('hangar-spec-speed');
    const agilityEl = document.getElementById('hangar-spec-agility');
    const massEl = document.getElementById('hangar-spec-mass');
    const roleEl = document.getElementById('hangar-spec-role');

    if (titleEl) titleEl.textContent = activeShip.name;
    if (speedEl) speedEl.textContent = activeShip.speed;
    if (agilityEl) agilityEl.textContent = activeShip.agility;
    if (massEl) massEl.textContent = activeShip.mass;
    if (roleEl) roleEl.textContent = activeShip.role;

    this.onShipChangeCallback(nextIdx);
  }

  private setupTurntableControls(): void {
    window.addEventListener('mousedown', (e) => {
      if (!this.isInLobby) return;
      this.isDragging = true;
      this.previousMouseX = e.clientX;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isInLobby || !this.isDragging) return;
      const deltaX = e.clientX - this.previousMouseX;
      this.previousMouseX = e.clientX;
      this.turntableRotation += deltaX * 0.006;
    });

    const stopDrag = () => {
      this.isDragging = false;
    };

    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mouseleave', stopDrag);

    // Touch support for tablets and mobile displays
    window.addEventListener(
      'touchstart',
      (e) => {
        if (!this.isInLobby || e.touches.length === 0) return;
        this.isDragging = true;
        this.previousMouseX = e.touches[0].clientX;
      },
      { passive: true }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        if (!this.isInLobby || !this.isDragging || e.touches.length === 0) return;
        const deltaX = e.touches[0].clientX - this.previousMouseX;
        this.previousMouseX = e.touches[0].clientX;
        this.turntableRotation += deltaX * 0.006;
      },
      { passive: true }
    );

    window.addEventListener('touchend', stopDrag);
    window.addEventListener('touchcancel', stopDrag);
  }

  public launch(): void {
    this.isInLobby = false;
    this.container.style.opacity = '0';
    this.container.style.display = 'none';
    this.onLaunchCallback();
  }

  public returnToLobby(): void {
    this.isInLobby = true;
    this.container.style.display = 'block';
    this.container.style.opacity = '0';
    this.render();
    requestAnimationFrame(() => {
      this.container.style.opacity = '1';
    });
  }
}
