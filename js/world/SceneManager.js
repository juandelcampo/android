import * as THREE from 'three';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.textureLoader = new THREE.TextureLoader();

        // Niebla nocturna que funde el horizonte con el skybox
        const fogColor = 0x0c121d;
        this.scene.fog = new THREE.Fog(fogColor, 30, 220);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
        this.camera.position.set(0, 1.6, 0);

        this.clock = new THREE.Clock();

        // Iluminación global limpia (SOLO 2 LUCES: 0 lag)
        this.ambientLight = new THREE.AmbientLight(0x3a4863, 1.2);
        this.scene.add(this.ambientLight);

        this.moonLight = new THREE.DirectionalLight(0x7799cc, 1.5);
        this.moonLight.position.set(-40, 60, -20);
        this.scene.add(this.moonLight);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.domElement.id = 'three-canvas';
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // Limitar la resolución interna en pantallas Retina/4K para garantizar 60 FPS
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        document.body.appendChild(this.renderer.domElement);

        this.shakeIntensity = 0;
        this.shakeDecay = 5.0;

        this.loadSkybox('./assets/Skyboxes/skybox-night.png');
        this.setupResize();
    }

    loadSkybox(imagePath) {
        if (this.skyDome) this.scene.remove(this.skyDome);
        this.textureLoader.load(imagePath, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            const skyGeo = new THREE.SphereGeometry(350, 32, 16);
            const skyMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, fog: false });
            this.skyDome = new THREE.Mesh(skyGeo, skyMat);
            this.skyDome.rotation.y = Math.PI;
            this.scene.add(this.skyDome);
        });
    }

    add(object) { this.scene.add(object); }
    getDelta() { return this.clock.getDelta(); }
    triggerShake(i) { this.shakeIntensity = i; }

    switchToSunsetAtmosphere() {
        this.loadSkybox('./assets/Skyboxes/skybox-alien.png');
        this.scene.fog = new THREE.Fog(0x8c5245, 20, 150);
        this.ambientLight.color.setHex(0x6a5855);
        this.ambientLight.intensity = 1.8;
        this.moonLight.visible = false;
        
        if (!this.sunLight) {
            this.sunLight = new THREE.DirectionalLight(0xffb380, 2.5);
            this.sunLight.position.set(50, 80, -50);
            this.scene.add(this.sunLight);
        }
        this.sunLight.visible = true;
        this.renderer.toneMappingExposure = 1.2;
    }

    switchToCityAtmosphere() {
        this.loadSkybox('./assets/Skyboxes/skybox-night.png');
        this.scene.fog = new THREE.Fog(0x0c121d, 30, 220);
        this.ambientLight.color.setHex(0x3a4863);
        this.ambientLight.intensity = 1.2;
        this.moonLight.visible = true;
        if (this.sunLight) this.sunLight.visible = false;
        this.renderer.toneMappingExposure = 1.0;
        this.hasSirensInForest = false;
        if (this.forestSirenRed) this.scene.remove(this.forestSirenRed);
        if (this.forestSirenBlue) this.scene.remove(this.forestSirenBlue);
    }

    render(delta) {
        if (this.skyDome) this.skyDome.position.copy(this.camera.position);
        if (this.shakeIntensity > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * delta);
        }

        if (this.hasSirensInForest) {
            const time = Date.now() * 0.008;
            const flash = Math.sin(time);
            if (this.forestSirenRed) this.forestSirenRed.intensity = flash > 0 ? 8.0 : 0.0;
            if (this.forestSirenBlue) this.forestSirenBlue.intensity = flash < 0 ? 8.0 : 0.0;
        }

        this.renderer.render(this.scene, this.camera);
    }

    setupResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setFogDensity(near, far) {
        if (this.scene.fog) {
            this.scene.fog.near = near;
            this.scene.fog.far = far;
        }
    }

setSanctuaryLighting() {
    // Atmósfera dorada/etérea para el santuario
    this.ambientLight.color.setHex(0x8a7255);
    this.ambientLight.intensity = 2.2;
    if (this.sunLight) {
        this.sunLight.color.setHex(0xffcb80);
        this.sunLight.intensity = 3.0;
    }
}

setTournamentLighting() {
    // Contraste dramático y frío para la memoria del torneo
    this.ambientLight.color.setHex(0x3a4863);
    this.ambientLight.intensity = 0.8;
    this.scene.fog.color.setHex(0x1a233a);
}

triggerFlash(colorHex = 0xffffff, duration = 0.5) {
    const flashLight = new THREE.PointLight(colorHex, 10.0, 50);
    flashLight.position.copy(this.camera.position);
    this.scene.add(flashLight);

    let elapsed = 0;
    const fade = () => {
        elapsed += 0.05;
        flashLight.intensity = Math.max(0, 10.0 * (1 - elapsed / duration));
        if (elapsed < duration) {
            requestAnimationFrame(fade);
        } else {
            this.scene.remove(flashLight);
        }
    };
    fade();
}

enableForestSirens() {
    // Luces rojas y azules de la policía parpadeando a lo lejos en la niebla del bosque
    this.forestSirenRed = new THREE.PointLight(0xff0000, 0, 80);
    this.forestSirenBlue = new THREE.PointLight(0x0000ff, 0, 80);

    this.forestSirenRed.position.set(-20, 5, -30);
    this.forestSirenBlue.position.set(20, 5, -30);

    this.scene.add(this.forestSirenRed);
    this.scene.add(this.forestSirenBlue);

    this.hasSirensInForest = true;
}

}