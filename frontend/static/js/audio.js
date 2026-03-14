/**
 * AudioManager - Handles audio capture and playback for FocusCompanion
 * 
 * Uses Web Audio API for:
 * - Capturing microphone input at 16kHz PCM16
 * - Resampling audio to match Gemini requirements
 * - Playing back audio responses from Gemini
 * - Visualizing audio levels
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.mediaStream = null;
        this.mediaRecorder = null;
        this.sourceNode = null;
        this.processorNode = null;
        this.analyserNode = null;
        
        // Audio settings
        this.sampleRate = 16000;
        this.bufferSize = 4096;
        this.channels = 1;
        
        // State
        this.isCapturing = false;
        this.isPlaying = false;
        this.audioQueue = [];
        
        // Callbacks
        this.onAudioData = null;
        this.onVisualization = null;
    }

    /**
     * Initialize the audio context
     */
    async initialize() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.sampleRate
            });
        }
        
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        return true;
    }

    /**
     * Start capturing audio from microphone
     */
    async startCapture() {
        if (this.isCapturing) return;
        
        try {
            await this.initialize();
            
            // Get microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: this.sampleRate,
                    channelCount: this.channels,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Create audio source
            this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
            
            // Create analyser for visualization
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 256;
            this.sourceNode.connect(this.analyserNode);
            
            // Create script processor for capturing raw audio
            this.processorNode = this.audioContext.createScriptProcessor(
                this.bufferSize,
                this.channels,
                this.channels
            );
            
            this.processorNode.onaudioprocess = (event) => {
                if (!this.isCapturing) return;
                
                const inputData = event.inputBuffer.getChannelData(0);
                
                // Convert float32 to PCM16
                const pcmData = this.floatToPCM16(inputData);
                
                // Send to callback
                if (this.onAudioData) {
                    this.onAudioData(pcmData);
                }
            };
            
            this.sourceNode.connect(this.processorNode);
            this.processorNode.connect(this.audioContext.destination);
            
            this.isCapturing = true;
            
            // Start visualization loop
            this.startVisualization();
            
            console.log('Audio capture started');
            return true;
            
        } catch (error) {
            console.error('Error starting audio capture:', error);
            throw error;
        }
    }

    /**
     * Stop capturing audio
     */
    stopCapture() {
        this.isCapturing = false;
        
        if (this.processorNode) {
            this.processorNode.disconnect();
            this.processorNode = null;
        }
        
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        
        if (this.analyserNode) {
            this.analyserNode.disconnect();
            this.analyserNode = null;
        }
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        console.log('Audio capture stopped');
    }

    /**
     * Convert Float32Array to PCM16 ArrayBuffer
     */
    floatToPCM16(floatData) {
        const pcmData = new Int16Array(floatData.length);
        for (let i = 0; i < floatData.length; i++) {
            // Clamp to [-1, 1] and convert to 16-bit
            const sample = Math.max(-1, Math.min(1, floatData[i]));
            pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }
        return pcmData.buffer;
    }

    /**
     * Convert PCM16 to Float32Array for playback
     */
    pcm16ToFloat(pcmData) {
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
            floatData[i] = pcmData[i] / 0x8000;
        }
        return floatData;
    }

    /**
     * Play audio data received from Gemini
     */
    async playAudio(audioBuffer) {
        try {
            await this.initialize();
            
            // Convert ArrayBuffer to Int16Array
            const pcmData = new Int16Array(audioBuffer);
            
            // Convert to Float32
            const floatData = this.pcm16ToFloat(pcmData);
            
            // Create audio buffer
            const audioBufferObj = this.audioContext.createBuffer(
                1,
                floatData.length,
                this.sampleRate
            );
            audioBufferObj.copyToChannel(floatData, 0);
            
            // Create source and play
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBufferObj;
            source.connect(this.audioContext.destination);
            source.start();
            
            this.isPlaying = true;
            
            source.onended = () => {
                this.isPlaying = false;
            };
            
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    /**
     * Start visualization loop
     */
    startVisualization() {
        if (!this.analyserNode || !this.onVisualization) return;
        
        const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
        
        const visualize = () => {
            if (!this.isCapturing) return;
            
            this.analyserNode.getByteFrequencyData(dataArray);
            
            // Calculate average volume
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            
            // Call visualization callback
            if (this.onVisualization) {
                this.onVisualization(dataArray, average);
            }
            
            requestAnimationFrame(visualize);
        };
        
        visualize();
    }

    /**
     * Check if browser supports required APIs
     */
    static isSupported() {
        return !!(
            window.AudioContext ||
            window.webkitAudioContext
        ) && !!(
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia
        );
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}