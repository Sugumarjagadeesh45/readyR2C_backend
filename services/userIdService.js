const User = require('../models/userModel');

class UserIdService {
  // Generate unique user ID in format: R2CYYYYMMDDNNN
  static async generateUserId() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `R2C${dateStr}`;
    
    // Find the highest sequence number for today
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
    
    const lastUser = await User.findOne({
      userId: { $regex: `^${prefix}` },
      createdAt: { $gte: todayStart, $lte: todayEnd }
    }).sort({ createdAt: -1 });
    
    let sequence = 1;
    if (lastUser && lastUser.userId) {
      const lastSequence = parseInt(lastUser.userId.slice(-3), 10);
      sequence = lastSequence + 1;
    }
    
    const sequenceStr = sequence.toString().padStart(3, '0');
    return `${prefix}${sequenceStr}`;
  }

  // Validate custom user ID
  static validateCustomUserId(userId) {
    if (!userId || typeof userId !== 'string') return false;
    
    // Exactly 6 characters minimum
    if (userId.length < 6) return false;
    
    // No special characters allowed (only alphanumeric)
    if (!/^[a-zA-Z0-9]+$/.test(userId)) return false;
    
    // Must include at least one number
    if (!/\d/.test(userId)) return false;
    
    return true;
  }


  
  // Check if user ID already exists
  static async isUserIdAvailable(userId) {
    if (!userId) return false;
    
    const existingUser = await User.findOne({ 
      userId: userId.toUpperCase().trim() 
    });
    
    return !existingUser;
  }
}

module.exports = UserIdService;