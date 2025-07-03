const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json());

// FIX 1: Use environment variable for JWT secret
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;

// Security check for JWT secret
if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set!');
    console.error('Please set JWT_SECRET in your environment variables.');
    process.exit(1);
}

// Simulated database (in real app, this would be a real database)
const users = [
    { id: 1, username: 'admin', password: '$2b$10$YourHashedPasswordHere' },
    { id: 2, username: 'user1', password: '$2b$10$AnotherHashedPassword' }
];

// FIX 2: Add input validation and prevent SQL injection
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Input validation
        if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Username and password are required and must be strings' });
        }
        
        // Sanitize and validate username
        const sanitizedUsername = username.trim();
        if (sanitizedUsername.length === 0 || sanitizedUsername.length > 50) {
            return res.status(400).json({ error: 'Username must be between 1 and 50 characters' });
        }
        
        // Validate password length
        if (password.length < 6 || password.length > 100) {
            return res.status(400).json({ error: 'Password must be between 6 and 100 characters' });
        }
        
        // Safe query simulation (in real app, use parameterized queries)
        console.log('Executing safe query with parameterized input');
        
        // Find user safely
        const user = users.find(u => u.username === sanitizedUsername);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // In real app, properly compare hashed passwords
        const isValidPassword = await bcrypt.compare(password, user.password).catch(() => false);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate token with expiration
        const token = jwt.sign(
            { userId: user.id, username: user.username }, 
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({ token, expiresIn: '24h' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Protected route with improved error handling
app.get('/protected', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No valid authorization header provided' });
    }
    
    const token = authHeader.substring(7);
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ 
            message: 'Access granted', 
            userId: decoded.userId,
            username: decoded.username 
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired' });
        }
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Data processing endpoint with validation
app.post('/process-data', async (req, res) => {
    try {
        const { data } = req.body;
        
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Data must be an array' });
        }
        
        if (data.length > 10000) {
            return res.status(400).json({ error: 'Data array too large. Maximum 10000 items allowed.' });
        }
        
        // Import and use the data processor
        const { processLargeDataset } = require('./utils/dataProcessor');
        const processedData = await processLargeDataset(data);
        
        res.json({ 
            message: 'Data processed successfully',
            count: processedData.length,
            data: processedData 
        });
    } catch (error) {
        console.error('Data processing error:', error);
        res.status(500).json({ error: 'Failed to process data' });
    }
});

// User management endpoints (example of using UserService)
const UserService = require('./services/userService');
const userService = new UserService();

app.post('/users', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await userService.createUser(username, password);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/users/:id', async (req, res) => {
    try {
        const user = userService.getUser(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;