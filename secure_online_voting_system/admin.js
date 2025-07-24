// Admin panel management module
class AdminManager {
    showAdminSection(sectionId) {
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId + 'Section').classList.add('active');
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        if (sectionId === 'parties') {
            this.renderPartiesList();
        } else if (sectionId === 'users') {
            this.renderUsersList();
        } else if (sectionId === 'analytics') {
            window.chartManager.updateAnalytics();
        }
    }

    updateDashboardStats() {
        document.getElementById('totalVoters').textContent = window.app.users.length;
        document.getElementById('totalVotes').textContent = window.app.users.filter(u => u.hasVoted).length;
        document.getElementById('turnoutRate').textContent = 
            Math.round((window.app.users.filter(u => u.hasVoted).length / window.app.users.length) * 100) + '%';
        document.getElementById('totalParties').textContent = window.app.parties.filter(p => p.active).length;
        
        window.chartManager.updateVotingChart();
    }

    renderPartiesList() {
        const container = document.getElementById('partiesList');
        container.innerHTML = '';
        
        window.app.parties.forEach(party => {
            const card = document.createElement('div');
            card.className = 'party-card fade-in';
            card.innerHTML = `
                <div class="party-info">
                    <img src="${party.logo}" alt="${party.name}" class="party-logo">
                    <div class="party-details">
                        <h4>${party.name}</h4>
                        <p>${getCurrentTranslation('candidate_name')}: ${party.candidate}</p>
                        <p>${getCurrentTranslation('votes_cast')}: ${party.votes}</p>
                    </div>
                </div>
                <div class="card-actions">
                    <button onclick="adminManager.editParty(${party.id})" class="edit-btn">${getCurrentTranslation('edit')}</button>
                    <button onclick="adminManager.toggleParty(${party.id})" class="toggle-btn">
                        ${party.active ? getCurrentTranslation('deactivate') : getCurrentTranslation('activate')}
                    </button>
                    <button onclick="adminManager.deleteParty(${party.id})" class="delete-btn">${getCurrentTranslation('delete')}</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    renderUsersList() {
        const container = document.getElementById('usersList');
        container.innerHTML = '';
        
        window.app.users.forEach(user => {
            const card = document.createElement('div');
            card.className = 'user-card fade-in';
            card.innerHTML = `
                <div class="user-info">
                    <div class="user-details">
                        <h4>${user.name}</h4>
                        <p>ID: ${user.id} | ${user.email}</p>
                        <p>${getCurrentTranslation(user.hasVoted ? 'voted' : 'not_voted')} | 
                           ${getCurrentTranslation(user.active ? 'active' : 'inactive')}</p>
                    </div>
                </div>
                <div class="card-actions">
                    <button onclick="adminManager.editUser('${user.id}')" class="edit-btn">${getCurrentTranslation('edit')}</button>
                    <button onclick="adminManager.toggleUser('${user.id}')" class="toggle-btn">
                        ${user.active ? getCurrentTranslation('deactivate') : getCurrentTranslation('activate')}
                    </button>
                    <button onclick="adminManager.deleteUser('${user.id}')" class="delete-btn">${getCurrentTranslation('delete')}</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // Party Management
    showAddPartyModal() {
        document.getElementById('addPartyModal').classList.add('active');
    }

    editParty(id) {
        const party = window.app.parties.find(p => p.id === id);
        if (party) {
            document.getElementById('partyName').value = party.name;
            document.getElementById('candidateName').value = party.candidate;
            document.getElementById('partyDescription').value = party.description;
            document.getElementById('partyLogo').value = party.logo;
            
            document.getElementById('addPartyModal').classList.add('active');
            document.getElementById('addPartyForm').onsubmit = (e) => {
                e.preventDefault();
                this.updateParty(id);
            };
        }
    }

    toggleParty(id) {
        const party = window.app.parties.find(p => p.id === id);
        if (party) {
            party.active = !party.active;
            this.renderPartiesList();
            this.updateDashboardStats();
        }
    }

    deleteParty(id) {
        if (confirm('Are you sure you want to delete this party?')) {
            window.app.parties = window.app.parties.filter(p => p.id !== id);
            this.renderPartiesList();
            this.updateDashboardStats();
        }
    }

    // User Management
    showAddUserModal() {
        document.getElementById('addUserModal').classList.add('active');
    }

    editUser(id) {
        const user = window.app.users.find(u => u.id === id);
        if (user) {
            document.getElementById('userName').value = user.name;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userPhone').value = user.phone;
            
            document.getElementById('addUserModal').classList.add('active');
            document.getElementById('addUserForm').onsubmit = (e) => {
                e.preventDefault();
                this.updateUser(id);
            };
        }
    }

    toggleUser(id) {
        const user = window.app.users.find(u => u.id === id);
        if (user) {
            user.active = !user.active;
            this.renderUsersList();
            this.updateDashboardStats();
        }
    }

    deleteUser(id) {
        if (confirm('Are you sure you want to delete this user?')) {
            window.app.users = window.app.users.filter(u => u.id !== id);
            this.renderUsersList();
            this.updateDashboardStats();
        }
    }

    updateParty(id) {
        const party = window.app.parties.find(p => p.id === id);
        if (party) {
            party.name = document.getElementById('partyName').value;
            party.candidate = document.getElementById('candidateName').value;
            party.description = document.getElementById('partyDescription').value;
            party.logo = document.getElementById('partyLogo').value;
            
            window.app.closeModal('addPartyModal');
            this.renderPartiesList();
            
            // Reset form handler
            document.getElementById('addPartyForm').onsubmit = window.app.originalAddPartyHandler;
        }
    }

    updateUser(id) {
        const user = window.app.users.find(u => u.id === id);
        if (user) {
            user.name = document.getElementById('userName').value;
            user.email = document.getElementById('userEmail').value;
            user.phone = document.getElementById('userPhone').value;
            
            window.app.closeModal('addUserModal');
            this.renderUsersList();
            
            // Reset form handler
            document.getElementById('addUserForm').onsubmit = window.app.originalAddUserHandler;
        }
    }
}

const adminManager = new AdminManager();