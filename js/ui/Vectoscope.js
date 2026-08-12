export class Vectoscope {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isActive = true;
    }

    draw(dataArray) {
        if (!this.isActive || !dataArray) return;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const radius = w * 0.4;

        // Fondo negro con estela de fósforo CRT
        this.ctx.fillStyle = 'rgba(2, 8, 4, 0.28)';
        this.ctx.fillRect(0, 0, w, h);

        this.ctx.save();
        // Resplandor de tubo catódico
        this.ctx.shadowBlur = 14;
        this.ctx.shadowColor = '#00ff88';
        this.ctx.strokeStyle = '#88ffcc';
        this.ctx.lineWidth = 1.8;
        this.ctx.beginPath();

        const bufferLen = dataArray.length;
        const sampleShift = Math.floor(bufferLen * 0.04); 
        const timeSec = performance.now() * 0.003;
        const lfoMod = Math.sin(timeSec * 1.5) * 0.18;

        let totalVolume = 0;

        for (let i = 0; i < bufferLen; i += 2) {
            const left = (dataArray[i] - 128) / 128.0;
            const shiftedIdx = (i + sampleShift) % bufferLen;
            let right = (dataArray[shiftedIdx] - 128) / 128.0;
            right = right * 0.85 + left * lfoMod;

            totalVolume += Math.abs(left);

            const side = (left - right) * 0.7071;
            const mid = (left + right) * 0.7071;

            const x = cx + side * radius * 1.2;
            const y = cy - mid * radius * 1.2;

            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();

        // Núcleo blanco brillante en picos de audio
        const avgVol = totalVolume / (bufferLen / 2);
        if (avgVol > 0.05) {
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.0;
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    stop() {
        this.isActive = false;
    }
}