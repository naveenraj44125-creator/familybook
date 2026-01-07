// Enhanced FamilyBook Application - Multi-User Support
// Supports user authentication, shared family networks, and collaborative family management

class FamilyBookApp {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.familyNetworks = this.loadFamilyNetworks();
        this.currentFamilyNetwork = null;
        this.relationships = new Map();
        this.init();
    }

    init() {
        this.checkUserSession();
        this.setupEventListeners();
        this.showInitialScreen();
    }

    // ==================== USER MANAGEMENT ====================

    loadUsers() {
        const stored = localStorage.getItem('familybook-users');
        return stored ? JSON.parse(stored) : {};
    }

    saveUsers() {
        localStorage.setItem('familybook-users', JSON.stringify(this.users));
    }

    loadFamilyNetworks() {
        const stored = localStorage.getItem('familybook-networks');
        return stored ? JSON.parse(stored) : {};
    }

    saveFamilyNetworks() {
        localStorage.setItem('familybook-networks', JSON.stringify(this.familyNetworks));
    }

    checkUserSession() {
        const sessionUser = localStorage.getItem('familybook-session');
        if (sessionUser) {
            this.currentUser = JSON.parse(sessionUser);
            return true;
        }
        return false;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    hashPassword(password) {
        // Simple hash for demo - in production, use proper bcrypt or similar
        return btoa(password + 'familybook-salt');
    }

    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    register(email, password, name) {
        // Validate input
        if (!this.validateEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
        if (this.users[email]) {
            throw new Error('An account with this email already exists');
        }

        // Create new user
        const userId = this.generateId();
        const user = {
            id: userId,
            email: email,
            name: name,
            password: this.hashPassword(password),
            familyNetworks: [],
            createdAt: new Date().toISOString(),
            profilePicture: null
        };

        this.users[email] = user;
        this.saveUsers();

        // Auto-login after registration
        this.currentUser = user;
        localStorage.setItem('familybook-session', JSON.stringify(user));

        return user;
    }

    login(email, password) {
        const user = this.users[email];
        if (!user || !this.verifyPassword(password, user.password)) {
            throw new Error('Invalid email or password');
        }

        this.currentUser = user;
        localStorage.setItem('familybook-session', JSON.stringify(user));
        return user;
    }

    logout() {
        this.currentUser = null;
        this.currentFamilyNetwork = null;
        localStorage.removeItem('familybook-session');
        this.showInitialScreen();
    }

    // ==================== FAMILY NETWORK MANAGEMENT ====================

    createFamilyNetwork(name, description) {
        if (!this.currentUser) throw new Error('Must be logged in to create a family network');

        const networkId = this.generateId();
        const network = {
            id: networkId,
            name: name,
            description: description,
            createdBy: this.currentUser.id,
            createdAt: new Date().toISOString(),
            members: [this.currentUser.id],
            familyMembers: [],
            mediaItems: [],
            invitePending: [],
            settings: {
                isPublic: false,
                allowMemberInvites: true
            }
        };

        this.familyNetworks[networkId] = network;
        
        // Add network to user's list
        if (!this.currentUser.familyNetworks) {
            this.currentUser.familyNetworks = [];
        }
        this.currentUser.familyNetworks.push(networkId);
        
        this.saveUsers();
        this.saveFamilyNetworks();
        
        return network;
    }

    joinFamilyNetwork(networkId, inviteCode = null) {
        const network = this.familyNetworks[networkId];
        if (!network) throw new Error('Family network not found');

        // Check if user is already a member
        if (network.members.includes(this.currentUser.id)) {
            throw new Error('You are already a member of this family network');
        }

        // Add user to network
        network.members.push(this.currentUser.id);
        
        // Add network to user's list
        if (!this.currentUser.familyNetworks) {
            this.currentUser.familyNetworks = [];
        }
        this.currentUser.familyNetworks.push(networkId);

        this.saveUsers();
        this.saveFamilyNetworks();

        return network;
    }

    getUserFamilyNetworks() {
        if (!this.currentUser || !this.currentUser.familyNetworks) return [];
        
        return this.currentUser.familyNetworks.map(networkId => {
            const network = this.familyNetworks[networkId];
            if (network) {
                return {
                    ...network,
                    memberCount: network.members ? network.members.length : 0,
                    familyMemberCount: network.familyMembers ? network.familyMembers.length : 0
                };
            }
            return null;
        }).filter(network => network !== null);
    }

    selectFamilyNetwork(networkId) {
        const network = this.familyNetworks[networkId];
        if (!network || !network.members.includes(this.currentUser.id)) {
            throw new Error('Access denied to this family network');
        }

        this.currentFamilyNetwork = network;
        this.showMainApplication();
        this.renderFamilyTree();
        this.updateMemberDropdowns();
        this.updateMembersChecklist();
        this.renderMediaFeed();
    }

    // ==================== FAMILY MEMBER MANAGEMENT ====================

    addFamilyMember() {
        if (!this.currentFamilyNetwork) {
            throw new Error('No family network selected');
        }

        const formData = new FormData(document.getElementById('addMemberForm'));
        const photoFile = document.getElementById('memberPhoto').files[0];

        const member = {
            id: this.generateId(),
            name: formData.get('memberName') || document.getElementById('memberName').value,
            email: document.getElementById('memberEmail').value,
            phone: document.getElementById('memberPhone').value,
            birthdate: document.getElementById('memberBirthdate').value,
            photo: null,
            relationships: [],
            addedBy: this.currentUser.id,
            addedByName: this.currentUser.name,
            addedDate: new Date().toISOString(),
            isRegisteredUser: false
        };

        // Handle photo upload
        if (photoFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                member.photo = e.target.result;
                this.completeMemberAddition(member);
            };
            reader.readAsDataURL(photoFile);
        } else {
            this.completeMemberAddition(member);
        }
    }

    completeMemberAddition(member) {
        // Add relationship if specified
        const relationshipType = document.getElementById('relationshipType').value;
        const relatedMemberId = document.getElementById('relatedMember').value;

        if (relationshipType && relatedMemberId) {
            this.addRelationship(member.id, relatedMemberId, relationshipType);
        }

        this.currentFamilyNetwork.familyMembers.push(member);
        this.saveFamilyNetworks();
        
        this.renderFamilyTree();
        this.updateMemberDropdowns();
        this.updateMembersChecklist();
        
        // Reset form
        document.getElementById('addMemberForm').reset();
        
        // Show success message
        this.showMessage(`${member.name} added to ${this.currentFamilyNetwork.name}!`, 'success');
        
        // Switch to family tree view
        this.showSection('family-tree');
    }

    // Relationship Management
    addRelationship(memberId1, memberId2, relationshipType) {
        const member1 = this.currentFamilyNetwork.familyMembers.find(m => m.id === memberId1);
        const member2 = this.currentFamilyNetwork.familyMembers.find(m => m.id === memberId2);

        if (member1 && member2) {
            // Add relationship to member1
            if (!member1.relationships) member1.relationships = [];
            member1.relationships.push({
                memberId: memberId2,
                relationship: relationshipType
            });

            // Add reciprocal relationship to member2
            if (!member2.relationships) member2.relationships = [];
            const reciprocalRelationship = this.getReciprocalRelationship(relationshipType);
            member2.relationships.push({
                memberId: memberId1,
                relationship: reciprocalRelationship
            });

            // Store in relationships map for easy lookup
            const key1 = `${memberId1}-${memberId2}`;
            const key2 = `${memberId2}-${memberId1}`;
            this.relationships.set(key1, relationshipType);
            this.relationships.set(key2, reciprocalRelationship);
        }
    }

    getReciprocalRelationship(relationship) {
        const reciprocals = {
            'parent': 'child',
            'child': 'parent',
            'sibling': 'sibling',
            'spouse': 'spouse',
            'grandparent': 'grandchild',
            'grandchild': 'grandparent',
            'uncle': 'nephew',
            'aunt': 'niece',
            'nephew': 'uncle',
            'niece': 'aunt',
            'cousin': 'cousin'
        };
        return reciprocals[relationship] || relationship;
    }

    // ==================== MEDIA SHARING ====================

    shareMedia() {
        if (!this.currentFamilyNetwork) {
            throw new Error('No family network selected');
        }

        const files = document.getElementById('mediaFiles').files;
        const caption = document.getElementById('mediaCaption').value;
        const selectedMembers = this.getSelectedMembers();

        if (files.length === 0) {
            this.showMessage('Please select at least one media file.', 'error');
            return;
        }

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const mediaItem = {
                    id: this.generateId(),
                    type: file.type.startsWith('video/') ? 'video' : 'image',
                    url: e.target.result,
                    caption: caption,
                    sharedWith: selectedMembers.length > 0 ? selectedMembers : 'all',
                    sharedBy: this.currentUser.id,
                    sharedByName: this.currentUser.name,
                    sharedDate: new Date().toISOString(),
                    fileName: file.name,
                    networkId: this.currentFamilyNetwork.id
                };

                this.currentFamilyNetwork.mediaItems.push(mediaItem);
                this.saveFamilyNetworks();
                this.renderMediaFeed();
            };
            reader.readAsDataURL(file);
        });

        // Reset form
        document.getElementById('mediaUploadForm').reset();
        this.updateMembersChecklist();

        this.showMessage('Media shared successfully with the family!', 'success');
    }

    getSelectedMembers() {
        const checkboxes = document.querySelectorAll('#membersList input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    // ==================== RELATIONSHIP CHAIN FINDER ====================

    findRelationshipChain() {
        const person1Id = document.getElementById('person1').value;
        const person2Id = document.getElementById('person2').value;
        const resultDiv = document.getElementById('relationshipResult');

        if (!person1Id || !person2Id) {
            resultDiv.innerHTML = '<div class="error-message">Please select both persons to find their relationship.</div>';
            return;
        }

        if (person1Id === person2Id) {
            resultDiv.innerHTML = '<div class="error-message">Please select two different persons.</div>';
            return;
        }

        const chain = this.findShortestPath(person1Id, person2Id);
        
        if (chain.length === 0) {
            resultDiv.innerHTML = `
                <div class="no-relationship">
                    <i class="fas fa-unlink"></i>
                    <h3>No relationship found</h3>
                    <p>These family members are not connected in the current family tree.</p>
                </div>
            `;
        } else {
            this.displayRelationshipChain(chain, resultDiv);
        }
    }

    findShortestPath(startId, endId) {
        const visited = new Set();
        const queue = [{id: startId, path: [startId]}];

        while (queue.length > 0) {
            const {id, path} = queue.shift();

            if (id === endId) {
                return path;
            }

            if (visited.has(id)) {
                continue;
            }

            visited.add(id);

            const member = this.currentFamilyNetwork.familyMembers.find(m => m.id === id);
            if (member && member.relationships) {
                for (const rel of member.relationships) {
                    if (!visited.has(rel.memberId)) {
                        queue.push({
                            id: rel.memberId,
                            path: [...path, rel.memberId]
                        });
                    }
                }
            }
        }

        return [];
    }

    displayRelationshipChain(chain, resultDiv) {
        let chainHtml = '<div class="relationship-chain">';
        
        for (let i = 0; i < chain.length; i++) {
            const member = this.currentFamilyNetwork.familyMembers.find(m => m.id === chain[i]);
            chainHtml += `<div class="chain-person">${member.name}</div>`;
            
            if (i < chain.length - 1) {
                const relationship = this.getRelationshipBetween(chain[i], chain[i + 1]);
                chainHtml += `
                    <div class="chain-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="chain-relationship">${relationship}</div>
                    <div class="chain-arrow"><i class="fas fa-arrow-right"></i></div>
                `;
            }
        }
        
        chainHtml += '</div>';
        
        const summary = this.generateRelationshipSummary(chain);
        chainHtml += `<div class="text-center mt-2"><strong>Relationship Summary:</strong> ${summary}</div>`;
        
        resultDiv.innerHTML = chainHtml;
    }

    getRelationshipBetween(id1, id2) {
        const key = `${id1}-${id2}`;
        return this.relationships.get(key) || 'related to';
    }

    generateRelationshipSummary(chain) {
        if (chain.length === 2) {
            const relationship = this.getRelationshipBetween(chain[0], chain[1]);
            return `Direct ${relationship}`;
        } else if (chain.length === 3) {
            const rel1 = this.getRelationshipBetween(chain[0], chain[1]);
            const rel2 = this.getRelationshipBetween(chain[1], chain[2]);
            return `${rel1}'s ${rel2}`;
        } else {
            return `Connected through ${chain.length - 2} intermediate family member(s)`;
        }
    }

    // ==================== UI MANAGEMENT ====================

    setupEventListeners() {
        // We'll set up listeners dynamically when screens are shown
        // since the DOM elements may not exist yet
    }

    showInitialScreen() {
        if (this.currentUser) {
            this.showFamilyNetworkSelection();
        } else {
            this.showAuthScreen();
        }
    }

    showAuthScreen() {
        document.body.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <h1><i class="fas fa-users"></i> FamilyBook</h1>
                        <p>Connect with your family network</p>
                    </div>

                    <div id="loginSection" class="auth-section active">
                        <h2>Welcome Back</h2>
                        <form id="loginForm">
                            <div class="form-group">
                                <label for="loginEmail">Email</label>
                                <input type="email" id="loginEmail" required>
                            </div>
                            <div class="form-group">
                                <label for="loginPassword">Password</label>
                                <input type="password" id="loginPassword" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Sign In</button>
                        </form>
                        <p class="auth-switch">
                            Don't have an account? 
                            <button type="button" id="showRegister" class="link-btn">Create one</button>
                        </p>
                    </div>

                    <div id="registerSection" class="auth-section">
                        <h2>Join FamilyBook</h2>
                        <form id="registerForm">
                            <div class="form-group">
                                <label for="registerName">Full Name</label>
                                <input type="text" id="registerName" required>
                            </div>
                            <div class="form-group">
                                <label for="registerEmail">Email</label>
                                <input type="email" id="registerEmail" required>
                            </div>
                            <div class="form-group">
                                <label for="registerPassword">Password</label>
                                <input type="password" id="registerPassword" required minlength="6">
                            </div>
                            <button type="submit" class="btn btn-primary">Create Account</button>
                        </form>
                        <p class="auth-switch">
                            Already have an account? 
                            <button type="button" id="showLogin" class="link-btn">Sign in</button>
                        </p>
                    </div>
                </div>
            </div>
        `;
        this.setupAuthListeners();
    }

    setupAuthListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        const showRegisterBtn = document.getElementById('showRegister');
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', () => {
                document.getElementById('loginSection').classList.remove('active');
                document.getElementById('registerSection').classList.add('active');
            });
        }

        const showLoginBtn = document.getElementById('showLogin');
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', () => {
                document.getElementById('registerSection').classList.remove('active');
                document.getElementById('loginSection').classList.add('active');
            });
        }
    }

    showFamilyNetworkSelection() {
        const userNetworks = this.getUserFamilyNetworks();
        
        document.body.innerHTML = `
            <div class="network-container">
                <div class="network-header">
                    <h1><i class="fas fa-users"></i> FamilyBook</h1>
                    <div class="user-info">
                        <span>Welcome, ${this.currentUser.name}</span>
                        <button id="logoutBtn" class="btn btn-secondary">Logout</button>
                    </div>
                </div>

                <div class="network-content">
                    <div class="network-section">
                        <h2>Your Family Networks</h2>
                        
                        ${userNetworks.length > 0 ? `
                            <div class="networks-grid">
                                ${userNetworks.map(network => `
                                    <div class="network-card" onclick="familyBookApp.selectFamilyNetwork('${network.id}')">
                                        <h3>${network.name}</h3>
                                        <p>${network.description || 'No description'}</p>
                                        <div class="network-stats">
                                            <span><i class="fas fa-users"></i> ${network.memberCount} users</span>
                                            <span><i class="fas fa-user-friends"></i> ${network.familyMemberCount} family members</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <i class="fas fa-network-wired"></i>
                                <h3>No family networks yet</h3>
                                <p>Create your first family network or join an existing one</p>
                            </div>
                        `}
                    </div>

                    <div class="network-actions">
                        <div class="action-card">
                            <h3>Create New Family Network</h3>
                            <form id="createNetworkForm">
                                <div class="form-group">
                                    <input type="text" id="networkName" placeholder="Family Network Name" required>
                                </div>
                                <div class="form-group">
                                    <textarea id="networkDescription" placeholder="Description (optional)" rows="2"></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary">Create Network</button>
                            </form>
                        </div>

                        <div class="action-card">
                            <h3>Join Existing Network</h3>
                            <form id="joinNetworkForm">
                                <div class="form-group">
                                    <input type="text" id="networkId" placeholder="Network ID" required>
                                    <small>Ask a family member for their Network ID</small>
                                </div>
                                <button type="submit" class="btn btn-secondary">Join Network</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.setupNetworkListeners();
    }

    setupNetworkListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        const createNetworkForm = document.getElementById('createNetworkForm');
        if (createNetworkForm) {
            createNetworkForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateNetwork();
            });
        }

        const joinNetworkForm = document.getElementById('joinNetworkForm');
        if (joinNetworkForm) {
            joinNetworkForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleJoinNetwork();
            });
        }
    }

    showMainApplication() {
        document.body.innerHTML = `
            <div class="app-container">
                <header class="app-header">
                    <h1><i class="fas fa-users"></i> ${this.currentFamilyNetwork.name}</h1>
                    <div class="header-controls">
                        <span class="current-user">Welcome, ${this.currentUser.name}</span>
                        <button onclick="familyBookApp.showFamilyNetworkSelection()" class="btn btn-secondary">Switch Network</button>
                        <button onclick="familyBookApp.logout()" class="btn btn-secondary">Logout</button>
                    </div>
                </header>

                <nav class="app-nav">
                    <button class="nav-btn active" data-section="family-tree">
                        <i class="fas fa-sitemap"></i> Family Tree
                    </button>
                    <button class="nav-btn" data-section="add-member">
                        <i class="fas fa-user-plus"></i> Add Member
                    </button>
                    <button class="nav-btn" data-section="share-media">
                        <i class="fas fa-photo-video"></i> Share Media
                    </button>
                    <button class="nav-btn" data-section="dependency-chain">
                        <i class="fas fa-link"></i> Check Relationships
                    </button>
                </nav>

                <main class="app-main">
                    ${this.getMainContentHTML()}
                </main>
            </div>
        `;
        this.setupMainAppListeners();
        this.showSection('family-tree');
    }

    getMainContentHTML() {
        return `
            <!-- Family Tree Section -->
            <section id="family-tree" class="content-section active">
                <div class="section-header">
                    <h2><i class="fas fa-sitemap"></i> Family Tree - ${this.currentFamilyNetwork.name}</h2>
                    <p>Network ID: <strong>${this.currentFamilyNetwork.id}</strong> (Share this with family members)</p>
                </div>
                <div id="familyGrid" class="family-grid"></div>
            </section>

            <!-- Add Member Section -->
            <section id="add-member" class="content-section">
                <div class="section-header">
                    <h2><i class="fas fa-user-plus"></i> Add Family Member</h2>
                    <p>Add a new member to your family network</p>
                </div>
                <form id="addMemberForm" class="member-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="memberName">Full Name *</label>
                            <input type="text" id="memberName" name="memberName" required>
                        </div>
                        <div class="form-group">
                            <label for="memberEmail">Email</label>
                            <input type="email" id="memberEmail" name="memberEmail">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="memberPhone">Phone</label>
                            <input type="tel" id="memberPhone" name="memberPhone">
                        </div>
                        <div class="form-group">
                            <label for="memberBirthdate">Date of Birth</label>
                            <input type="date" id="memberBirthdate" name="memberBirthdate">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="relationshipType">Relationship</label>
                            <select id="relationshipType">
                                <option value="">Select relationship</option>
                                <option value="parent">Parent</option>
                                <option value="child">Child</option>
                                <option value="sibling">Sibling</option>
                                <option value="spouse">Spouse</option>
                                <option value="grandparent">Grandparent</option>
                                <option value="grandchild">Grandchild</option>
                                <option value="uncle">Uncle</option>
                                <option value="aunt">Aunt</option>
                                <option value="nephew">Nephew</option>
                                <option value="niece">Niece</option>
                                <option value="cousin">Cousin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="relatedMember">Related to</label>
                            <select id="relatedMember">
                                <option value="">Select family member</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="memberPhoto">Profile Photo</label>
                        <input type="file" id="memberPhoto" accept="image/*">
                    </div>

                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Family Member
                    </button>
                </form>
            </section>

            <!-- Share Media Section -->
            <section id="share-media" class="content-section">
                <div class="section-header">
                    <h2><i class="fas fa-photo-video"></i> Share Photos & Videos</h2>
                    <p>Share memories with your family network</p>
                </div>

                <form id="mediaUploadForm" class="media-form">
                    <div class="form-group">
                        <label for="mediaFiles">Select Photos/Videos</label>
                        <input type="file" id="mediaFiles" multiple accept="image/*,video/*">
                    </div>

                    <div class="form-group">
                        <label for="mediaCaption">Caption</label>
                        <textarea id="mediaCaption" rows="3" placeholder="Add a caption..."></textarea>
                    </div>

                    <div class="form-group">
                        <label>Share with:</label>
                        <div id="membersList" class="members-list"></div>
                        <p class="help-text">Leave blank to share with all family members</p>
                    </div>

                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-share"></i> Share Media
                    </button>
                </form>

                <div class="media-feed">
                    <h3>Recent Shared Media</h3>
                    <div id="mediaFeed"></div>
                </div>
            </section>

            <!-- Dependency Chain Section -->
            <section id="dependency-chain" class="content-section">
                <div class="section-header">
                    <h2><i class="fas fa-link"></i> Check Relationship Chain</h2>
                    <p>Find how two family members are connected</p>
                </div>

                <div class="relationship-checker">
                    <div class="checker-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="person1">First Person</label>
                                <select id="person1">
                                    <option value="">Select first person</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="person2">Second Person</label>
                                <select id="person2">
                                    <option value="">Select second person</option>
                                </select>
                            </div>
                        </div>
                        <button id="findRelationshipBtn" class="btn btn-primary">
                            <i class="fas fa-search"></i> Find Relationship
                        </button>
                    </div>

                    <div id="relationshipResult" class="relationship-result"></div>
                </div>
            </section>
        `;
    }

    setupMainAppListeners() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // Add member form
        const addMemberForm = document.getElementById('addMemberForm');
        if (addMemberForm) {
            addMemberForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addFamilyMember();
            });
        }

        // Media upload form
        const mediaUploadForm = document.getElementById('mediaUploadForm');
        if (mediaUploadForm) {
            mediaUploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.shareMedia();
            });
        }

        // Relationship finder
        const findRelationshipBtn = document.getElementById('findRelationshipBtn');
        if (findRelationshipBtn) {
            findRelationshipBtn.addEventListener('click', () => {
                this.findRelationshipChain();
            });
        }
    }

    // ==================== EVENT HANDLERS ====================

    handleLogin() {
        try {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            this.login(email, password);
            this.showFamilyNetworkSelection();
        } catch (error) {
            this.showAuthMessage(error.message, 'error');
        }
    }

    handleRegister() {
        try {
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            this.register(email, password, name);
            this.showFamilyNetworkSelection();
        } catch (error) {
            this.showAuthMessage(error.message, 'error');
        }
    }

    handleCreateNetwork() {
        try {
            const name = document.getElementById('networkName').value;
            const description = document.getElementById('networkDescription').value;

            this.createFamilyNetwork(name, description);
            this.showFamilyNetworkSelection();
            this.showAuthMessage(`Family network "${name}" created successfully!`, 'success');
        } catch (error) {
            this.showAuthMessage(error.message, 'error');
        }
    }

    handleJoinNetwork() {
        try {
            const networkId = document.getElementById('networkId').value;
            const network = this.joinFamilyNetwork(networkId);
            this.showFamilyNetworkSelection();
            this.showAuthMessage(`Successfully joined "${network.name}"!`, 'success');
        } catch (error) {
            this.showAuthMessage(error.message, 'error');
        }
    }

    // ==================== RENDERING METHODS ====================

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Add active class to corresponding nav button
        const targetBtn = document.querySelector(`[data-section="${sectionId}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
    }

    renderFamilyTree() {
        const familyGrid = document.getElementById('familyGrid');
        
        if (!this.currentFamilyNetwork || !this.currentFamilyNetwork.familyMembers || this.currentFamilyNetwork.familyMembers.length === 0) {
            familyGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No family members yet</h3>
                    <p>Add your first family member to get started!</p>
                    <button onclick="familyBookApp.showSection('add-member')" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Family Member
                    </button>
                </div>
            `;
            return;
        }

        familyGrid.innerHTML = this.currentFamilyNetwork.familyMembers.map(member => `
            <div class="family-member-card">
                <img src="${member.photo || 'https://via.placeholder.com/80x80/3498db/white?text=' + member.name.charAt(0)}" 
                     alt="${member.name}" class="member-photo">
                <div class="member-name">${member.name}</div>
                <div class="member-info">
                    ${member.email ? `<div><i class="fas fa-envelope"></i> ${member.email}</div>` : ''}
                    ${member.phone ? `<div><i class="fas fa-phone"></i> ${member.phone}</div>` : ''}
                    ${member.birthdate ? `<div><i class="fas fa-birthday-cake"></i> ${new Date(member.birthdate).toLocaleDateString()}</div>` : ''}
                </div>
                ${this.renderMemberRelationships(member)}
                <div class="member-meta">
                    <small>Added by ${member.addedByName} on ${new Date(member.addedDate).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
    }

    renderMemberRelationships(member) {
        if (!member.relationships || member.relationships.length === 0) {
            return '<div class="member-relationships"><em>No relationships defined</em></div>';
        }

        const relationshipsHtml = member.relationships.map(rel => {
            const relatedMember = this.currentFamilyNetwork.familyMembers.find(m => m.id === rel.memberId);
            if (relatedMember) {
                return `<span class="relationship-tag">${rel.relationship}: ${relatedMember.name}</span>`;
            }
            return '';
        }).join('');

        return `<div class="member-relationships">${relationshipsHtml}</div>`;
    }

    renderMediaFeed() {
        const mediaFeed = document.getElementById('mediaFeed');
        
        if (!this.currentFamilyNetwork || !this.currentFamilyNetwork.mediaItems || this.currentFamilyNetwork.mediaItems.length === 0) {
            mediaFeed.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-photo-video"></i>
                    <h3>No media shared yet</h3>
                    <p>Share your first photo or video with the family!</p>
                </div>
            `;
            return;
        }

        const sortedMedia = this.currentFamilyNetwork.mediaItems.sort((a, b) => new Date(b.sharedDate) - new Date(a.sharedDate));

        mediaFeed.innerHTML = sortedMedia.map(item => `
            <div class="media-post">
                <div class="post-header">
                    <span class="post-author"><i class="fas fa-user"></i> ${item.sharedByName}</span>
                    <span class="post-date">${new Date(item.sharedDate).toLocaleDateString()}</span>
                </div>
                ${item.type === 'video' 
                    ? `<video src="${item.url}" controls class="post-media"></video>`
                    : `<img src="${item.url}" alt="Shared media" class="post-media">`
                }
                ${item.caption ? `<div class="post-caption">${item.caption}</div>` : ''}
                <div class="post-shared-with">
                    <i class="fas fa-share"></i> Shared with: ${this.getSharedWithNames(item.sharedWith).join(', ') || 'Everyone'}
                </div>
            </div>
        `).join('');
    }

    getSharedWithNames(sharedWith) {
        if (sharedWith === 'all' || !Array.isArray(sharedWith)) return ['Everyone'];
        
        return sharedWith.map(id => {
            const member = this.currentFamilyNetwork.familyMembers.find(m => m.id === id);
            return member ? member.name : 'Unknown';
        });
    }

    updateMemberDropdowns() {
        const selects = ['relatedMember', 'person1', 'person2'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;
            
            const currentValue = select.value;
            
            // Keep the first option (placeholder)
            const placeholder = select.firstElementChild.outerHTML;
            select.innerHTML = placeholder;

            if (this.currentFamilyNetwork && this.currentFamilyNetwork.familyMembers) {
                this.currentFamilyNetwork.familyMembers.forEach(member => {
                    const option = document.createElement('option');
                    option.value = member.id;
                    option.textContent = member.name;
                    select.appendChild(option);
                });
            }

            // Restore previous selection if it still exists
            if (currentValue && this.currentFamilyNetwork.familyMembers.find(m => m.id === currentValue)) {
                select.value = currentValue;
            }
        });
    }

    updateMembersChecklist() {
        const membersList = document.getElementById('membersList');
        if (!membersList) return;
        
        if (!this.currentFamilyNetwork || !this.currentFamilyNetwork.familyMembers || this.currentFamilyNetwork.familyMembers.length === 0) {
            membersList.innerHTML = '<p class="text-center">Add family members first to share media with them.</p>';
            return;
        }

        membersList.innerHTML = this.currentFamilyNetwork.familyMembers.map(member => `
            <label class="member-checkbox">
                <input type="checkbox" value="${member.id}">
                <span>${member.name}</span>
            </label>
        `).join('');
    }

    // ==================== UTILITY METHODS ====================

    showMessage(message, type) {
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
        messageDiv.textContent = message;

        // Insert at the top of the current active section
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection) {
            const header = activeSection.querySelector('.section-header');
            if (header) {
                header.insertAdjacentElement('afterend', messageDiv);
            } else {
                activeSection.insertAdjacentElement('afterbegin', messageDiv);
            }
        }

        // Remove message after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    showAuthMessage(message, type) {
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
        messageDiv.textContent = message;

        // Insert at the top of the auth card
        const authCard = document.querySelector('.auth-card');
        if (authCard) {
            const header = authCard.querySelector('.auth-header');
            if (header) {
                header.insertAdjacentElement('afterend', messageDiv);
            }
        }

        // Remove message after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.familyBookApp = new FamilyBookApp();
});
