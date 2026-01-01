

require('dotenv').config();

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userDataRoutes = require('./routes/userDataRoutes');

dotenv.config();

console.log('MONGODB_URL:', process.env.MONGODB_URL);

const http = require('http');
const { initSocket } = require('./services/socket');

const app = express();
const server = http.createServer(app);
initSocket(server);

// ✅ Middleware with increased payload limit and dynamic CORS
app.use(cors({
  // Allow any origin in development to prevent "Network request failed" on devices
  origin: true, 
  credentials: true,
}));

// Increase payload limit to 50MB for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Connect to MongoDB
connectDB();




// Add this after other route imports
const friendsRoutes = require('./routes/friendsRoutes');
const messageRoutes = require('./routes/messageRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const fcmTokenRoutes = require('./routes/fcmTokenRoutes'); // Corrected route

// Add this after other app.use() calls
app.use('/api/friends', friendsRoutes);
app.use('/api', messageRoutes);
app.use('/api', conversationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', fcmTokenRoutes); // Corrected route and path



// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userDataRoutes);

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ 
      success: false, 
      message: 'Image too large. Please use a smaller image.' 
    });
  }
  
  res.status(500).json({ success: false, message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
