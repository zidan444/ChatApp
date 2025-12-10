// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import chatRoutes from "./routes/chats.js";
import messageRoutes from "./routes/messages.js";
import User from "./models/user.js";

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = process.env.CLIENT_URL.split(",");

app.use(
  cors({
    origin: function(origin, callback){
      // allow requests with no origin (Postman, curl)
      if(!origin) return callback(null, true);
      if(allowedOrigins.indexOf(origin) === -1){
        return callback(new Error("Not allowed "), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

// REST routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

app.get("/debug/headers", (req, res) => {
  res.json({
    authorization: req.headers.authorization || null,
    headers: req.headers,
  })
})

// userId -> [socketIds]
const onlineUsers = new Map();
// socketId -> userId
const socketToUser = new Map();

io.on("connection", (socket) => {
  const { token } = socket.handshake.auth || {};
  let authUserId = null;
  try {
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      authUserId = decoded.id?.toString();
      socket.data.userId = authUserId;
    }
  } catch (e) {
    socket.disconnect(true);
    return;
  }

  socket.on("setup", async () => {
    const userId = authUserId;
    if (!userId) return;

    socketToUser.set(socket.id, userId);

    const sockets = onlineUsers.get(userId) || [];
    sockets.push(socket.id);
    onlineUsers.set(userId, sockets);

    socket.join(userId.toString());
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));

    try {
      await User.findByIdAndUpdate(userId, {
        lastSeen: new Date(),
      });
    } catch (e) {
    }
  });

  socket.on("joinChat", (chatId) => {
    if (!chatId) return;
    socket.join(chatId.toString());
  });

  socket.on("typing", ({ chatId, typing }) => {
    if (!chatId) return;
    socket.to(chatId.toString()).emit("typing", { chatId, typing });
  });

  socket.on("newMessage", (message) => {
    if (message && message.chat && message.chat.participants) {
      const participants = message.chat.participants;
      participants.forEach((user) => {
        const id = user._id ? user._id.toString() : user.toString();
        io.to(id).emit("messageReceived", message);
      });
    } else if (message && message.chatId) {
      io.to(message.chatId.toString()).emit("messageReceived", message);
    }
  });

  socket.on("disconnect", async () => {
    const userId = socket.data.userId || socketToUser.get(socket.id);
    if (userId) {
      socketToUser.delete(socket.id);
      const sockets = onlineUsers.get(userId) || [];
      const filtered = sockets.filter((sid) => sid !== socket.id);
      if (filtered.length === 0) {
        onlineUsers.delete(userId);
        try {
          await User.findByIdAndUpdate(userId, {
            lastSeen: new Date(),
          });
        } catch (e) {
        }
      } else {
        onlineUsers.set(userId, filtered);
      }
    }
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
