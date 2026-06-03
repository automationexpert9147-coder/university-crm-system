require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const studentRoutes = require('./src/routes/students');
const teacherRoutes = require('./src/routes/teachers');
const adminRoutes = require('./src/routes/admin');
const attendanceRoutes = require('./src/routes/attendance');
const taskRoutes = require('./src/routes/tasks');
const gradeRoutes = require('./src/routes/grades');
const materialRoutes = require('./src/routes/materials');
const notificationRoutes = require('./src/routes/notifications');
const chatRoutes = require('./src/routes/chat');
const aiRoutes = require('./src/routes/ai');
const reportRoutes = require('./src/routes/reports');
const courseRoutes = require('./src/routes/courses');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/courses', courseRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'University CRM API running', db: 'Supabase' })
);

// Socket.io real-time chat
const onlineUsers = new Map();

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

const addOnlineUser = (userId, socketId) => {
  const normalizedUserId = String(userId);

  if (!onlineUsers.has(normalizedUserId)) {
    onlineUsers.set(normalizedUserId, new Set());
  }

  onlineUsers.get(normalizedUserId).add(socketId);
};

const removeSocketFromOnlineUsers = (socketId) => {
  for (const [userId, socketIds] of onlineUsers.entries()) {
    socketIds.delete(socketId);

    if (socketIds.size === 0) {
      onlineUsers.delete(userId);
    }
  }
};

io.on('connection', (socket) => {
  socket.on('user_connected', (userId) => {
    if (!userId) return;

    addOnlineUser(userId, socket.id);
    io.emit('online_users', getOnlineUserIds());
  });

  socket.on('join_room', (roomId) => {
    if (!roomId) return;
    socket.join(roomId);
  });

  socket.on('send_message', (data) => {
    if (!data?.roomId) return;
    io.to(data.roomId).emit('receive_message', data);
  });

  socket.on('typing', (data) => {
    if (!data?.roomId) return;
    socket.to(data.roomId).emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    removeSocketFromOnlineUsers(socket.id);
    io.emit('online_users', getOnlineUserIds());
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`University CRM Server running on port ${PORT} | DB: Supabase`)
);