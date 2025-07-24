// Authentication module for login/logout functionality
class AuthenticationManager {
    constructor() {
        this.currentUser = null;
        this.currentRole = null;
    }

    showAdminLogin() {
        document.getElementById('adminLoginForm').classList.remove('hidden');
        document.getElementById('voterLoginForm').classList.add('hidden');
    }

    showVoterLogin() {
        document.getElementById('voterLoginForm').classList.remove('hidden');
        document.getElementById('adminLoginForm').classList.add('hidden');
    }

    adminLogin() {
        // Skip validation for now - accept any credentials
        this.currentUser = { id: 'admin', name: 'Administrator' };
        this.currentRole = 'admin';
        window.app.showScreen('adminDashboard');
        window.adminManager.showAdminSection('dashboard');
        window.adminManager.updateDashboardStats();
    }

    voterLogin() {
        const voterID = document.getElementById('voterID').value;
        // Skip validation - accept any voter ID
        const newUser = {
            id: voterID,
            name: 'Voter ' + voterID,
            email: voterID + '@example.com',
            phone: '+1234567890',
            hasVoted: false,
            votedFor: null,
            active: true,
            lastLogin: new Date().toISOString()
        };
        
        // Add to users if not exists
        let user = window.app.users.find(u => u.id === voterID);
        if (!user) {
            window.app.users.push(newUser);
            user = newUser;
        }
        
        this.currentUser = user;
        this.currentRole = 'voter';
        window.app.showScreen('voterDashboard');
        window.voterManager.updateVoterDashboard();
    }

    startBiometric() {
        const statusElement = document.getElementById('biometric-status');
        statusElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
        
        // Simulate biometric authentication
        setTimeout(() => {
            statusElement.innerHTML = '<i class="fas fa-check-circle" style="color: #48bb78;"></i> Authentication successful';
        }, 2000);
    }

    logout() {
        this.currentUser = null;
        this.currentRole = null;
        window.app.showScreen('loginScreen');
        
        // Reset forms
        document.getElementById('adminUsername').value = '';
        document.getElementById('adminPassword').value = '';
        document.getElementById('voterID').value = '';
        document.getElementById('biometric-status').innerHTML = '';
        
        // Hide login forms
        document.getElementById('adminLoginForm').classList.add('hidden');
        document.getElementById('voterLoginForm').classList.add('hidden');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentRole() {
        return this.currentRole;
    }
}