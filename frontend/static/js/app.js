/**
 * FocusCompanion - Main Application
 * 
 * Coordinates between:
 * - WebSocketClient for backend communication
 * - AudioManager for voice capture/playback
 * - ScreenCapture for screen analysis
 * - Session timer and UI updates
 */
class FocusCompanionApp {
    constructor() {
        // Initialize components
        this.wsClient = new WebSocketClient();
        this.audioManager = new AudioManager();
        this.screenCapture = new ScreenCapture();
        
        // Session state
        this.currentSession = null;
        this.timerInterval = null;
        this.isConnected = false;
        
        // Screen analysis state
        this.lastScreenAnalysis = null;
        this.screenAnalysisInterval = null;
        this.focusState = 'unknown'; // 'focused', 'distracted', 'unknown'
        
        // Adaptive capture config - optimized for bandwidth
        // Lower quality when focused (less critical), higher when distracted (need detail)
        this.captureConfig = {
            focused: { interval: 60000, quality: 0.3 },    // Every 60s, 30% quality (saves bandwidth)
            distracted: { interval: 10000, quality: 0.6 }, // Every 10s, 60% quality (need clarity)
            normal: { interval: 30000, quality: 0.5 }       // Every 30s, 50% quality (balanced)
        };
        
        // Track compression stats
        this.compressionStats = {
            captures: 0,
            totalOriginalSize: 0,
            totalCompressedSize: 0
        };
        
        // Bind UI elements
        this.bindElements();
        this.bindEvents();
        
        // Setup callbacks
        this.setupCallbacks();
    }
    
