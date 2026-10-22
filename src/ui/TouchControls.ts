import { InputManager } from '../player/InputManager';

export class TouchControls {
  private container: HTMLElement;
  private inputManager: InputManager;
  private joystickBase!: HTMLElement;
  private joystickKnob!: HTMLElement;

  private isDraggingJoystick = false;
  private joystickCenter = { x: 0, y: 0 };
  private maxRadius = 45;
  private isTouchDevice = false;
  private isRequestedVisible = false;

  constructor(inputManager: InputManager) {
    this.inputManager = inputManager;
    this.container = document.createElement('div');
    this.container.id = 'touch-controls-layer';
    document.body.appendChild(this.container);

    // Strictly detect pure touch mobile devices (touch-only screen with no fine mouse pointer)
    const isPureMobile = window.matchMedia('(pointer: coarse)').matches &&
                         !window.matchMedia('(pointer: fine)').matches;
    this.isTouchDevice = isPureMobile;

    this.render();
    this.container.style.display = 'none';

    // If actual touch interactions occur on a hybrid device without keyboard
    window.addEventListener('touchstart', () => {
      this.isTouchDevice = true;
      if (this.isRequestedVisible) {
        this.container.style.display = 'block';
      }
    }, { passive: true });

    // If keyboard or mouse used, permanently hide on-screen mobile controls
    window.addEventListener('keydown', () => {
      this.isTouchDevice = false;
      this.container.style.display = 'none';
    });
    window.addEventListener('mousedown', () => {
      if (!isPureMobile) {
        this.isTouchDevice = false;
        this.container.style.display = 'none';
      }
    });

    this.setupJoystickEvents();
  }

  private render(): void {
    this.container.innerHTML = `
      <style>
        #touch-controls-layer {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          pointer-events: none;
          z-index: 60;
          user-select: none;
          -webkit-user-select: none;
        }

        /* Virtual Joystick (Bottom Left) */
        .touch-joystick-base {
          position: absolute;
          bottom: 38px;
          left: 38px;
          width: 110px;
          height: 110px;
          background: rgba(10, 16, 28, 0.45);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 2px solid rgba(0, 240, 255, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: auto;
          box-shadow: 0 0 25px rgba(0, 240, 255, 0.2);
        }

        .touch-joystick-knob {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #00f0ff, #0077aa);
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.6);
          position: relative;
          transition: transform 0.05s ease-out;
        }

        /* Right Touch Action Buttons Cluster */
        .touch-actions-cluster {
          position: absolute;
          bottom: 38px;
          right: 38px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: flex-end;
          pointer-events: auto;
        }

        .touch-btn-row {
          display: flex;
          gap: 12px;
        }

        .touch-action-btn {
          width: 58px;
          height: 58px;
          background: rgba(10, 16, 28, 0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-family: 'Orbitron', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        }

        .touch-action-btn:active {
          transform: scale(0.92);
        }

        .touch-btn-boost {
          border-color: #00f0ff;
          color: #00f0ff;
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.35);
        }

        .touch-btn-brake {
          border-color: #ff3344;
          color: #ff3344;
          box-shadow: 0 0 15px rgba(255, 51, 68, 0.35);
        }

        .touch-btn-cam {
          border-color: #ffe277;
          color: #ffe277;
        }
      </style>

      <!-- Left Virtual Joystick -->
      <div class="touch-joystick-base" id="virtual-joystick-base">
        <div class="touch-joystick-knob" id="virtual-joystick-knob"></div>
      </div>

      <!-- Right Action Buttons -->
      <div class="touch-actions-cluster">
        <div class="touch-btn-row">
          <button class="touch-action-btn touch-btn-cam" id="touch-cam-btn">
            CAM
          </button>
          <button class="touch-action-btn touch-btn-brake" id="touch-brake-btn">
            BRAKE
          </button>
        </div>
        <div class="touch-btn-row">
          <button class="touch-action-btn touch-btn-boost" id="touch-boost-btn" style="width:72px; height:72px; font-size:12px;">
            BOOST
          </button>
        </div>
      </div>
    `;

    this.joystickBase = document.getElementById('virtual-joystick-base')!;
    this.joystickKnob = document.getElementById('virtual-joystick-knob')!;

    // Boost & Brake Touch Listeners
    const boostBtn = document.getElementById('touch-boost-btn');
    boostBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputManager.mobileTouch.throttleY = 1.0;
      this.inputManager.mobileTouch.boost = true;
    });
    boostBtn?.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.inputManager.mobileTouch.throttleY = 0.0;
      this.inputManager.mobileTouch.boost = false;
    });

    const brakeBtn = document.getElementById('touch-brake-btn');
    brakeBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputManager.mobileTouch.throttleY = -1.0;
      this.inputManager.mobileTouch.brake = true;
    });
    brakeBtn?.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.inputManager.mobileTouch.throttleY = 0.0;
      this.inputManager.mobileTouch.brake = false;
    });

    const camBtn = document.getElementById('touch-cam-btn');
    camBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.inputManager.mobileTouch.cameraToggled = true;
    });
  }

  private setupJoystickEvents(): void {
    const onStart = (clientX: number, clientY: number) => {
      this.isDraggingJoystick = true;
      const rect = this.joystickBase.getBoundingClientRect();
      this.joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      onMove(clientX, clientY);
    };

    const onMove = (clientX: number, clientY: number) => {
      if (!this.isDraggingJoystick) return;

      const deltaX = clientX - this.joystickCenter.x;
      const deltaY = clientY - this.joystickCenter.y;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const angle = Math.atan2(deltaY, deltaX);

      const clampedDist = Math.min(dist, this.maxRadius);
      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;

      this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

      // Map to InputManager (-1 to 1)
      this.inputManager.mobileTouch.steerX = knobX / this.maxRadius;
      this.inputManager.mobileTouch.throttleY = -knobY / this.maxRadius;
    };

    const onEnd = () => {
      if (!this.isDraggingJoystick) return;
      this.isDraggingJoystick = false;
      this.joystickKnob.style.transform = 'translate(0px, 0px)';
      this.inputManager.mobileTouch.steerX = 0;
      this.inputManager.mobileTouch.throttleY = 0;
    };

    // Touch events for mobile
    this.joystickBase.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      onStart(t.clientX, t.clientY);
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDraggingJoystick) return;
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    });

    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);

    // Mouse fallback for desktop testing
    this.joystickBase.addEventListener('mousedown', (e) => {
      onStart(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      onMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', onEnd);
  }

  public setVisible(visible: boolean): void {
    this.isRequestedVisible = visible;
    this.container.style.display = (visible && this.isTouchDevice) ? 'block' : 'none';
  }
}
