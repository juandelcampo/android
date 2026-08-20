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

        // Nuevos estados de movimiento
        this.isRunning = false;
        this.isCrouching = false;
        this.isJumping = false;

        // Velocidades
        this.baseSpeed = 3; 
        this.runSpeed = 5;
        this.crouchSpeed = 2.0;
        this.speed = this.baseSpeed;
        
        this.canWalk = false;

        // ALTURA DEL PERSONAJE
        this.defaultEyeHeight = 5;
        this.crouchEyeHeight = 1.8;
        this.eyeHeight = this.defaultEyeHeight; 

        // Física de salto
        this.velocityY = 0;
        this.jumpForce = 12.0;
        this.gravity = -30.0;
        this.jumpOffset = 0;

        this.walkCycle = 0;
        this.bobbingAmountY = 0.185; 
        this.playerRadius = 0.9;

        this.colliders = [];
        // Vector para manejar la inercia (X = lado, Y = adelante)
        this.velocity = new THREE.Vector2();

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

            // Movimiento direccional
            if (code === 'KeyW' || k === 'w' || code === 'ArrowUp') this.moveForward = isPressed;
            if (code === 'KeyS' || k === 's' || code === 'ArrowDown') this.moveBackward = isPressed;
            if (code === 'KeyA' || k === 'a' || code === 'ArrowLeft') this.moveLeft = isPressed;
            if (code === 'KeyD' || k === 'd' || code === 'ArrowRight') this.moveRight = isPressed;

            // Modificadores: Correr y Agacharse
            if (code === 'ShiftLeft' || code === 'ShiftRight') this.isRunning = isPressed;
            if (code === 'ControlLeft' || code === 'ControlRight') this.isCrouching = isPressed;

            // Salto (solo si presiona espacio, no está saltando y no está agachado)
            if (code === 'Space' && isPressed && !this.isJumping && !this.isCrouching) {
                this.velocityY = this.jumpForce;
                this.isJumping = true;
            }
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

        // 1. Ajustar velocidad máxima según estado
        if (this.isCrouching) {
            this.speed = this.crouchSpeed;
        } else if (this.isRunning) {
            this.speed = this.runSpeed;
        } else {
            this.speed = this.baseSpeed;
        }

        // 2. SISTEMA DE INERCIA Y FRICCIÓN (¡PRIMERO MOVER!)
        const forward = (this.moveForward ? 1 : 0) - (this.moveBackward ? 1 : 0);
        const side = (this.moveRight ? 1 : 0) - (this.moveLeft ? 1 : 0);
        
        const friction = 8.0;      
        const acceleration = 60.0; 
        
        // Fricción
        this.velocity.x -= this.velocity.x * friction * delta;
        this.velocity.y -= this.velocity.y * friction * delta;
        
        // Aceleración
        if (forward !== 0 || side !== 0) {
            const len = Math.hypot(forward, side);
            this.velocity.y += (forward / len) * acceleration * delta;
            this.velocity.x += (side / len) * acceleration * delta;
        }
        
        // Limitar velocidad
        const currentSpeedSq = this.velocity.lengthSq();
        if (currentSpeedSq > this.speed * this.speed) {
            this.velocity.normalize().multiplyScalar(this.speed);
        }
        
        // APLICAR MOVIMIENTO
        this.controls.moveForward(this.velocity.y * delta);
        this.controls.moveRight(this.velocity.x * delta);
        
        const isMoving = currentSpeedSq > 0.05;

        // 3. DETECCIÓN DE COLISIONES Y LÍMITES (¡AHORA DESPUÉS DE MOVER!)
        const playerObj = this.controls.getObject();
        const px = playerObj.position.x;
        const pz = playerObj.position.z;

        if (isTransitioned) {
            // Colisiones del bosque
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
        } else {
            // LÍMITES DEL ASCENSOR
            const limit = 0.6;
            // Si nos pasamos de la pared, frenamos la cámara y matamos la inercia visual
            if (playerObj.position.x > limit || playerObj.position.x < -limit) this.velocity.x = 0;
            if (playerObj.position.z > limit || playerObj.position.z < -limit) this.velocity.y = 0;

            playerObj.position.x = THREE.MathUtils.clamp(playerObj.position.x, -limit, limit);
            playerObj.position.z = THREE.MathUtils.clamp(playerObj.position.z, -limit, limit);
        }

        // 4. Suavizar transición de agacharse
        const targetEyeHeight = this.isCrouching ? this.crouchEyeHeight : this.defaultEyeHeight;
        this.eyeHeight += (targetEyeHeight - this.eyeHeight) * 10.0 * delta;

        // 5. Aplicar física de salto
        if (this.isJumping) {
            this.velocityY += this.gravity * delta;
            this.jumpOffset += this.velocityY * delta;

            if (this.jumpOffset <= 0) {
                this.jumpOffset = 0;
                this.velocityY = 0;
                this.isJumping = false;
            }
        }

        // 6. Aplicar altura del personaje + efecto caminata
        const baseTerrainY = isTransitioned ? getTerrainHeight(playerObj.position.x, playerObj.position.z) : 0.0;
        const activeEyeHeight = isTransitioned ? this.eyeHeight : 2.6;
        let bobbing = 0;

        if (isMoving && !this.isJumping) {
            const prevCycle = this.walkCycle; 
            const cycleSpeed = this.isRunning ? 6.5 : (this.isCrouching ? 2.5 : 3.8);
            this.walkCycle += delta * cycleSpeed; 
            
            bobbing = Math.sin(this.walkCycle) * this.bobbingAmountY;

            if (Math.floor(this.walkCycle / Math.PI) > Math.floor(prevCycle / Math.PI)) {
                if (this.onStep) this.onStep(); 
            }
        } else {
            this.walkCycle += delta * 1.5;
            bobbing = Math.sin(this.walkCycle) * 0.01;
        }

        let finalY = baseTerrainY + activeEyeHeight + this.jumpOffset + bobbing;

        // Techo del ascensor
        if (!isTransitioned && finalY > 2.0) { 
            finalY = 2.0; 
            if (this.velocityY > 0) this.velocityY = -2.0; // Rebote
        }

        playerObj.position.y = finalY;
    }
}