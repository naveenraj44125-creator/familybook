const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from current directory (where index.html, styles.css, script.js are located)
app.use(express.static(__dirname));

// Serve the original FamilyBook application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Family data storage (in production, this would use a database)
let families = {};
let currentFamilyId = null;

// API endpoint to create a new family
app.post('/api/family', (req, res) => {
    const { familyName, creatorName } = req.body;
    const familyId = Date.now().toString();
    
    families[familyId] = {
        id: familyId,
        name: familyName,
        creator: creatorName,
        members: [
            {
                id: Date.now().toString(),
                name: creatorName,
                relationship: 'Creator',
                photos: [],
                videos: [],
                addedAt: new Date().toISOString()
            }
        ],
        relationships: [],
        createdAt: new Date().toISOString()
    };
    
    res.json({ 
        success: true, 
        familyId: familyId,
        family: families[familyId]
    });
});

// API endpoint to get family data
app.get('/api/family/:familyId', (req, res) => {
    const { familyId } = req.params;
    
    if (!families[familyId]) {
        return res.status(404).json({ success: false, message: 'Family not found' });
    }
    
    res.json({ 
        success: true, 
        family: families[familyId]
    });
});

// API endpoint to add a family member
app.post('/api/family/:familyId/member', (req, res) => {
    const { familyId } = req.params;
    const { name, relationship } = req.body;
    
    if (!families[familyId]) {
        return res.status(404).json({ success: false, message: 'Family not found' });
    }
    
    const member = {
        id: Date.now().toString(),
        name: name,
        relationship: relationship,
        photos: [],
        videos: [],
        addedAt: new Date().toISOString()
    };
    
    families[familyId].members.push(member);
    
    res.json({ 
        success: true, 
        member: member,
        family: families[familyId]
    });
});

// API endpoint to add relationship
app.post('/api/family/:familyId/relationship', (req, res) => {
    const { familyId } = req.params;
    const { fromMemberId, toMemberId, relationshipType } = req.body;
    
    if (!families[familyId]) {
        return res.status(404).json({ success: false, message: 'Family not found' });
    }
    
    const relationship = {
        id: Date.now().toString(),
        fromMemberId: fromMemberId,
        toMemberId: toMemberId,
        type: relationshipType,
        createdAt: new Date().toISOString()
    };
    
    families[familyId].relationships.push(relationship);
    
    res.json({ 
        success: true, 
        relationship: relationship,
        family: families[familyId]
    });
});

// API endpoint to get relationship chain
app.get('/api/family/:familyId/relationship-chain/:fromId/:toId', (req, res) => {
    const { familyId, fromId, toId } = req.params;
    
    if (!families[familyId]) {
        return res.status(404).json({ success: false, message: 'Family not found' });
    }
    
    const family = families[familyId];
    const chain = findRelationshipChain(family, fromId, toId);
    
    res.json({ 
        success: true, 
        chain: chain
    });
});

// Helper function to find relationship chain
function findRelationshipChain(family, fromId, toId) {
    if (fromId === toId) {
        const member = family.members.find(m => m.id === fromId);
        return [{ member: member, relationship: 'Same person' }];
    }
    
    // Simple BFS to find shortest path
    const visited = new Set();
    const queue = [{ memberId: fromId, path: [] }];
    
    while (queue.length > 0) {
        const { memberId, path } = queue.shift();
        
        if (visited.has(memberId)) continue;
        visited.add(memberId);
        
        const member = family.members.find(m => m.id === memberId);
        const currentPath = [...path, { member: member }];
        
        if (memberId === toId) {
            return currentPath;
        }
        
        // Find connected members
        const connections = family.relationships.filter(r => 
            r.fromMemberId === memberId || r.toMemberId === memberId
        );
        
        for (const rel of connections) {
            const nextMemberId = rel.fromMemberId === memberId ? rel.toMemberId : rel.fromMemberId;
            if (!visited.has(nextMemberId)) {
                queue.push({ 
                    memberId: nextMemberId, 
                    path: [...currentPath.slice(0, -1), { 
                        member: member, 
                        relationship: rel.type 
                    }]
                });
            }
        }
    }
    
    return []; // No path found
}

// Health check endpoint (required for deployment)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// System info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        status: 'success',
        message: 'FamilyBook - Family Network Platform',
        version: '1.0.0',
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        features: ['Family Management', 'Photo Sharing', 'Relationship Mapping']
    });
});

app.listen(PORT, () => {
    console.log(`🚀 FamilyBook server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
});
