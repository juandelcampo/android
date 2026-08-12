import * as THREE from 'three';

export class Phone3D {
    constructor(canvas2d) {
        this.group = new THREE.Group();
        this.canvas2d = canvas2d;
        
        this.screenTexture = new THREE.CanvasTexture(this.canvas2d);
        this.screenTexture.minFilter = THREE.LinearFilter;

        this.targetRotationX = 0;
        this.targetRotationY = 0;

        this.buildModel();
    }

    buildModel() {
        // Carcasa reducida a dimensiones realistas de smartphone
        const bodyGeo = new THREE.BoxGeometry(0.35, 0.68, 0.05);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x0c100e, flatShading: true });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.group.add(bodyMesh);

        // Pantalla
        const screenGeo = new THREE.PlaneGeometry(0.30, 0.30);
        const screenMat = new THREE.MeshBasicMaterial({ map: this.screenTexture });
        const screenMesh = new THREE.Mesh(screenGeo, screenMat);
        screenMesh.position.set(0, 0.1, 0.028);
        this.group.add(screenMesh);

        // Posición abajo a la derecha
        this.group.position.set(0.30, -0.28, -0.75);
    }

    updateTexture() {
        if (this.screenTexture) {
            this.screenTexture.needsUpdate = true;
        }
    }

    addParallaxDelta(deltaX, deltaY) {
        this.targetRotationY += deltaX * 0.001;
        this.targetRotationX += deltaY * 0.001;

        this.targetRotationY = Math.max(-0.2, Math.min(0.2, this.targetRotationY));
        this.targetRotationX = Math.max(-0.15, Math.min(0.15, this.targetRotationX));
    }

    updateSmoothRotation() {
        this.group.rotation.y += (this.targetRotationY - this.group.rotation.y) * 0.1;
        this.group.rotation.x += (this.targetRotationX - this.group.rotation.x) * 0.1;
    }

    lowerPhone() {
        const animateDown = () => {
            if (this.group.position.y > -2.0) {
                this.group.position.y -= 0.04;
                requestAnimationFrame(animateDown);
            } else {
                this.group.visible = false;
            }
        };
        animateDown();
    }
}