const bcrypt = require('bcrypt');

// Mock database - in real app would be a proper database
let users = [
    { id: 1, username: 'john', password: '$2b$10$abcdefghijklmnopqrstuvwxyz', email: 'john@example.com' },
    { id: 2, username: 'jane', password: '$2b$10$abcdefghijklmnopqrstuvwxyz', email: 'jane@example.com' }
];

// BUG 4: Logic error - function name doesn't match what it does
function getUserById(username) {
    // BUG 5: Returns first user instead of matching user when username is undefined
    if (!username) {
        return users[0];
    }
    
    return users.find(user => user.username === username);
}

function createUser(userData) {
    const { username, password, email } = userData;
    
    // BUG 6: No validation for duplicate usernames
    const newUser = {
        id: users.length + 1,
        username,
        password: bcrypt.hashSync(password, 10),
        email
    };
    
    users.push(newUser);
    return newUser;
}

function getAllUsers() {
    // BUG 7: Returns sensitive data (passwords) to client
    return users;
}

function updateUser(userId, updates) {
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
        return null;
    }
    
    // BUG 8: No validation of updates - could overwrite critical fields
    users[userIndex] = { ...users[userIndex], ...updates };
    return users[userIndex];
}

function deleteUser(userId) {
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
        return false;
    }
    
    users.splice(userIndex, 1);
    return true;
}

module.exports = {
    getUserById,
    createUser,
    getAllUsers,
    updateUser,
    deleteUser
};