

require('dotenv').config();

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userDataRoutes = require('./routes/userDataRoutes');

dotenv.config();

console.log('MONGODB_URL:', process.env.MONGODB_URL);

const app = express();

// ✅ Middleware with increased payload limit
app.use(cors({
  origin: [
    'http://localhost:5000',
    'http://10.0.2.2:5000',
    'http://192.168.93.126:5000'
  ],
  credentials: true,
}));

// Increase payload limit to 50MB for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Connect to MongoDB
connectDB();




// Add this after other route imports
const friendsRoutes = require('./routes/friendsRoutes');

// Add this after other app.use() calls
app.use('/api/friends', friendsRoutes);


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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
