import * as THREE from 'three';
import { AudioSystem } from './audio/AudioSystem.js';
import { Vectoscope } from './ui/Vectoscope.js';
import { SceneManager } from './world/SceneManager.js';
import { Forest } from './world/Forest.js';
import { CityBackground } from './world/CityBackground.js';
import { Phone3D } from './world/Phone3D.js';
import { PlayerControls } from './controls/PlayerControls.js';
import { scriptTimeline } from './timeline.js';
import { HallucinationManager } from './world/HallucinationManager.js';

const audio = new AudioSystem('dialogue');
const vectoscope = new Vectoscope('vectoscope');
const sceneManager = new SceneManager();
const hallucinations = new HallucinationManager(sceneManager.scene, sceneManager.camera);
const city = new CityBackground();
const forest = new Forest();
const phone3D = new Phone3D(document.getElementById('vectoscope'));
const playerControls = new PlayerControls(sceneManager.camera, sceneManager.renderer.domElement);

const subtitleBox = document.getElementById('subtitle-box');

// 1. Agregar la ciudad a la escena
sceneManager.add(city.group);

// 2. Ocultar e instanciar el bosque
forest.hide();
sceneManager.add(forest.group);

// 3. Inicializar los colisionadores de las paredes de la ciudad
playerControls.setColliders(city.getColliders());

sceneManager.camera.add(phone3D.group);
sceneManager.add(sceneManager.camera);

const startBtn = document.getElementById('start-btn');
const startOverlay = document.getElementById('start-overlay');

let isPlaying = false;
let isTransitioned = false;

window.addEventListener('mousemove', (e) => {
    if (!isPlaying || isTransitioned) return;
    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;
    phone3D.addParallaxDelta(movementX, movementY);
});

startBtn.addEventListener('click', async () => {
    try {
        await audio.init();
        playerControls.lockCursor();
        playerControls.enableWalking();
        
        // Arrancar parado sobre la vereda derecha mirando a la calle (X = 9.2, Z = 2.0)
        playerControls.resetPosition(9.2, 2.0);
        
        isPlaying = true;
        startOverlay.style.opacity = '0';
        setTimeout(() => { startOverlay.style.display = 'none'; }, 800);
        
    } catch (err) {
        console.error("Error al iniciar audio:", err);
    }
});

function loop() {
    requestAnimationFrame(loop);

    const delta = sceneManager.getDelta();
    const currentTime = audio.getCurrentTime();

    if (!isTransitioned) {
        city.update(delta);
        const audioData = audio.getWaveformData();
        vectoscope.draw(audioData);
        phone3D.updateTexture();
        phone3D.updateSmoothRotation();
    } else {
        // Actualizar efectos de alucinación cuando estamos en el bosque
        hallucinations.update(delta);
    }
    
    playerControls.update(delta, isTransitioned);

    scriptTimeline.forEach(event => {
        if (!event.executed && currentTime >= event.time) {
            event.executed = true;
            handleTrigger(event);
        }
    });

    sceneManager.render(delta);
}

loop();

