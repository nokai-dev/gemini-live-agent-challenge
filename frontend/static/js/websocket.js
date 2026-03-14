/**
 * WebSocketClient - Manages WebSocket connection to FocusCompanion backend
 * 
 * Handles:
 * - Connection lifecycle
 * - Message serialization/deserialization
 * - Reconnection logic
 * - Ping/pong keepalive
 */
class WebSocketClient {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.pingInterval = null;
        
        // Callbacks
        this.onConnect = null;
        this.onDisconnect = null;
        this.onMessage = null;
        this.onError = null;
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        return new Promise((resolve, reject) => {
            try {
                // Use wss:// for HTTPS, ws:// for HTTP
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = this.url || `${protocol}//${window.location.host}/ws/focus`;
                
                console.log('Connecting to WebSocket:', wsUrl);
                this.ws = new WebSocket(wsUrl);
                
                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.startPingInterval();
                    
                    if (this.onConnect) {
                        this.onConnect();
                    }
                    resolve();
                };
                
                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        
                        if (data.type === 'pong') {
                            // Ping response, ignore
                            return;
                        }
                        
                        if (this.onMessage) {
                            this.onMessage(data);
                        }
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                };
                
                this.ws.onclose = (event) => {
                    console.log('WebSocket closed:', event.code, event.reason);
                    this.isConnected = false;
                    this.stopPingInterval();
                    
                    if (this.onDisconnect) {
                        this.onDisconnect();
                    }
                    
                    // Attempt reconnection if not intentionally closed
                    if (event.code !== 1000 && event.code !== 1001) {
                        this.attemptReconnect();
                    }
                };
                
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    
                    if (this.onError) {
                        this.onError(error);
                    }
                    
                    reject(error);
                };
                
            } catch (error) {
                console.error('Error creating WebSocket:', error);
                reject(error);
            }
        });
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        this.stopPingInterval();
        
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
        
        this.isConnected = false;
    }

    /**
     * Send a message to the server
     */
    send(type, data = {}) {
        if (!this.isConnected || !this.ws) {
            console.warn('Cannot send message: not connected');
            return false;
        }
        
        try {
            const message = JSON.stringify({
                type,
                ...data
            });
            
            this.ws.send(message);
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }

    /**
     * Send audio data to the server
     */
    sendAudio(base64Audio) {
        return this.send('audio', { data: base64Audio });
    }

    /**
     * Send text message to the server
     */
    sendText(text) {
        return this.send('text', { text });
    }

    /**
     * Start a focus session
     */
    startSession(durationMinutes, goal) {
        return this.send('start_session', {
            duration_minutes: durationMinutes,
            goal: goal
        });
    }

    /**
     * Pause the current session
     */
    pauseSession() {
        return this.send('pause_session');
    }

    /**
     * Resume the current session
     */
    resumeSession() {
        return this.send('resume_session');
    }

    /**
     * End the current session
     */
    endSession() {
        return this.send('end_session');
    }

    /**
     * Get current session status
     */
    getSessionStatus() {
        return this.send('get_session_status');
    }

    /**
     * Initialize Gemini connection
     */
    connectGemini() {
        return this.send('connect');
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            this.connect().catch(error => {
                console.error('Reconnection failed:', error);
            });
        }, delay);
    }

    /**
     * Start ping interval to keep connection alive
     */
    startPingInterval() {
        this.pingInterval = setInterval(() => {
            if (this.isConnected) {
                this.send('ping');
            }
        }, 30000); // Ping every 30 seconds
    }

    /**
     * Stop ping interval
     */
    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketClient;
}