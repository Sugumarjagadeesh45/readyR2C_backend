const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const UserData = require('../models/UserData');
const User = require('../models/userModel');
const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');
const Friendship = require('../models/Friendship');

const onlineUsers = new Map();

const initSocket = (server) => {
  const io = socketio(server, {
    cors: {
      origin: '*',
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id);
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log('a user connected', socket.user.userId);
    onlineUsers.set(socket.user.id, socket.id);

    try {
      let userData = await UserData.findOne({ userId: socket.user.id });
      if (userData) {
        userData.isOnline = true;
        if (!userData.location || !userData.location.type || !userData.location.coordinates) {
          userData.location = {
            type: 'Point',
            coordinates: [0, 0]
          };
        }
        await userData.save();
      } else {
        userData = new UserData({ 
          userId: socket.user.id, 
          isOnline: true,
          location: {
            type: 'Point',
            coordinates: [0, 0]
          }
        });
        await userData.save();
      }

      const friendships = await Friendship.find({
        $or: [{ user1: socket.user.id }, { user2: socket.user.id }],
        status: 'accepted',
      });

      const friendIds = friendships.map((friendship) => {
        return friendship.user1.toString() === socket.user.id.toString()
          ? friendship.user2.toString()
          : friendship.user1.toString();
      });

      friendIds.forEach((friendId) => {
        const friendSocketId = onlineUsers.get(friendId);
        if (friendSocketId) {
          io.to(friendSocketId).emit('userStatus', {
            userId: socket.user.id,
            isOnline: true,
          });
        }
      });
    } catch (error) {
      console.error('Error on user connection:', error);
    }

    socket.on('sendMessage', async (data) => {
      const { recipientId, text, attachment } = data;
      const senderId = socket.user.id;

      try {
        let conversation = await Conversation.findOne({
          participants: { $all: [senderId, recipientId] },
        });

        if (!conversation) {
          conversation = new Conversation({
            participants: [senderId, recipientId],
          });
          await conversation.save();
        }

        const newMessage = new Message({
          conversationId: conversation._id,
          sender: senderId,
          recipient: recipientId,
          text: text,
          attachment: attachment,
        });

        await newMessage.save();

        const recipientSocketId = onlineUsers.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('receiveMessage', newMessage);
        }

        // also send to sender for confirmation
        socket.emit('receiveMessage', newMessage);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    socket.on('typing', (data) => {
      const { recipientId } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typingStatus', {
          senderId: socket.user.id,
          isTyping: true,
        });
      }
    });

    socket.on('stopTyping', (data) => {
      const { recipientId } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typingStatus', {
          senderId: socket.user.id,
          isTyping: false,
        });
      }
    });

    socket.on('disconnect', async () => {
      console.log('user disconnected', socket.user.userId);
      onlineUsers.delete(socket.user.id);

      try {
        const userData = await UserData.findOne({ userId: socket.user.id });
        if (userData) {
          userData.isOnline = false;
          userData.lastActive = new Date();
          if (!userData.location || !userData.location.type || !userData.location.coordinates) {
            userData.location = {
              type: 'Point',
              coordinates: [0, 0]
            };
          }
          await userData.save();
        }

        const friendships = await Friendship.find({
          $or: [{ user1: socket.user.id }, { user2: socket.user.id }],
          status: 'accepted',
        });

        const friendIds = friendships.map((friendship) => {
          return friendship.user1.toString() === socket.user.id.toString()
            ? friendship.user2.toString()
            : friendship.user1.toString();
        });

        friendIds.forEach((friendId) => {
          const friendSocketId = onlineUsers.get(friendId);
          if (friendSocketId) {
            io.to(friendSocketId).emit('userStatus', {
              userId: socket.user.id,
              isOnline: false,
              lastSeen: userData.lastActive,
            });
          }
        });
      } catch (error) {
        console.error('Error on user disconnect:', error);
      }
    });
  });
};

module.exports = { initSocket };
