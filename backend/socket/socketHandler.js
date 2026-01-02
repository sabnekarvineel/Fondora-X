import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const onlineUsers = new Map();
let io;

export const setupSocketIO = (ioInstance) => {
  // Store the io instance in the module
  io = ioInstance;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    socket.join(socket.userId);
    onlineUsers.set(socket.userId, socket.id);
    io.emit('userOnline', socket.userId);

    socket.on('sendMessage', (message) => {
      try {
        const receiverId = message.receiver._id || message.receiver;
        const receiverSocketId = onlineUsers.get(receiverId);
        
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveMessage', message);
          console.log(`Message sent from ${socket.userId} to ${receiverId}`);
        } else {
          console.log(`Receiver ${receiverId} not online, message saved to DB`);
        }
      } catch (error) {
        console.error('Error in sendMessage socket handler:', error.message);
      }
    });

    socket.on('typing', ({ conversationId, receiverId }) => {
      try {
        const receiverSocketId = onlineUsers.get(receiverId);
        
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('userTyping', {
            conversationId,
            userId: socket.userId,
          });
        }
      } catch (error) {
        console.error('Error in typing event:', error.message);
      }
    });

    socket.on('stopTyping', ({ conversationId, receiverId }) => {
      try {
        const receiverSocketId = onlineUsers.get(receiverId);
        
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('userStoppedTyping', {
            conversationId,
            userId: socket.userId,
          });
        }
      } catch (error) {
        console.error('Error in stopTyping event:', error.message);
      }
    });

    socket.on('messageSeen', ({ messageId, senderId }) => {
      try {
        const senderSocketId = onlineUsers.get(senderId);
        
        if (senderSocketId) {
          io.to(senderSocketId).emit('messageMarkedAsSeen', messageId);
        }
      } catch (error) {
        console.error('Error in messageSeen event:', error.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      onlineUsers.delete(socket.userId);
      io.emit('userOffline', socket.userId);
    });
  });

  return io;
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
