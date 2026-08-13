import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AudioSystem } from './audio/AudioSystem.js';
import { Vectoscope } from './ui/Vectoscope.js';
import { SceneManager } from './world/SceneManager.js';
import { Forest } from './world/Forest.js';
import { Phone3D } from './world/Phone3D.js';
import { PlayerControls } from './controls/PlayerControls.js';
import { scriptTimeline } from './timeline.js';
import { HallucinationManager } from './world/HallucinationManager.js';
import { PostProcessing } from './effects/PostProcessing.js';
import { getTerrainHeight } from './world/Terrain.js';

// ---------------------------------------------------------------------
// PANTALLA DE CARGA Y CITA DE MIKHAIL TAL
// ---------------------------------------------------------------------
const startBtn = document.getElementById('start-btn');
const startOverlay = document.getElementById('start-overlay');

startOverlay.style.position = 'fixed';
startOverlay.style.top = '0';
startOverlay.style.left = '0';
startOverlay.style.width = '100vw';
startOverlay.style.height = '100vh';
startOverlay.style.backgroundColor = '#000000';
startOverlay.style.opacity = '1';
startOverlay.style.zIndex = '10000';
startOverlay.style.transition = 'opacity 0.8s ease-in-out';
startOverlay.style.display = 'flex';
startOverlay.style.flexDirection = 'column';
startOverlay.style.justifyContent = 'center';
startOverlay.style.alignItems = 'center';

startBtn.style.cssText = `
    border: 2px solid #ffffff;
    background: #000000;
    color: #ffffff;
    padding: 12px 35px;
    font-family: 'VT323', monospace;
    font-size: 1.6rem;
    letter-spacing: 2px;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s ease;
    margin-bottom: 30px;
`;

let englishQuoteContainer = document.getElementById('tal-english-quote');
if (!englishQuoteContainer) {
    englishQuoteContainer = document.createElement('div');
    englishQuoteContainer.id = 'tal-english-quote';
    englishQuoteContainer.style.cssText = `
        max-width: 800px;
        width: 88%;
        margin-bottom: 25px;
        box-sizing: border-box;
    `;
    englishQuoteContainer.innerHTML = `
        <blockquote style="
            border-left: none;
            padding: 10px 0;
            margin: 0;
            text-align: center;
            font-family: Georgia, 'Times New Roman', serif;
            font-style: italic;
            font-size: 2rem;
            line-height: 1.7;
            color: #ffffff;
        ">
            "I began winning decisive games.<br>
            Perhaps because I uncovered a simple truth:<br>
            I was not the only one anxious;<br>
            my opponent was as well."<br>
            <footer style="margin-top:8px; font-size:0.9rem; color:#dddddd;">- Mikhail Tal</footer>
        </blockquote>
    `;
    startOverlay.insertBefore(englishQuoteContainer, startBtn);
}

let spanishQuoteContainer = document.getElementById('tal-spanish-quote');
if (!spanishQuoteContainer) {
    spanishQuoteContainer = document.createElement('div');
    spanishQuoteContainer.id = 'tal-spanish-quote';
    spanishQuoteContainer.style.cssText = `
        max-width: 900px;
        width: 88%;
        box-sizing: border-box;
    `;
    spanishQuoteContainer.innerHTML = `
        <div style="
            padding: 22px 20px;
            font-family: 'VT323', monospace;
            font-size: 1.45rem;
            line-height: 1.6;
            color: #ffffff;
            text-align: center;
        ">
            "Empecé a ganar partidas decisivas. <br>
            Tal vez porque descubrí una verdad simple: <br>
            Yo no era el único que estaba ansioso; <br>
            mi oponente también lo estaba."<br>
            <footer style="margin-top:8px; font-size:0.9rem; color:#dddddd;">- Mikhail Tal</footer>
        </div>
    `;
    startOverlay.appendChild(spanishQuoteContainer);
}

startBtn.disabled = true;
startBtn.innerText = "LOADING... 0%";

const loadingManager = new THREE.LoadingManager();

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = Math.round((itemsLoaded / itemsTotal) * 100);
    startBtn.innerText = `LOADING... ${progress}%`;
};

loadingManager.onLoad = () => {
    startBtn.disabled = false;
    startBtn.innerText = "START";
};

// ---------------------------------------------------------------------
// OVERLAY FADE ENTRE ESCENAS
// ---------------------------------------------------------------------
const fadeOverlay = document.createElement('div');
fadeOverlay.style.position = 'fixed';
fadeOverlay.style.top = '0';
fadeOverlay.style.left = '0';
fadeOverlay.style.width = '100vw';
fadeOverlay.style.height = '100vh';
fadeOverlay.style.backgroundColor = '#000000';
fadeOverlay.style.opacity = '0';
fadeOverlay.style.pointerEvents = 'none';
fadeOverlay.style.transition = 'opacity 0.8s ease-in-out';
fadeOverlay.style.zIndex = '9999';
document.body.appendChild(fadeOverlay);

function triggerScreenFlash(duration = 1200) {
    const flashEl = document.getElementById('flash-overlay');
    if (!flashEl) return;
    
    // Encendido instantáneo (fogonazo nuclear)
    flashEl.style.transition = 'none';
    flashEl.style.opacity = '1';
    
    // Desvanecimiento progresivo
    requestAnimationFrame(() => {
        flashEl.style.transition = `opacity ${duration}ms ease-out`;
        flashEl.style.opacity = '0';
    });
}

function fadeOutScreen(duration = 800) {
    return new Promise((resolve) => {
        fadeOverlay.style.opacity = '1';
        setTimeout(resolve, duration);
    });
}

function fadeInScreen(duration = 800) {
    return new Promise((resolve) => {
        fadeOverlay.style.opacity = '0';
        setTimeout(resolve, duration);
    });
}