    bindElements() {
        // Connection status
        this.statusBadge = document.getElementById('connection-status');
        this.statusText = this.statusBadge.querySelector('.status-text');
        
        // Panels
        this.setupPanel = document.getElementById('setup-panel');
        this.sessionPanel = document.getElementById('session-panel');
        
        // Form elements
        this.goalInput = document.getElementById('session-goal');
        this.durationSelect = document.getElementById('session-duration');
        
        // Buttons
        this.connectBtn = document.getElementById('connect-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resumeBtn = document.getElementById('resume-btn');
        this.endBtn = document.getElementById('end-btn');
        
        // Session display
        this.goalDisplay = document.getElementById('session-goal-display');
        this.timerDisplay = document.getElementById('timer');
        this.progressFill = document.getElementById('progress-fill');
        
        // Audio visualization
        this.audioCanvas = document.getElementById('audio-canvas');
        this.audioStatus = document.getElementById('audio-status');
        
        // Transcript
        this.transcriptDiv = document.getElementById('transcript');
    }
    
    bindEvents() {
        // Main connect/start button
        this.connectBtn.addEventListener('click', () => this.startSession());
        
        // Session controls
        this.pauseBtn.addEventListener('click', () => this.pauseSession());
        this.resumeBtn.addEventListener('click', () => this.resumeSession());
        this.endBtn.addEventListener('click', () => this.endSession());
        
        // Audio canvas click to toggle mute/unmute
        this.audioCanvas.addEventListener('click', () => this.toggleAudioCapture());
    }
    
    setupCallbacks() {
        // WebSocket callbacks
        this.wsClient.onConnect = () => this.onConnected();
        this.wsClient.onDisconnect = () => this.onDisconnected();
        this.wsClient.onMessage = (data) => this.onMessage(data);
        this.wsClient.onError = (error) => this.onError(error);
        
        // Audio callbacks
        this.audioManager.onAudioData = (pcmData) => {
            if (this.isConnected) {
                const base64 = this.arrayBufferToBase64(pcmData);
                this.wsClient.sendAudio(base64);
            }
        };
        
        this.audioManager.onVisualization = (dataArray, average) => {
            this.drawAudioVisualization(dataArray, average);
        };
        
        // Screen capture callback
        this.screenCapture.onCapture = (imageData) => {
            this.sendScreenAnalysis(imageData);
        };
    }
    
    // ==================== Connection Lifecycle ====================
    
    async startSession() {
        const goal = this.goalInput.value.trim();
        const duration = parseInt(this.durationSelect.value);
        
        if (!goal) {
            alert('Please enter what you\'re working on');
            return;
        }
        
        this.connectBtn.disabled = true;
        this.connectBtn.textContent = 'Connecting...';
        
        try {
            // Connect WebSocket
            await this.wsClient.connect();
            
            // Initialize Gemini
            this.wsClient.connectGemini();
            
            // Start audio capture
            await this.audioManager.startCapture();
            
            // Store session info
            this.currentSession = {
                goal,
                duration,
                startTime: Date.now(),
                state: 'active'
            };
            
            // Update UI
            this.showSessionPanel();
            this.goalDisplay.textContent = goal;
            this.updateTimer();
            
            // Start timer
            this.startTimer();
            
            // Request screen capture permission
            const screenAllowed = await this.screenCapture.requestPermission();
            if (screenAllowed) {
                this.startScreenAnalysis();
                this.addTranscript('system', 'Screen capture enabled. I\'ll help you stay focused!');
            } else {
                this.addTranscript('system', 'Screen capture not available. I\'ll help with voice only.');
            }
            
            // Start session on server
            this.wsClient.startSession(duration, goal);
            
        } catch (error) {
            console.error('Failed to start session:', error);
            alert('Failed to connect. Please check your microphone permissions and try again.');
            this.connectBtn.disabled = false;
            this.connectBtn.textContent = '🎤 Connect & Start';
        }
    }
    
    onConnected() {
        this.isConnected = true;
        this.updateConnectionStatus('connected', 'Connected');
    }
    
    onDisconnected() {
        this.isConnected = false;
        this.updateConnectionStatus('disconnected', 'Disconnected');
        this.cleanup();
    }
    
    onError(error) {
        console.error('WebSocket error:', error);
        this.addTranscript('system', 'Connection error. Please try again.');
    }
    
    updateConnectionStatus(state, text) {
        this.statusBadge.className = `status-badge ${state}`;
        this.statusText.textContent = text;
    }
    
    // ==================== Message Handling ====================
    
    onMessage(data) {
        switch (data.type) {
            case 'connected':
                this.addTranscript('system', data.message);
                break;
                
            case 'audio':
                this.playAudioResponse(data.data);
                break;
                
            case 'transcript':
                this.addTranscript('agent', data.text);
                break;
                
            case 'session_started':
                this.addTranscript('system', `Session started: ${data.session.goal}`);
                break;
                
            case 'session_paused':
                this.currentSession.state = 'paused';
                this.showPauseState();
                break;
                
            case 'session_resumed':
                this.currentSession.state = 'active';
                this.showActiveState();
                break;
                
            case 'session_ended':
                this.onSessionEnded();
                break;
                
            case 'focus_coaching':
                // Received coaching message from server based on screen analysis
                this.addTranscript('agent', data.message);
                break;
                
            case 'interruption_alert':
                // Received interruption alert
                this.handleInterruptionAlert(data);
                break;
                
            case 'error':
                this.addTranscript('system', `Error: ${data.message}`);
                break;
        }
    }
    
    // ==================== Session Controls ====================
    
    pauseSession() {
        if (this.currentSession) {
            this.currentSession.state = 'paused';
            this.wsClient.pauseSession();
            this.stopScreenAnalysis();
        }
    }
    
    resumeSession() {
        if (this.currentSession) {
            this.currentSession.state = 'active';
            this.wsClient.resumeSession();
            this.startScreenAnalysis();
        }
    }
    
    endSession() {
        if (this.currentSession) {
            this.wsClient.endSession();
            this.onSessionEnded();
        }
    }
    
    onSessionEnded() {
        this.cleanup();
        this.showSetupPanel();
        this.addTranscript('system', 'Session ended. Great work!');
    }
    
    cleanup() {
        // Stop timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Stop screen analysis
        this.stopScreenAnalysis();
        
        // Stop audio
        this.audioManager.stopCapture();
        
        // Disconnect WebSocket
        this.wsClient.disconnect();
        
        // Reset state
        this.currentSession = null;
        this.isConnected = false;
        this.focusState = 'unknown';
    }
    
    // ==================== Timer & UI ====================
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }
    
    updateTimer() {
        if (!this.currentSession) return;
        
        const elapsed = Math.floor((Date.now() - this.currentSession.startTime) / 1000);
        const total = this.currentSession.duration * 60;
        const remaining = Math.max(0, total - elapsed);
        
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        
        this.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update progress bar
        const progress = (elapsed / total) * 100;
        this.progressFill.style.width = `${progress}%`;
        
        // Check if complete
        if (remaining === 0) {
            this.onTimerComplete();
        }
    }
    
    onTimerComplete() {
        this.addTranscript('system', 'Time\'s up! Session complete.');
        this.endSession();
    }
    
    showSessionPanel() {
        this.setupPanel.classList.add('hidden');
        this.sessionPanel.classList.remove('hidden');
        this.connectBtn.disabled = false;
        this.connectBtn.textContent = '🎤 Connect & Start';
    }
    
    showSetupPanel() {
        this.sessionPanel.classList.add('hidden');
        this.setupPanel.classList.remove('hidden');
        this.transcriptDiv.innerHTML = '';
    }
    
    showPauseState() {
        this.pauseBtn.classList.add('hidden');
        this.resumeBtn.classList.remove('hidden');
        this.timerDisplay.classList.add('paused');
        this.audioStatus.textContent = 'Session paused';
    }
    
    showActiveState() {
        this.resumeBtn.classList.add('hidden');
        this.pauseBtn.classList.remove('hidden');
        this.timerDisplay.classList.remove('paused');
        this.audioStatus.textContent = 'Click microphone to speak';
    }
    
