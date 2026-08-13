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
            
            // EL CAMBIO ESTÁ ACÁ: Lo ocultamos apenas termina de cargar
            this.skyDome.visible = false; 

            this.scene.add(this.skyDome);
        });
    }

    add(object) { this.scene.add(object); }
    getDelta() { return this.clock.getDelta(); }
    triggerShake(i) { this.shakeIntensity = i; }

switchToSunsetAtmosphere() {
        const sunsetColor = 0x5c3848;
        this.scene.background = new THREE.Color(sunsetColor);
        // Niebla ajustada a 15m - 150m para que se funda perfectamente con el cielo
        this.scene.fog = new THREE.Fog(sunsetColor, 15, 150);

        this.ambientLight.color.setHex(0x8c5245);
        this.ambientLight.intensity = 2.2;
        
        if (this.moonLight) this.moonLight.visible = false;

        if (!this.sunLight) {
            this.sunLight = new THREE.DirectionalLight(0xffb380, 2.8);
            this.sunLight.position.set(50, 80, -50);
            this.scene.add(this.sunLight);
        }
        this.sunLight.visible = true;
        this.loadSkybox('./assets/Skyboxes/skybox-alien.png', true);
        this.renderer.toneMappingExposure = 1.1;
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
        this._resizeHandler = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', this._resizeHandler);
    }

    dispose() {
        try {
            if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
            if (this.renderer) {
                try { this.renderer.dispose(); } catch (e) {}
                try { if (this.renderer.domElement && this.renderer.domElement.parentNode) this.renderer.domElement.parentNode.removeChild(this.renderer.domElement); } catch (e) {}
            }
            // dispose skyDome material/texture
            if (this.skyDome) {
                try { if (this.skyDome.material && this.skyDome.material.map) this.skyDome.material.map.dispose(); } catch (e) {}
                try { if (this.skyDome.geometry) this.skyDome.geometry.dispose(); } catch (e) {}
                if (this.skyDome.parent) this.skyDome.parent.remove(this.skyDome);
            }
        } catch (e) { console.warn('Error disposing SceneManager', e); }
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
setSkyboxVisible(isVisible) {
    if (this.skyDome) {
        this.skyDome.visible = isVisible;
    }
}

// Agregar dentro de la clase SceneManager:

enablePoliceSirens() {
    this.isPoliceActive = true;
    
    // Reflector de Helicóptero desde las alturas
    if (!this.spotlightHelicopter) {
        this.spotlightHelicopter = new THREE.SpotLight(0xffffff, 12.0, 80, Math.PI / 6, 0.3);
        this.spotlightHelicopter.position.set(0, 35, 0);
        this.spotlightTarget = new THREE.Object3D();
        this.scene.add(this.spotlightHelicopter);
        this.scene.add(this.spotlightTarget);
        this.spotlightHelicopter.target = this.spotlightTarget;
    }
    this.spotlightHelicopter.visible = true;
}

updatePoliceSirens(time, playerPos) {
    if (!this.isPoliceActive) return;

    // 1. Alternar color de fondo/niebla/ambiente entre Rojo y Azul (Sirenas)
    const flash = Math.sin(time * 12.0) > 0;
    const policeColor = flash ? 0xaa0000 : 0x0011bb;
    
    this.scene.background.setHex(policeColor);
    this.scene.fog.color.setHex(policeColor);
    this.ambientLight.color.setHex(policeColor);

    // 2. Mover el reflector del helicóptero buscando cerca del jugador
    if (this.spotlightHelicopter && playerPos) {
        this.spotlightHelicopter.position.set(playerPos.x + Math.sin(time * 1.5) * 15, playerPos.y + 30, playerPos.z + Math.cos(time * 1.5) * 15);
        this.spotlightTarget.position.set(playerPos.x + Math.cos(time * 3.0) * 5, playerPos.y, playerPos.z + Math.sin(time * 3.0) * 5);
    }
}

}