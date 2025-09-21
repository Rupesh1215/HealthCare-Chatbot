require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const db = require('./config/database');
const chatController = require('./controllers/chatController');
const { processHealthQuery } = require('./services/rapidApiService');
const auth = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/user');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
db.initialize();

// Routes
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);
app.use('/user', userRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // In the socket.io message handler, add language support:
socket.on('user_message', async (data) => {
  console.log('Received message:', data);
  
  // Show typing indicator
  socket.emit('bot_typing');
  
  try {
    // Process with RapidAPI ChatGPT - pass language if needed
    const aiResponse = await processHealthQuery(data.message, data.userId, data.language);
    
    // Save chat to database
    await chatController.saveChat(data.userId, data.message, aiResponse);
    
    // Send response to client
    socket.emit('chat_message', { 
      message: aiResponse
    });
    
  } catch (error) {
    console.error('Error processing message with AI:', error);
    
    const errorResponse = `I apologize, but I'm experiencing technical difficulties. 😔

${error.message}

Please try asking your question again.`;

    await chatController.saveChat(data.userId, data.message, errorResponse);
    
    socket.emit('chat_message', { 
      message: errorResponse
    });
  }
});
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});