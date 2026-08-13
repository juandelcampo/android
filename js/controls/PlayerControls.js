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

        // VELOCIDAD REDUCIDA PARA CAMINATA LENTA Y PESADA
        this.speed = 4.8; 
        this.canWalk = false;

        // ALTURA DEL PERSONAJE (Ojos sobre el piso)
        this.eyeHeight = 3.8; 

        this.walkCycle = 0;
        // BAMBOLEO INCREMENTADO
        this.bobbingAmountY = 0.185; 
        this.playerRadius = 0.9;

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

    resetPosition(x = 0, z = 0) { 
        const playerObj = this.controls.getObject();
        const y = getTerrainHeight(x, z) + this.eyeHeight;
        playerObj.position.set(x, y, z); 
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
        const px = playerObj.position.x;
        const pz = playerObj.position.z;

        // Detección de colisiones
        const TILE_SIZE = 300;
        const localX = (((px % TILE_SIZE) + TILE_SIZE + TILE_SIZE / 2) % TILE_SIZE) - TILE_SIZE / 2;
        const localZ = (((pz % TILE_SIZE) + TILE_SIZE + TILE_SIZE / 2) % TILE_SIZE) - TILE_SIZE / 2;

        for (let i = 0; i < this.colliders.length; i++) {
            const obs = this.colliders[i];
            if (!obs.isBox3) {
                const dx = localX - obs.x;
                const dz = localZ - obs.z;

                if (Math.abs(dx) < 3.5 && Math.abs(dz) < 3.5) {
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    const minDist = obs.radius + 0.35;

                    if (dist < minDist && dist > 0) {
                        const angle = Math.atan2(dz, dx);
                        playerObj.position.x += Math.cos(angle) * (minDist - dist);
                        playerObj.position.z += Math.sin(angle) * (minDist - dist);
                    }
                }
            }
        }

        // Aplicar altura del personaje + efecto caminata pesado
        const baseTerrainY = getTerrainHeight(playerObj.position.x, playerObj.position.z);
        if (isMoving) {
            const prevCycle = this.walkCycle; 
            // REDUCIDO DE 6.0 a 3.8 PARA QUE LOS PASOS SEAN MUCHO MÁS ESPACIADOS Y PESADOS
            this.walkCycle += delta * 3.8; 
            playerObj.position.y = baseTerrainY + this.eyeHeight + Math.sin(this.walkCycle) * this.bobbingAmountY;

            // DETECCIÓN DE PASO
            if (Math.floor(this.walkCycle / Math.PI) > Math.floor(prevCycle / Math.PI)) {
                if (this.onStep) this.onStep(); 
            }
        } else {
            this.walkCycle += delta * 1.5;
            playerObj.position.y = baseTerrainY + this.eyeHeight + Math.sin(this.walkCycle) * 0.01;
        }
    }
}