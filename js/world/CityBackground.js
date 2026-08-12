import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class CityBackground {
    constructor() {
        this.group = new THREE.Group();
        this.colliders = []; 
        this.movingCars = [];

        this.manager = new THREE.LoadingManager();
        this.manager.setURLModifier((url) => {
            if (url.includes('colormap.png') || url.includes('Textures/')) {
                return './assets/textures/variation-a.png';
            }
            return url;
        });

        this.loader = new GLTFLoader(this.manager);
        this.buildCity();
    }

    getColliders() {
        return this.colliders;
    }

    async buildCity() {
        // 1. BARRERAS FÍSICAS DE LA VEREDA (Invisibles)
        const leftWallBox = new THREE.Box3(
            new THREE.Vector3(-200, -10, -600),
            new THREE.Vector3(-13.5, 100, 50)
        );
        this.colliders.push(leftWallBox);

        const rightWallBox = new THREE.Box3(
            new THREE.Vector3(13.5, -10, -600),
            new THREE.Vector3(200, 100, 50)
        );
        this.colliders.push(rightWallBox);

        // 2. Asfalto de la Avenida
        const roadGeo = new THREE.PlaneGeometry(20, 600); 
        const roadMat = new THREE.MeshLambertMaterial({ color: 0x181b22 });
        const road = new THREE.Mesh(roadGeo, roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(0, 0, -250);
        this.group.add(road);

        const lineGeo = new THREE.PlaneGeometry(0.3, 8);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xcc9922 });
        for (let z = 20; z >= -500; z -= 16) {
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.02, z);
            this.group.add(line);
        }

        // 3. Veredas
        const sidewalkGeo = new THREE.BoxGeometry(10, 0.4, 600);
        const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x3d4352 });
        
        const sidewalkL = new THREE.Mesh(sidewalkGeo, sidewalkMat);
        sidewalkL.position.set(-15, 0.2, -250); 
        this.group.add(sidewalkL);

        const sidewalkR = new THREE.Mesh(sidewalkGeo, sidewalkMat);
        sidewalkR.position.set(15, 0.2, -250);  
        this.group.add(sidewalkR);

        // 4. Faroles de Vereda 3D
        const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 4.2);
        const poleMat = new THREE.MeshLambertMaterial({ color: 0x5a6270 });
        const armGeo = new THREE.BoxGeometry(0.8, 0.12, 0.12);
        const bulbGeo = new THREE.SphereGeometry(0.35, 12, 12);
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });

        for (let z = 10; z >= -500; z -= 25) {
            const poleL = new THREE.Mesh(poleGeo, poleMat);
            poleL.position.set(-11, 2.1, z);
            const armL = new THREE.Mesh(armGeo, poleMat);
            armL.position.set(-10.5, 4.1, z);
            const bulbL = new THREE.Mesh(bulbGeo, bulbMat);
            bulbL.position.set(-10.1, 4.0, z);

            this.group.add(poleL);
            this.group.add(armL);
            this.group.add(bulbL);

            const poleR = new THREE.Mesh(poleGeo, poleMat);
            poleR.position.set(11, 2.1, z);
            const armR = new THREE.Mesh(armGeo, poleMat);
            armR.position.set(10.5, 4.1, z);
            const bulbR = new THREE.Mesh(bulbGeo, bulbMat);
            bulbR.position.set(10.1, 4.0, z);

            this.group.add(poleR);
            this.group.add(armR);
            this.group.add(bulbR);
        }

        for (let z = 0; z >= -450; z -= 60) {
            const streetLight = new THREE.PointLight(0xffaa44, 2.5, 45);
            streetLight.position.set(0, 5, z);
            this.group.add(streetLight);
        }

        // 5. Carga e instanciación de edificios
        const highDetailFiles = [
            'building-a.glb', 'building-b.glb', 'building-c.glb', 
            'building-d.glb', 'building-e.glb', 'building-f.glb',
            'building-g.glb', 'building-h.glb', 'building-i.glb',
            'building-j.glb', 'building-k.glb', 'building-l.glb'
        ];
        const lowDetailFiles = [
            'low-detail-building-a.glb', 'low-detail-building-b.glb', 'low-detail-building-c.glb',
            'low-detail-building-d.glb', 'low-detail-building-e.glb', 'low-detail-building-f.glb',
            'low-detail-building-wide-a.glb', 'low-detail-building-wide-b.glb'
        ];
        const skyscraperFiles = [
            'building-skyscraper-a.glb', 'building-skyscraper-b.glb', 
            'building-skyscraper-c.glb', 'building-skyscraper-d.glb',
            'building-skyscraper-e.glb'
        ];
        const propFiles = [
            'detail-awning.glb', 'detail-awning-wide.glb', 
            'detail-overhang.glb', 'detail-overhang-wide.glb'
        ];

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

        const loadedFront = await loadCategory(highDetailFiles);
        const loadedLow = await loadCategory(lowDetailFiles);
        const loadedTowers = await loadCategory(skyscraperFiles);
        const loadedProps = await loadCategory(propFiles);

        const prepareModel = (model) => {
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.roughness = 0.6;
                    child.material.metalness = 0.2;
                }
            });
        };

        [...loadedFront, ...loadedLow, ...loadedTowers, ...loadedProps].forEach(prepareModel);

        const snapToGround = (model, targetY) => {
            const box = new THREE.Box3().setFromObject(model);
            model.position.y += (targetY - box.min.y);
            return box;
        };

        // Fila 1: Frente continuo en veredas (Retirados a X = +/- 17)
        if (loadedFront.length > 0) {
            let zLeft = 15;
            let zRight = 15;
            let index = 0;

            while (zLeft > -480 || zRight > -480) {
                if (zLeft > -480) {
                    const modelL = loadedFront[index % loadedFront.length].clone();
                    modelL.scale.set(4.2, 4.2, 4.2);
                    modelL.rotation.y = Math.PI / 2;
                    modelL.position.set(-17.5, 0, zLeft);
                    this.group.add(modelL);
                    const boxL = snapToGround(modelL, 0.4);

                    if (loadedProps.length > 0 && index % 2 === 0) {
                        const prop = loadedProps[index % loadedProps.length].clone();
                        prop.scale.set(3.5, 3.5, 3.5);
                        prop.rotation.y = Math.PI / 2;
                        prop.position.set(-14.5, 2.2, zLeft - 2);
                        this.group.add(prop);
                    }
                    zLeft -= ((boxL.max.z - boxL.min.z) + 0.1);
                }

                if (zRight > -480) {
                    const modelR = loadedFront[(index + 2) % loadedFront.length].clone();
                    modelR.scale.set(4.2, 4.2, 4.2);
                    modelR.rotation.y = -Math.PI / 2;
                    modelR.position.set(17.5, 0, zRight);
                    this.group.add(modelR);
                    const boxR = snapToGround(modelR, 0.4);

                    if (loadedProps.length > 0 && index % 2 === 1) {
                        const prop = loadedProps[(index + 1) % loadedProps.length].clone();
                        prop.scale.set(3.5, 3.5, 3.5);
                        prop.rotation.y = -Math.PI / 2;
                        prop.position.set(14.5, 2.2, zRight - 2);
                        this.group.add(prop);
                    }
                    zRight -= ((boxR.max.z - boxR.min.z) + 0.1);
                }
                index++;
            }
        }

        // Fila 2: Manto Denso de Relleno
        const loadedFillers = loadedLow.length > 0 ? loadedLow : loadedFront;
        if (loadedFillers.length > 0) {
            let i = 0;
            for (let z = 15; z >= -500; z -= 14) {
                [-28, -42, -58, 28, 42, 58].forEach(x => {
                    const bgBuilding = loadedFillers[(i++) % loadedFillers.length].clone();
                    bgBuilding.scale.set(6.0, 6.0 + Math.random() * 4.0, 6.0);
                    bgBuilding.rotation.y = (Math.floor(Math.random() * 4) * Math.PI) / 2;
                    bgBuilding.position.set(x, 0, z);
                    this.group.add(bgBuilding);
                    snapToGround(bgBuilding, 0.0);
                });
            }
        }

        // Fila 3: Rascacielos
        const beaconGroup = new THREE.Group();
        const lightGeo = new THREE.SphereGeometry(0.7, 8, 8);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xff1100 });

        if (loadedTowers.length > 0) {
            let index = 0;
            for (let z = 15; z >= -500; z -= 40) {
                [-75, -100, 75, 100].forEach((x, i) => {
                    const tower = loadedTowers[(index + i) % loadedTowers.length].clone();
                    tower.scale.set(8.0, 12.0 + Math.random() * 8.0, 8.0);
                    tower.rotation.y = (Math.floor(Math.random() * 4) * Math.PI) / 2;
                    tower.position.set(x, 0, z);
                    this.group.add(tower);
                    
                    const box = snapToGround(tower, 0.0);
                    const beacon = new THREE.Mesh(lightGeo, lightMat);
                    beacon.position.set(x, box.max.y + 0.5, z);
                    beaconGroup.add(beacon);
                });
                index++;
            }

            for (let x = -40; x <= 40; x += 12) {
                const wallTower = loadedTowers[Math.abs(x) % loadedTowers.length].clone();
                wallTower.scale.set(9.0, 15.0 + Math.random() * 5.0, 9.0);
                wallTower.position.set(x, 0, -360 - Math.random() * 30);
                this.group.add(wallTower);
                
                const box = snapToGround(wallTower, 0.0);
                const beacon = new THREE.Mesh(lightGeo, lightMat);
                beacon.position.set(x, box.max.y + 0.5, wallTower.position.z);
                beaconGroup.add(beacon);
            }
        }

        this.beaconGroup = beaconGroup;
        this.group.add(this.beaconGroup);

        // 6. PATRULLERO ESTACIONADO
        this.loadPoliceCar();

        // 7. SISTEMA DE AUTOS Y TRÁFICO
        await this.loadCityTraffic();
    }

    loadPoliceCar() {
        this.loader.load(
            './assets/models/police.glb',
            (gltf) => {
                const policeCar = gltf.scene;
                policeCar.scale.set(3.5, 3.5, 3.5);
                policeCar.position.set(6.5, 0, -8);
                policeCar.rotation.y = Math.PI - 0.2;

                policeCar.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.roughness = 0.3;
                        child.material.metalness = 0.7;
                    }
                });

                this.group.add(policeCar);
                this.colliders.push(new THREE.Box3().setFromObject(policeCar));

                this.sirenLightRed = new THREE.PointLight(0xff0000, 0, 15);
                this.sirenLightRed.position.set(7.5, 2.5, -8);
                this.group.add(this.sirenLightRed);

                this.sirenLightBlue = new THREE.PointLight(0x0000ff, 0, 15);
                this.sirenLightBlue.position.set(5.5, 2.5, -8);
                this.group.add(this.sirenLightBlue);
            },
            undefined,
            (err) => console.error("No se pudo cargar police.glb", err)
        );
    }

    async loadCityTraffic() {
        const carFiles = [
            'sedan-sports.glb', 'taxi.glb', 'suv.glb', 
            'suv-luxury.glb', 'van.glb', 'firetruck.glb', 'garbage-truck.glb'
        ];

        const loadModels = async () => {
            const promises = carFiles.map(file => new Promise((resolve) => {
                this.loader.load(
                    `./assets/models/${file}`,
                    (gltf) => resolve(gltf.scene),
                    undefined,
                    () => resolve(null)
                );
            }));
            return (await Promise.all(promises)).filter(m => m !== null);
        };

        const loadedCars = await loadModels();

        if (loadedCars.length > 0) {
            // A. Autos Estacionados a los lados de la vereda
            for (let z = 20; z >= -480; z -= (25 + Math.random() * 20)) {
                // Cordón derecho (X = 8.0)
                if (Math.random() > 0.35) {
                    const car = loadedCars[Math.floor(Math.random() * loadedCars.length)].clone();
                    car.scale.set(3.2, 3.2, 3.2);
                    car.position.set(8.0, 0, z);
                    car.rotation.y = Math.PI + (Math.random() * 0.08 - 0.04);
                    this.group.add(car);
                    this.colliders.push(new THREE.Box3().setFromObject(car));
                }

                // Cordón izquierdo (X = -8.0)
                if (Math.random() > 0.35) {
                    const car = loadedCars[Math.floor(Math.random() * loadedCars.length)].clone();
                    car.scale.set(3.2, 3.2, 3.2);
                    car.position.set(-8.0, 0, z - 12);
                    car.rotation.y = (Math.random() * 0.08 - 0.04);
                    this.group.add(car);
                    this.colliders.push(new THREE.Box3().setFromObject(car));
                }
            }

            // B. Tráfico Dinámico en Movimiento
            const totalMovingCars = 10;
            for (let i = 0; i < totalMovingCars; i++) {
                const car = loadedCars[i % loadedCars.length].clone();
                car.scale.set(3.2, 3.2, 3.2);

                const isRightLane = i % 2 === 0;
                const laneX = isRightLane ? 3.8 : -3.8;
                const direction = isRightLane ? -1 : 1; // -1 se aleja hacia -Z, 1 viene hacia +Z
                const initialZ = 30 - (i * 55);

                car.position.set(laneX, 0, initialZ);
                car.rotation.y = isRightLane ? Math.PI : 0;

                // Faros delanteros
                const headlight = new THREE.SpotLight(0xfffaee, 4.0, 30, Math.PI / 5, 0.4);
                headlight.position.set(0, 1.2, isRightLane ? -1.8 : 1.8);
                headlight.target.position.set(0, 0, isRightLane ? -15 : 15);
                car.add(headlight);
                car.add(headlight.target);

                this.group.add(car);
                this.movingCars.push({
                    mesh: car,
                    speed: 18 + Math.random() * 12,
                    direction: direction
                });
            }
        } else {
            // Fallback procedural por si no se encuentran los modelos GLB
            this.buildProceduralTraffic();
        }
    }

    buildProceduralTraffic() {
        const carGeo = new THREE.BoxGeometry(2.2, 1.4, 4.5);
        const carColors = [0x992222, 0x225599, 0x333333, 0xaaaaaa, 0xddaa22];

        for (let i = 0; i < 8; i++) {
            const carMat = new THREE.MeshLambertMaterial({ color: carColors[i % carColors.length] });
            const car = new THREE.Mesh(carGeo, carMat);
            
            const isRightLane = i % 2 === 0;
            const laneX = isRightLane ? 3.8 : -3.8;
            const direction = isRightLane ? -1 : 1;
            const initialZ = 20 - (i * 65);

            car.position.set(laneX, 0.7, initialZ);
            
            const headlight = new THREE.SpotLight(0xfffaee, 4.0, 30, Math.PI / 5);
            headlight.position.set(0, 0.2, isRightLane ? -2.2 : 2.2);
            headlight.target.position.set(0, 0, isRightLane ? -15 : 15);
            car.add(headlight);
            car.add(headlight.target);

            this.group.add(car);
            this.movingCars.push({
                mesh: car,
                speed: 20 + Math.random() * 10,
                direction: direction
            });
        }
    }

    update(delta) {
        const time = Date.now() * 0.005;
        
        // Balizas altas rojas
        if (this.beaconGroup) {
            this.beaconGroup.visible = Math.sin(time * 0.4) > 0;
        }

        // Sirenas del patrullero
        if (this.sirenLightRed && this.sirenLightBlue) {
            const flash = Math.sin(time * 3.0);
            this.sirenLightRed.intensity = flash > 0 ? 6.0 : 0.0;
            this.sirenLightBlue.intensity = flash < 0 ? 6.0 : 0.0;
        }

        // Movimiento en loop del tráfico
        this.movingCars.forEach(item => {
            item.mesh.position.z += item.speed * item.direction * delta;

            if (item.direction === -1 && item.mesh.position.z < -520) {
                item.mesh.position.z = 40;
            } else if (item.direction === 1 && item.mesh.position.z > 40) {
                item.mesh.position.z = -520;
            }
        });
    }

    show() { this.group.visible = true; }
    hide() { this.group.visible = false; }
}