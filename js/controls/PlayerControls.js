import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { getTerrainHeight } from '../world/Terrain.js';

export class PlayerControls {
    constructor(camera, domElement) {
        this.controls = new PointerLockControls(camera, domElement);
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        this.speed = 7.5;
        this.canWalk = false;
        this.maxRadius = 380.0; 

        this.walkCycle = 0;
        this.bobbingAmountY = 0.035;
        this.playerRadius = 0.5; // Radio del cuerpo del jugador para colisiones

        this.colliders = [];

        this.initListeners(domElement);
    }

    setColliders(colliders) {
        this.colliders = colliders || [];
    }

    initListeners(domElement) {
        domElement.addEventListener('click', () => {
            if (this.canWalk && !this.controls.isLocked) {
                this.controls.lock();
            }
        });

        const handleKey = (event, isPressed) => {
            if (!this.canWalk) return;
            const k = event.key ? event.key.toLowerCase() : '';
            const code = event.code || '';

            if (code === 'KeyW' || k === 'w' || code === 'ArrowUp') this.moveForward = isPressed;
            if (code === 'KeyS' || k === 's' || code === 'ArrowDown') this.moveBackward = isPressed;
            if (code === 'KeyA' || k === 'a' || code === 'ArrowLeft') this.moveLeft = isPressed;
            if (code === 'KeyD' || k === 'd' || code === 'ArrowRight') this.moveRight = isPressed;
        };

        window.addEventListener('keydown', (e) => handleKey(e, true));
        window.addEventListener('keyup', (e) => handleKey(e, false));
    }

    lockCursor() { this.controls.lock(); }
    enableWalking() { this.canWalk = true; }

    resetPosition(x = 9.2, z = 2.0) { 
        // Aparece exactamente parado sobre la vereda derecha mirando hacia el fondo (-Z)
        const playerObj = this.controls.getObject();
        playerObj.position.set(x, 2.0, z); 
    }

    update(delta, isTransitioned = false) {
        if (!this.canWalk || !this.controls.isLocked) return;

        const forward = (this.moveForward ? 1 : 0) - (this.moveBackward ? 1 : 0);
        const side = (this.moveRight ? 1 : 0) - (this.moveLeft ? 1 : 0);
        const isMoving = forward !== 0 || side !== 0;

        if (isMoving) {
            const len = Math.hypot(forward, side);
            const moveF = (forward / len) * this.speed * delta;
            const moveS = (side / len) * this.speed * delta;

            this.controls.moveForward(moveF);
            this.controls.moveRight(moveS);
        }

        const playerObj = this.controls.getObject();

        if (!isTransitioned) {
            // --- DETECCIÓN DE COLISIÓN DE CAJAS 3D CONTRA EDIFICIOS ---
            const r = this.playerRadius;
            for (let i = 0; i < this.colliders.length; i++) {
                const box = this.colliders[i];
                if (box.isBox3) {
                    if (playerObj.position.x + r > box.min.x &&
                        playerObj.position.x - r < box.max.x &&
                        playerObj.position.z + r > box.min.z &&
                        playerObj.position.z - r < box.max.z) {

                        // Calcular empuje en la dirección de la colisión para no atravesar la pared
                        const pushLeft = Math.abs((playerObj.position.x + r) - box.min.x);
                        const pushRight = Math.abs((playerObj.position.x - r) - box.max.x);
                        const pushFront = Math.abs((playerObj.position.z + r) - box.min.z);
                        const pushBack = Math.abs((playerObj.position.z - r) - box.max.z);

                        const minPush = Math.min(pushLeft, pushRight, pushFront, pushBack);

                        if (minPush === pushLeft) playerObj.position.x = box.min.x - r;
                        else if (minPush === pushRight) playerObj.position.x = box.max.x + r;
                        else if (minPush === pushFront) playerObj.position.z = box.min.z - r;
                        else if (minPush === pushBack) playerObj.position.z = box.max.z + r;
                    }
                }
            }

            // Repetir la ciudad en Z para dar sensación de mundo infinito
            if (playerObj.position.z > 30) playerObj.position.z = -520;
            if (playerObj.position.z < -520) playerObj.position.z = 30;
            
            // Subir de altura en la vereda
            const isOnSidewalk = Math.abs(playerObj.position.x) > 8.0;
            const baseTerrainY = isOnSidewalk ? 0.4 : 0.0;

            if (isMoving) {
                this.walkCycle += delta * 7.5;
                playerObj.position.y = baseTerrainY + 1.6 + Math.sin(this.walkCycle) * this.bobbingAmountY;
            } else {
                this.walkCycle += delta * 1.5;
                playerObj.position.y = baseTerrainY + 1.6 + Math.sin(this.walkCycle) * 0.01;
            }
            
        } else {
            // Límite del bosque
            const px = playerObj.position.x;
            const pz = playerObj.position.z;

            for (let i = 0; i < this.colliders.length; i++) {
                const obs = this.colliders[i];
                if (!obs.isBox3) {
                    const dx = px - obs.x;
                    const dz = pz - obs.z;

                    if (Math.abs(dx) < 3.5 && Math.abs(dz) < 3.5) {
                        const dist = Math.sqrt(dx * dx + dz * dz);
                        const minDist = obs.radius + 0.35;

                        if (dist < minDist) {
                            const angle = Math.atan2(dz, dx);
                            playerObj.position.x = obs.x + Math.cos(angle) * minDist;
                            playerObj.position.z = obs.z + Math.sin(angle) * minDist;
                        }
                    }
                }
            }

            const distMap = Math.sqrt(px ** 2 + pz ** 2);
            if (distMap > this.maxRadius) {
                const angle = Math.atan2(pz, px);
                playerObj.position.x = Math.cos(angle) * this.maxRadius;
                playerObj.position.z = Math.sin(angle) * this.maxRadius;
            }

            const baseTerrainY = getTerrainHeight(playerObj.position.x, playerObj.position.z);
            if (isMoving) {
                this.walkCycle += delta * 7.5;
                playerObj.position.y = baseTerrainY + 1.6 + Math.sin(this.walkCycle) * this.bobbingAmountY;
            } else {
                this.walkCycle += delta * 1.5;
                playerObj.position.y = baseTerrainY + 1.6 + Math.sin(this.walkCycle) * 0.01;
            }
        }
    }
}