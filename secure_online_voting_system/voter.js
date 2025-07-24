// Voter interface management module
class VoterManager {
    constructor() {
        this.isReadAloudActive = false;
    }

    updateVoterDashboard() {
        const currentUser = window.authManager.getCurrentUser();
        const hasVoted = currentUser.hasVoted;
        
        document.getElementById('votedMessage').style.display = hasVoted ? 'block' : 'none';
        document.getElementById('notVotedMessage').style.display = hasVoted ? 'none' : 'block';
        
        this.renderVotingParties();
    }

    renderVotingParties() {
        const container = document.getElementById('partiesGrid');
        container.innerHTML = '';
        
        const activeParties = window.app.parties.filter(p => p.active);
        const currentUser = window.authManager.getCurrentUser();
        
        activeParties.forEach(party => {
            const card = document.createElement('div');
            card.className = 'party-voting-card fade-in';
            card.innerHTML = `
                <div class="party-header" 
                     onmouseenter="voterManager.readPartyInfo('${party.name}', '${party.candidate}', '${party.description}')">
                    <img src="${party.logo}" alt="${party.name}" class="party-logo-large">
                    <div class="party-info-large">
                        <h3>${party.name}</h3>
                        <p>${party.candidate}</p>
                    </div>
                </div>
                <div class="party-description" 
                     onmouseenter="voterManager.readPartyInfo('${party.name}', '${party.candidate}', '${party.description}')">
                    <p>${party.description}</p>
                </div>
                <div class="vote-action">
                    <button onclick="biometricManager.startBiometricVote('${party.id}')" 
                            class="vote-btn" 
                            ${currentUser.hasVoted ? 'disabled' : ''}>
                        <i class="fas fa-vote-yea"></i>
                        ${getCurrentTranslation('vote')}
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // Hover-to-read functionality
    readPartyInfo(name, candidate, description) {
        if (!this.isReadAloudActive) return;
        
        const content = `${name}, ${getCurrentTranslation('candidate_name')}: ${candidate}. ${description}`;
        
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(content);
            utterance.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-US';
            utterance.rate = 0.8;
            window.speechSynthesis.speak(utterance);
        }
    }

    // Read Aloud Functionality
    toggleReadAloud() {
        this.isReadAloudActive = !this.isReadAloudActive;
        const btn = document.querySelector('.read-aloud-btn');
        
        if (this.isReadAloudActive) {
            btn.classList.add('active');
            this.announcePageContent();
        } else {
            btn.classList.remove('active');
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        }
    }

    announcePageContent() {
        if (!window.speechSynthesis) return;
        
        const content = [];
        
        // Add voting instructions
        content.push(getCurrentTranslation('select_candidate'));
        
        // Add party information
        const activeParties = window.app.parties.filter(p => p.active);
        activeParties.forEach(party => {
            content.push(`${party.name}, ${getCurrentTranslation('candidate_name')}: ${party.candidate}. ${party.description}`);
        });
        
        const utterance = new SpeechSynthesisUtterance(content.join('. '));
        utterance.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-US';
        utterance.rate = 0.8;
        
        window.speechSynthesis.speak(utterance);
    }

    closeConfirmation() {
        document.getElementById('confirmationModal').classList.remove('active');
    }

    submitVote() {
        const selectedPartyForVote = window.biometricManager.getSelectedPartyForVote();
        const currentUser = window.authManager.getCurrentUser();
        
        if (!selectedPartyForVote || currentUser.hasVoted) return;
        
        // Update user vote status
        currentUser.hasVoted = true;
        currentUser.votedFor = selectedPartyForVote;
        
        // Update party vote count
        const party = window.app.parties.find(p => p.id === selectedPartyForVote);
        if (party) {
            party.votes++;
        }
        
        // Update user in users array
        const userIndex = window.app.users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            window.app.users[userIndex] = { ...currentUser };
        }
        
        this.closeConfirmation();
        this.updateVoterDashboard();
        
        // Show success message
        window.app.showMessage(getCurrentTranslation('vote_confirmed'), 'success');
        
        // Simulate blockchain recording
        console.log('Vote recorded on blockchain:', {
            voter: currentUser.id,
            party: selectedPartyForVote,
            timestamp: new Date().toISOString()
        });
    }
}