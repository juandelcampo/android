import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class HallucinationManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.activeEffects = [];
        this.loader = new GLTFLoader();
        this.ambientTimer = 0;
        this.isInForest = false;

        this.initParticleSystem();
        this.initChessGrid();
    }

    // A. POLVO / POLEN FLOTANTE ETEREO (Santuario)
    initParticleSystem() {
        const particleCount = 1500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 300;
            positions[i + 1] = Math.random() * 20;
            positions[i + 2] = (Math.random() - 0.5) * 300;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffddaa,
            size: 0.35,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    // B. PISO DE AJEDREZ FANTASMA (Recuento del Torneo)
    initChessGrid() {
        const gridGeo = new THREE.PlaneGeometry(80, 80, 8, 8);
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillRect(64, 64, 64, 64);

        const tex = new THREE.CanvasTexture(canvas);
        tex.repeat.set(8, 8);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;

        const gridMat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            opacity: 0,
            depthWrite: false
        });

        this.chessFloor = new THREE.Mesh(gridGeo, gridMat);
        this.chessFloor.rotation.x = -Math.PI / 2;
        this.chessFloor.position.y = 0.05;
        this.scene.add(this.chessFloor);
    }

    // --- DISPARADORES DE ALUCINACIONES NARRATIVAS ---

    // 1. "Los árboles se repiten / Renderizado se simplifica"
    triggerWireframeTrees(forestGroup) {
        forestGroup.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.wireframe = true;
                setTimeout(() => {
                    child.material.wireframe = false;
                }, 4000); // Vuelve a la normalidad en 4 segundos
            }
        });
    }

    // 2. "En el santuario de este bosque..."
    triggerSanctuarySpores() {
        let opacity = this.particles.material.opacity || 0;
        const fadeIn = setInterval(() => {
            opacity += 0.05;
            this.particles.material.opacity = Math.min(0.75, opacity);
            if (opacity >= 0.75) clearInterval(fadeIn);
        }, 100);
    }

    enterForestMode() {
        this.isInForest = true;
        this.ambientTimer = 0.3;
        this.triggerSanctuarySpores();
    }

    exitForestMode() {
        this.isInForest = false;
        if (this.particles) this.particles.material.opacity = 0;
    }

    spawnAmbientForestEvent() {
        if (!this.camera) return;
        const playerPos = this.camera.position.clone();
        const playerDir = new THREE.Vector3();
        this.camera.getWorldDirection(playerDir);

        const choice = Math.random();
        if (choice < 0.28) {
            this.triggerGhostOrbs(playerPos);
        } else if (choice < 0.55) {
            this.triggerCircuitTrail(playerPos, playerDir, 0xff88ff);
        } else if (choice < 0.75) {
            this.triggerSoundGlitch(playerPos);
        } else {
            this.triggerCoolantGlow(playerPos);
        }
    }

    // 3. "Faros flotantes en la oscuridad"
    triggerPhantomHeadlights(playerPos, playerDir) {
        const group = new THREE.Group();
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });

        // Dos luces flotando entre las sombras de los árboles
        const light1 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), lightMat);
        const light2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), lightMat);
        light1.position.set(-1.8, 1.5, 0);
        light2.position.set(1.8, 1.5, 0);

        group.add(light1); group.add(light2);

        const spot1 = new THREE.SpotLight(0xfff5cc, 8.0, 40, Math.PI / 6);
        spot1.position.copy(light1.position);
        spot1.target.position.set(-1.8, 0, 10);
        group.add(spot1); group.add(spot1.target);

        // Aparece flotando adelante del jugador
        group.position.set(
            playerPos.x + playerDir.x * 18,
            playerPos.y + 0.5,
            playerPos.z + playerDir.z * 18
        );
        group.lookAt(playerPos);

        this.scene.add(group);

        // Desaparece parpadeando tipo glitch
        let flashes = 0;
        const interval = setInterval(() => {
            group.visible = !group.visible;
            flashes++;
            if (flashes > 10) {
                clearInterval(interval);
                this.scene.remove(group);
            }
        }, 120);
    }

    triggerSoundGlitch(playerPos) {
        const group = new THREE.Group();
        const colors = [0xff66cc, 0x66ccff, 0xffffff, 0x22ffaa];

        for (let i = 0; i < 12; i++) {
            const cube = new THREE.Mesh(
                new THREE.BoxGeometry(0.26, 0.26, 0.26),
                new THREE.MeshBasicMaterial({ color: colors[i % colors.length], transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending })
            );
            cube.position.set((Math.random() - 0.5) * 4, 0.8 + Math.random() * 2.4, (Math.random() - 0.5) * 4);
            cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            group.add(cube);
        }

        group.position.copy(playerPos);
        this.scene.add(group);

        const effect = {
            elapsed: 0,
            done: false,
            update: (delta) => {
                group.rotation.y += delta * 4.8;
                group.rotation.x += delta * 0.7;
                group.position.y = playerPos.y + Math.sin(Date.now() * 0.003) * 0.12;
                effect.elapsed += delta;
                const alpha = Math.max(0, 0.92 - effect.elapsed * 0.2);
                group.children.forEach(mesh => {
                    mesh.material.opacity = alpha;
                    mesh.material.color.offsetHSL(0, 0, Math.sin(effect.elapsed * 5 + mesh.id) * 0.02);
                });
                if (effect.elapsed > 4.5) {
                    this.scene.remove(group);
                    effect.done = true;
                }
            }
        };

        this.activeEffects.push(effect);
    }

    triggerCircuitTrail(playerPos, playerDir, colorHex = 0x00ff88) {
        const points = [];
        const trailLength = 18;

        for (let i = 0; i < trailLength; i++) {
            const offset = Math.sin(i * 0.6) * 2.6 + (Math.random() - 0.5) * 1.1;
            const point = new THREE.Vector3(
                playerPos.x + playerDir.x * (3 + i * 2) + offset,
                playerPos.y + 0.2 + Math.sin(i * 0.95) * 1.0,
                playerPos.z + playerDir.z * (3 + i * 2) + offset
            );
            points.push(point);
        }

        const trailGeo = new THREE.BufferGeometry().setFromPoints(points);
        const trailMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending });
        const trail = new THREE.Line(trailGeo, trailMat);
        this.scene.add(trail);

        const glow = new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 64, 0.08, 8, false),
            new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending })
        );
        this.scene.add(glow);

        const effect = {
            elapsed: 0,
            done: false,
            update: (delta) => {
                effect.elapsed += delta;
                trail.material.opacity = Math.max(0, 0.95 - effect.elapsed * 0.1);
                glow.material.opacity = Math.max(0, 0.35 - effect.elapsed * 0.05);
                trail.rotation.y += delta * 0.3;
                glow.rotation.y -= delta * 0.25;
                if (effect.elapsed > 8.0) {
                    this.scene.remove(trail);
                    this.scene.remove(glow);
                    effect.done = true;
                }
            }
        };

        this.activeEffects.push(effect);
    }

    triggerForestExplosion(playerPos, playerDir) {
        const explosionDistance = 30 + Math.random() * 10;
        const pos = new THREE.Vector3(
            playerPos.x + playerDir.x * explosionDistance + (Math.random() - 0.5) * 8,
            playerPos.y + 2.0 + Math.random() * 4,
            playerPos.z + playerDir.z * explosionDistance + (Math.random() - 0.5) * 8
        );

        const fireGeo = new THREE.SphereGeometry(1.8, 12, 12);
        const fireMat = new THREE.MeshBasicMaterial({ color: 0xff6611, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending });
        const fire = new THREE.Mesh(fireGeo, fireMat);
        fire.position.copy(pos);
        this.scene.add(fire);

        const ringGeo = new THREE.RingGeometry(2.4, 3.4, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffdd33, transparent: true, opacity: 0.45, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(pos);
        this.scene.add(ring);

        const light = new THREE.PointLight(0xffaa22, 16.0, 90);
        light.position.copy(pos);
        this.scene.add(light);

        const smokeGeo = new THREE.SphereGeometry(2.6, 12, 12);
        const smokeMat = new THREE.MeshBasicMaterial({ color: 0x553333, transparent: true, opacity: 0.42 });
        const smoke = new THREE.Mesh(smokeGeo, smokeMat);
        smoke.position.copy(pos);
        this.scene.add(smoke);

        const effect = {
            elapsed: 0,
            done: false,
            update: (delta) => {
                effect.elapsed += delta;
                fire.scale.setScalar(1 + effect.elapsed * 1.1);
                fire.material.opacity = Math.max(0, 0.95 - effect.elapsed * 0.22);
                smoke.scale.setScalar(1 + effect.elapsed * 1.2);
                smoke.material.opacity = Math.max(0, 0.42 - effect.elapsed * 0.04);
                ring.material.opacity = Math.max(0, 0.45 - effect.elapsed * 0.06);
                ring.rotation.z += delta * 1.5;
                light.intensity = Math.max(0, 16.0 - effect.elapsed * 3.0);
                if (effect.elapsed > 5.5) {
                    this.scene.remove(fire);
                    this.scene.remove(smoke);
                    this.scene.remove(light);
                    this.scene.remove(ring);
                    effect.done = true;
                }
            }
        };
        this.activeEffects.push(effect);
    }

    triggerBlueRain(playerPos) {
        const count = 260;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = playerPos.x + (Math.random() - 0.5) * 26;
            positions[i + 1] = playerPos.y + 10 + Math.random() * 14;
            positions[i + 2] = playerPos.z + (Math.random() - 0.5) * 26;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ color: 0x66ddff, size: 0.22, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending });
        const rain = new THREE.Points(geo, material);
        this.scene.add(rain);

        const effect = {
            elapsed: 0,
            done: false,
            update: (delta) => {
                effect.elapsed += delta;
                const posArr = rain.geometry.attributes.position.array;
                for (let i = 1; i < posArr.length; i += 3) {
                    posArr[i] -= delta * (5.5 + Math.sin(i * 0.02));
                    if (posArr[i] < playerPos.y - 2) {
                        posArr[i] = playerPos.y + 10 + Math.random() * 14;
                    }
                }
                rain.geometry.attributes.position.needsUpdate = true;
                material.opacity = Math.max(0, 0.95 - effect.elapsed * 0.08);
                material.size = 0.22 + Math.sin(effect.elapsed * 12) * 0.03;
                if (effect.elapsed > 8.2) {
                    this.scene.remove(rain);
                    effect.done = true;
                }
            }
        };
        this.activeEffects.push(effect);
    }

    triggerForestCarAppearance(playerPos) {
        const carModel = './assets/models/sedan-sports.glb';
        this.loader.load(carModel, (gltf) => {
            const car = gltf.scene.clone();
            car.scale.set(0.9, 0.9, 0.9);
            car.position.set(
                playerPos.x + (Math.random() - 0.5) * 6,
                playerPos.y - 0.2,
                playerPos.z + (Math.random() - 0.5) * 6
            );
            car.rotation.y = Math.random() * Math.PI * 2;
            this.scene.add(car);

            const effect = {
                elapsed: 0,
                done: false,
                update: (delta) => {
                    effect.elapsed += delta;
                    car.rotation.y += delta * 0.35;
                    if (effect.elapsed > 5.0) {
                        this.scene.remove(car);
                        effect.done = true;
                    }
                }
            };
            this.activeEffects.push(effect);
        });
    }

    triggerPoliceBeacons(playerPos, playerDir) {
        const group = new THREE.Group();
        const orbRed = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.9 }));
        const orbBlue = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0x0066ff, transparent: true, opacity: 0.9 }));
        orbRed.position.set(-1.2, 2.2, 0);
        orbBlue.position.set(1.2, 2.2, 0);
        group.add(orbRed, orbBlue);

        const trail = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-1.2, 2.2, 0),
                new THREE.Vector3(-4, 0.3, -4),
                new THREE.Vector3(-8, 0.3, -8)
            ]),
            new THREE.LineBasicMaterial({ color: 0x0044ff, transparent: true, opacity: 0.45 })
        );
        group.add(trail);

        const pos = new THREE.Vector3(
            playerPos.x + playerDir.x * 26 + (Math.random() - 0.5) * 6,
            playerPos.y + 0.8,
            playerPos.z + playerDir.z * 26 + (Math.random() - 0.5) * 6
        );
        group.position.copy(pos);
        this.scene.add(group);

        const effect = {
            elapsed: 0,
            done: false,
            update: (delta) => {
                effect.elapsed += delta;
                orbRed.material.opacity = Math.max(0, 0.9 - effect.elapsed * 0.08);
                orbBlue.material.opacity = Math.max(0, 0.9 - effect.elapsed * 0.08);
                group.position.y = pos.y + Math.sin(effect.elapsed * 4.0) * 0.08;
                if (effect.elapsed > 6.0) {
                    this.scene.remove(group);
                    effect.done = true;
                }
            }
        };
        this.activeEffects.push(effect);
    }

    triggerForestMist(playerPos) {
        const count = 220;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = playerPos.x + (Math.random() - 0.5) * 18;
            positions[i + 1] = playerPos.y + Math.random() * 5;
            positions[i + 2] = playerPos.z + (Math.random() - 0.5) * 18;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ color: 0xddeeff, size: 0.24, transparent: true, opacity: 0.28 });
        const mist = new THREE.Points(geometry, material);
        this.scene.add(mist);

        const effect = {
            elapsed: 0,
            done: false,
            update: (delta) => {
                effect.elapsed += delta;
                const posArr = mist.geometry.attributes.position.array;
                for (let i = 1; i < posArr.length; i += 3) {
                    posArr[i] += delta * 0.12;
                    if (posArr[i] > playerPos.y + 8) posArr[i] = playerPos.y + Math.random() * 2;
                }
                mist.geometry.attributes.position.needsUpdate = true;
                material.opacity = Math.max(0, 0.28 - effect.elapsed * 0.03);
                if (effect.elapsed > 8.0) {
                    this.scene.remove(mist);
                    effect.done = true;
                }
            }
        };
        this.activeEffects.push(effect);
    }

    triggerForestAura(playerPos) {
        const ringGeo = new THREE.RingGeometry(1.6, 2.2, 40);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff88ff, transparent: true, opacity: 0.45, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(playerPos.x, playerPos.y + 0.3, playerPos.z);
        this.scene.add(ring);

        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff55ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending }));
        orb.position.set(playerPos.x, playerPos.y + 1.0, playerPos.z);
        this.scene.add(orb);

        const halo = new THREE.Mesh(
            new THREE.RingGeometry(2.4, 3.4, 40),
            new THREE.MeshBasicMaterial({ color: 0xff44ee, transparent: true, opacity: 0.18, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
        );
        halo.rotation.x = -Math.PI / 2;
        halo.position.set(playerPos.x, playerPos.y + 0.22, playerPos.z);
        this.scene.add(halo);

        const effect = {
            elapsed: 0,
            done: false,
            update: (delta) => {
                effect.elapsed += delta;
                ring.rotation.z += delta * 0.8;
                halo.rotation.z -= delta * 0.5;
                ring.material.opacity = Math.max(0, 0.45 - effect.elapsed * 0.03);
                orb.material.opacity = Math.max(0, 0.75 - effect.elapsed * 0.06);
                halo.material.opacity = Math.max(0, 0.18 - effect.elapsed * 0.02);
                orb.position.y = playerPos.y + 1.0 + Math.sin(effect.elapsed * 5.7) * 0.15;
                orb.scale.setScalar(1 + Math.sin(effect.elapsed * 2.2) * 0.12);
                if (effect.elapsed > 9.2) {
                    this.scene.remove(ring);
                    this.scene.remove(orb);
                    this.scene.remove(halo);
                    effect.done = true;
                }
            }
        };
        this.activeEffects.push(effect);
    }

    triggerCoolantGlow(playerPos) {
        const glow = new THREE.Mesh(
            new THREE.CircleGeometry(4.2, 48),
            new THREE.MeshBasicMaterial({ color: 0x22bbff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending })
        );
        glow.rotation.x = -Math.PI / 2;
        glow.position.set(playerPos.x, playerPos.y + 0.05, playerPos.z);
        this.scene.add(glow);

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(4.5, 5.8, 48),
            new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.22, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(glow.position);
        this.scene.add(ring);

        const effect = {
            elapsed: 0,
            done: false,
            update: (delta) => {
                effect.elapsed += delta;
                glow.material.opacity = Math.max(0, 0.45 - effect.elapsed * 0.05);
                ring.material.opacity = Math.max(0, 0.22 - effect.elapsed * 0.03);
                glow.scale.setScalar(1 + effect.elapsed * 0.28);
                ring.scale.setScalar(1 + effect.elapsed * 0.16);
                ring.rotation.z += delta * 0.4;
                if (effect.elapsed > 8.0) {
                    this.scene.remove(glow);
                    this.scene.remove(ring);
                    effect.done = true;
                }
            }
        };
        this.activeEffects.push(effect);
    }

    triggerMagentaCircuitPath(playerPos, playerDir) {
        const length = 24;
        const points = [];
        for (let i = 0; i <= length; i++) {
            const factor = i / length;
            const offset = Math.sin(factor * Math.PI * 5) * 1.8;
            points.push(new THREE.Vector3(
                playerPos.x + playerDir.x * (i * 1.6) + playerDir.z * offset,
                playerPos.y + 0.12 + Math.sin(factor * Math.PI * 2.2) * 0.22,
                playerPos.z + playerDir.z * (i * 1.6) - playerDir.x * offset
            ));
        }

        const pathGeo = new THREE.BufferGeometry().setFromPoints(points);
        const pathMat = new THREE.LineBasicMaterial({ color: 0xff33ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending });
        const path = new THREE.Line(pathGeo, pathMat);
        this.scene.add(path);

        const glow = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: 0xff88ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending })
        );
        this.scene.add(glow);

        const nodes = new THREE.Group();
        points.filter((_, i) => i % 2 === 0).forEach(point => {
            const node = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 10, 10),
                new THREE.MeshBasicMaterial({ color: 0xff88ff, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending })
            );
            node.position.copy(point);
            nodes.add(node);
        });
        this.scene.add(nodes);

        const effect = {
            elapsed: 0,
            done: false,
            update: (delta) => {
                effect.elapsed += delta;
                path.material.opacity = Math.max(0, 0.95 - effect.elapsed * 0.085);
                glow.material.opacity = Math.max(0, 0.16 - effect.elapsed * 0.015);
                nodes.children.forEach((node, index) => {
                    node.material.opacity = Math.max(0, 0.92 - effect.elapsed * 0.1);
                    node.position.y += Math.sin((effect.elapsed + index) * 4.1) * delta * 0.06;
                    node.scale.setScalar(1 + Math.sin(effect.elapsed * 4 + index) * 0.08);
                });
                if (effect.elapsed > 9.0) {
                    this.scene.remove(path);
                    this.scene.remove(glow);
                    this.scene.remove(nodes);
                    effect.done = true;
                }
            }
        };
        this.activeEffects.push(effect);
    }

    // 4. "Entré al torneo... 33 jugadas, jaque mate"
    triggerChessHallucination(playerPos) {
        this.chessFloor.position.set(playerPos.x, 0.08, playerPos.z);
        let opacity = 0;
        const timer = setInterval(() => {
            opacity += 0.08;
            this.chessFloor.material.opacity = Math.min(0.6, opacity);
            if (opacity >= 0.6) {
                clearInterval(timer);
                setTimeout(() => {
                    // Desvanecer
                    const fadeOut = setInterval(() => {
                        this.chessFloor.material.opacity -= 0.05;
                        if (this.chessFloor.material.opacity <= 0) {
                            clearInterval(fadeOut);
                        }
                    }, 100);
                }, 6000);
            }
        }, 80);
    }

    // 5. "Cestas de rosas muy rojas y saturadas" (Lluvia de pétalos rojos)
    triggerRosePetalsRain(playerPos) {
        const count = 300;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i += 3) {
            pos[i] = playerPos.x + (Math.random() - 0.5) * 20;
            pos[i + 1] = playerPos.y + 10 + Math.random() * 10;
            pos[i + 2] = playerPos.z + (Math.random() - 0.5) * 20;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xff0033,
            size: 0.25,
            transparent: true,
            opacity: 0.9
        });

        const petals = new THREE.Points(geo, mat);
        this.scene.add(petals);

        this.activeEffects.push({
            update: (delta) => {
                const positions = petals.geometry.attributes.position.array;
                for (let i = 1; i < count * 3; i += 3) {
                    positions[i] -= delta * 2.5; // Caen lentamente
                    if (positions[i] < playerPos.y - 1) positions[i] = playerPos.y + 10;
                }
                petals.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    triggerGhostOrbs(playerPos) {
        const orbCount = 12;
        const geo = new THREE.SphereGeometry(0.18, 8, 8);
        const orbs = new THREE.Group();

        for (let i = 0; i < orbCount; i++) {
            const orb = new THREE.Mesh(
                geo,
                new THREE.MeshBasicMaterial({ color: 0xaaffff, transparent: true, opacity: 0.7 })
            );
            orb.position.set(
                playerPos.x + Math.cos((i / orbCount) * Math.PI * 2) * (2 + Math.random() * 1.5),
                playerPos.y + 1.2 + Math.sin(i * 0.7) * 0.8,
                playerPos.z + Math.sin((i / orbCount) * Math.PI * 2) * (2 + Math.random() * 1.5)
            );
            orbs.add(orb);
        }

        this.scene.add(orbs);
        const effect = {
            elapsed: 0,
            done: false,
            update: (delta) => {
                effect.elapsed += delta;
                orbs.rotation.y += delta * 0.8;
                orbs.children.forEach((orb, index) => {
                    orb.material.opacity = Math.max(0, 0.7 - effect.elapsed * 0.18);
                    orb.position.y += Math.sin((Date.now() * 0.001) + index) * delta * 0.08;
                });
                if (effect.elapsed > 4.2) {
                    this.scene.remove(orbs);
                    effect.done = true;
                }
            }
        };
        this.activeEffects.push(effect);
    }

    update(delta) {
        // Animación constante de partículas flotantes
        if (this.particles && this.particles.material.opacity > 0) {
            const pos = this.particles.geometry.attributes.position.array;
            for (let i = 1; i < pos.length; i += 3) {
                pos[i] += Math.sin(Date.now() * 0.001 + i) * 0.015;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        if (this.isInForest) {
            this.ambientTimer -= delta;
            if (this.ambientTimer <= 0) {
                this.ambientTimer = 0.9 + Math.random() * 1.4;
                this.spawnAmbientForestEvent();
            }
        }

        // Actualizar efectos activos y limpiar los terminados
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const fx = this.activeEffects[i];
            if (fx.update) fx.update(delta);
            if (fx.done) this.activeEffects.splice(i, 1);
        }
    }
}