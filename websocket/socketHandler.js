const db = require('../db/database');

let connectedUsers = new Map();

function initializeSocketIO(io) {
    io.on('connection', (socket) => {
        socket.on('register', (userData) => {
            const { userId, userType } = userData;
            connectedUsers.set(socket.id, { userId, userType, socketId: socket.id });
            socket.join(`${userType}_${userId}`);
        });

        socket.on('sendNotification', async (data) => {
            try {
                const { receiverId, receiverType, message } = data;
                
                await saveNotificationToDB(receiverId, receiverType, message);
                
                socket.to(`${receiverType}_${receiverId}`).emit('newNotification', {
                    message: message,
                    timestamp: new Date(),
                    type: 'project_application'
                });

            } catch (error) {
                console.error('Napaka pri pošiljanju obvestila:', error);
            }
        });

        socket.on('disconnect', () => {
            connectedUsers.delete(socket.id);
        });
    });
}

async function saveNotificationToDB(userId, userType, message) {
    return new Promise((resolve, reject) => {
        
        const isValidUserType = userType === 'prostovoljec' || userType === 'drustvo';
        
        const columnName = userType === 'prostovoljec' ? 'TK_Prostovoljec' : 'TK_Drustvo';
        
        const query = `
            INSERT INTO Obvestila (
                ${columnName}, 
                sporocilo,
                tip_uporabnika
            ) VALUES (?, ?, ?)
        `;
        
        
        db.query(query, [userId, message, userType], (err, result) => {
            if (err) {
                console.error('Error message:', err.message);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

module.exports = { initializeSocketIO, saveNotificationToDB };