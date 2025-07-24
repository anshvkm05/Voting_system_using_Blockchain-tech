// Main application coordinator
class VotingApp {
    constructor() {
        this.parties = [
            {
                id: 1,
                name: "Progressive Party",
                candidate: "John Smith",
                description: "Working for progress and development of our nation with focus on education and healthcare.",
                logo: "https://via.placeholder.com/80x80/4299e1/ffffff?text=PP",
                votes: 0,
                active: true
            },
            {
                id: 2,
                name: "Unity Alliance",
                candidate: "Sarah Johnson",
                description: "Building bridges across communities and promoting unity in diversity.",
                logo: "https://via.placeholder.com/80x80/48bb78/ffffff?text=UA",
                votes: 0,
                active: true
            },
            {
                id: 3,
                name: "Future Forward",
                candidate: "Michael Chen",
                description: "Embracing technology and innovation for a better tomorrow.",
                logo: "https://via.placeholder.com/80x80/ed8936/ffffff?text=FF",
                votes: 0,
                active: true
            }
        ];

        this.users = [
            {
                id: "V001",
                name: "Alice Cooper",
                email: "alice@example.com",
                phone: "+1234567890",
                hasVoted: false,
                votedFor: null,
                active: true,
                lastLogin: null
            },
            {
                id: "V002",
                name: "Bob Wilson",
                email: "bob@example.com",
                phone: "+1234567891",
                hasVoted: true,
                votedFor: 1,
                active: true,
                lastLogin: new Date().toISOString()
            }
        ];

        // Store original form handlers for reset functionality
        this.originalAddPartyHandler = null;
        this.originalAddUserHandler = null;
    }

    async initialize() {
        // Load face-api models first
        await this.loadFaceModels();
        
        // Initialize managers
        window.authManager = new AuthenticationManager();
        window.adminManager = new AdminManager();
        window.voterManager = new VoterManager();
        window.chartManager = new ChartManager();
        window.biometricManager = new BiometricManager();
        
        await window.biometricManager.initialize();
        
        // Set default language
        changeLanguage('en');
        
        // Show login screen
        this.showScreen('loginScreen');
        
        // Initialize charts (empty)
        window.chartManager.initializeCharts();
        
        // Setup form handlers
        this.setupFormHandlers();
    }

    async loadFaceModels() {
        try {
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/weights/'),
                faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/weights/'),
                faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/weights/')
            ]);
            console.log('Face-api models loaded successfully');
            return true;
        } catch (err) {
            console.error('Error loading face-api models:', err);
            return false;
        }
    }

    setupFormHandlers() {
        // Party form handler
        this.originalAddPartyHandler = (e) => {
            e.preventDefault();
            
            const newParty = {
                id: Date.now(),
                name: document.getElementById('partyName').value,
                candidate: document.getElementById('candidateName').value,
                description: document.getElementById('partyDescription').value,
                logo: document.getElementById('partyLogo').value || 'https://via.placeholder.com/80x80/667eea/ffffff?text=Party',
                votes: 0,
                active: true
            };
            
            this.parties.push(newParty);
            this.closeModal('addPartyModal');
            window.adminManager.renderPartiesList();
            window.adminManager.updateDashboardStats();
            document.getElementById('addPartyForm').reset();
        };

        // User form handler
        this.originalAddUserHandler = (e) => {
            e.preventDefault();
            
            const newUser = {
                id: 'V' + String(this.users.length + 1).padStart(3, '0'),
                name: document.getElementById('userName').value,
                email: document.getElementById('userEmail').value,
                phone: document.getElementById('userPhone').value,
                hasVoted: false,
                votedFor: null,
                active: true,
                lastLogin: null
            };
            
            this.users.push(newUser);
            this.closeModal('addUserModal');
            window.adminManager.renderUsersList();
            window.adminManager.updateDashboardStats();
            document.getElementById('addUserForm').reset();
        };

        document.getElementById('addPartyForm').onsubmit = this.originalAddPartyHandler;
        document.getElementById('addUserForm').onsubmit = this.originalAddUserHandler;
    }

    // Screen Management
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    // Utility Functions
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    showMessage(message, type) {
        // Create and show temporary message
        const messageEl = document.createElement('div');
        messageEl.className = `status-message ${type}`;
        messageEl.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
        messageEl.style.position = 'fixed';
        messageEl.style.top = '20px';
        messageEl.style.right = '20px';
        messageEl.style.zIndex = '10000';
        messageEl.style.minWidth = '300px';
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// Global app instance and managers
window.app = new VotingApp();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async function() {
    await window.app.initialize();
});

