import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getTerrainHeight } from './Terrain.js';

export class Forest {
    constructor() {
        this.group = new THREE.Group();
        this.tileGroup = new THREE.Group();
        this.tiles = [];
        this.colliders = [];
        this.loader = new GLTFLoader();

        this.tileSize = 300;
        this.lastTileX = NaN;
        this.lastTileZ = NaN;

        this.buildForestTile();
    }

    async buildForestTile() {
        // 1. Suelo Base
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x3d3828 });
        const groundGeo = new THREE.PlaneGeometry(this.tileSize, this.tileSize, 80, 80);
        const pos = groundGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vy = pos.getY(i);
            pos.setZ(i, getTerrainHeight(vx, -vy));
        }
        groundGeo.computeVertexNormals();

        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.userData.isGround = true;
        this.tileGroup.add(ground);

        // Textura Estepa
        this.loader.load('./assets/models/dry_steppe_autumn_seamless_map_second.glb', (gltf) => {
            gltf.scene.traverse((child) => {
                if (child.isMesh && child.material) {
                    let tex = child.material.map || (Array.isArray(child.material) && child.material[0].map);
                    if (tex) {
                        const clonedTex = tex.clone();
                        clonedTex.wrapS = THREE.RepeatWrapping;
                        clonedTex.wrapT = THREE.RepeatWrapping;
                        clonedTex.repeat.set(35, 35);
                        clonedTex.colorSpace = THREE.SRGBColorSpace;
                        clonedTex.needsUpdate = true;

                        const groundMaterial = new THREE.MeshLambertMaterial({ map: clonedTex });
                        ground.material = groundMaterial;

                        this.tiles.forEach(tile => {
                            tile.traverse(c => {
                                if (c.isMesh && c.userData.isGround) {
                                    c.material = groundMaterial;
                                }
                            });
                        });
                    }
                }
            });
        });

        // 2. Cargar Árboles y Rocas
        this.loader.load('./assets/models/low_poly_forest_tree_pack.glb', (gltf) => {
            gltf.scene.updateMatrixWorld(true);

            const trees = [], rocks = [], trunks = [], branches = [];

            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    const bakedGeo = child.geometry.clone();
                    bakedGeo.applyMatrix4(child.matrixWorld);

                    bakedGeo.computeBoundingBox();
                    if (bakedGeo.boundingBox) {
                        const bbox = bakedGeo.boundingBox;
                        bakedGeo.translate(-(bbox.min.x + bbox.max.x) / 2, -bbox.min.y, -(bbox.min.z + bbox.max.z) / 2);
                    }

                    const mat = child.material.clone();
                    mat.alphaTest = 0.4;
                    mat.depthWrite = true;
                    mat.side = THREE.DoubleSide;

                    const prepared = { geometry: bakedGeo, material: mat };
                    const name = (child.name || '').toLowerCase();

                    if (name.includes('rock')) rocks.push(prepared);
                    else if (name.includes('trunk')) trunks.push(prepared);
                    else if (name.includes('branch')) branches.push(prepared);
                    else trees.push(prepared);
                }
            });

            if (trees.length > 0) this.spawnInstancedMeshes(trees, 1200, 0.8, 1.8, 12, 0.25, 0.4);
            if (rocks.length > 0) this.spawnInstancedMeshes(rocks, 800, 0.5, 2.0, 8, 0.25, 0.2);
            if (trunks.length > 0) this.spawnInstancedMeshes(trunks, 200, 0.7, 1.4, 8, 0.2, 0.3);
            if (branches.length > 0) this.spawnInstancedMeshes(branches, 300, 0.6, 1.2, 8, 0.0, 0.2);

            this.initTileGrid();
        });

        // 3. Esculturas de Ajedrez, Auto Quemado y Estatua
        this.scatterChessSculptures();
        this.spawnSingleBurnedCar();
        this.spawnSingleStatue();
        this.spawnGiantSphere(); // <-- NUEVA LÍNEA AÑADIDA
    }

    initTileGrid() {
        if (this.tiles.length > 0) return;

        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const clonedTile = this.tileGroup.clone(true);
                clonedTile.position.set(dx * this.tileSize, 0, dz * this.tileSize);
                this.group.add(clonedTile);
                this.tiles.push(clonedTile);
            }
        }
    }

    addToMap(object) {
        this.tileGroup.add(object);
        if (this.tiles.length > 0) {
            this.tiles.forEach(tile => {
                tile.add(object.clone(true));
            });
        }
    }

    normalizeScale(object, targetMeters) {
        object.updateMatrixWorld(true);
        const bbox = new THREE.Box3().setFromObject(object);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const scaleFactor = targetMeters / maxDim;
            object.scale.multiplyScalar(scaleFactor);
        }
    }

    setChessboardPatch(enable, centerPos) {}

    scatterChessSculptures() {
        this.loader.load('./assets/models/props/replica_lewis_chess_pieces_on_chessboard.glb', (gltf) => {
            const pieceCategories = {};

            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    const name = (child.name || '').toLowerCase();
                    const matName = (child.material?.name || '').toLowerCase();

                    if (!name.includes('board') && !matName.includes('board')) {
                        const baseName = name.replace(/\.\d+$/, '');
                        if (!pieceCategories[baseName]) {
                            pieceCategories[baseName] = child;
                        }
                    }
                }
            });

            const uniquePieces = Object.values(pieceCategories);
            if (uniquePieces.length === 0) return;

            const sculpturesGroup = new THREE.Group();

            for (let i = 0; i < 30; i++) {
                const randomMesh = uniquePieces[Math.floor(Math.random() * uniquePieces.length)];
                const pieceClone = randomMesh.clone(true);

                const sculptureHeight = 4.0 + Math.random() * 2.5;
                this.normalizeScale(pieceClone, sculptureHeight);

                const x = (Math.random() - 0.5) * (this.tileSize - 30);
                const z = (Math.random() - 0.5) * (this.tileSize - 30);

                if (Math.sqrt(x * x + z * z) < 15) continue;

                const gy = getTerrainHeight(x, z);
                pieceClone.updateMatrixWorld(true);
                const bbox = new THREE.Box3().setFromObject(pieceClone);

                pieceClone.position.set(x, gy - bbox.min.y, z);
                pieceClone.rotation.y = Math.random() * Math.PI * 2;

                sculpturesGroup.add(pieceClone);
                this.colliders.push({ x: x, z: z, radius: 2.2 });
            }

            this.addToMap(sculpturesGroup);
        });
    }

    spawnSingleBurnedCar() {
        this.loader.load('./assets/models/props/free_burned_police_cars.glb', (gltf) => {
            const car = gltf.scene;
            this.normalizeScale(car, 18.0);

            const x = 20.0;
            const z = -15.0;
            const gy = getTerrainHeight(x, z);

            car.updateMatrixWorld(true);
            const bbox = new THREE.Box3().setFromObject(car);

            car.position.set(x, gy - bbox.min.y, z);
            car.rotation.set(0, -0.6, 0);

            this.group.add(car);
            this.colliders.push({ x: x, z: z, radius: 8.0 });
        });
    }

    // ESTATUA CON GIRO DE 180 GRADOS RESPECTO A ANTES
    spawnSingleStatue() {
        this.loader.load('./assets/models/st_olaf_the_patron_saint_of_norway.glb', (gltf) => {
            const statue = gltf.scene;
            this.normalizeScale(statue, 9.0);

            const x = -12.0;
            const z = -18.0;
            const gy = getTerrainHeight(x, z);

            statue.updateMatrixWorld(true);
            const bbox = new THREE.Box3().setFromObject(statue);

            statue.position.set(x, gy - bbox.min.y, z);
            
            // Giro de 180° aplicado (Math.PI/4 + Math.PI)
            statue.rotation.y = (5 * Math.PI) / 4;

            statue.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.group.add(statue);
            this.colliders.push({ x: x, z: z, radius: 3.5 });
        });
    }

