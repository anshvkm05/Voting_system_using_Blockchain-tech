// Biometric authentication and storage module
class BiometricManager {
    constructor() {
        this.storage = new FaceDataStorage();
        this.registeredFaces = new Map();
        this.registeredFingerprints = new Map();
        this.currentVideoStream = null;
        this.selectedPartyForVote = null;
    }

    async initialize() {
        try {
            await this.storage.initialize();
            // Load existing face data
            const faceData = await this.storage.loadAllFaceData();
            this.registeredFaces = faceData;
            
            // Load existing fingerprint data
            const fingerprintData = await this.storage.loadAllFingerprintData();
            this.registeredFingerprints = fingerprintData;
            
            console.log(`Loaded ${this.registeredFaces.size} face profiles and ${this.registeredFingerprints.size} fingerprint profiles`);
        } catch (err) {
            console.error('Failed to initialize biometric storage:', err);
            window.app.showMessage('Warning: Biometric storage not available. Some features may not work.', 'error');
        }
    }

    async startFaceRegistration() {
        const userId = prompt('Enter User ID for face registration:');
        if (!userId) return;
        
        // Check if user exists
        const user = window.app.users.find(u => u.id === userId);
        if (!user) {
            window.app.showMessage('User not found. Please add the user first.', 'error');
            return;
        }
        
        document.getElementById('videoModal').classList.add('active');
        document.getElementById('personName').value = userId;
        
        try {
            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
            });
            
            const video = document.getElementById('video');
            const overlay = document.getElementById('overlay');
            
            video.srcObject = stream;
            this.currentVideoStream = stream;
            
            // Resize overlay to match video
            video.addEventListener('loadedmetadata', () => {
                overlay.width = video.videoWidth;
                overlay.height = video.videoHeight;
            });
            
