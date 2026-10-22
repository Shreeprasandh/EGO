import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { CELESTIAL_CONSTANTS } from '../utils/constants';

export class CelestialEngine {
  public sunLight: THREE.DirectionalLight;
  public moonLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  public hemiLight: THREE.HemisphereLight;

  // Celestial Cycle Time (0.0 - 1.0)
  public timeOfDay = 0.25;
  public cycleSpeed = 1.0 / CELESTIAL_CONSTANTS.CYCLE_DURATION_SECONDS;

  private rgbeLoader = new RGBELoader();
  public daySkyTexture: THREE.DataTexture | null = null;
  public nightSkyTexture: THREE.DataTexture | null = null;
  private currentSkyMode: 'day' | 'night' | 'none' = 'none';

  public dayFallback = new THREE.Color(0x3e6894);
  public nightFallback = new THREE.Color(0x040816);
  private starDome!: THREE.Points;
  public isOutdoor = true;

  constructor(scene: THREE.Scene) {
    // 0. Procedural Celestial Starfield Dome for Night Atmosphere
    this.createStarDome(scene);
    // 1. Directional Sun (Golden Alpine Sunlight)
    this.sunLight = new THREE.DirectionalLight(0xfff4e6, 2.8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10.0;
    this.sunLight.shadow.camera.far = 1400.0;
    const shadowDist = 240.0;
    this.sunLight.shadow.camera.left = -shadowDist;
    this.sunLight.shadow.camera.right = shadowDist;
    this.sunLight.shadow.camera.top = shadowDist;
    this.sunLight.shadow.camera.bottom = -shadowDist;
    this.sunLight.shadow.bias = -0.0002;
    scene.add(this.sunLight);
    scene.add(this.sunLight.target);

    // 2. Moon Light (Crisp lunar illumination for striking night races)
    this.moonLight = new THREE.DirectionalLight(0xa0c4ff, 1.6);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.moonLight.shadow.bias = -0.0002;
    scene.add(this.moonLight);
    scene.add(this.moonLight.target);

    // 3. Ambient & Hemisphere Light (Crisp European Alpine Sky & Grass Bounce)
    this.ambientLight = new THREE.AmbientLight(0x3a5272, 0.75);
    scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xdcf0ff, 0x223c20, 0.85);
    scene.add(this.hemiLight);

    // 4. Preload Photorealistic HDR Skyboxes (Day sunset + Night starry sky)
    this.preloadHDRSkyboxes(scene);
  }

  private preloadHDRSkyboxes(scene: THREE.Scene): void {
    // 1. Day / Sunset HDR
    this.rgbeLoader.load(
      '/textures/sky/sunset_1k.hdr',
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.daySkyTexture = texture;
        if (this.isOutdoor && (this.currentSkyMode === 'day' || this.currentSkyMode === 'none')) {
          this.currentSkyMode = 'day';
          scene.background = texture;
          scene.environment = texture;
        }
      },
      undefined,
      (err) => console.warn('Day HDR skybox fallback:', err)
    );

