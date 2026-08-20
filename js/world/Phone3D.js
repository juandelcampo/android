import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Phone3D {
    constructor(canvasElement) {
        this.group = new THREE.Group();
        this.loader = new GLTFLoader();

        // Textura dinámica del Vectoscopio
        this.canvasTexture = new THREE.CanvasTexture(canvasElement);
        this.canvasTexture.colorSpace = THREE.SRGBColorSpace;
        this.canvasTexture.flipY = false;

        this.phoneMesh = null;
        this.screenMesh = null;

        this.targetRotationX = 0;
        this.targetRotationY = 0;

        this.loadModel();
    }

loadModel() {
        this.loader.load(
            './assets/models/props/phone.glb',
            (gltf) => {
                this.phoneMesh = gltf.scene;

                // Reducimos la escala a la mitad para que no atraviese paredes
                this.phoneMesh.scale.set(0.3, 0.3, 0.3);
                this.phoneMesh.position.set(0, 0, 0);

                const screenMaterial = new THREE.MeshBasicMaterial({
                    map: this.canvasTexture,
                    side: THREE.DoubleSide
                });

                this.phoneMesh.traverse((child) => {
                    if (child.isMesh) {
                        const name = child.name.toLowerCase();

                        if (name === 'object_5' || name.includes('screen') || name.includes('display') || name.includes('pantalla') || name.includes('lcd')) {
                            this.screenMesh = child;
                            this.screenMesh.material = screenMaterial;
                        } else if (child.material) {
                            child.material.roughness = 0.4;
                            child.material.metalness = 0.6;
                        }
                    }
                });

                this.group.add(this.phoneMesh);
            },
            undefined,
            (err) => console.error("Error cargando phone.glb:", err)
        );
    }

    // MÉTODO REQUERIDO: Refresca el lienzo del vectoscopio en cada frame
    updateTexture() {
        if (this.canvasTexture) {
            this.canvasTexture.needsUpdate = true;
        }
    }

    // Inclinación al arrastrar el mouse
    addParallaxDelta(movementX, movementY) {
        // Multiplicador 0.005 para que el arrastre se sienta más directo
        this.targetRotationY += movementX * 0.005; 
        this.targetRotationX += movementY * 0.005;

        // Topes para que el jugador no pueda dar vuelta el celular completamente
        this.targetRotationX = THREE.MathUtils.clamp(this.targetRotationX, -0.4, 0.4);
        this.targetRotationY = THREE.MathUtils.clamp(this.targetRotationY, -0.8, 0.8);
    }

    // Nuevo método: Vuelve el celular al centro
    resetRotation() {
        this.targetRotationX = 0;
        this.targetRotationY = 0;
    }

    update(delta) {
        if (!this.group) return;

        const time = Date.now() * 0.0015;

        if (this.phoneMesh) {
            this.phoneMesh.position.y = Math.sin(time) * 0.015;
        }

        this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, this.targetRotationY + Math.sin(time * 0.8) * 0.04, 0.05);
        this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, this.targetRotationX, 0.05);
    }

    dispose() {
        try {
            if (this.canvasTexture) {
                try { this.canvasTexture.dispose(); } catch (e) {}
                this.canvasTexture = null;
            }
            if (this.phoneMesh) {
                this.phoneMesh.traverse((child) => {
                    if (child.isMesh) {
                        try { if (child.geometry) child.geometry.dispose(); } catch (e) {}
                        try {
                            const mats = Array.isArray(child.material) ? child.material : [child.material];
                            mats.forEach(m => { if (m && m.dispose) m.dispose(); });
                        } catch (e) {}
                    }
                });
                if (this.phoneMesh.parent) this.phoneMesh.parent.remove(this.phoneMesh);
            }
            if (this.group && this.group.parent) this.group.parent.remove(this.group);
            this.loader = null;
        } catch (e) { console.warn('Error disposing Phone3D', e); }
    }
}