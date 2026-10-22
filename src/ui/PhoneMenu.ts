import { ProceduralMusicPlayer } from '../audio/ProceduralMusicPlayer';
import { MUSIC_CATALOG } from '../audio/MusicDatabase';

export class PhoneMenu {
  public isOpen = false;
  private container: HTMLElement;
  private player: ProceduralMusicPlayer;
  private activeTab: 'music' | 'lyrics' | 'telemetry' = 'music';

  constructor(player: ProceduralMusicPlayer) {
    this.player = player;
    this.container = document.createElement('div');
    this.container.id = 'phone-menu-root';
    document.body.appendChild(this.container);

    this.render();
    this.setupListeners();

    // Listen to track changes to update UI
    this.player.onTrackChange(() => {
      this.updatePlayerUI();
      if (this.activeTab === 'lyrics') {
        this.renderLyricsTab();
      }
    });
  }

  public toggle(): void {
    this.isOpen = !this.isOpen;
    const phone = document.getElementById('cyber-phone');
    if (phone) {
      if (this.isOpen) {
        phone.classList.add('open');
      } else {
        phone.classList.remove('open');
      }
    }
  }

  private setupListeners(): void {
    // Press 'M' or 'P' to toggle phone
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM' || e.code === 'KeyP') {
        this.toggle();
      }
    });
  }

  private render(): void {
    this.container.innerHTML = `
      <style>
        /* Floating Cyber-Phone Toggle Button */
        #phone-fab {
          position: fixed;
          bottom: 28px;
          right: 28px;
          width: 58px;
          height: 58px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 240, 255, 0.4);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.25);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 99;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: auto;
        }
        #phone-fab:hover {
          transform: scale(1.08);
          border-color: #00f0ff;
          box-shadow: 0 0 30px rgba(0, 240, 255, 0.5);
        }
        #phone-fab svg {
          width: 26px;
          height: 26px;
          fill: none;
          stroke: #00f0ff;
          stroke-width: 2;
        }

        /* Futuristic Holographic Smartphone Shell */
        #cyber-phone {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 380px;
          height: 640px;
          background: rgba(11, 15, 25, 0.88);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 36px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(0, 240, 255, 0.18);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 100;
          transform: translateX(450px) scale(0.95);
          opacity: 0;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: auto;
          font-family: 'Rajdhani', sans-serif;
          color: #fff;
        }
        #cyber-phone.open {
          transform: translateX(0) scale(1);
          opacity: 1;
        }

        /* Top Notch / Status Bar */
        .phone-status-bar {
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          color: rgba(255, 255, 255, 0.6);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .phone-notch {
          width: 80px;
          height: 8px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }

        /* Tabs Navigation */
        .phone-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.04);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .phone-tab-btn {
          flex: 1;
          padding: 10px 0;
          text-align: center;
          font-family: 'Orbitron', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
        }
        .phone-tab-btn.active {
          color: #00f0ff;
          border-bottom-color: #00f0ff;
          background: rgba(0, 240, 255, 0.06);
        }

        /* Content Body */
        .phone-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .phone-content::-webkit-scrollbar {
          width: 4px;
        }
        .phone-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }

        /* Mini Now Playing Card */
        .now-playing-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(0, 240, 255, 0.05));
          border: 1px solid rgba(0, 240, 255, 0.2);
          border-radius: 18px;
          padding: 14px;
          margin-bottom: 16px;
        }
        .now-playing-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .album-art-thumb {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #ff007f;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        }
        .track-info {
          flex: 1;
          overflow: hidden;
        }
        .track-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .track-artist {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        /* Controls Row */
        .controls-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-top: 12px;
        }
        .ctrl-btn {
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease;
        }
        .ctrl-btn:hover {
          transform: scale(1.15);
          color: #00f0ff;
        }
        .play-main-btn {
          width: 42px;
          height: 42px;
          background: #00f0ff;
          border-radius: 50%;
          color: #050608;
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.6);
        }

        /* Visualizer Bars */
        .visualizer-container {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 18px;
          margin-top: 10px;
        }
        .vis-bar {
          flex: 1;
          background: #00f0ff;
          border-radius: 2px;
          height: 4px;
          animation: bounce 0.8s infinite alternate ease-in-out;
        }
        @keyframes bounce {
          from { height: 3px; }
          to { height: 16px; }
        }

        /* Song List Items */
        .song-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 12px;
          margin-bottom: 6px;
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .song-item:hover {
          background: rgba(0, 240, 255, 0.1);
          transform: translateX(4px);
        }
        .song-item.active {
          background: rgba(0, 240, 255, 0.18);
          border: 1px solid rgba(0, 240, 255, 0.35);
        }
        .song-meta-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .song-badge {
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
        }

        /* Lyrics Tab Styles */
        .lyrics-container {
          padding: 8px 4px;
          line-height: 1.6;
        }
        .lyric-line {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 6px;
          transition: color 0.2s ease;
        }
        .lyric-section-header {
          font-family: 'Orbitron', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #00f0ff;
          margin-top: 14px;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      </style>

      <!-- FAB Phone Toggle -->
      <div id="phone-fab" title="Open EGO Cyber-Phone (M)">
        <svg viewBox="0 0 24 24">
          <rect x="5" y="2" width="14" height="20" rx="3" ry="3"></rect>
          <line x1="12" y1="18" x2="12" y2="18.01"></line>
        </svg>
      </div>

      <!-- Cyber-Phone Modal -->
      <div id="cyber-phone">
        <div class="phone-status-bar">
          <div>EGO OS 4.6</div>
          <div class="phone-notch"></div>
          <div>5G &bull; 99%</div>
        </div>

        <div class="phone-tabs">
          <div class="phone-tab-btn active" id="tab-btn-music">MUSIC (35)</div>
          <div class="phone-tab-btn" id="tab-btn-lyrics">LYRICS</div>
          <div class="phone-tab-btn" id="tab-btn-telemetry">TELEMETRY</div>
        </div>

        <div class="phone-content" id="phone-main-content">
          <!-- Dynamically filled by tab -->
        </div>
      </div>
    `;

    document.getElementById('phone-fab')!.addEventListener('click', () => this.toggle());

    document.getElementById('tab-btn-music')!.addEventListener('click', () => this.switchTab('music'));
    document.getElementById('tab-btn-lyrics')!.addEventListener('click', () => this.switchTab('lyrics'));
    document.getElementById('tab-btn-telemetry')!.addEventListener('click', () => this.switchTab('telemetry'));

    this.renderMusicTab();
  }

  private switchTab(tab: 'music' | 'lyrics' | 'telemetry'): void {
    this.activeTab = tab;
    document.querySelectorAll('.phone-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-btn-${tab}`)?.classList.add('active');

    if (tab === 'music') this.renderMusicTab();
    if (tab === 'lyrics') this.renderLyricsTab();
    if (tab === 'telemetry') this.renderTelemetryTab();
  }

  private renderMusicTab(): void {
    const song = this.player.getCurrentSong();
    const content = document.getElementById('phone-main-content');
    if (!content) return;

    let songsHtml = '';
    MUSIC_CATALOG.forEach((s, idx) => {
      const isActive = idx === this.player.currentTrackIndex;
      songsHtml += `
        <div class="song-item ${isActive ? 'active' : ''}" data-index="${idx}">
          <div class="song-meta-left">
            <div style="font-size:12px; font-weight:700; width:18px; color:rgba(255,255,255,0.4)">${idx + 1}</div>
            <div>
              <div style="font-size:13px; font-weight:700;">${s.title}</div>
              <div style="font-size:11px; opacity:0.6;">${s.artist} &bull; ${s.bpm} BPM</div>
            </div>
          </div>
          <div style="text-align:right">
            <span class="song-badge">${s.genre.split('/')[0]}</span>
            <div style="font-size:11px; opacity:0.5; margin-top:2px;">${s.duration}</div>
          </div>
        </div>
      `;
    });

    content.innerHTML = `
      <div class="now-playing-card">
        <div class="now-playing-header">
          <div class="album-art-thumb" id="mini-album-art" style="background:${song.albumArtColor}">🎵</div>
          <div class="track-info">
            <div class="track-title" id="mini-track-title">${song.title}</div>
            <div class="track-artist" id="mini-track-artist">${song.artist}</div>
          </div>
        </div>

        <div class="visualizer-container" id="mini-vis" style="display:${this.player.isPlaying ? 'flex' : 'none'}">
          ${Array.from({ length: 18 }).map((_, i) => `<div class="vis-bar" style="animation-delay:${(i * 0.08).toFixed(2)}s"></div>`).join('')}
        </div>

        <div class="controls-row">
          <button class="ctrl-btn" id="ctrl-prev">⏮</button>
          <button class="ctrl-btn play-main-btn" id="ctrl-play">${this.player.isPlaying ? '⏸' : '▶'}</button>
          <button class="ctrl-btn" id="ctrl-next">⏭</button>
        </div>
      </div>

      <div style="font-size:11px; font-weight:700; color:rgba(255,255,255,0.4); margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">
        TRACK CATALOG (${MUSIC_CATALOG.length})
      </div>

      <div id="songs-list">
        ${songsHtml}
      </div>
    `;

    // Hook listeners
    document.getElementById('ctrl-play')?.addEventListener('click', () => {
      this.player.togglePlay();
      this.updatePlayerUI();
    });

    document.getElementById('ctrl-prev')?.addEventListener('click', () => {
      this.player.prevTrack();
      this.updatePlayerUI();
    });

    document.getElementById('ctrl-next')?.addEventListener('click', () => {
      this.player.nextTrack();
      this.updatePlayerUI();
    });

    document.querySelectorAll('.song-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-index') || '0', 10);
        this.player.selectTrack(idx);
        this.player.play();
        this.renderMusicTab();
      });
    });
  }

  private renderLyricsTab(): void {
    const song = this.player.getCurrentSong();
    const content = document.getElementById('phone-main-content');
    if (!content) return;

    if (song.isInstrumental || !song.lyrics || song.lyrics.length === 0) {
      content.innerHTML = `
        <div style="text-align:center; padding: 40px 10px; opacity:0.6;">
          <div style="font-size:36px; margin-bottom:12px;">🎧</div>
          <div style="font-family:'Orbitron',sans-serif; font-size:16px; font-weight:700;">INSTRUMENTAL TRACK</div>
          <div style="font-size:13px; margin-top:6px;">Pure sonic adrenaline. No spoken lyrics on this flight.</div>
        </div>
      `;
      return;
    }

    let lyricsHtml = '';
    song.lyrics.forEach(line => {
      if (line.startsWith('[')) {
        lyricsHtml += `<div class="lyric-section-header">${line}</div>`;
      } else if (line.trim() === '') {
        lyricsHtml += `<div style="height:8px"></div>`;
      } else {
        lyricsHtml += `<div class="lyric-line">${line}</div>`;
      }
    });

    content.innerHTML = `
      <div style="margin-bottom:16px;">
        <div style="font-family:'Orbitron',sans-serif; font-size:16px; font-weight:700; color:#00f0ff;">${song.title}</div>
        <div style="font-size:12px; opacity:0.6;">${song.artist} &bull; ${song.genre}</div>
      </div>
      <div class="lyrics-container">
        ${lyricsHtml}
      </div>
    `;
  }

  private renderTelemetryTab(): void {
    const content = document.getElementById('phone-main-content');
    if (!content) return;

    content.innerHTML = `
      <div style="font-family:'Orbitron',sans-serif; font-size:14px; font-weight:700; color:#00f0ff; margin-bottom:14px;">
        FLIGHT AVIONICS & SENSORS
      </div>
      <div style="background:rgba(255,255,255,0.04); border-radius:14px; padding:14px; margin-bottom:10px;">
        <div style="font-size:11px; opacity:0.5;">PROPULSION ENGINE</div>
        <div style="font-size:16px; font-weight:700; margin-top:2px;">Wieselsberger Ground-Effect Drive</div>
        <div style="font-size:12px; color:#00f0ff; margin-top:4px;">120Hz Decoupled PID Stabilizer (ACTIVE)</div>
      </div>
      <div style="background:rgba(255,255,255,0.04); border-radius:14px; padding:14px; margin-bottom:10px;">
        <div style="font-size:11px; opacity:0.5;">CELESTIAL RESONANCE</div>
        <div style="font-size:16px; font-weight:700; margin-top:2px;">Solar & Lunar Dual Photonic Cells</div>
        <div style="font-size:12px; color:#ffe277; margin-top:4px;">Infinite Endurance &bull; Zero Fuel Depletion</div>
      </div>
      <div style="background:rgba(255,255,255,0.04); border-radius:14px; padding:14px;">
        <div style="font-size:11px; opacity:0.5;">HOTKEYS</div>
        <div style="font-size:12px; line-height:1.8; margin-top:6px;">
          <div><b>WASD / Arrows</b> — Skim & Steering</div>
          <div><b>V</b> — Toggle 1st / 3rd Person View</div>
          <div><b>M / P</b> — Open / Close Cyber-Phone</div>
          <div><b>Shift</b> — Boost Burst</div>
          <div><b>Space</b> — Instant Rebirth (on crash)</div>
        </div>
      </div>
    `;
  }

  private updatePlayerUI(): void {
    const song = this.player.getCurrentSong();
    const titleEl = document.getElementById('mini-track-title');
    const artistEl = document.getElementById('mini-track-artist');
    const playBtn = document.getElementById('ctrl-play');
    const artThumb = document.getElementById('mini-album-art');
    const vis = document.getElementById('mini-vis');

    if (titleEl) titleEl.textContent = song.title;
    if (artistEl) artistEl.textContent = song.artist;
    if (playBtn) playBtn.textContent = this.player.isPlaying ? '⏸' : '▶';
    if (artThumb) artThumb.style.background = song.albumArtColor;
    if (vis) vis.style.display = this.player.isPlaying ? 'flex' : 'none';

    document.querySelectorAll('.song-item').forEach((el, idx) => {
      if (idx === this.player.currentTrackIndex) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }
}
