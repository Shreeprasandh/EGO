import { InputState } from '../types/game';

export class InputManager {
  private keys: Record<string, boolean> = {};
  private mouseDeltaX = 0;
  private mouseDeltaY = 0;
  private isPointerLocked = false;
  
  // Smoothed input state
  public state: InputState = {
    forward: 0,
    turn: 0,
    lookX: 0,
    lookY: 0,
    activatePower: false,
    toggleCamera: false,
    brake: false,
    boost: false,
  };

  // Virtual mobile touch state
  public mobileTouch = {
    steerX: 0,
    throttleY: 0,
    boost: false,
    brake: false,
    powerTapped: false,
    cameraToggled: false,
  };

  constructor(canvas: HTMLElement) {
    this.setupKeyboard();
    this.setupMouse(canvas);
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyV' || e.code === 'KeyC') {
        this.state.toggleCamera = true;
      }
      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.state.activatePower = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  private setupMouse(canvas: HTMLElement): void {
    canvas.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        canvas.requestPointerLock?.();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === canvas;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
      }
    });
  }

  /**
   * Poll Gamepad API if available
   */
  private pollGamepad(): { steer: number; throttle: number; boost: boolean; brake: boolean } {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp) return { steer: 0, throttle: 0, boost: false, brake: false };

    const deadzone = 0.15;
    let stickX = gp.axes[0] || 0;
    let stickY = gp.axes[1] || 0;

    if (Math.abs(stickX) < deadzone) stickX = 0;
    if (Math.abs(stickY) < deadzone) stickY = 0;

    const rTrigger = gp.buttons[7]?.value || 0;
    const lTrigger = gp.buttons[6]?.value || 0;

    if (gp.buttons[0]?.pressed) this.state.activatePower = true;
    if (gp.buttons[3]?.pressed) this.state.toggleCamera = true;

    return {
      steer: stickX,
      throttle: rTrigger > 0.1 ? rTrigger : -stickY,
      boost: rTrigger > 0.8,
      brake: lTrigger > 0.2,
    };
  }

  /**
   * Update and smooth input frame
   */
  public update(): InputState {
    let rawForward = 0;
    let rawTurn = 0;

    // 1. Keyboard mappings
    if (this.keys['KeyW'] || this.keys['ArrowUp']) rawForward += 1.0;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) rawForward -= 1.0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) rawTurn -= 1.0;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) rawTurn += 1.0;

    // 2. Controller mappings
    const gp = this.pollGamepad();
    if (Math.abs(gp.steer) > 0.1) rawTurn = gp.steer;
    if (Math.abs(gp.throttle) > 0.1) rawForward = gp.throttle;

    // 3. Mobile touch mappings
    if (Math.abs(this.mobileTouch.steerX) > 0.05) rawTurn = this.mobileTouch.steerX;
    if (Math.abs(this.mobileTouch.throttleY) > 0.05) rawForward = this.mobileTouch.throttleY;
    if (this.mobileTouch.powerTapped) {
      this.state.activatePower = true;
      this.mobileTouch.powerTapped = false;
    }
    if (this.mobileTouch.cameraToggled) {
      this.state.toggleCamera = true;
      this.mobileTouch.cameraToggled = false;
    }

    // 4. Agile Responsive Smoothing (alpha = 0.45 for immediate steering reaction)
    const alpha = 0.45;
    this.state.forward += (rawForward - this.state.forward) * alpha;
    this.state.turn += (rawTurn - this.state.turn) * alpha;

    // 5. Look around deltas
    this.state.lookX = this.mouseDeltaX * 0.0025;
    this.state.lookY = this.mouseDeltaY * 0.0025;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;

    this.state.boost = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || gp.boost || this.mobileTouch.boost;
    this.state.brake = this.keys['KeyS'] || gp.brake || this.mobileTouch.brake;
    // Engage drift when braking or holding drift key while turning
    this.state.drift = (this.state.brake || this.keys['Space']) && Math.abs(this.state.turn) > 0.2;

    return this.state;
  }

  /**
   * Consume single-fire triggers
   */
  public consumeCameraToggle(): boolean {
    const val = this.state.toggleCamera;
    this.state.toggleCamera = false;
    return val;
  }

  public consumePowerTrigger(): boolean {
    const val = this.state.activatePower;
    this.state.activatePower = false;
    return val;
  }
}
