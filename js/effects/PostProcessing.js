import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const RetroGlitchShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'uTime': { value: 0 },
        'uGlitch': { value: 0.0 },
        'uRGBShift': { value: 0.0 },
        'uFlashColor': { value: new THREE.Color(0x000000) },
        'uFlashIntensity': { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uGlitch;
        uniform float uRGBShift;
        uniform vec3 uFlashColor;
        uniform float uFlashIntensity;
        varying vec2 vUv;

        float rand(vec2 co) {
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec2 uv = vUv;

            if (uGlitch > 0.0) {
                float slice = floor(uv.y * 16.0);
                float noise = rand(vec2(slice, floor(uTime * 15.0)));
                if (noise < uGlitch) {
                    uv.x += (rand(vec2(uTime, slice)) - 0.5) * 0.08 * uGlitch;
                }
            }

            float shift = uRGBShift * 0.015;
            float r = texture2D(tDiffuse, vec2(uv.x + shift, uv.y)).r;
            float g = texture2D(tDiffuse, uv).g;
            float b = texture2D(tDiffuse, vec2(uv.x - shift, uv.y)).b;
            vec3 color = vec3(r, g, b);

            color = mix(color, uFlashColor, uFlashIntensity);

            gl_FragColor = vec4(color, 1.0);
        }
    `
};

export class PostProcessing {
    constructor(renderer, scene, camera) {
        this.composer = new EffectComposer(renderer);
        // FIX CRÍTICO: Forzar al composer a coincidir exactamente con la resolución 320x240
        this.composer.setSize(320, 240);
        
        const renderPass = new RenderPass(scene, camera);
        this.composer.addPass(renderPass);

        this.customPass = new ShaderPass(RetroGlitchShader);
        this.composer.addPass(this.customPass);
    }

    update(time) {
        this.customPass.uniforms['uTime'].value = time;
    }

    setGlitch(intensity) {
        this.customPass.uniforms['uGlitch'].value = intensity;
    }

    setRGBShift(amount) {
        this.customPass.uniforms['uRGBShift'].value = amount;
    }

    triggerFlash(colorHex, intensity = 0.8) {
        this.customPass.uniforms['uFlashColor'].value.setHex(colorHex);
        this.customPass.uniforms['uFlashIntensity'].value = intensity;
    }

    clearFlash() {
        this.customPass.uniforms['uFlashIntensity'].value = 0.0;
    }

    render() {
        this.composer.render();
    }
}