const bcrypt = require('bcrypt');

// Mock database - in real app would be a proper database
let users = [
    { id: 1, username: 'john', password: '$2b$10$abcdefghijklmnopqrstuvwxyz', email: 'john@example.com' },
    { id: 2, username: 'jane', password: '$2b$10$abcdefghijklmnopqrstuvwxyz', email: 'jane@example.com' }
];

// FIXED BUG 4 & 5: Renamed function to match functionality and fixed logic error
function getUserByUsername(username) {
    if (!username || typeof username !== 'string') {
        return null; // Return null instead of first user
    }
    
    return users.find(user => user.username === username.trim());
}

// Keep backward compatibility but mark as deprecated
function getUserById(id) {
    if (!id) {
        return null;
    }
    
    return users.find(user => user.id === parseInt(id));
}

function createUser(userData) {
    const { username, password, email } = userData;
    
    // FIXED BUG 6: Add validation for duplicate usernames and input validation
    if (!username || !password || !email) {
        throw new Error('Username, password, and email are required');
    }
    
    if (typeof username !== 'string' || typeof password !== 'string' || typeof email !== 'string') {
        throw new Error('Username, password, and email must be strings');
    }
    
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
        throw new Error('Username must be between 3 and 50 characters');
    }
    
    // Check for duplicate username
    if (getUserByUsername(trimmedUsername)) {
        throw new Error('Username already exists');
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }
    
    const newUser = {
        id: users.length + 1,
        username: trimmedUsername,
        password: bcrypt.hashSync(password, 12), // Increased salt rounds for better security
        email: email.trim().toLowerCase()
    };
    
    users.push(newUser);
    return { id: newUser.id, username: newUser.username, email: newUser.email }; // Don't return password
}

// FIXED BUG 7: Remove sensitive data (passwords) from response
function getAllUsers() {
    return users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email
        // password field excluded for security
    }));
}

// FIXED BUG 8: Add proper validation for updates
function updateUser(userId, updates) {
    const userIndex = users.findIndex(user => user.id === parseInt(userId));
    
    if (userIndex === -1) {
        return null;
    }
    
    // Validate updates - only allow specific fields to be updated
    const allowedFields = ['email'];
    const validatedUpdates = {};
    
    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
            if (key === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    throw new Error('Invalid email format');
                }
                validatedUpdates[key] = value.trim().toLowerCase();
            } else {
                validatedUpdates[key] = value;
            }
        }
    }
    
    users[userIndex] = { ...users[userIndex], ...validatedUpdates };
    
    // Return user without password
    const { password, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword;
}

function deleteUser(userId) {
    const userIndex = users.findIndex(user => user.id === parseInt(userId));
    
    if (userIndex === -1) {
        return false;
    }
    
    users.splice(userIndex, 1);
    return true;
}

// New function to change password with proper validation
function changePassword(userId, currentPassword, newPassword) {
    const user = users.find(user => user.id === parseInt(userId));
    
    if (!user) {
        return { success: false, error: 'User not found' };
    }
    
    if (!bcrypt.compareSync(currentPassword, user.password)) {
        return { success: false, error: 'Current password is incorrect' };
    }
    
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return { success: false, error: 'New password must be at least 6 characters long' };
    }
    
    user.password = bcrypt.hashSync(newPassword, 12);
    return { success: true };
}

module.exports = {
    getUserById, // Deprecated but kept for compatibility
    getUserByUsername,
    createUser,
    getAllUsers,
    updateUser,
    deleteUser,
    changePassword
};