// Global function stubs for HTML onclick handlers
function showAdminLogin() { window.authManager.showAdminLogin(); }
function showVoterLogin() { window.authManager.showVoterLogin(); }
function adminLogin() { window.authManager.adminLogin(); }
function voterLogin() { window.authManager.voterLogin(); }
function startBiometric() { window.authManager.startBiometric(); }
function logout() { window.authManager.logout(); }
function showAdminSection(section) { window.adminManager.showAdminSection(section); }
function showAddPartyModal() { window.adminManager.showAddPartyModal(); }
function showAddUserModal() { window.adminManager.showAddUserModal(); }
function toggleReadAloud() { window.voterManager.toggleReadAloud(); }
function closeConfirmation() { window.voterManager.closeConfirmation(); }
function submitVote() { window.voterManager.submitVote(); }
function closeModal(modalId) { window.app.closeModal(modalId); }
function startFaceRegistration() { window.biometricManager.startFaceRegistration(); }
function startFingerprintRegistration() { window.biometricManager.startFingerprintRegistration(); }
function captureAndRegisterFace() { window.biometricManager.captureAndRegisterFace(); }
function closeVideoModal() { window.biometricManager.closeVideoModal(); }
function initiateFacialRecognition() { window.biometricManager.initiateFacialRecognition(); }
function initiateFingerprintScan() { window.biometricManager.initiateFingerprintScan(); }
function confirmBiometricVote() { window.biometricManager.confirmBiometricVote(); }
function closeBiometricModal() { window.biometricManager.closeBiometricModal(); }

// removed currentUser, currentRole, isReadAloudActive variables - moved to managers
// removed selectedPartyForVote - moved to BiometricManager
// removed storage instance - moved to BiometricManager
// removed registeredFaces, registeredFingerprints - moved to BiometricManager
// removed currentVideoStream - moved to BiometricManager
// removed loadFaceModels() function - moved to VotingApp class
// removed initBiometricStorage() function - moved to BiometricManager
// removed showScreen() function - moved to VotingApp class
// removed showAdminLogin(), showVoterLogin(), adminLogin(), voterLogin(), startBiometric(), logout() functions - moved to AuthenticationManager
// removed showAdminSection(), updateDashboardStats(), renderPartiesList(), renderUsersList() functions - moved to AdminManager
// removed showAddPartyModal(), editParty(), toggleParty(), deleteParty() functions - moved to AdminManager
// removed showAddUserModal(), editUser(), toggleUser(), deleteUser() functions - moved to AdminManager
// removed updateVoterDashboard(), renderVotingParties() functions - moved to VoterManager
// removed startBiometricVote(), initiateFacialRecognition(), matchFaceToUser(), initiateFingerprintScan() functions - moved to BiometricManager
// removed confirmBiometricVote(), closeBiometricModal() functions - moved to BiometricManager
// removed readPartyInfo(), toggleReadAloud(), announcePageContent() functions - moved to VoterManager
// removed selectPartyForVote(), closeConfirmation(), submitVote() functions - moved to VoterManager
// removed startFaceRegistration(), captureAndRegisterFace(), registerFace() functions - moved to BiometricManager
// removed startFingerprintRegistration(), registerFingerprint() functions - moved to BiometricManager
// removed startFaceDetection(), closeVideoModal() functions - moved to BiometricManager
// removed initializeCharts(), updateVotingChart(), updateAnalytics() functions - moved to ChartManager
// removed updateParty(), updateUser() functions - moved to AdminManager
// removed closeModal(), showMessage() functions - moved to VotingApp class