// ---------------------------------------------------------------------
// SISTEMA DE AUDIO ASMR DE PASOS Y ZUMBIDOS
// ---------------------------------------------------------------------
let stepAudioBuffer = null;
let stepCtx = null; 

async function loadStepSound() {
    try {
        stepCtx = new (window.AudioContext || window.webkitAudioContext)();
        const response = await fetch('./assets/audio/leaves_step.mp3'); 
        
        if (!response.ok) {
            console.error("❌ ERROR: El navegador no encuentra 'leaves_step.mp3' en ./assets/audio/");
            return;
        }

        const arrayBuffer = await response.arrayBuffer();
        stepAudioBuffer = await stepCtx.decodeAudioData(arrayBuffer);
        console.log("✅ Sonido ASMR cargado correctamente.");
    } catch (e) {
        console.error("❌ Error decodificando el audio ASMR:", e);
    }
}

let lastStepTime = 0;

function playAndroidStepSound() {
    if (!stepAudioBuffer || !stepCtx) return;

    const now = performance.now();
    if (now - lastStepTime < 500) return; 
    lastStepTime = now;

    try {
        if (stepCtx.state === 'suspended') {
            stepCtx.resume();
        }

        const source = stepCtx.createBufferSource();
        source.buffer = stepAudioBuffer;
        source.playbackRate.value = 0.85 + Math.random() * 0.2; 

        const gainNode = stepCtx.createGain();
        gainNode.gain.value = 0.1; 

        source.connect(gainNode);
        gainNode.connect(stepCtx.destination);
        source.start(0);
    } catch (e) {
        console.error("❌ Audio step real falló al intentar reproducir:", e);
    }
}

// ZUMBIDO CON SUBLOW Y REVERB PROCEDURAL
function playSkullBuzzSound() {
    try {
        const ctx = audio.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (!ctx || ctx.state === 'suspended') return;
        const time = ctx.currentTime;
        
        const rate = ctx.sampleRate;
        const length = rate * 4.0; 
        const impulse = ctx.createBuffer(2, length, rate);
        for (let i = 0; i < 2; i++) {
            const channelData = impulse.getChannelData(i);
            for (let j = 0; j < length; j++) {
                channelData[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 4); 
            }
        }
        const convolver = ctx.createConvolver();
        convolver.buffer = impulse;

        const subOsc = ctx.createOscillator();
        subOsc.type = 'sine'; 
        subOsc.frequency.setValueAtTime(45, time);
        subOsc.frequency.exponentialRampToValueAtTime(15, time + 3.0);

        const sawOsc = ctx.createOscillator();
        sawOsc.type = 'sawtooth'; 
        sawOsc.frequency.setValueAtTime(60, time);
        sawOsc.frequency.exponentialRampToValueAtTime(20, time + 3.0);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0, time);
        gain.gain.linearRampToValueAtTime(1.5, time + 0.2); 
        gain.gain.exponentialRampToValueAtTime(0.01, time + 3.0);

        subOsc.connect(gain);
        sawOsc.connect(gain);
        
        gain.connect(convolver);
        convolver.connect(ctx.destination);
        gain.connect(ctx.destination);
        
        subOsc.start(time);
        subOsc.stop(time + 3.1);
        sawOsc.start(time);
        sawOsc.stop(time + 3.1);
    } catch(e) {}
}

