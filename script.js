// FamilyBook Application - Simple Version working with Node.js Backend
class FamilyBook {
    constructor() {
        this.currentFamily = null;
        this.members = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.showCreateFamilyForm();
    }

    setupEventListeners() {
        // Setup event listeners after DOM elements are created
    }

    showCreateFamilyForm() {
        document.body.innerHTML = `
            <div class="container">
                <div class="header">
                    <h1><i class="fas fa-users"></i> FamilyBook</h1>
                    <p>Create your family network and connect with loved ones</p>
                </div>

                <div class="family-setup">
                    <div class="setup-card">
                        <h2>Create Your Family</h2>
                        <form id="createFamilyForm">
                            <div class="form-group">
                                <label for="familyName">Family Name</label>
                                <input type="text" id="familyName" required placeholder="Enter your family name">
                            </div>
                            <div class="form-group">
                                <label for="creatorName">Your Name</label>
                                <input type="text" id="creatorName" required placeholder="Enter your name">
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-plus"></i> Create Family
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('createFamilyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createFamily();
        });
    }

    async createFamily() {
        const familyName = document.getElementById('familyName').value;
        const creatorName = document.getElementById('creatorName').value;

        try {
            const response = await fetch('/api/family', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    familyName: familyName,
                    creatorName: creatorName
                })
            });

            const result = await response.json();

            if (result.success) {
                this.currentFamily = result.family;
                this.members = result.family.members;
                this.showMainApplication();
                this.showMessage(`Welcome to ${familyName}! You can now add family members.`, 'success');
            } else {
                this.showMessage('Failed to create family. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error creating family:', error);
            this.showMessage('Error creating family. Please try again.', 'error');
        }
    }

    showMainApplication() {
        document.body.innerHTML = `
            <div class="app-container">
                <header class="app-header">
                    <h1><i class="fas fa-users"></i> ${this.currentFamily.name}</h1>
                    <div class="header-info">
                        <span>Creator: ${this.currentFamily.creator}</span>
                        <button onclick="location.reload()" class="btn btn-secondary">New Family</button>
                    </div>
                </header>

                <nav class="app-nav">
                    <button class="nav-btn active" onclick="familyBook.showSection('family-tree')">
                        <i class="fas fa-sitemap"></i> Family Tree
                    </button>
                    <button class="nav-btn" onclick="familyBook.showSection('add-member')">
                        <i class="fas fa-user-plus"></i> Add Member
                    </button>
                    <button class="nav-btn" onclick="familyBook.showSection('relationships')">
                        <i class="fas fa-link"></i> Check Relationships
                    </button>
                </nav>

                <main class="app-main">
                    <!-- Family Tree Section -->
                    <section id="family-tree" class="content-section active">
                        <div class="section-header">
                            <h2><i class="fas fa-sitemap"></i> Family Tree</h2>
                            <p>View all family members and their connections</p>
                        </div>
                        <div id="familyMembers" class="family-grid"></div>
                    </section>

                    <!-- Add Member Section -->
                    <section id="add-member" class="content-section">
                        <div class="section-header">
                            <h2><i class="fas fa-user-plus"></i> Add Family Member</h2>
                            <p>Add a new member to your family</p>
                        </div>
                        
                        <form id="addMemberForm" class="member-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="memberName">Full Name *</label>
                                    <input type="text" id="memberName" required>
                                </div>
                                <div class="form-group">
                                    <label for="memberRelationship">Relationship</label>
                                    <select id="memberRelationship">
                                        <option value="">Select relationship</option>
                                        <option value="parent">Parent</option>
                                        <option value="child">Child</option>
                                        <option value="sibling">Sibling</option>
                                        <option value="spouse">Spouse</option>
                                        <option value="grandparent">Grandparent</option>
                                        <option value="grandchild">Grandchild</option>
                                        <option value="uncle">Uncle</option>
                                        <option value="aunt">Aunt</option>
                                        <option value="cousin">Cousin</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-plus"></i> Add Member
                            </button>
                        </form>
                    </section>

                    <!-- Relationships Section -->
                    <section id="relationships" class="content-section">
                        <div class="section-header">
                            <h2><i class="fas fa-link"></i> Check Relationship Chain</h2>
                            <p>Find how two family members are connected</p>
                        </div>
                        
                        <div class="relationship-checker">
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
                            <button onclick="familyBook.findRelationshipChain()" class="btn btn-primary">
                                <i class="fas fa-search"></i> Find Relationship
                            </button>
                            
                            <div id="relationshipResult" class="relationship-result"></div>
                        </div>
                    </section>
                </main>
            </div>
        `;

        this.setupMainAppListeners();
        this.loadFamilyMembers();
        this.updateMemberDropdowns();
    }

    setupMainAppListeners() {
        // Add member form
        const addMemberForm = document.getElementById('addMemberForm');
        if (addMemberForm) {
            addMemberForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addFamilyMember();
            });
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Add active class to clicked button
        event.target.classList.add('active');
    }

    async loadFamilyMembers() {
        if (!this.currentFamily) return;

        try {
            const response = await fetch(`/api/family/${this.currentFamily.id}`);
            const result = await response.json();

            if (result.success) {
                this.currentFamily = result.family;
                this.members = result.family.members;
                this.renderFamilyMembers();
                this.updateMemberDropdowns();
            }
        } catch (error) {
            console.error('Error loading family members:', error);
        }
    }

    renderFamilyMembers() {
        const familyMembersDiv = document.getElementById('familyMembers');
        
        if (!this.members || this.members.length === 0) {
            familyMembersDiv.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No family members yet</h3>
                    <p>Add your first family member to get started!</p>
                    <button onclick="familyBook.showSection('add-member')" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add Family Member
                    </button>
                </div>
            `;
            return;
        }

