import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class GarageHangar {
  public group: THREE.Group;
  public isLoaded = false;
  private lightsGroup: THREE.Group;
  public parkingPadCenter = new THREE.Vector3(0, 0.75, 0);

  // Interior safe camera bounds (within 17m x 22m x 12m garage)
  public readonly cameraBounds = {
    minRadius: 4.2,
    maxRadius: 5.6,
    minHeight: 1.4,
    maxHeight: 2.3,
  };

  constructor(_scene?: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'GarageHangarGroup';
    this.lightsGroup = new THREE.Group();
    this.lightsGroup.name = 'GarageLightsGroup';

    this.setupLighting();
    this.loadModel();
  }

  private setupLighting(): void {
    // 1. Soft industrial ambient fill
    const ambientLight = new THREE.AmbientLight(0xdde5ff, 0.95);
    this.lightsGroup.add(ambientLight);

    // 2. Primary overhead showcase spot with High-Resolution Contact Shadow (Cool Daylight LED)
    const mainSpot = new THREE.SpotLight(0xffffff, 5.5, 30, Math.PI / 3.2, 0.45, 1.2);
    mainSpot.position.set(0, 9.0, 0.5);
    mainSpot.target.position.set(0, 0.3, 0);
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 2048;
    mainSpot.shadow.mapSize.height = 2048;
    mainSpot.shadow.camera.near = 0.5;
    mainSpot.shadow.camera.far = 16.0;
    mainSpot.shadow.bias = -0.0003;
    mainSpot.shadow.normalBias = 0.02;
    this.lightsGroup.add(mainSpot);
    this.lightsGroup.add(mainSpot.target);

    // 3. Warm amber underglow bounce (reflecting off yellow metal parking ring)
    const floorBounce = new THREE.PointLight(0xffaa44, 2.2, 14, 1.5);
    floorBounce.position.set(0, 0.6, 0);
    this.lightsGroup.add(floorBounce);

    // 4. Electric blue aero rim backlight
    const rimLight = new THREE.DirectionalLight(0x00d8ff, 2.2);
    rimLight.position.set(0, 4.5, 6.5);
    rimLight.target.position.set(0, 0.5, 0);
    this.lightsGroup.add(rimLight);
    this.lightsGroup.add(rimLight.target);

    // 5. Front accent fill light
    const frontFill = new THREE.DirectionalLight(0xffeedd, 1.6);
    frontFill.position.set(0, 3.2, -6.0);
    frontFill.target.position.set(0, 0.5, 0);
    this.lightsGroup.add(frontFill);
    this.lightsGroup.add(frontFill.target);
  }

  private loadModel(): void {
    const loader = new GLTFLoader();
    loader.load(
      '/assets/models/garageforlobby.glb',
      (gltf) => {
        const model = gltf.scene;
        model.name = 'GarageHangarMesh';

        // Enhance PBR materials for realistic architectural hangar feel
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.envMapIntensity = 1.4;
              if (mesh.name.includes('YellowMetal') || mesh.name.includes('Circle')) {
                // Parking circle metal accents with high anisotropic reflectivity
                mat.roughness = 0.28;
                mat.metalness = 0.90;
                mat.envMapIntensity = 1.8;
              } else if (mesh.name.includes('wALL') || mesh.name.includes('Cube')) {
                // Industrial matte walls
                mat.roughness = 0.70;
                mat.metalness = 0.25;
              }
            }
          }
        });

        this.group.add(model);
        this.isLoaded = true;
      },
      undefined,
      (err) => {
        console.warn('Garage model load fallback:', err);
      }
    );
  }

  public setVisible(visible: boolean, scene: THREE.Scene): void {
    if (visible) {
      if (!scene.getObjectByName('GarageHangarGroup')) {
        scene.add(this.group);
        scene.add(this.lightsGroup);
      }
      this.group.visible = true;
      this.lightsGroup.visible = true;
    } else {
      this.group.visible = false;
      this.lightsGroup.visible = false;
    }
  }

  public dispose(scene: THREE.Scene): void {
    scene.remove(this.group);
    scene.remove(this.lightsGroup);
  }
}
