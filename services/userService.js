const bcrypt = require('bcrypt');
const crypto = require('crypto');

// FIX: Implement proper cache with size limits and TTL
class UserCache {
    constructor(maxSize = 1000, ttlMs = 3600000) { // 1 hour TTL by default
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }
    
    set(key, value) {
        // Remove oldest entry if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        // Check if item has expired
        if (Date.now() - item.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    delete(key) {
        return this.cache.delete(key);
    }
    
    clear() {
        this.cache.clear();
    }
    
    size() {
        return this.cache.size;
    }
}

class UserService {
    constructor() {
        // FIX: Use environment variable for salt rounds with fallback
        this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
        this.userCache = new UserCache();
        
        // Periodically clean up expired cache entries
        this.cacheCleanupInterval = setInterval(() => {
            this.cleanupCache();
        }, 300000); // Every 5 minutes
    }
    
    cleanupCache() {
        const now = Date.now();
        for (const [key, item] of this.userCache.cache) {
            if (now - item.timestamp > this.userCache.ttlMs) {
                this.userCache.delete(key);
            }
        }
    }
    
    // FIX: Add comprehensive input validation and error handling
    async createUser(username, password) {
        // Input validation
        if (!username || typeof username !== 'string') {
            throw new Error('Username is required and must be a string');
        }
        
        if (!password || typeof password !== 'string') {
            throw new Error('Password is required and must be a string');
        }
        
        const trimmedUsername = username.trim();
        if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
            throw new Error('Username must be between 3 and 50 characters');
        }
        
        if (password.length < 6 || password.length > 100) {
            throw new Error('Password must be between 6 and 100 characters');
        }
        
        // Check username format (alphanumeric and underscores only)
        if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
            throw new Error('Username can only contain letters, numbers, and underscores');
        }
        
        try {
            const hashedPassword = await bcrypt.hash(password, this.saltRounds);
            
            const user = {
                id: crypto.randomUUID(), // FIX: Use proper UUID instead of timestamp
                username: trimmedUsername,
                password: hashedPassword,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Store in cache with proper limits
            this.userCache.set(user.id, user);
            
            // Return user without password
            return this.sanitizeUser(user);
        } catch (error) {
            console.error('Error creating user:', error);
            throw new Error('Failed to create user');
        }
    }
    
    // FIX: Never expose sensitive information
    getUser(userId) {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Valid user ID is required');
        }
        
        const user = this.userCache.get(userId);
        if (!user) {
            return null;
        }
        
        // Always return sanitized user data
        return this.sanitizeUser(user);
    }
    
    // FIX: Add pagination and async operation
    async getAllUsers(page = 1, limit = 50) {
        if (page < 1 || limit < 1 || limit > 100) {
            throw new Error('Invalid pagination parameters');
        }
        
        const allUsers = Array.from(this.userCache.cache.values())
            .map(item => item.value)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = allUsers.slice(startIndex, endIndex);
        
        return {
            users: paginatedUsers.map(user => this.sanitizeUser(user)),
            pagination: {
                page,
                limit,
                total: allUsers.length,
                totalPages: Math.ceil(allUsers.length / limit)
            }
        };
    }
    
    // FIX: Add proper validation and return confirmation
    deleteUser(userId) {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Valid user ID is required');
        }
        
        const user = this.userCache.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        const deleted = this.userCache.delete(userId);
        return {
            success: deleted,
            deletedUserId: userId,
            message: deleted ? 'User deleted successfully' : 'Failed to delete user'
        };
    }
    
    // FIX: Prevent race conditions with proper validation
    async updateUser(userId, updates) {
        if (!userId || typeof userId !== 'string') {
            throw new Error('Valid user ID is required');
        }
        
        if (!updates || typeof updates !== 'object') {
            throw new Error('Updates must be an object');
        }
        
        const user = this.userCache.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Create a copy to avoid mutation
        const updatedUser = { ...user };
        
        // Validate and apply updates
        const allowedUpdates = ['username'];
        const updateKeys = Object.keys(updates);
        
        for (const key of updateKeys) {
            if (!allowedUpdates.includes(key)) {
                throw new Error(`Update of field '${key}' is not allowed`);
            }
        }
        
        // Validate username if being updated
        if (updates.username) {
            const trimmedUsername = updates.username.trim();
            if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
                throw new Error('Username must be between 3 and 50 characters');
            }
            if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
                throw new Error('Username can only contain letters, numbers, and underscores');
            }
            updatedUser.username = trimmedUsername;
        }
        
        // Update timestamp
        updatedUser.updatedAt = new Date().toISOString();
        
        // Save updated user
        this.userCache.set(userId, updatedUser);
        
        return this.sanitizeUser(updatedUser);
    }
    
    // Helper method to remove sensitive data
    sanitizeUser(user) {
        if (!user) return null;
        
        const { password, ...sanitized } = user;
        return sanitized;
    }
    
    // Method to change password
    async changePassword(userId, currentPassword, newPassword) {
        if (!userId || !currentPassword || !newPassword) {
            throw new Error('User ID, current password, and new password are required');
        }
        
        const user = this.userCache.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }
        
        // Validate new password
        if (newPassword.length < 6 || newPassword.length > 100) {
            throw new Error('New password must be between 6 and 100 characters');
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
        
        // Update user
        const updatedUser = {
            ...user,
            password: hashedPassword,
            updatedAt: new Date().toISOString()
        };
        
        this.userCache.set(userId, updatedUser);
        
        return { success: true, message: 'Password changed successfully' };
    }
    
    // Cleanup method
    destroy() {
        if (this.cacheCleanupInterval) {
            clearInterval(this.cacheCleanupInterval);
        }
        this.userCache.clear();
    }
}

// FIX: Export class instead of instance for better testing and flexibility
module.exports = UserService;