// ---------------------------------------------------------------------
// SECUENCIA DE CRÉDITOS TIPO PELÍCULA
// ---------------------------------------------------------------------
function triggerMovieCredits() {
    if (document.getElementById('credits-overlay')) return;
    let style = document.getElementById('credits-style');
    if (!style) {
        style = document.createElement('style');
        style.id = 'credits-style';
        style.innerHTML = `
        @keyframes scrollCredits {
            0% { transform: translateY(100vh); }
            100% { transform: translateY(-130%); }
        }
    `;
        document.head.appendChild(style);
    }

    const creditsOverlay = document.createElement('div');
    creditsOverlay.id = 'credits-overlay';
    creditsOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: #000000;
        color: #ffffff;
        z-index: 20000;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        font-family: 'VT323', monospace;
    `;

    const creditsContent = document.createElement('div');
    creditsContent.style.cssText = `
        text-align: center;
        animation: scrollCredits 28s linear forwards;
        font-size: 1.8rem;
        line-height: 2.2;
        padding: 20px;
        max-width: 800px;
    `;

    creditsContent.innerHTML = `
        <h1 style="font-size: 3.5rem; letter-spacing: 6px; margin-bottom: 60px;">17</h1>
        
        <p style="color: #aaaaaa; font-size: 1.5rem;"></p>
        <p style="font-size: 2.5rem; margin-bottom: 50px;"></p>
        
        <p style="color: #aaaaaa; font-size: 1.5rem;">Written by</p>
        <p style="font-size: 2rem; font-style: italic; margin-bottom: 50px;">Joaquin Cascini</p>

        <p style="color: #aaaaaa; font-size: 1.3rem;">Directed and Vibecoded by</p>
        <p style="font-size: 2rem; margin-bottom: 50px;">Juan del Campo</p>

        <p style="color: #aaaaaa; font-size: 1.5rem;">Visual Assets Sourced from</p>
        <p style="font-size: 2rem; margin-bottom: 50px;">Hallway by jimbogies (CC BY 4.0)</p>
                <p style="font-size: 2rem; margin-bottom: 50px;">Cellphone by chaschinkaa (CC BY 4.0)</p>
                        <p style="font-size: 2rem; margin-bottom: 50px;">Forest by 99.Miles (CC BY 4.0)</p>
                        <p style="font-size: 2rem; margin-bottom: 50px;">Autum Seamless Map by SibeYu (CC BY 4.0)</p>
                                <p style="font-size: 2rem; margin-bottom: 50px;">St Olaf by Historiska (CC BY 4.0)</p>
                                        <p style="font-size: 2rem; margin-bottom: 50px;">Burned Police Cars by Renafox (CC BY 4.0)</p>
                                                <p style="font-size: 2rem; margin-bottom: 50px;"> Lewis Chess Pieces by Thomas Flynn (CC BY 4.0)</p>
                                                        <p style="font-size: 2rem; margin-bottom: 50px;">Corpse by Tamal De Quezo (CC BY 4.0)</p>
                                                            <p style="font-size: 2rem; margin-bottom: 50px;">Rose Skull by sea-c (CC BY 4.0)</p>
                                                            <p style="color: #aaaaaa; font-size: 1.3rem;">Provided via sketchfab.com</p>

                                                            <p style="color: #aaaaaa; font-size: 1.5rem;">Favicon Sourced from</p>
                                                            <p style="font-size: 2rem; margin-bottom: 50px;">Number 17 by riajulislam (CC BY 4.0)</p>
                                                            <p style="color: #aaaaaa; font-size: 1.3rem;">Provided via www.flaticon.es</p>

        </div>
    `;

    creditsOverlay.appendChild(creditsContent);
    document.body.appendChild(creditsOverlay);

    creditsContent.addEventListener('animationend', () => {
        try { creditsOverlay.remove(); } catch (e) { }
        const s = document.getElementById('credits-style');
        if (s) s.remove();
    }, { once: true });
}

// ---------------------------------------------------------------------
// INICIALIZACIÓN DE SISTEMAS
// ---------------------------------------------------------------------
const audio = new AudioSystem('dialogue');
const vectoscope = new Vectoscope('vectoscope');
const sceneManager = new SceneManager();

sceneManager.renderer.shadowMap.enabled = true;
sceneManager.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const hallucinations = new HallucinationManager(sceneManager.scene, sceneManager.camera);
const forest = new Forest(sceneManager.scene, loadingManager);
const phone3D = new Phone3D(document.getElementById('vectoscope'), loadingManager);
const playerControls = new PlayerControls(sceneManager.camera, sceneManager.renderer.domElement);

playerControls.onStep = playAndroidStepSound;

const postProcessing = new PostProcessing(sceneManager.renderer, sceneManager.scene, sceneManager.camera);

const subtitleBox = document.getElementById('subtitle-box');
const gltfLoader = new GLTFLoader(loadingManager);

let corpseMesh = null;
let roseSkullMesh = null;

const bloodGroup = new THREE.Group();
bloodGroup.visible = false;
sceneManager.scene.add(bloodGroup);

const forestSunLight = new THREE.DirectionalLight(0xffaa77, 0.0);
forestSunLight.castShadow = true;
forestSunLight.shadow.mapSize.width = 2048;
forestSunLight.shadow.mapSize.height = 2048;
forestSunLight.shadow.camera.near = 1.0;
forestSunLight.shadow.camera.far = 150;
forestSunLight.shadow.camera.left = -40;
forestSunLight.shadow.camera.right = 40;
forestSunLight.shadow.camera.top = 40;
forestSunLight.shadow.camera.bottom = -40;
forestSunLight.shadow.bias = -0.0008;

const forestSunLightTarget = new THREE.Object3D();
sceneManager.scene.add(forestSunLightTarget);
forestSunLight.target = forestSunLightTarget;
sceneManager.scene.add(forestSunLight);

const forestAmbientLight = new THREE.AmbientLight(0x383a40, 0.0);
sceneManager.scene.add(forestAmbientLight);

const explosionLight = new THREE.PointLight(0xff4400, 0.0, 300);
sceneManager.scene.add(explosionLight);
let explosionIntensity = 0.0;

let skullOpacity = 0.0;
let defaultFOV = 60;
let targetFOV = 60; 
let zoomStartTime = 0;

// Variables para "forzar" la cámara a mirar algo
let lockCameraTime = 0;
let lockCameraTarget = new THREE.Vector3();

// NIEBLAS
const neutralFogColor = new THREE.Color(0xF2F8F7);
const nightFogColor = new THREE.Color(0x000000); 
const currentFogColor = new THREE.Color(0xF2F8F7);
const tournamentFogTarget = new THREE.Color(0x3a0808); 

const targetBgColor = new THREE.Color(0xF2F8F7);
const targetFogColor = new THREE.Color(0xF2F8F7);

let forestStartTime = 84.88;

function safeOrientTo(targetPos) {
    const cam = sceneManager.camera;
    const playerObj = (playerControls && playerControls.controls && typeof playerControls.controls.getObject === 'function')
        ? playerControls.controls.getObject()
        : cam;

    const dx = targetPos.x - playerObj.position.x;
    const dy = targetPos.y - (playerObj.position.y);
    const dz = targetPos.z - playerObj.position.z;
    const distXZ = Math.sqrt(dx * dx + dz * dz);

    const yaw = Math.atan2(-dx, -dz);
    const pitch = Math.max(-1.4, Math.min(1.4, Math.atan2(dy, distXZ)));

    playerObj.rotation.order = 'YXZ';
    cam.rotation.order = 'YXZ';

    playerObj.rotation.y = yaw;
    playerObj.rotation.x = pitch;
    playerObj.rotation.z = 0;

    cam.rotation.x = pitch;
    cam.rotation.y = yaw;
    cam.rotation.z = 0;
}

function disposeObject(obj) {
    if (!obj) return;
    try {
        obj.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) {
                    try { child.geometry.dispose(); } catch (e) { }
                }
                if (child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach((m) => {
                        try {
                            if (m.map) { m.map.dispose(); }
                            if (m.lightMap) { m.lightMap.dispose(); }
                            if (m.emissiveMap) { m.emissiveMap.dispose(); }
                            if (m.alphaMap) { m.alphaMap.dispose(); }
                            if (m.bumpMap) { m.bumpMap.dispose(); }
                            if (m.normalMap) { m.normalMap.dispose(); }
                            if (typeof m.dispose === 'function') m.dispose();
                        } catch (err) { }
                    });
                }
            }
        });
    } catch (e) { }
    if (obj.parent && typeof obj.parent.remove === 'function') {
        try { obj.parent.remove(obj); } catch (e) { }
    }
}

// GENERADOR PROCEDURAL DE CHARCO DE SANGRE
function createOrganicBloodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(85, 4, 3, 0.96)';

    function drawCurvySplatterBlob(centerX, centerY, baseRadius) {
        const numPoints = 16 + Math.floor(Math.random() * 10);
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radFactor = 0.55 + Math.random() * 0.65;
            const r = baseRadius * radFactor;
            points.push({
                x: centerX + Math.cos(angle) * r,
                y: centerY + Math.sin(angle) * r
            });
        }

        ctx.beginPath();
        let p0 = points[points.length - 1];
        let p1 = points[0];
        let midX = (p0.x + p1.x) / 2;
        let midY = (p0.y + p1.y) / 2;
        ctx.moveTo(midX, midY);

        for (let i = 0; i < points.length; i++) {
            p0 = points[i];
            p1 = points[(i + 1) % points.length];
            let nextMidX = (p0.x + p1.x) / 2;
            let nextMidY = (p0.y + p1.y) / 2;
            ctx.quadraticCurveTo(p0.x, p0.y, nextMidX, nextMidY);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawCurvySplatterBlob(1024, 1024, 550);

    for (let i = 0; i < 50; i++) {
        const cx = 1024 + (Math.random() - 0.5) * 500;
        const cy = 1024 + (Math.random() - 0.5) * 500;
        const r = 200 + Math.random() * 250;
        drawCurvySplatterBlob(cx, cy, r);
    }

    ctx.globalCompositeOperation = 'destination-in';
    const maskGrad = ctx.createRadialGradient(1024, 1024, 200, 1024, 1024, 820);
    maskGrad.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)');
    maskGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.85)');
    maskGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = maskGrad;
    ctx.beginPath();
    ctx.arc(1024, 1024, 1000, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    
    const geo = new THREE.PlaneGeometry(30, 30, 64, 64);
    
    const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.96,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
        side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.visible = false;
    return mesh;
}

const proceduralBloodMesh = createOrganicBloodTexture();
sceneManager.scene.add(proceduralBloodMesh);

let bloodSplatterBase = null;
loadGLTFWithHandlers('./assets/models/small_blood_splatter.glb', (gltf) => {
    bloodSplatterBase = gltf.scene;
    bloodSplatterBase.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshBasicMaterial({
                color: 0x220101,
                transparent: true,
                opacity: 0.95,
                depthWrite: false,
                polygonOffset: true,
                polygonOffsetFactor: -4,
                polygonOffsetUnits: -4,
                side: THREE.DoubleSide
            });
        }
    });
}, null, (err) => { console.warn('small_blood_splatter failed to load:', err); });

gltfLoader.manager = gltfLoader.manager || loadingManager;
function loadGLTFWithHandlers(path, onLoad, onProgress, onError) {
    try {
        gltfLoader.load(path, onLoad, onProgress, (err) => {
            console.error('GLTF load error for', path, err);
            if (typeof onError === 'function') onError(err);
        });
    } catch (e) {
        console.error('Exception loading GLTF', path, e);
        if (typeof onError === 'function') onError(e);
    }
}

function playExplosionSound() {
    try {
        const ctx = audio.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();

        const bufferSize = ctx.sampleRate * 3.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime); // Un poco más de graves/medios
        filter.frequency.exponentialRampToValueAtTime(15, ctx.currentTime + 3.2);

        const gain = ctx.createGain();
        // VOLUMEN SUBIDO DE 1.4 A 3.5
        gain.gain.setValueAtTime(3.5, ctx.currentTime); 
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3.4);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
        noise.stop(ctx.currentTime + 3.6);
        noise.onended = () => {
            try { noise.disconnect(); filter.disconnect(); gain.disconnect(); } catch (e) { }
        };
    } catch (e) {
        console.error("Error al sintetizar audio de explosión:", e);
    }
}

function cleanup() {
    try {
        document.removeEventListener('click', requestPointerLock);
        document.removeEventListener('keydown', requestPointerLock);
    } catch (e) { }

    try {
        if (proceduralBloodMesh) disposeObject(proceduralBloodMesh);
        while (bloodGroup.children.length > 0) {
            disposeObject(bloodGroup.children[0]);
        }
    } catch (e) { }
}

window.addEventListener('beforeunload', cleanup);
window.addEventListener('unload', cleanup);

const hallwayGroup = new THREE.Group();
sceneManager.scene.add(hallwayGroup);

loadGLTFWithHandlers('./assets/models/hallway_with_baked_lighting.glb', (gltf) => {
    const hallway = gltf.scene;

    hallway.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material.side = THREE.DoubleSide;
            child.receiveShadow = true;
        }
    });

    hallway.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(hallway);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    if (size.y > 0) {
        const scaleFactor = 4.8 / size.y;
        hallway.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    hallway.updateMatrixWorld(true);
    const newBbox = new THREE.Box3().setFromObject(hallway);
    const center = new THREE.Vector3();
    newBbox.getCenter(center);

    hallway.position.x = -center.x;
    hallway.position.y = -newBbox.min.y - 0.8;
    hallway.position.z = -center.z;

    hallwayGroup.add(hallway);

    const windowLight = new THREE.DirectionalLight(0xffffff, 1.5);
    windowLight.position.set(-5, 2, 0);
    windowLight.castShadow = true;
    hallwayGroup.add(windowLight);
}, null, (err) => { console.warn('hallway model failed to load:', err); });

loadGLTFWithHandlers('./assets/models/corpse.glb', (gltf) => {
    corpseMesh = gltf.scene;
    corpseMesh.visible = false;

    corpseMesh.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(corpseMesh);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
        const scale = 5.5 / maxDim;
        corpseMesh.scale.set(scale, scale, scale);
    }

    corpseMesh.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    sceneManager.scene.add(corpseMesh);
}, null, (err) => { console.warn('corpse model failed to load:', err); });

loadGLTFWithHandlers('./assets/models/rose_skull.glb', (gltf) => {
    roseSkullMesh = gltf.scene;
    roseSkullMesh.visible = false;

    roseSkullMesh.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(roseSkullMesh);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
        // TAMAÑO AUMENTADO
        const scale = 150.0 / maxDim;
        roseSkullMesh.scale.set(scale, scale, scale);
    }

    roseSkullMesh.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            if (child.material) {
                child.material = child.material.clone();
                child.material.transparent = true;
                child.material.opacity = 0.0;
            }
        }
    });

    sceneManager.scene.add(roseSkullMesh);
}, null, (err) => { console.warn('rose_skull model failed to load:', err); });

const hallwayAmbient = new THREE.AmbientLight(0xffffff, 2.0);
hallwayGroup.add(hallwayAmbient);

sceneManager.scene.background = new THREE.Color(0xffffff);
sceneManager.scene.fog = new THREE.Fog(0xffffff, 8, 30);

const phoneLight = new THREE.DirectionalLight(0xffffff, 2.5);
phoneLight.position.set(1, 3, 3);
sceneManager.scene.add(phoneLight);

sceneManager.camera.add(phone3D.group);
sceneManager.scene.add(sceneManager.camera);
phone3D.group.position.set(0, -0.8, -1.8);
phone3D.group.visible = true;

const playerSpotlight = new THREE.SpotLight(0xffffff, 0.0, 150, Math.PI / 4, 0.4, 0);
playerSpotlight.castShadow = true;
const playerSpotlightTarget = new THREE.Object3D();
sceneManager.scene.add(playerSpotlight);
sceneManager.scene.add(playerSpotlightTarget);
playerSpotlight.target = playerSpotlightTarget;

const createSpotlightGlowTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.95)');
    gradient.addColorStop(0.4, 'rgba(255, 245, 220, 0.5)');
    gradient.addColorStop(0.7, 'rgba(255, 230, 200, 0.15)');
    gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

const spotlightDiskGeo = new THREE.PlaneGeometry(18, 18);
const spotlightDiskMat = new THREE.MeshBasicMaterial({
    map: createSpotlightGlowTexture(),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const spotlightDisk = new THREE.Mesh(spotlightDiskGeo, spotlightDiskMat);
spotlightDisk.rotation.x = Math.PI / 2;
spotlightDisk.visible = false;
sceneManager.scene.add(spotlightDisk);

const policeSirenLight = new THREE.PointLight(0xff0000, 0.0, 60);
sceneManager.scene.add(policeSirenLight);

let spotlightActive = false;
let policeActive = false;

forest.hide();
sceneManager.scene.add(forest.group);

let isPlaying = false;
let isTransitioned = false;

const requestPointerLock = () => {
    if (isPlaying && isTransitioned && playerControls) {
        if (typeof playerControls.lockCursor === 'function') {
            playerControls.lockCursor();
        } else if (playerControls.controls && typeof playerControls.controls.lock === 'function') {
            playerControls.controls.lock();
        }
    }
};

document.addEventListener('click', requestPointerLock);
document.addEventListener('keydown', requestPointerLock);

document.addEventListener('mousemove', (e) => {
    if (!isPlaying) return;
    if (!isTransitioned && phone3D) {
        phone3D.addParallaxDelta(e.movementX || 0, e.movementY || 0);
    }
});

startBtn.addEventListener('click', async () => {
    if (startBtn.disabled) return;

    isPlaying = true;
    startOverlay.style.opacity = '0';
    setTimeout(() => { startOverlay.style.display = 'none'; }, 800);

    try {
        await audio.init();
        await loadStepSound();
    } catch (err) {
        console.error("Error al iniciar audio:", err);
    }
});

function loop() {
    requestAnimationFrame(loop);

    const delta = sceneManager.getDelta();
    const currentTime = audio.getCurrentTime();

    if (!isTransitioned) {
        const audioData = audio.getWaveformData();
        if (vectoscope && typeof vectoscope.draw === 'function') vectoscope.draw(audioData);
        if (phone3D && typeof phone3D.updateTexture === 'function') phone3D.updateTexture();
        if (phone3D && typeof phone3D.update === 'function') phone3D.update(delta);
    } else {
        const totalDuration = (audio.audio && !isNaN(audio.audio.duration) && audio.audio.duration > 0)
            ? audio.audio.duration 
            : 435;
            
        const playerPos = playerControls.controls.getObject().position;

        // Limpiar el flash de la pantalla de forma suave
        if (postProcessing && postProcessing.customPass && postProcessing.customPass.uniforms['uFlashIntensity'].value > 0) {
            postProcessing.customPass.uniforms['uFlashIntensity'].value = Math.max(0, postProcessing.customPass.uniforms['uFlashIntensity'].value - delta * 1.2);
        }
        
        const targetDarkTime = 379.04;
        const nightProgress = Math.min(1.0, Math.max(0.0, (currentTime - forestStartTime) / (targetDarkTime - forestStartTime)));

        const sunY = THREE.MathUtils.lerp(40.0, -10.0, nightProgress);
        forestSunLight.position.set(playerPos.x + 30.0, playerPos.y + sunY, playerPos.z + 20.0);
        forestSunLightTarget.position.copy(playerPos);
        forestSunLightTarget.updateMatrixWorld();

        forestSunLight.intensity = THREE.MathUtils.lerp(2.2, 0.0, nightProgress);
        forestAmbientLight.intensity = THREE.MathUtils.lerp(0.8, 0.002, nightProgress); 

        const tournamentEvt = scriptTimeline.find(e => e.trigger === "TOURNAMENT_RECOUNT");
        if (tournamentEvt && !tournamentEvt.executed && currentTime >= (tournamentEvt.time - 3.5)) {
            currentFogColor.lerp(tournamentFogTarget, delta * 2.5);
            forestAmbientLight.intensity = THREE.MathUtils.lerp(forestAmbientLight.intensity, 0.01, delta * 2.5);
        } else {
            currentFogColor.copy(neutralFogColor).lerp(nightFogColor, nightProgress);
        }

        sceneManager.scene.background.lerp(currentFogColor, delta * 2.0);
        if (sceneManager.scene.fog) {
            sceneManager.scene.fog.color.lerp(currentFogColor, delta * 2.0);
        }
        
        if (typeof forest.update === 'function') forest.update(delta, playerPos);
        if (typeof hallucinations.update === 'function') hallucinations.update(delta);
        
        if (typeof playerControls.update === 'function') playerControls.update(delta, true);

        // FORZAR LA MIRADA (Bloqueo del cuello por unos segundos)
        if (currentTime < lockCameraTime) {
            safeOrientTo(lockCameraTarget);
        }

        if (targetFOV !== defaultFOV && zoomStartTime > 0) {
            if (currentTime > zoomStartTime + 8.5) {
                targetFOV = defaultFOV; 
            }
        }

        if (Math.abs(sceneManager.camera.fov - targetFOV) > 0.1) {
            sceneManager.camera.fov = THREE.MathUtils.lerp(sceneManager.camera.fov, targetFOV, delta * 1.5);
            sceneManager.camera.updateProjectionMatrix();
        }

        if (explosionIntensity > 0) {
            explosionIntensity = Math.max(0.0, explosionIntensity - delta * 90.0);
            explosionLight.intensity = explosionIntensity;
        }
        
        if (proceduralBloodMesh.visible && proceduralBloodMesh.scale.x < 0.95) {
            proceduralBloodMesh.scale.multiplyScalar(1.0 + delta * 0.1);
        }

        // ANIMACIÓN DE GLITCH SUTIL PARA LA CALAVERA
        if (roseSkullMesh && roseSkullMesh.visible) {
            if (roseSkullMesh.userData.basePos) {
                const floatY = roseSkullMesh.userData.basePos.y + Math.sin(currentTime * 2.0) * 0.15;
                
                // Efecto de ruido corto pero sutil (vibración en X/Y/Z + desfase RGB)
                if (Math.random() > 0.88) {
                    roseSkullMesh.position.x = roseSkullMesh.userData.basePos.x + (Math.random() - 0.5) * 1.5;
                    roseSkullMesh.position.y = floatY + (Math.random() - 0.5) * 1.5;
                    roseSkullMesh.position.z = roseSkullMesh.userData.basePos.z + (Math.random() - 0.5) * 1.5;
                    if (postProcessing) postProcessing.setRGBShift(2.5);
                } else {
                    roseSkullMesh.position.x = roseSkullMesh.userData.basePos.x;
                    roseSkullMesh.position.y = floatY;
                    roseSkullMesh.position.z = roseSkullMesh.userData.basePos.z;
                    if (postProcessing) postProcessing.setRGBShift(0.0);
                }
            }

            if (skullOpacity < 1.0) {
                skullOpacity = Math.min(1.0, skullOpacity + delta * 0.8);
            }
            
            // Parpadeo leve de opacidad
            roseSkullMesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.opacity = skullOpacity * (Math.random() > 0.92 ? 0.7 : 1.0);
                }
            });
        }

        if (spotlightActive) {
            playerSpotlight.intensity = 55.0;
            playerSpotlight.position.set(playerPos.x, playerPos.y + 35.0, playerPos.z);
            playerSpotlightTarget.position.copy(playerPos);
            playerSpotlightTarget.updateMatrixWorld();

            spotlightDisk.position.set(playerPos.x, playerPos.y + 34.8, playerPos.z);
            spotlightDiskMat.opacity = 1.0;
            spotlightDisk.visible = true;
        } else {
            playerSpotlight.intensity = 0.0;
            spotlightDiskMat.opacity = 0.0;
            spotlightDisk.visible = false;
        }

        if (policeActive) {
            const time = currentTime;
            const flash = Math.sin(time * 14.0) > 0;
            policeSirenLight.color.setHex(flash ? 0xff0000 : 0x0044ff);
            policeSirenLight.intensity = 130.0;
            policeSirenLight.position.set(playerPos.x, playerPos.y + 2.5, playerPos.z);
        } else {
            policeSirenLight.intensity = 0.0;
        }

        if (audio.audio && (audio.audio.ended || currentTime >= (totalDuration - 0.5))) {
            const endEvt = scriptTimeline.find(e => e.trigger === "END_OF_MESSAGE");
            if (endEvt && !endEvt.executed) {
                endEvt.executed = true;
                handleTrigger(endEvt);
            }
        }
    }

    scriptTimeline.forEach(event => {
        if (!event.executed && currentTime >= event.time) {
            event.executed = true;
            handleTrigger(event);
        }
    });

    if (postProcessing && typeof postProcessing.update === 'function') postProcessing.update(currentTime);
    sceneManager.render(delta, postProcessing);
}

loop();

async function handleTrigger(event) {
    console.log("[TIMELINE EXECUTE]:", event.trigger);

    if (event.text !== undefined && subtitleBox) {
        if (event.text === "") {
            subtitleBox.style.opacity = '0';
            setTimeout(() => { subtitleBox.style.display = 'none'; }, 300);
        } else {
            subtitleBox.style.display = 'block';
            subtitleBox.style.opacity = '0';
            setTimeout(() => {
                subtitleBox.innerHTML = event.text;
                subtitleBox.style.opacity = '1';
            }, 50);
        }
    }

    const playerPos = playerControls.controls.getObject().position;
    
    const _tmpPlayerDir = new THREE.Vector3(); 
    const _tmpCorpsePos = new THREE.Vector3(); 
    
    sceneManager.camera.getWorldDirection(_tmpPlayerDir);
    _tmpPlayerDir.y = 0;
    _tmpPlayerDir.normalize();
    const playerDir = _tmpPlayerDir;

    switch (event.trigger) {
        case "TRANSITION_TO_FOREST":
            try {
                await fadeOutScreen(800);

                isTransitioned = true;
                targetFOV = defaultFOV; 
                forestStartTime = audio.getCurrentTime() || 84.88;

                if (sceneManager.skyDome) sceneManager.skyDome.visible = true;

                hallwayGroup.visible = false;
                if (phone3D && phone3D.group) sceneManager.camera.remove(phone3D.group);
                if (phoneLight) sceneManager.scene.remove(phoneLight);

                if (typeof sceneManager.switchToSunsetAtmosphere === 'function') {
                    sceneManager.switchToSunsetAtmosphere(); 
                }
                
                targetBgColor.copy(neutralFogColor);
                targetFogColor.copy(neutralFogColor);

                forestSunLight.intensity = 2.2;
                forestAmbientLight.intensity = 0.8;
                sceneManager.scene.fog = new THREE.Fog(neutralFogColor, 10, 85);

                if (forest) {
                    forest.show();
                    
                    forest.group.traverse((c) => {
                        if (c.isMesh || c.isInstancedMesh) {
                            c.castShadow = true;
                            c.receiveShadow = true;
                        }
                    });

                    forest.tileGroup.traverse((child) => {
                        if (child.isInstancedMesh) {
                            const dummy = new THREE.Matrix4();
                            const pos = new THREE.Vector3();
                            for(let i=0; i<child.count; i++) {
                                child.getMatrixAt(i, dummy);
                                pos.setFromMatrixPosition(dummy);
                                if (pos.length() < 25 && pos.distanceTo(new THREE.Vector3(-12, 0, -18)) < 15) {
                                     dummy.setPosition(new THREE.Vector3(pos.x, pos.y - 100, pos.z));
                                     child.setMatrixAt(i, dummy);
                                }
                            }
                            child.instanceMatrix.needsUpdate = true;
                        }
                    });
                }

                if (hallucinations && typeof hallucinations.enterForestMode === 'function') {
                    hallucinations.enterForestMode();
                }
                
                if (playerControls) {
                    if (typeof playerControls.setColliders === 'function') playerControls.setColliders(forest.colliders);
                    if (typeof playerControls.resetPosition === 'function') playerControls.resetPosition(0, 0);
                    if (typeof playerControls.enableWalking === 'function') playerControls.enableWalking();
                    if (typeof playerControls.lockCursor === 'function') playerControls.lockCursor();

                    const statuePos = new THREE.Vector3(-12.0, 1.6, -18.0);
                    safeOrientTo(statuePos);
                }

                await fadeInScreen(800);
            } catch (err) {
                console.error("Error en TRANSITION_TO_FOREST:", err);
                hallwayGroup.visible = false;
                if (forest) forest.show();
                await fadeInScreen(400);
            }
            break;

        case "SPEAKER_DISTORTION":
            if (typeof sceneManager.triggerShake === 'function') sceneManager.triggerShake(0.35);
            if (postProcessing && typeof postProcessing.triggerFlash === 'function') {
                postProcessing.triggerFlash(0x88ddff, 0.3);
            }
            break;

        case "HEADLIGHTS_FLASH":
            if (postProcessing && typeof postProcessing.triggerFlash === 'function') {
                postProcessing.triggerFlash(0xfffaee, 0.5);
            }
            break;

case "TOURNAMENT_RECOUNT":
            if (typeof sceneManager.setTournamentLighting === 'function') sceneManager.setTournamentLighting();
            if (hallucinations && typeof hallucinations.triggerChessHallucination === 'function') {
                hallucinations.triggerChessHallucination(playerPos);
            }

            playExplosionSound(); // Sonido con el volumen aumentado

            // FOGONAZO BLANCO INFALIBLE EN PANTALLA COMPLETA
            triggerScreenFlash(1500); // 1.5 segundos de desvanecimiento

            const expDist = 65.0;
            const expX = playerPos.x + playerDir.x * expDist;
            const expZ = playerPos.z + playerDir.z * expDist;
            const expY = getTerrainHeight(expX, expZ) + 15.0;

            explosionLight.position.set(expX, expY, expZ);
            explosionIntensity = 320.0;
            explosionLight.intensity = explosionIntensity;

            if (typeof sceneManager.triggerShake === 'function') sceneManager.triggerShake(1.5);

            if (corpseMesh) {
                const targetX = playerPos.x + playerDir.x * 11.0;
                const targetZ = playerPos.z + playerDir.z * 11.0;
                const groundY = getTerrainHeight(targetX, targetZ);

                corpseMesh.updateMatrixWorld(true);
                const bbox = new THREE.Box3().setFromObject(corpseMesh);

                corpseMesh.position.set(targetX, groundY - bbox.min.y + 0.05, targetZ);
                corpseMesh.rotation.y = Math.atan2(playerDir.x, playerDir.z) + Math.PI / 2;
                corpseMesh.visible = true;

                _tmpCorpsePos.set(targetX, groundY + 0.4, targetZ);
                
                // OBLIGA A MIRAR AL CUERPO
                lockCameraTarget.copy(_tmpCorpsePos);
                lockCameraTime = audio.getCurrentTime() + 2.5; 
                
                targetFOV = 22; 
                zoomStartTime = audio.getCurrentTime();

                proceduralBloodMesh.position.set(targetX, 0, targetZ);
                proceduralBloodMesh.updateMatrixWorld();
                
                const posAttr = proceduralBloodMesh.geometry.attributes.position;
                for(let i = 0; i < posAttr.count; i++) {
                    const lx = posAttr.getX(i);
                    const ly = posAttr.getY(i);
                    const wx = targetX + lx;
                    const wz = targetZ - ly; 
                    
                    const ty = getTerrainHeight(wx, wz);
                    posAttr.setZ(i, ty + 0.05); 
                }
                proceduralBloodMesh.geometry.computeVertexNormals();
                posAttr.needsUpdate = true;
                
                proceduralBloodMesh.visible = true;

                while (bloodGroup.children.length > 0) {
                    const child = bloodGroup.children[0];
                    try { disposeObject(child); } catch (e) { }
                }

                if (bloodSplatterBase) {
                    for (let i = 0; i < 4; i++) {
                        const splatter = bloodSplatterBase.clone(true);
                        const offsetX = (Math.random() - 0.5) * 4.0;
                        const offsetZ = (Math.random() - 0.5) * 4.0;
                        const px = targetX + offsetX;
                        const pz = targetZ + offsetZ;
                        const py = getTerrainHeight(px, pz) + 0.02 + (i * 0.005); 

                        splatter.position.set(px, py, pz);
                        splatter.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI * 2);
                        splatter.scale.set(0.1, 0.1, 0.1);
                        
                        const finalScale = 0.5 + Math.random() * 0.7;
                        splatter.userData.targetScale = new THREE.Vector3(finalScale, 0.1, finalScale);
                        
                        bloodGroup.add(splatter);
                    }
                }
                bloodGroup.visible = true;
            }
            break;

        case "CIRCUIT_BOARDS":
            if (postProcessing && typeof postProcessing.triggerFlash === 'function') {
                postProcessing.triggerFlash(0x00ff88, 0.35);
            }
            break;

        case "ROSE_SKULL":
            playSkullBuzzSound(); // Zumbido con Sublow

            if (postProcessing && typeof postProcessing.triggerFlash === 'function') {
                postProcessing.triggerFlash(0x550000, 0.8); 
            }

            if (roseSkullMesh) {
                const distance = 20.0; 
                const height = 60.0;

                const skullPos = new THREE.Vector3(
                    playerPos.x + playerDir.x * distance,
                    playerPos.y + height,
                    playerPos.z + playerDir.z * distance
                );

                roseSkullMesh.userData.basePos = skullPos.clone(); // Guardo posición original para el glitch
                roseSkullMesh.position.copy(skullPos);
                roseSkullMesh.lookAt(playerPos.x, playerPos.y + 1.6, playerPos.z);
                roseSkullMesh.rotateY(Math.PI);

                // OBLIGA A MIRAR A LA CALAVERA Y HACE ZOOM
                lockCameraTarget.copy(skullPos);
                lockCameraTime = audio.getCurrentTime() + 4.0; 
                
                targetFOV = 35;
                zoomStartTime = audio.getCurrentTime();

                skullOpacity = 0.0;
                roseSkullMesh.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.opacity = 0.0;
                    }
                });
                roseSkullMesh.visible = true;
            }
            break;

        case "SPOTLIGHT_ON":
            spotlightActive = true;
            if (typeof sceneManager.triggerShake === 'function') sceneManager.triggerShake(0.2);
            break;

        case "POLICE_SIRENS":
            policeActive = true;
            if (typeof sceneManager.triggerShake === 'function') sceneManager.triggerShake(0.4);
            break;

        case "MOVIE_CREDITS":
            triggerMovieCredits();
            break;

        case "END_OF_MESSAGE":
            try {
                await fadeOutScreen(800);

                isTransitioned = false;
                spotlightActive = false;
                policeActive = false;
                policeSirenLight.intensity = 0;
                playerSpotlight.intensity = 0;
                forestSunLight.intensity = 0;
                forestAmbientLight.intensity = 0;
                explosionIntensity = 0;
                explosionLight.intensity = 0;
                spotlightDisk.visible = false;
                spotlightDiskMat.opacity = 0.0;

                targetFOV = defaultFOV;
                zoomStartTime = 0;
                
                // Apagamos cualquier glitch de color residual
                if (postProcessing) postProcessing.setRGBShift(0.0);

                skullOpacity = 0.0;
                if (corpseMesh) corpseMesh.visible = false;
                if (roseSkullMesh) roseSkullMesh.visible = false;
                bloodGroup.visible = false;
                proceduralBloodMesh.visible = false;

                if (playerControls) {
                    if (playerControls.controls && typeof playerControls.controls.unlock === 'function') {
                        playerControls.controls.unlock();
                    }
                    if (typeof playerControls.resetPosition === 'function') {
                        playerControls.resetPosition(0, 0);
                    }
                }
                
                sceneManager.camera.position.set(0, 0.45, 0);
                sceneManager.camera.rotation.set(0, 0, 0);
                sceneManager.camera.fov = defaultFOV;
                sceneManager.camera.updateProjectionMatrix();

                if (forest) forest.hide();
                if (hallucinations && typeof hallucinations.exitForestMode === 'function') {
                    hallucinations.exitForestMode();
                }
                if (subtitleBox) subtitleBox.style.display = 'none';

                if (sceneManager.skyDome) sceneManager.skyDome.visible = false;

                hallwayGroup.visible = true;
                targetBgColor.setHex(0xffffff);
                targetFogColor.setHex(0xffffff);
                sceneManager.scene.background = new THREE.Color(0xffffff);
                sceneManager.scene.fog = new THREE.Fog(0xffffff, 8, 30);
                
                if (phone3D && phone3D.group) {
                    sceneManager.camera.add(phone3D.group);
                    phone3D.group.position.set(0, -0.65, -1.4);
                    phone3D.group.rotation.set(0, 0, 0);
                    phone3D.group.visible = true;
                }
                sceneManager.scene.add(phoneLight);

                if (vectoscope && typeof vectoscope.start === 'function') {
                    vectoscope.start();
                }

                await fadeInScreen(800);

            } catch (err) {
                console.error("Error en END_OF_MESSAGE:", err);
                await fadeInScreen(400);
            }
            break;
    }
}