            // Start face detection
            this.startFaceDetection();
            
        } catch (err) {
            window.app.showMessage('Camera access denied. Please allow camera permissions.', 'error');
            this.closeVideoModal();
        }
    }

    async captureAndRegisterFace() {
        const userId = document.getElementById('personName').value.trim();
        if (!userId) {
            window.app.showMessage('Please enter a User ID', 'error');
            return;
        }
        
        try {
            const success = await this.registerFace(userId);
            if (success) {
                window.app.showMessage(`Face data registered successfully for User ID: ${userId}`, 'success');
                this.closeVideoModal();
            }
        } catch (err) {
            window.app.showMessage('Failed to register face: ' + err.message, 'error');
        }
    }

    async registerFace(userId) {
        const video = document.getElementById('video');
        const progressBar = document.getElementById('progressBar');
        const captureProgress = document.getElementById('captureProgress');
        
        const samples = [];
        const totalSamples = 10;
        const minFaceSize = 100;
        const detectionThreshold = 0.7;
        
        captureProgress.style.display = 'block';
        progressBar.style.width = '0%';
        
        for (let i = 0; i < totalSamples;) {
            try {
                await new Promise(resolve => setTimeout(resolve, 800));
                
                const detection = await faceapi.detectSingleFace(video)
                    .withFaceLandmarks()
                    .withFaceDescriptor();
                    
                if (!detection) {
                    console.log('No face detected, retrying...');
                    continue;
                }
                
                // Check detection quality
                const faceSize = detection.detection.box.width;
                if (faceSize < minFaceSize) {
                    console.log('Face too small, retrying...');
                    continue;
                }
                
                if (detection.detection.score < detectionThreshold) {
                    console.log('Detection confidence too low, retrying...');
                    continue;
                }
                
                samples.push(detection.descriptor);
                i++;
                
                progressBar.style.width = `${(i / totalSamples) * 100}%`;
                console.log(`Captured sample ${i}/${totalSamples}`);
                
            } catch (err) {
                console.error('Face capture error:', err);
                continue;
            }
        }
        
        if (samples.length === totalSamples) {
            try {
                await this.storage.saveFaceData(userId, samples);
                this.registeredFaces.set(userId, samples);
                console.log(`Successfully saved ${samples.length} face samples for user ${userId}`);
                return true;
            } catch (err) {
                throw new Error(`Failed to save face data: ${err.message}`);
            }
        }
        
        throw new Error('Failed to capture enough quality face samples');
    }

    async startFingerprintRegistration() {
        const userId = prompt('Enter User ID for fingerprint registration:');
        if (!userId) return;
        
        // Check if user exists
        const user = window.app.users.find(u => u.id === userId);
        if (!user) {
            window.app.showMessage('User not found. Please add the user first.', 'error');
            return;
        }
        
        const statusEl = document.getElementById('biometricStatus');
        statusEl.style.display = 'block';
        statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering fingerprint...';
        statusEl.className = 'status-message info';
        
        try {
            await this.registerFingerprint(userId);
            statusEl.innerHTML = `<i class="fas fa-check-circle"></i> Fingerprint registered successfully for User ID: ${userId}`;
            statusEl.className = 'status-message success';
            
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);
            
        } catch (err) {
            statusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed to register fingerprint';
            statusEl.className = 'status-message error';
        }
    }

    async registerFingerprint(userId) {
        // Simulate fingerprint registration
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockFingerprintData = {
            credentialId: `fingerprint_${userId}_${Date.now()}`,
            publicKey: `pub_${Date.now()}`,
            algorithm: 'RS256',
            template: `template_${Math.random().toString(36).substr(2, 9)}`
        };
        
        await this.storage.saveFingerprintData(userId, mockFingerprintData);
        this.registeredFingerprints.set(userId, mockFingerprintData);
        console.log(`Fingerprint registered for user ${userId}`);
    }

    // Face detection for video
    async startFaceDetection() {
        const video = document.getElementById('video');
        const overlay = document.getElementById('overlay');
        const canvas = overlay.getContext('2d');
        
        async function detect() {
            if (!video.srcObject) return;
            
            const detections = await faceapi.detectAllFaces(video)
                .withFaceLandmarks();
                
            canvas.clearRect(0, 0, overlay.width, overlay.height);
            
            const resized = faceapi.resizeResults(detections, {
                width: overlay.width,
                height: overlay.height
            });
            
            faceapi.draw.drawDetections(overlay, resized);
            faceapi.draw.drawFaceLandmarks(overlay, resized);
            
            requestAnimationFrame(detect);
        }
        
        detect();
    }

    closeVideoModal() {
        document.getElementById('videoModal').classList.remove('active');
        
        if (this.currentVideoStream) {
            this.currentVideoStream.getTracks().forEach(track => track.stop());
            this.currentVideoStream = null;
        }
    }

    async matchFaceToUser(faceDescriptor) {
        if (this.registeredFaces.size === 0) {
            return { matched: false, userId: null, confidence: 0 };
        }
        
        let bestMatch = null;
        let bestDistance = 1.0; // Lower is better
        const threshold = 0.5; // Face matching threshold
        
        for (const [userId, storedDescriptors] of this.registeredFaces) {
            for (const storedDescriptor of storedDescriptors) {
                const distance = faceapi.euclideanDistance(faceDescriptor, storedDescriptor);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = userId;
                }
            }
        }
        
        return {
            matched: bestDistance < threshold,
            userId: bestMatch,
            confidence: Math.max(0, (1 - bestDistance) * 100)
        };
    }

    async startBiometricVote(partyId) {
        const currentUser = window.authManager.getCurrentUser();
        if (currentUser.hasVoted) return;
        
        this.selectedPartyForVote = partyId;
        
        // Show biometric verification modal
        document.getElementById('biometricVoteModal').classList.add('active');
        document.getElementById('biometricStatus').innerHTML = '';
        document.getElementById('biometricStatus').className = 'status-message';
        
        // Reset buttons
        document.getElementById('fingerprintBtn').style.display = 'none';
        document.getElementById('confirmVoteBtn').style.display = 'none';
    }

    async initiateFacialRecognition() {
        const statusEl = document.getElementById('biometricStatus');
        statusEl.innerHTML = '<i class="fas fa-camera"></i> Initializing camera for face verification...';
        statusEl.className = 'status-message info';
        
        try {
            // Start camera
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
            });
            
            // Create temporary video element for face detection
            const tempVideo = document.createElement('video');
            tempVideo.srcObject = stream;
            tempVideo.autoplay = true;
            
            await new Promise((resolve) => {
                tempVideo.addEventListener('loadedmetadata', resolve);
            });
            
            statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning and matching face...';
            
            // Wait a moment for video to stabilize
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Detect face and get descriptor
            const detection = await faceapi.detectSingleFace(tempVideo)
                .withFaceLandmarks()
                .withFaceDescriptor();
                
            // Stop camera
            stream.getTracks().forEach(track => track.stop());
            
            if (!detection) {
                throw new Error('No face detected. Please ensure your face is visible and try again.');
            }
            
            // Match against registered faces
            const matchResult = await this.matchFaceToUser(detection.descriptor);
            const currentUser = window.authManager.getCurrentUser();
            
            if (matchResult.matched && matchResult.userId === currentUser.id) {
                statusEl.innerHTML = '<i class="fas fa-check-circle" style="color: #48bb78;"></i> Face verified successfully';
                statusEl.className = 'status-message success';
                document.getElementById('fingerprintBtn').style.display = 'block';
            } else if (matchResult.matched) {
                throw new Error('Face matches a different user. Please login with the correct account.');
            } else {
                throw new Error('Face not recognized. Please ensure you are registered in the system.');
            }
            
        } catch (err) {
            console.error('Facial recognition error:', err);
            statusEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${err.message}`;
            statusEl.className = 'status-message error';
            
            // Stop any active streams
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => stream.getTracks().forEach(track => track.stop()))
                .catch(() => {});
        }
    }

    initiateFingerprintScan() {
        const statusEl = document.getElementById('biometricStatus');
        statusEl.innerHTML = '<i class="fas fa-fingerprint"></i> Verifying fingerprint...';
        statusEl.className = 'status-message info';
        
        try {
            const currentUser = window.authManager.getCurrentUser();
            // Check if user has registered fingerprint
            if (!this.registeredFingerprints.has(currentUser.id)) {
                throw new Error('No fingerprint registered for this user.');
            }
            
            // Simulate fingerprint verification
            setTimeout(() => {
                // In a real implementation, you would verify the actual fingerprint
                const fingerprintData = this.registeredFingerprints.get(currentUser.id);
                if (fingerprintData) {
                    statusEl.innerHTML = '<i class="fas fa-check-circle" style="color: #48bb78;"></i> Fingerprint verified successfully';
                    statusEl.className = 'status-message success';
                    
                    // Enable vote button
                    document.getElementById('confirmVoteBtn').style.display = 'block';
                } else {
                    throw new Error('Fingerprint verification failed.');
                }
            }, 2000);
            
        } catch (err) {
            statusEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${err.message}`;
            statusEl.className = 'status-message error';
        }
    }

    confirmBiometricVote() {
        const party = window.app.parties.find(p => p.id === this.selectedPartyForVote);
        if (party) {
            document.getElementById('selectedPartyBio').innerHTML = `
                <img src="${party.logo}" alt="${party.name}">
                <div>
                    <h4>${party.name}</h4>
                    <p>${party.candidate}</p>
                </div>
            `;
        }
        
        document.getElementById('biometricVoteModal').classList.remove('active');
        document.getElementById('confirmationModal').classList.add('active');
    }

    closeBiometricModal() {
        document.getElementById('biometricVoteModal').classList.remove('active');
        this.selectedPartyForVote = null;
    }

    getSelectedPartyForVote() {
        return this.selectedPartyForVote;
    }
}