spawnGiantSphere() {
        this.loader.load('./assets/models/free_stone_sphere.glb', (gltf) => {
            this.giantSphere = gltf.scene; 
            this.normalizeScale(this.giantSphere, 5.0);

            this.giantSphere.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.giantSphere.visible = false; 
            this.group.add(this.giantSphere);
        });
    }

    clearTreesAround(x, z, clearRadius) {
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();

        // Recorremos todos los grupos de árboles/rocas instanciados
        this.tileGroup.children.forEach((child) => {
            if (child.isInstancedMesh) {
                let updated = false;
                for (let i = 0; i < child.count; i++) {
                    child.getMatrixAt(i, matrix);
                    position.setFromMatrixPosition(matrix);
                    
                    // Calculamos la distancia entre el árbol y la nueva Esfera
                    const dx = position.x - x;
                    const dz = position.z - z;
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    
                    if (dist < clearRadius) {
                        // Si está muy cerca, lo hundimos 100 metros para ocultarlo
                        position.y -= 100; 
                        matrix.setPosition(position);
                        child.setMatrixAt(i, matrix);
                        updated = true;
                    }
                }
                // Si movimos algún árbol, le avisamos a Three.js que actualice los gráficos
                if (updated) {
                    child.instanceMatrix.needsUpdate = true;
                }
            }
        });
    }

    update(delta, playerPos) {
        if (this.tiles.length === 0 || !playerPos) return;

        const currentTileX = Math.floor((playerPos.x + this.tileSize / 2) / this.tileSize);
        const currentTileZ = Math.floor((playerPos.z + this.tileSize / 2) / this.tileSize);

        if (currentTileX !== this.lastTileX || currentTileZ !== this.lastTileZ) {
            this.lastTileX = currentTileX;
            this.lastTileZ = currentTileZ;

            let index = 0;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const tile = this.tiles[index++];
                    tile.position.set(
                        (currentTileX + dx) * this.tileSize,
                        0,
                        (currentTileZ + dz) * this.tileSize
                    );
                }
            }
        }
    }