    // ==================== Screen Analysis ====================
    
    startScreenAnalysis() {
        // Initial capture
        this.screenCapture.capture();
        
        // Adaptive interval based on focus state
        const scheduleNextCapture = () => {
            const config = this.captureConfig[this.focusState] || this.captureConfig.normal;
            
            this.screenAnalysisInterval = setTimeout(() => {
                if (this.currentSession && this.currentSession.state === 'active') {
                    this.screenCapture.capture(config.quality);
                    scheduleNextCapture();
                }
            }, config.interval);
        };
        
        scheduleNextCapture();
    }
    
    stopScreenAnalysis() {
        if (this.screenAnalysisInterval) {
            clearTimeout(this.screenAnalysisInterval);
            this.screenAnalysisInterval = null;
        }
    }
    
    async sendScreenAnalysis(imageData) {
        if (!this.isConnected) return;
        
        // Track compression stats
        const estimatedOriginal = (1280 * 720 * 3) / 1024; // ~2.6MB uncompressed
        const compressedSize = (imageData.length * 0.75) / 1024;
        this.compressionStats.captures++;
        this.compressionStats.totalOriginalSize += estimatedOriginal;
        this.compressionStats.totalCompressedSize += compressedSize;
        
        // Log stats every 10 captures
        if (this.compressionStats.captures % 10 === 0) {
            const avgSavings = ((this.compressionStats.totalOriginalSize - this.compressionStats.totalCompressedSize) / this.compressionStats.totalOriginalSize * 100).toFixed(1);
            console.log(`📊 Compression stats: ${this.compressionStats.captures} captures, ~${avgSavings}% avg savings`);
        }
        
        // Send screen data to server for analysis
        this.wsClient.send('screen_analysis', {
            image_data: imageData,
            timestamp: Date.now(),
            current_goal: this.currentSession?.goal || ''
        });
    }
    
    updateFocusState(state) {
        if (this.focusState !== state) {
            this.focusState = state;
            console.log(`Focus state changed to: ${state}`);
            
            // Visual indicator
            const orb = document.querySelector('.audio-viz');
            if (orb) {
                orb.className = 'audio-viz ' + state;
            }
        }
    }
    
    // ==================== Audio Handling ====================
    
    async playAudioResponse(base64Audio) {
        try {
            const audioBuffer = this.base64ToArrayBuffer(base64Audio);
            await this.audioManager.playAudio(audioBuffer);
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }
    
    toggleAudioCapture() {
        if (this.audioManager.isCapturing) {
            this.audioManager.stopCapture();
            this.audioStatus.textContent = 'Microphone off';
        } else {
            this.audioManager.startCapture();
            this.audioStatus.textContent = 'Microphone on - speak to interrupt';
        }
    }
    
    drawAudioVisualization(dataArray, average) {
        const canvas = this.audioCanvas;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw visualization
        const barWidth = (width / dataArray.length) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < dataArray.length; i++) {
            barHeight = (dataArray[i] / 255) * height;
            
            // Color based on focus state
            let color = '#4a90d9'; // default blue
            if (this.focusState === 'focused') color = '#4caf50'; // green
            if (this.focusState === 'distracted') color = '#ff9800'; // orange
            
            ctx.fillStyle = color;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
        
        // Draw volume indicator
        const volume = Math.min(100, (average / 255) * 150);
        ctx.fillStyle = this.focusState === 'distracted' ? '#ff5722' : '#4caf50';
        ctx.fillRect(0, 0, (volume / 100) * width, 3);
    }
    
    // ==================== Transcript ====================
    
    addTranscript(sender, text) {
        const entry = document.createElement('div');
        entry.className = `transcript-entry ${sender}`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        entry.innerHTML = `
            <span class="timestamp">${time}</span>
            <span class="sender">${sender === 'agent' ? 'Focus' : sender === 'user' ? 'You' : 'System'}:</span>
            <span class="text">${this.escapeHtml(text)}</span>
        `;
        
        this.transcriptDiv.appendChild(entry);
        this.transcriptDiv.scrollTop = this.transcriptDiv.scrollHeight;
    }
    
    handleInterruptionAlert(data) {
        // Visual alert for interruption
        const alert = document.createElement('div');
        alert.className = 'interruption-alert';
        alert.innerHTML = `
            <span class="alert-icon">⚠️</span>
            <span class="alert-text">${this.escapeHtml(data.message)}</span>
        `;
        
        this.transcriptDiv.appendChild(alert);
        this.transcriptDiv.scrollTop = this.transcriptDiv.scrollHeight;
        
        // Update focus state
        if (data.urgency === 'high') {
            this.updateFocusState('distracted');
        }
    }
    
    // ==================== Utilities ====================
    
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.focusApp = new FocusCompanionApp();
});