        familyMembersDiv.innerHTML = this.members.map(member => `
            <div class="family-member-card">
                <div class="member-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="member-info">
                    <h3>${member.name}</h3>
                    <p class="member-relationship">${member.relationship}</p>
                    <p class="member-added">Added: ${new Date(member.addedAt).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');
    }

    async addFamilyMember() {
        const name = document.getElementById('memberName').value;
        const relationship = document.getElementById('memberRelationship').value;

        if (!name.trim()) {
            this.showMessage('Please enter a name for the family member.', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/family/${this.currentFamily.id}/member`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    relationship: relationship || 'Family Member'
                })
            });

            const result = await response.json();

            if (result.success) {
                this.currentFamily = result.family;
                this.members = result.family.members;
                this.renderFamilyMembers();
                this.updateMemberDropdowns();
                
                // Reset form
                document.getElementById('addMemberForm').reset();
                
                // Show success message and switch to family tree
                this.showMessage(`${name} added to the family!`, 'success');
                this.showSection('family-tree');
            } else {
                this.showMessage('Failed to add family member. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error adding family member:', error);
            this.showMessage('Error adding family member. Please try again.', 'error');
        }
    }

    updateMemberDropdowns() {
        const selects = ['person1', 'person2'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;
            
            // Clear existing options except the first one
            select.innerHTML = '<option value="">Select person</option>';

            if (this.members) {
                this.members.forEach(member => {
                    const option = document.createElement('option');
                    option.value = member.id;
                    option.textContent = member.name;
                    select.appendChild(option);
                });
            }
        });
    }

    async findRelationshipChain() {
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

        try {
            const response = await fetch(`/api/family/${this.currentFamily.id}/relationship-chain/${person1Id}/${person2Id}`);
            const result = await response.json();

            if (result.success) {
                if (result.chain && result.chain.length > 0) {
                    this.displayRelationshipChain(result.chain, resultDiv);
                } else {
                    resultDiv.innerHTML = `
                        <div class="no-relationship">
                            <i class="fas fa-unlink"></i>
                            <h3>No relationship found</h3>
                            <p>These family members are not connected in the current family tree.</p>
                        </div>
                    `;
                }
            } else {
                resultDiv.innerHTML = '<div class="error-message">Error finding relationship chain.</div>';
            }
        } catch (error) {
            console.error('Error finding relationship chain:', error);
            resultDiv.innerHTML = '<div class="error-message">Error finding relationship chain.</div>';
        }
    }

    displayRelationshipChain(chain, resultDiv) {
        let chainHtml = '<div class="relationship-chain">';
        
        for (let i = 0; i < chain.length; i++) {
            const chainItem = chain[i];
            chainHtml += `<div class="chain-person">${chainItem.member.name}</div>`;
            
            if (i < chain.length - 1 && chainItem.relationship) {
                chainHtml += `
                    <div class="chain-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="chain-relationship">${chainItem.relationship}</div>
                    <div class="chain-arrow"><i class="fas fa-arrow-right"></i></div>
                `;
            }
        }
        
        chainHtml += '</div>';
        
        resultDiv.innerHTML = chainHtml;
    }

    showMessage(message, type) {
        // Remove any existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type === 'success' ? 'success-message' : 'error-message'}`;
        messageDiv.textContent = message;

        // Insert at the top of the main content area
        const main = document.querySelector('.app-main') || document.querySelector('.container');
        if (main) {
            main.insertAdjacentElement('afterbegin', messageDiv);
        }

        // Remove message after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.familyBook = new FamilyBook();
});
