import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TextureGenerator } from './TextureGenerator.js';
import { getTerrainHeight } from './Terrain.js';

export class Forest {
    constructor() {
        this.group = new THREE.Group();
        this.colliders = [];
        this.narrativeProps = {};
        this.loader = new GLTFLoader();
        this.buildForest();
    }

    async buildForest() {
        const groundTex = TextureGenerator.createGroundTexture();
        const groundMat = new THREE.MeshLambertMaterial({ map: groundTex });

        // 1. Suelo Gigante
        const groundGeo = new THREE.PlaneGeometry(800, 800, 120, 120);
        const pos = groundGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vy = pos.getY(i);
            pos.setZ(i, getTerrainHeight(vx, -vy));
        }
        groundGeo.computeVertexNormals();

        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        this.group.add(ground);

        // 2. Organización de assets por categoría
        const assetCategories = {
            trees: [
                'tree_oak.glb', 'tree_oak_dark.glb', 'tree_oak_fall.glb',
                'tree_tall.glb', 'tree_tall_dark.glb', 'tree_tall_fall.glb',
                'tree_thin.glb', 'tree_thin_dark.glb', 'tree_thin_fall.glb',
                'tree_detailed.glb', 'tree_detailed_dark.glb', 'tree_detailed_fall.glb',
                'tree_fat.glb', 'tree_fat_darkh.glb', 'tree_fat_fall.glb',
                'tree_pineTallA_detailed.glb', 'tree_pineTallB_detailed.glb',
                'tree_pineTallC_detailed.glb', 'tree_pineTallD_detailed.glb',
                'tree_pineDefaultA.glb', 'tree_pineDefaultB.glb',
                'tree_pineRoundA.glb', 'tree_pineRoundB.glb', 'tree_pineRoundC.glb',
                'tree_pineSmallA.glb', 'tree_pineSmallB.glb',
                'tree_cone.glb', 'tree_cone_dark.glb', 'tree_cone_fall.glb',
                'tree_default.glb', 'tree_default_dark.glb', 'tree_default_fall.glb',
                'tree_blocks.glb', 'tree_blocks_dark.glb', 'tree_blocks_fall.glb'
            ],
            cacti: ['cactus_tall.glb', 'cactus_short.glb'],
            bushes: [
                'plant_bush.glb', 'plant_bushLarge.glb', 'plant_bushDetailed.glb',
                'plant_bushSmall.glb', 'plant_bushTriangle.glb', 'plant_bushLargeTriangle.glb',
                'plant_flatTall.glb', 'plant_flatShort.glb'
            ],
            rocksAndStumps: [
                'stump_old.glb', 'stump_oldTall.glb', 'stump_round.glb',
                'stump_roundDetailed.glb', 'stump_square.glb', 'stump_squareDetailed.glb',
                'stump_squareDetailedWide.glb', 'log.glb', 'log_large.glb',
                'log_stack.glb', 'log_stackLarge.glb',
                'rock_largeA.glb', 'rock_largeB.glb', 'rock_largeC.glb', 'rock_largeD.glb',
                'rock_tallA.glb', 'rock_tallB.glb', 'rock_tallC.glb', 'rock_tallD.glb',
                'rock_tallE.glb', 'rock_tallF.glb', 'rock_tallG.glb', 'rock_tallH.glb', 'rock_tallI.glb', 'rock_tallJ.glb',
                'rock_smallA.glb', 'rock_smallB.glb', 'rock_smallC.glb', 'rock_smallD.glb', 'rock_smallE.glb', 'rock_smallF.glb',
                'rock_smallFlatA.glb', 'rock_smallFlatB.glb', 'rock_smallFlatC.glb',
                'rock_smallG.glb', 'rock_smallH.glb', 'rock_smallI.glb', 'rock_smallTopA.glb', 'rock_smallTopB.glb',
                'stone_largeA.glb', 'stone_largeB.glb', 'stone_largeC.glb', 'stone_largeD.glb', 'stone_largeE.glb', 'stone_largeF.glb',
                'stone_tallA.glb', 'stone_tallB.glb', 'stone_tallC.glb', 'stone_tallD.glb', 'stone_tallE.glb',
                'stone_tallF.glb', 'stone_tallG.glb', 'stone_tallH.glb', 'stone_tallI.glb', 'stone_tallJ.glb',
                'stone_smallA.glb', 'stone_smallB.glb', 'stone_smallC.glb', 'stone_smallD.glb', 'stone_smallE.glb', 'stone_smallF.glb',
                'stone_smallFlatA.glb', 'stone_smallFlatB.glb', 'stone_smallFlatC.glb',
                'stone_smallG.glb', 'stone_smallH.glb', 'stone_smallI.glb', 'stone_smallTopA.glb', 'stone_smallTopB.glb'
            ],
            flora: [
                'flower_yellowA.glb', 'flower_yellowB.glb', 'flower_yellowC.glb',
                'flower_redA.glb', 'flower_redB.glb', 'flower_redC.glb',
                'flower_purpleA.glb', 'flower_purpleB.glb', 'flower_purpleC.glb',
                'lily_large.glb', 'lily_small.glb',
                'mushroom_red.glb', 'mushroom_redGroup.glb', 'mushroom_redTall.glb',
                'mushroom_tan.glb', 'mushroom_tanGroup.glb', 'mushroom_tanTall.glb'
            ],
            grass: [
                'grass.glb', 'grass_large.glb', 'grass_leafs.glb', 'grass_leafsLarge.glb',
                'ground_grass.glb'
            ]
        };

