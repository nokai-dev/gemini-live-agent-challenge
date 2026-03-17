/**
 * ScreenCapture - Handles screen capture using Canvas API
 * 
 * Features:
 * - Request display media permission
 * - Capture screen at specified quality
 * - Encode to base64 for transmission
 * - Adaptive capture rates based on focus state
 */
class ScreenCapture {
    constructor() {
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.isCapturing = false;
        this.permissionGranted = false;
        
        // Callbacks
        this.onCapture = null;
        this.onError = null;
        
        // Initialize canvas for processing
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }
    
    /**
     * Request screen capture permission
     * @returns {Promise<boolean>} - True if permission granted
     */
    async requestPermission() {
        try {
            // Check if getDisplayMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                console.warn('Screen capture not supported in this browser');
                return false;
            }
            
            // Request screen capture
            this.stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    displaySurface: 'monitor' // or 'window', 'browser'
                },
                audio: false
            });
            
            // Create video element to capture frames
            this.video = document.createElement('video');
            this.video.srcObject = this.stream;
            this.video.play();
            
            // Handle stream end (user clicks "Stop sharing")
            this.stream.getVideoTracks()[0].onended = () => {
                console.log('Screen sharing ended by user');
                this.stop();
            };
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    resolve();
                };
            });
            
            this.permissionGranted = true;
            this.isCapturing = true;
            
            console.log('Screen capture permission granted');
            return true;
            
        } catch (error) {
            console.error('Error requesting screen capture:', error);
            
            if (error.name === 'NotAllowedError') {
                console.log('User denied screen capture permission');
            } else if (error.name === 'NotFoundError') {
                console.log('No display found to capture');
            }
            
            if (this.onError) {
                this.onError(error);
            }
            
            return false;
        }
    }
    
    /**
     * Capture a screenshot with adaptive compression
     * @param {number} quality - JPEG quality (0.0 to 1.0)
     * @returns {string|null} - Base64 encoded image or null
     */
    capture(quality = 0.7) {
        if (!this.isCapturing || !this.video || !this.stream) {
            return null;
        }
        
        try {
            // Set canvas size to match video
            // Limit max dimensions to reduce data size
            const maxWidth = 1280;
            const maxHeight = 720;
            
            let width = this.video.videoWidth;
            let height = this.video.videoHeight;
            
            // Scale down if too large
            if (width > maxWidth || height > maxHeight) {
                const scale = Math.min(maxWidth / width, maxHeight / height);
                width = Math.floor(width * scale);
                height = Math.floor(height * scale);
            }
            
            this.canvas.width = width;
            this.canvas.height = height;
            
            // Draw video frame to canvas
            this.ctx.drawImage(this.video, 0, 0, width, height);
            
            // Convert to base64 JPEG
            const imageData = this.canvas.toDataURL('image/jpeg', quality);
            
            // Remove data URL prefix for transmission
            const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, '');
            
            // Log compression stats
            const originalSize = (width * height * 3) / 1024; // Rough KB estimate
            const compressedSize = (base64Data.length * 0.75) / 1024; // Base64 is ~4/3 of binary
            const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
            console.log(`Screen capture: ${width}x${height}, quality=${quality.toFixed(2)}, ~${compressedSize.toFixed(0)}KB (${savings}% savings)`);
            
            // Trigger callback
            if (this.onCapture) {
                this.onCapture(base64Data);
            }
            
            return base64Data;
            
        } catch (error) {
            console.error('Error capturing screen:', error);
            return null;
        }
    }
    
    /**
     * Capture a specific region of the screen
     * @param {Object} region - {x, y, width, height}
     * @param {number} quality - JPEG quality
     * @returns {string|null} - Base64 encoded image
     */
    captureRegion(region, quality = 0.8) {
        if (!this.isCapturing || !this.video) {
            return null;
        }
        
        try {
            const { x, y, width, height } = region;
            
            this.canvas.width = width;
            this.canvas.height = height;
            
            // Draw specific region
            this.ctx.drawImage(
                this.video,
                x, y, width, height,  // Source
                0, 0, width, height   // Destination
            );
            
            const imageData = this.canvas.toDataURL('image/jpeg', quality);
            return imageData.replace(/^data:image\/jpeg;base64,/, '');
            
        } catch (error) {
            console.error('Error capturing region:', error);
            return null;
        }
    }
    
    /**
     * Get current screen dimensions
     * @returns {Object|null} - {width, height}
     */
    getDimensions() {
        if (!this.video) return null;
        
        return {
            width: this.video.videoWidth,
            height: this.video.videoHeight
        };
    }
    
    /**
     * Check if a specific application is visible
     * This is a simple check based on pixel analysis
     * @param {string} appName - Name of app to detect
     * @returns {boolean}
     */
    detectApplication(appName) {
        // This would require more sophisticated image analysis
        // For now, return false - server-side Vision API will do the heavy lifting
        return false;
    }
    
    /**
     * Stop screen capture
     */
    stop() {
        this.isCapturing = false;
        this.permissionGranted = false;
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
            this.video = null;
        }
        
        console.log('Screen capture stopped');
    }
    
    /**
     * Check if screen capture is supported
     * @returns {boolean}
     */
    static isSupported() {
        return !!(
            navigator.mediaDevices &&
            navigator.mediaDevices.getDisplayMedia
        );
    }
    
    /**
     * Get estimated data size for a capture
     * @param {number} quality - JPEG quality
     * @returns {number} - Estimated size in bytes
     */
    estimateDataSize(quality = 0.7) {
        if (!this.video) return 0;
        
        // Rough estimate: width * height * 3 bytes per pixel * compression ratio
        const pixels = this.video.videoWidth * this.video.videoHeight;
        const compressionRatio = 1 - (quality * 0.8); // Higher quality = less compression
        return Math.floor(pixels * 3 * compressionRatio);
    }
    
    /**
     * Compress an existing base64 image
     * @param {string} base64Data - Original base64 image data
     * @param {number} quality - Target quality (0.1 to 1.0)
     * @param {number} maxDimension - Maximum width or height
     * @returns {Promise<string>} - Compressed base64 image
     */
    async compressImage(base64Data, quality = 0.5, maxDimension = 1280) {
        return new Promise((resolve, reject) => {
            try {
                const img = new Image();
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    
                    // Scale down if too large
                    if (width > maxDimension || height > maxDimension) {
                        const scale = Math.min(maxDimension / width, maxDimension / height);
                        width = Math.floor(width * scale);
                        height = Math.floor(height * scale);
                    }
                    
                    // Create temp canvas for compression
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = width;
                    tempCanvas.height = height;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // Draw and compress
                    tempCtx.drawImage(img, 0, 0, width, height);
                    const compressed = tempCanvas.toDataURL('image/jpeg', quality);
                    
                    // Calculate savings
                    const originalSize = (base64Data.length * 0.75) / 1024;
                    const newSize = (compressed.length * 0.75) / 1024;
                    console.log(`Image compressed: ${originalSize.toFixed(0)}KB → ${newSize.toFixed(0)}KB (${((1 - newSize/originalSize) * 100).toFixed(1)}% reduction)`);
                    
                    resolve(compressed.replace(/^data:image\/jpeg;base64,/, ''));
                };
                img.onerror = reject;
                img.src = 'data:image/jpeg;base64,' + base64Data;
            } catch (error) {
                console.error('Compression failed, using original:', error);
                resolve(base64Data); // Fallback to original
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScreenCapture;
}