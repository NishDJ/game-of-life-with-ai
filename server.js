const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getUserById, getUserByUsername, createUser, getAllUsers } = require('./services/userService');
const { processLargeDataset } = require('./utils/dataProcessor');
const GameOfLifeService = require('./services/gameOfLifeService');
const AIPatternService = require('./services/aiPatternService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Game instances storage
const gameInstances = new Map();
const aiService = new AIPatternService();

// FIXED: Use environment variable for JWT secret with fallback validation
const JWT_SECRET = process.env.JWT_SECRET || 'game-of-life-secret-key-for-development';

if (!process.env.JWT_SECRET) {
    console.warn('Warning: Using default JWT secret. Set JWT_SECRET environment variable for production!');
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Authentication endpoints (fixed from previous bugs)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Username and password are required and must be strings' });
    }
    
    const sanitizedUsername = username.trim();
    if (sanitizedUsername.length === 0 || sanitizedUsername.length > 50) {
        return res.status(400).json({ error: 'Username must be between 1 and 50 characters' });
    }
    
    try {
        const user = await getUserByUsername(sanitizedUsername);
        
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ 
                token, 
                user: { id: user.id, username: user.username, email: user.email },
                message: 'Welcome to Conway\'s Game of Life with AI!'
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// FIXED: Added authentication check to profile endpoint
app.get('/profile/:id', authenticateToken, (req, res) => {
    const userId = req.params.id;
    const requestingUserId = req.user.userId;
    
    if (parseInt(userId) !== requestingUserId) {
        return res.status(403).json({ error: 'Access denied: Can only access your own profile' });
    }
    
    try {
        const user = getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Game of Life API endpoints
app.post('/api/game/create', (req, res) => {
    const { width = 50, height = 50, gameId } = req.body;
    
    if (width < 10 || width > 200 || height < 10 || height > 200) {
        return res.status(400).json({ error: 'Grid dimensions must be between 10 and 200' });
    }
    
    const finalGameId = gameId || `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const game = new GameOfLifeService(width, height);
    gameInstances.set(finalGameId, game);
    
    res.json({
        gameId: finalGameId,
        state: game.getGameState(),
        message: 'Game created successfully'
    });
});

app.get('/api/game/:gameId/state', (req, res) => {
    const { gameId } = req.params;
    const game = gameInstances.get(gameId);
    
    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json(game.getGameState());
});

app.post('/api/game/:gameId/cell', (req, res) => {
    const { gameId } = req.params;
    const { x, y, alive } = req.body;
    const game = gameInstances.get(gameId);
    
    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }
    
    if (typeof x !== 'number' || typeof y !== 'number' || typeof alive !== 'boolean') {
        return res.status(400).json({ error: 'Invalid cell parameters' });
    }
    
    game.setCell(x, y, alive);
    
    // Emit update to all connected clients
    io.emit('gameUpdate', { gameId, state: game.getGameState() });
    
    res.json({ success: true, state: game.getGameState() });
});

app.post('/api/game/:gameId/next', (req, res) => {
    const { gameId } = req.params;
    const game = gameInstances.get(gameId);
    
    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }
    
    const newState = game.nextGeneration();
    
    // Emit update to all connected clients
    io.emit('gameUpdate', { gameId, state: newState });
    
    res.json(newState);
});

app.post('/api/game/:gameId/clear', (req, res) => {
    const { gameId } = req.params;
    const game = gameInstances.get(gameId);
    
    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }
    
    game.clear();
    const newState = game.getGameState();
    
    // Emit update to all connected clients
    io.emit('gameUpdate', { gameId, state: newState });
    
    res.json(newState);
});

app.post('/api/game/:gameId/pattern', (req, res) => {
    const { gameId } = req.params;
    const { patternName, x, y, density } = req.body;
    const game = gameInstances.get(gameId);
    
    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }
    
    try {
        if (patternName === 'random') {
            game.generateRandomPattern(density || 0.3);
        } else {
            const success = game.generateKnownPattern(patternName, x || 25, y || 25);
            if (!success) {
                return res.status(400).json({ error: 'Unknown pattern name' });
            }
        }
        
        const newState = game.getGameState();
        
        // Emit update to all connected clients
        io.emit('gameUpdate', { gameId, state: newState });
        
        res.json(newState);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate pattern' });
    }
});

app.get('/api/game/:gameId/patterns', (req, res) => {
    const { gameId } = req.params;
    const game = gameInstances.get(gameId);
    
    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json({
        knownPatterns: game.getKnownPatternNames(),
        detectedPatterns: Array.from(game.patterns.keys())
    });
});

// AI Analysis endpoints
app.post('/api/ai/analyze', (req, res) => {
    const { grid } = req.body;
    
    if (!Array.isArray(grid) || !Array.isArray(grid[0])) {
        return res.status(400).json({ error: 'Invalid grid format' });
    }
    
    try {
        const analysis = aiService.analyzePatternComplexity(grid);
        res.json(analysis);
    } catch (error) {
        console.error('AI Analysis error:', error);
        res.status(500).json({ error: 'Analysis failed' });
    }
});

app.post('/api/ai/predict', (req, res) => {
    const { grid, generations = 5 } = req.body;
    
    if (!Array.isArray(grid) || !Array.isArray(grid[0])) {
        return res.status(400).json({ error: 'Invalid grid format' });
    }
    
    if (generations < 1 || generations > 20) {
        return res.status(400).json({ error: 'Generations must be between 1 and 20' });
    }
    
    try {
        const prediction = aiService.predictEvolution(grid, generations);
        res.json(prediction);
    } catch (error) {
        console.error('AI Prediction error:', error);
        res.status(500).json({ error: 'Prediction failed' });
    }
});

app.get('/api/ai/suggestions/:type', (req, res) => {
    const { type } = req.params;
    
    try {
        const suggestion = aiService.generateOptimalConfiguration(type);
        res.json(suggestion);
    } catch (error) {
        console.error('AI Suggestion error:', error);
        res.status(500).json({ error: 'Suggestion generation failed' });
    }
});

// Legacy data processing endpoint (kept for compatibility)
app.post('/process-data', async (req, res) => {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data)) {
        return res.status(400).json({ error: 'Data must be a non-empty array' });
    }
    
    if (data.length > 10000) {
        return res.status(400).json({ error: 'Data array too large (max 10000 items)' });
    }
    
    try {
        const result = await processLargeDataset(data);
        res.json({ result });
    } catch (error) {
        console.error('Data processing error:', error);
        res.status(500).json({ error: 'Processing failed' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        activeGames: gameInstances.size,
        service: 'Game of Life with AI'
    });
});

// Main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('joinGame', (gameId) => {
        socket.join(gameId);
        console.log(`Client ${socket.id} joined game ${gameId}`);
    });
    
    socket.on('leaveGame', (gameId) => {
        socket.leave(gameId);
        console.log(`Client ${socket.id} left game ${gameId}`);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Cleanup old games periodically
setInterval(() => {
    const maxAge = 1000 * 60 * 60; // 1 hour
    const now = Date.now();
    
    for (const [gameId, game] of gameInstances.entries()) {
        // Remove games that haven't been updated in a while
        if (now - game.lastUpdate > maxAge) {
            gameInstances.delete(gameId);
            console.log(`Cleaned up old game: ${gameId}`);
        }
    }
}, 1000 * 60 * 15); // Run every 15 minutes

server.listen(PORT, () => {
    console.log(`🎮 Conway's Game of Life with AI Server running on port ${PORT}`);
    console.log(`🌐 Visit http://localhost:${PORT} to play!`);
    console.log(`🤖 AI-powered pattern analysis and prediction available`);
});

module.exports = app;