        // 3. Cargador en paralelo
        const loadCategory = async (files) => {
            const promises = files.map(file => new Promise((resolve) => {
                this.loader.load(
                    `./assets/models/${file}`,
                    (gltf) => resolve(gltf.scene),
                    undefined,
                    () => resolve(null)
                );
            }));
            return (await Promise.all(promises)).filter(m => m !== null);
        };

        const loadedTrees = await loadCategory(assetCategories.trees);
        const loadedCacti = await loadCategory(assetCategories.cacti);
        const loadedBushes = await loadCategory(assetCategories.bushes);
        const loadedProps = await loadCategory(assetCategories.rocksAndStumps);
        const loadedFlora = await loadCategory(assetCategories.flora);
        const loadedGrass = await loadCategory(assetCategories.grass);

        // 4. INSTANCIACIÓN MASIVA GPU (Renderizado Extremo)
        this.spawnInstanced(loadedTrees, 5000, 10.0, 25.0, 14, 0.12); // Árboles Colosales
        this.spawnInstanced(loadedCacti, 1000, 3.0, 5.5, 5, 0.25);    // Cactus
        this.spawnInstanced(loadedBushes, 5000, 2.0, 4.0, 4, 0);      // Arbustos (sin colisión)
        this.spawnInstanced(loadedProps, 10000, 1.8, 4.0, 0, 0.3);    // Rocas y Troncos
        this.spawnInstanced(loadedFlora, 15000, 1.2, 2.5, 0, 0);      // Flores y Hongos
        this.spawnInstanced(loadedGrass, 150000, 2.0, 4.5, 0, 0);     // Manto de Pasto (¡150.000!)

        if (loadedTrees.length === 0) {
            this.buildNativeProceduralTrees();
        }