spawnInstancedMeshes(itemList, totalCount, scaleMin, scaleMax, skipRadius, colliderRatio, sinkOffset = 0.0) {
        const countPerMesh = Math.floor(totalCount / itemList.length);
        const dummy = new THREE.Object3D();

        itemList.forEach((item) => {
            const instancedMesh = new THREE.InstancedMesh(item.geometry, item.material, countPerMesh);
            let spawned = 0;
            const origMatrices = [];

            while (spawned < countPerMesh) {
                const x = (Math.random() - 0.5) * (this.tileSize - 6);
                const z = (Math.random() - 0.5) * (this.tileSize - 6);

                // Radio libre del centro original
                if (skipRadius > 0 && Math.sqrt(x * x + z * z) < skipRadius) continue;

                // ---> NUEVO: Claro en el bosque para la Esfera Gigante
                const distToSphere = Math.sqrt(Math.pow(x - 80.0, 2) + Math.pow(z - (-80.0), 2));
                if (distToSphere < 25.0) continue; // 25 metros a la redonda sin árboles
                // <--- FIN NUEVO

                const gy = getTerrainHeight(x, z);
                const scale = scaleMin + Math.random() * (scaleMax - scaleMin);

                dummy.position.set(x, gy - (sinkOffset * scale), z);
                dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix();

                instancedMesh.setMatrixAt(spawned, dummy.matrix);
                origMatrices.push(dummy.matrix.clone());

                if (colliderRatio > 0) {
                    this.colliders.push({ x: x, z: z, radius: colliderRatio * scale });
                }

                spawned++;
            }

            instancedMesh.userData.originalMatrices = origMatrices;
            instancedMesh.instanceMatrix.needsUpdate = true;
            this.tileGroup.add(instancedMesh);
        });
    }

    show() { this.group.visible = true; }
    hide() { this.group.visible = false; }

    dispose() {
        try {
            const disposeMeshRec = (obj) => {
                obj.traverse((child) => {
                    if (child.isMesh) {
                        try { if (child.geometry) child.geometry.dispose(); } catch (e) {}
                        try {
                            const mats = Array.isArray(child.material) ? child.material : [child.material];
                            mats.forEach(m => {
                                if (!m) return;
                                try { if (m.map) m.map.dispose(); } catch (e) {}
                                try { if (m.dispose) m.dispose(); } catch (e) {}
                            });
                        } catch (e) {}
                    }
                });
                if (obj.parent && typeof obj.parent.remove === 'function') obj.parent.remove(obj);
            };

            if (this.group) disposeMeshRec(this.group);
            if (this.tileGroup) disposeMeshRec(this.tileGroup);
            this.tiles.length = 0;
            this.colliders.length = 0;
            this.loader = null;
        } catch (e) { console.warn('Error disposing Forest:', e); }
    }
}