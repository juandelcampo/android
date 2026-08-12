export class AudioSystem {
    constructor(audioElementId) {
        this.audioElement = document.getElementById(audioElementId);
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
    }

    async init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaElementSource(this.audioElement);
            
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 1024;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
        }

        // Reanudar contexto si el navegador lo suspendió
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Iniciar reproducción atrapando posibles alertas de audio
        try {
            await this.audioElement.play();
        } catch (err) {
            console.warn("Reproducción diferida o bloqueada por el navegador:", err);
        }
    }

    getWaveformData() {
        if (this.analyser && this.dataArray) {
            this.analyser.getByteTimeDomainData(this.dataArray);
            return this.dataArray;
        }
        return null;
    }

    getCurrentTime() {
        return this.audioElement ? this.audioElement.currentTime : 0;
    }
}