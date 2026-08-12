import * as THREE from 'three';

export class TextureGenerator {
    static createBarkTexture(type = 'dark') {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const baseColor = type === 'birch' ? '#d0d3d4' : (type === 'redwood' ? '#3d1e15' : '#221a15');
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, 128, 128);

        if (type === 'birch') {
            for (let y = 0; y < 128; y += 8) {
                for (let x = 0; x < 128; x += 10) {
                    if (Math.random() > 0.4) {
                        ctx.fillStyle = '#1c252a';
                        ctx.fillRect(x, y, 8 + Math.random() * 10, 3);
                    }
                }
            }
        } else {
            for (let x = 0; x < 128; x += 2) {
                for (let y = 0; y < 128; y += 4) {
                    const r = Math.random();
                    if (r > 0.65) ctx.fillStyle = '#2f241d';
                    else if (r < 0.2) ctx.fillStyle = '#120d0a';
                    else ctx.fillStyle = baseColor;
                    ctx.fillRect(x, y, 2, 4);
                }
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    static create3DFoliageTexture(colorHex = '#275932') {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = colorHex;
        ctx.fillRect(0, 0, 128, 128);

        for (let x = 0; x < 128; x += 2) {
            for (let y = 0; y < 128; y += 2) {
                const r = Math.random();
                if (r > 0.65) ctx.fillStyle = '#377e47';
                else if (r < 0.25) ctx.fillStyle = '#15331f';
                else ctx.fillStyle = colorHex;
                ctx.fillRect(x, y, 2, 2);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    static createGroundTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#254e2d';
        ctx.fillRect(0, 0, 256, 256);

        for (let x = 0; x < 256; x += 4) {
            for (let y = 0; y < 256; y += 4) {
                const rand = Math.random();
                if (rand > 0.7) ctx.fillStyle = '#32683d';
                else if (rand > 0.4) ctx.fillStyle = '#1c3d22';
                else if (rand < 0.15) ctx.fillStyle = '#122916';
                else ctx.fillStyle = '#254e2d';
                ctx.fillRect(x, y, 4, 4);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(80, 80);
        return texture;
    }

    static createGrassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * 28);
            const height = 14 + Math.floor(Math.random() * 16);
            ctx.fillStyle = Math.random() > 0.4 ? '#2e6b3c' : '#45a05b';
            ctx.fillRect(x, 32 - height, 2, height);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }

    static createFernTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 64, 64);

        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI - Math.PI / 2;
            ctx.fillStyle = i % 2 === 0 ? '#2a6336' : '#3e8c4e';
            for (let r = 0; r < 28; r += 2) {
                const x = 32 + Math.cos(angle) * r;
                const y = 60 - Math.sin(angle) * r * 0.8;
                ctx.fillRect(x - 2, y - 2, 4, 4);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }

    static createMossRockTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#3a3d42'; ctx.fillRect(0, 0, 64, 64);

        // Manchas de musgo verde sobre la piedra
        for (let x = 0; x < 64; x += 2) {
            for (let y = 0; y < 64; y += 2) {
                const r = Math.random();
                if (r > 0.75) ctx.fillStyle = '#2f6338';
                else if (r > 0.55) ctx.fillStyle = '#41824c';
                else if (r < 0.2) ctx.fillStyle = '#222428';
                else ctx.fillStyle = '#3a3d42';
                ctx.fillRect(x, y, 2, 2);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }

    static createMushroomTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#d63031'; ctx.fillRect(0, 0, 32, 32);

        // Puntos blancos en el sombrero del hongo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(6, 6, 4, 4);
        ctx.fillRect(20, 8, 4, 4);
        ctx.fillRect(12, 18, 5, 5);
        ctx.fillRect(24, 22, 3, 3);

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        return texture;
    }

    static createSunsetSkyTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1; canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, 0, 128);
        grad.addColorStop(0, '#101728');   
        grad.addColorStop(0.4, '#2d2238');  
        grad.addColorStop(0.75, '#5c3848'); 
        grad.addColorStop(1.0, '#8c5245');  

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1, 128);

        return new THREE.CanvasTexture(canvas);
    }

    static createBuildingTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#10141c'; ctx.fillRect(0, 0, 128, 256);

        for (let y = 12; y < 240; y += 20) {
            for (let x = 12; x < 110; x += 18) {
                const isLit = Math.random() > 0.5;
                ctx.fillStyle = isLit ? (Math.random() > 0.3 ? '#ffcc55' : '#77bbff') : '#080a0e';
                ctx.fillRect(x, y, 10, 14);
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }

    static createCircuitTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#003318'; ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#00ff88';
        for (let i = 0; i < 14; i++) {
            const x = Math.floor(Math.random() * 58);
            const y = Math.floor(Math.random() * 58);
            ctx.fillRect(x, y, 12, 2); ctx.fillRect(x, y, 2, 12);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        return texture;
    }
}