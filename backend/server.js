// server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chats.js';
import messageRoutes from './routes/messages.js';
import User from './models/user.js';

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// REST routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

// userId -> [socketIds]
const onlineUsers = new Map();
// socketId -> userId
const socketToUser = new Map();

io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

  // frontend emits: socket.emit("setup", user._id)
  socket.on('setup', async (userId) => {
    if (!userId) return;

    // map socket -> user
    socketToUser.set(socket.id, userId);

    const sockets = onlineUsers.get(userId) || [];
    sockets.push(socket.id);
    onlineUsers.set(userId, sockets);

    socket.join(userId.toString());
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));

    // mark user as recently active
    try {
      await User.findByIdAndUpdate(userId, {
        lastSeen: new Date(),
      });
    } catch (e) {
      console.error('Error setting lastSeen on setup:', e);
    }
  });

  socket.on('joinChat', (chatId) => {
    if (!chatId) return;
    socket.join(chatId.toString());
  });

  socket.on('typing', ({ chatId, typing }) => {
    if (!chatId) return;
    socket.to(chatId.toString()).emit('typing', { chatId, typing });
  });

  socket.on('newMessage', (message) => {
    if (message && message.chat && message.chat.participants) {
      const participants = message.chat.participants;
      participants.forEach((user) => {
        const id = user._id ? user._id.toString() : user.toString();
        io.to(id).emit('messageReceived', message);
      });
    } else if (message && message.chatId) {
      io.to(message.chatId.toString()).emit('messageReceived', message);
    }
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected', socket.id);

    const userId = socketToUser.get(socket.id);
    if (userId) {
      socketToUser.delete(socket.id);

      const sockets = onlineUsers.get(userId) || [];
      const filtered = sockets.filter((sid) => sid !== socket.id);

      if (filtered.length === 0) {
        // user fully offline
        onlineUsers.delete(userId);

        try {
          await User.findByIdAndUpdate(userId, {
            lastSeen: new Date(),
          });
        } catch (e) {
          console.error('Error setting lastSeen on disconnect:', e);
        }
      } else {
        onlineUsers.set(userId, filtered);
      }
    }

    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