function handleTrigger(event) {
    console.log("[TIMELINE EXECUTE]:", event.trigger);
    
    // Manejo universal de subtítulos
    if (event.text !== undefined) {
        if (event.text === "") {
            subtitleBox.style.display = 'none';
        } else {
            subtitleBox.innerText = event.text;
            subtitleBox.style.display = 'block';
        }
    }

    const playerPos = playerControls.controls.getObject().position;
    const playerDir = new THREE.Vector3();
    sceneManager.camera.getWorldDirection(playerDir);

    switch (event.trigger) {
        case "TRANSITION_TO_FOREST":
            isTransitioned = true;
            vectoscope.stop();
            city.hide();
            sceneManager.switchToSunsetAtmosphere(); 
            forest.show();
            hallucinations.enterForestMode();
            playerControls.setColliders(forest.colliders);
            playerControls.resetPosition(0, 0);
            phone3D.lowerPhone();
            break;

        case "RENDER_SIMPLIFIES":
            // "El renderizado se simplifica más allá de lo que puedo ver"
            // Cerramos la niebla abruptamente reduciendo la visibilidad
            sceneManager.setFogDensity(10, 60);
            break;

        case "FOREST_MIST":
            hallucinations.triggerForestMist(playerPos);
            sceneManager.triggerFlash(0x99ddff, 0.18);
            break;

        case "FOREST_AURA":
            hallucinations.triggerForestAura(playerPos);
            sceneManager.triggerFlash(0xff88ff, 0.18);
            break;

        case "SANCTUARY_ATMOSPHERE":
            // "En el santuario de este bosque, se puede escuchar música"
            sceneManager.setSanctuaryLighting();
            hallucinations.triggerSanctuarySpores();
            hallucinations.triggerSoundGlitch(playerPos);
            break;

        case "SPEAKER_DISTORTION":
            // Micro-glitch visual simulando la falla de los parlantes/circuitos
            sceneManager.triggerShake(0.35);
            hallucinations.triggerSoundGlitch(playerPos);
            hallucinations.triggerCircuitTrail(playerPos, playerDir);
            sceneManager.triggerFlash(0x88ddff, 0.3);
            break;

        case "ACTUATORS_UPGRADE":
            // "Mis actuadores funcionan mejor que nunca. El movimiento viene más fluido ahora."
            hallucinations.triggerCircuitTrail(playerPos, playerDir, 0xff33cc);
            hallucinations.triggerGhostOrbs(playerPos);
            hallucinations.triggerForestCarAppearance(playerPos);
            sceneManager.triggerFlash(0xff88dd, 0.2);
            break;

        case "HEADLIGHTS_FLASH":
            // "Me encantaba romper los faros..."
            forest.spawnPropAhead("HEADLIGHTS", playerPos, playerDir);
            sceneManager.triggerFlash(0xfffaee, 0.6);
            break;

        case "TOURNAMENT_RECOUNT":
            // Cambia el ambiente a tonos oscuros y fríos de memoria
            sceneManager.setTournamentLighting();
            hallucinations.triggerChessHallucination(playerPos);
            break;

        case "BACKPACK_EXPLOSION":
            // Explota la mochila negra: Fuerte temblor + destello de luz naranja
            forest.spawnPropAhead("BACKPACK", playerPos, playerDir);
            sceneManager.triggerShake(1.6);
            sceneManager.triggerFlash(0xff4400, 1.2);
            hallucinations.triggerSoundGlitch(playerPos);
            hallucinations.triggerForestExplosion(playerPos, playerDir);
            break;

        case "BLUE_COOLANT_LEAK":
            // "El refrigerante azul goteaba por mis cortes"
            forest.spawnPropAhead("COOLANT", playerPos, playerDir);
            hallucinations.triggerBlueRain(playerPos);
            break;

        case "COOLANT_GLOW":
            hallucinations.triggerCoolantGlow(playerPos);
            break;

        case "ESCAPE_RUN":
            // "Y luego corrí"
            // Temblor de pisadas rápidas sin cambiar la velocidad del jugador
            sceneManager.triggerShake(0.5);
            hallucinations.triggerSoundGlitch(playerPos);
            break;

        case "CIRCUIT_BOARDS":
            // "Veo ese verde oscuro brillante de las placas de circuito... en una bicicleta magenta"
            forest.spawnPropAhead("CIRCUITS", playerPos, playerDir);
            forest.spawnPropAhead("BICYCLE", playerPos, playerDir);
            hallucinations.triggerCircuitTrail(playerPos, playerDir, 0xff00ff);
            hallucinations.triggerMagentaCircuitPath(playerPos, playerDir);
            sceneManager.triggerFlash(0x00ff88, 0.25);
            break;

        case "ROTOSCOPED_ROSES":
            // "Sosteniendo una cesta de mimbre llena de rosas muy rojas"
            forest.spawnPropAhead("ROSES", playerPos, playerDir);
            hallucinations.triggerRosePetalsRain(playerPos);
            hallucinations.triggerGhostOrbs(playerPos);
            break;

        case "POLICE_SIRENS":
            // "Los escucho venir"
            // Parpadeo de sirenas de la policía a lo lejos entre la niebla del bosque
            sceneManager.enableForestSirens();
            sceneManager.triggerShake(0.2);
            hallucinations.triggerPoliceBeacons(playerPos, playerDir);
            hallucinations.triggerSoundGlitch(playerPos);
            break;

        case "END_OF_MESSAGE":
            // Volver a la ciudad al final del mensaje
            isTransitioned = false;
            forest.hide();
            city.show();
            hallucinations.exitForestMode();
            sceneManager.switchToCityAtmosphere();
            playerControls.setColliders(city.getColliders());
            playerControls.resetPosition(9.2, 2.0);
            subtitleBox.style.display = 'none';
            break;
    }
}