        this.setupNarrativeProps();
    }

    // MOTOR DE INSTANCIACIÓN (Convierte cualquier modelo GLTF a miles de instancias en un solo draw-call)
    spawnInstanced(models, totalCount, scaleMin, scaleMax, skipRadius, colliderRatio) {
        if (!models || models.length === 0) return;

        const countPerModel = Math.floor(totalCount / models.length);
        const dummy = new THREE.Object3D();

        models.forEach(model => {
            // Actualizar matrices internas del modelo descargado
            model.updateMatrixWorld(true);
            const meshData = [];

            model.traverse(child => {
                if (child.isMesh) {
                    meshData.push({
                        geometry: child.geometry,
                        material: child.material,
                        localMatrix: child.matrixWorld.clone()
                    });
                }
            });

            // Crear el InstancedMesh por cada parte geométrica
            const instancedMeshes = meshData.map(data => {
                const im = new THREE.InstancedMesh(data.geometry, data.material, countPerModel);
                // Solo activamos sombras para objetos grandes que tienen colisionador
                if (colliderRatio > 0) {
                    im.castShadow = true;
                    im.receiveShadow = true;
                }
                this.group.add(im);
                return { instance: im, localMatrix: data.localMatrix };
            });

            // Posicionar las miles de copias
            let spawned = 0;
            while (spawned < countPerModel) {
                const x = (Math.random() - 0.5) * 780;
                const z = (Math.random() - 0.5) * 780;

                // Evitar el área de aparición inicial
                if (skipRadius > 0 && Math.sqrt(x * x + z * z) < skipRadius) {
                    continue;
                }

                const gy = getTerrainHeight(x, z);

                dummy.position.set(x, gy, z);
                dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
                const scale = scaleMin + Math.random() * (scaleMax - scaleMin);
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix();

                // Aplicar a cada geometría del modelo
                instancedMeshes.forEach(({ instance, localMatrix }) => {
                    const finalMatrix = new THREE.Matrix4().multiplyMatrices(dummy.matrix, localMatrix);
                    instance.setMatrixAt(spawned, finalMatrix);
                });

                if (colliderRatio > 0) {
                    this.colliders.push({ x: x, z: z, radius: colliderRatio * scale });
                }

                spawned++;
            }

            instancedMeshes.forEach(({ instance }) => {
                instance.instanceMatrix.needsUpdate = true;
            });
        });
    }

    buildNativeProceduralTrees() {
        const barkDark = TextureGenerator.createBarkTexture('dark');
        const folGreen = TextureGenerator.create3DFoliageTexture('#275932');
        const matDark = new THREE.MeshLambertMaterial({ map: barkDark, flatShading: true });
        const matFolGreen = new THREE.MeshLambertMaterial({ map: folGreen, flatShading: true });

        for (let i = 0; i < 200; i++) {
            const tree = new THREE.Group();
            const trunkHeight = 35 + Math.random() * 25;
            const trunkRadius = 2.0 + Math.random() * 1.5;

            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius, trunkHeight, 8), matDark);
            trunk.position.y = trunkHeight / 2;
            tree.add(trunk);

            const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(10 + Math.random() * 5, 1), matFolGreen);
            crown.position.y = trunkHeight + 2.0;
            tree.add(crown);

            const x = (Math.random() - 0.5) * 700;
            const z = (Math.random() - 0.5) * 700;
            if (Math.sqrt(x * x + z * z) < 14) continue;

            const gy = getTerrainHeight(x, z);
            tree.position.set(x, gy, z);
            tree.rotation.y = Math.random() * Math.PI;

            this.group.add(tree);
            this.colliders.push({ x: x, z: z, radius: trunkRadius + 0.6 });
        }
    }

    setupNarrativeProps() {
        const circuitTex = TextureGenerator.createCircuitTexture();

        const headlightsGroup = new THREE.Group();
        headlightsGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.5), new THREE.MeshBasicMaterial({ color: 0xffffff })));
        const lightSpread = new THREE.SpotLight(0xfff5cc, 4.0, 20, Math.PI / 3);
        lightSpread.position.set(0, 0.2, 0);
        headlightsGroup.add(lightSpread);
        headlightsGroup.visible = false;
        this.narrativeProps["HEADLIGHTS"] = headlightsGroup;
        this.group.add(headlightsGroup);

        const backpackGroup = new THREE.Group();
        backpackGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.5), new THREE.MeshLambertMaterial({ color: 0x111111 })));
        const scorch = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ color: 0x221111 }));
        scorch.rotation.x = -Math.PI / 2; scorch.position.y = 0.02;
        backpackGroup.add(scorch);
        backpackGroup.visible = false;
        this.narrativeProps["BACKPACK"] = backpackGroup;
        this.group.add(backpackGroup);

        const coolant = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5), new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.85 }));
        coolant.rotation.x = -Math.PI / 2; coolant.visible = false;
        this.narrativeProps["COOLANT"] = coolant;
        this.group.add(coolant);

        const circuit = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ map: circuitTex }));
        circuit.rotation.x = -Math.PI / 2; circuit.visible = false;
        this.narrativeProps["CIRCUITS"] = circuit;
        this.group.add(circuit);

        const bikeGroup = new THREE.Group();
        bikeGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 1.8), new THREE.MeshBasicMaterial({ color: 0xff00a0 })));
        bikeGroup.visible = false;
        this.narrativeProps["BICYCLE"] = bikeGroup;
        this.group.add(bikeGroup);

        const rosesGroup = new THREE.Group();
        const roseMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
        for (let r = 0; r < 10; r++) {
            const rose = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), roseMat);
            rose.position.set((Math.random() - 0.5) * 1.5, 0.3, (Math.random() - 0.5) * 1.5);
            rosesGroup.add(rose);
        }
        rosesGroup.visible = false;
        this.narrativeProps["ROSES"] = rosesGroup;
        this.group.add(rosesGroup);
    }

    spawnPropAhead(propKey, playerPos, playerDir) {
        const prop = this.narrativeProps[propKey];
        if (!prop) return;

        const spawnX = playerPos.x + playerDir.x * 5.0;
        const spawnZ = playerPos.z + playerDir.z * 5.0;
        const spawnY = getTerrainHeight(spawnX, spawnZ);

        prop.position.set(spawnX, spawnY + 0.1, spawnZ);
        prop.visible = true;
    }

    show() { this.group.visible = true; }
    hide() { this.group.visible = false; }
}