    // 2. Night HDR
    this.rgbeLoader.load(
      '/textures/sky/night_1k.hdr',
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.nightSkyTexture = texture;
        if (this.isOutdoor && this.currentSkyMode === 'night') {
          scene.background = texture;
          scene.environment = texture;
        }
      },
      undefined,
      (err) => console.warn('Night HDR skybox fallback:', err)
    );
  }

  private createStarDome(scene: THREE.Scene): void {
    const starCount = 950;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85); // Upper hemisphere only
      const r = 1100.0;
      pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) + 20.0;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xddeeff,
      size: 2.2,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.starDome = new THREE.Points(geo, mat);
    this.starDome.visible = false;
    scene.add(this.starDome);
  }

  public update(dt: number, playerPos: THREE.Vector3, scene: THREE.Scene): { isNight: boolean; sunElevation: number } {
    this.timeOfDay = (this.timeOfDay + dt * this.cycleSpeed) % 1.0;

    const theta = this.timeOfDay * Math.PI * 2.0;
    const R = CELESTIAL_CONSTANTS.SUN_ORBIT_RADIUS;

    const sunX = playerPos.x + Math.cos(theta) * R;
    const sunY = Math.sin(theta) * R;
    const sunZ = playerPos.z + 180.0;

    this.sunLight.position.set(sunX, Math.max(sunY, -80), sunZ);
    this.sunLight.target.position.copy(playerPos);

    const isNight = sunY < 0;
    const sunElevation = sunY / R;

    // Center star dome around player
    if (this.starDome) {
      this.starDome.position.copy(playerPos);
      this.starDome.visible = this.isOutdoor && isNight;
    }

    // Switch HDR Skybox texture dynamically in outdoor mode
    if (this.isOutdoor) {
      if (isNight && this.currentSkyMode !== 'night') {
        this.currentSkyMode = 'night';
        scene.background = this.nightSkyTexture || this.nightFallback;
        scene.environment = this.nightSkyTexture || null;
      } else if (!isNight && this.currentSkyMode !== 'day') {
        this.currentSkyMode = 'day';
        scene.background = this.daySkyTexture || this.dayFallback;
        scene.environment = this.daySkyTexture || null;
      }
    }

    if (!isNight) {
      const sunsetFactor = Math.max(0, 1.0 - Math.abs(sunElevation) * 2.8);
      this.sunLight.color.lerpColors(
        new THREE.Color(0xfff4e6),
        new THREE.Color(0xff8833),
        sunsetFactor
      );
      this.sunLight.intensity = Math.max(0.6, sunElevation * 2.8);
      this.moonLight.intensity = 0.0;

      // Atmospheric fresh alpine haze (replaces brown desert dust)
      const dayFogColor = sunsetFactor > 0.4 ? 0xb86438 : 0x769ac2;
      scene.fog = new THREE.FogExp2(dayFogColor, 0.00065);
    } else {
      this.sunLight.intensity = 0.0;
      this.moonLight.intensity = Math.min(1.8, Math.abs(sunElevation) * 2.2);
      this.moonLight.position.set(playerPos.x - sunX, -sunY, playerPos.z - sunZ);
      this.moonLight.target.position.copy(playerPos);

      // Deep sapphire midnight celestial haze with sparkling stars
      scene.fog = new THREE.FogExp2(0x080e22, 0.00085);
    }

    return { isNight, sunElevation };
  }

  public setOutdoorLightingVisible(visible: boolean, scene: THREE.Scene, fallbackEnv?: THREE.Texture): void {
    this.isOutdoor = visible;
    this.sunLight.visible = visible;
    this.moonLight.visible = visible;
    this.ambientLight.visible = visible;
    this.hemiLight.visible = visible;
    if (this.starDome) this.starDome.visible = visible && this.currentSkyMode === 'night';

    if (!visible) {
      scene.fog = null;
      if (fallbackEnv) {
        scene.environment = fallbackEnv;
      }
    } else {
      const activeTexture = this.currentSkyMode === 'night' ? this.nightSkyTexture : this.daySkyTexture;
      if (activeTexture) {
        scene.background = activeTexture;
        scene.environment = activeTexture;
      } else {
        scene.background = this.currentSkyMode === 'night' ? this.nightFallback : this.dayFallback;
        if (fallbackEnv) {
          scene.environment = fallbackEnv;
        }
      }
    }
  }

  public getCurrentEnvironment(): THREE.Texture | null {
    return this.currentSkyMode === 'night' ? this.nightSkyTexture : this.daySkyTexture;
  }

  public getCurrentBackground(): THREE.Texture | THREE.Color {
    const active = this.currentSkyMode === 'night' ? this.nightSkyTexture : this.daySkyTexture;
    return active || (this.currentSkyMode === 'night' ? this.nightFallback : this.dayFallback);
  }
}
