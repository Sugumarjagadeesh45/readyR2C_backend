const FCMToken = require("../models/FCMToken");

exports.registerToken = async (req, res) => {
  const { token } = req.body;
  const userId = req.user._id; // Correctly get userId from authenticated user

  if (!token) {
    return res.status(400).json({ success: false, message: "FCM token is required." });
  }

  try {
    // Use findOneAndUpdate with upsert to create or update the token
    const updatedToken = await FCMToken.findOneAndUpdate(
      { userId }, // Find by userId
      { token, lastUpdated: new Date() }, // Update the token and timestamp
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ 
        success: true,
        message: "FCM token registered successfully.",
        token: updatedToken
    });
  } catch (error) {
    console.error("Error registering FCM token:", error);
    // Check for duplicate key error for the token
    if (error.code === 11000 && error.keyPattern && error.keyPattern.token) {
        return res.status(409).json({ success: false, message: "This FCM token is already registered to another user." });
    }
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
