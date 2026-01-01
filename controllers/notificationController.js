const fcmService = require('../services/fcmService');
const User = require('../models/userModel');

/**
 * @route   POST /api/admin/notify
 * @desc    Send a notification to a specific user
 * @access  Admin
 */
exports.sendUserNotification = async (req, res) => {
  const { userId, title, body, data } = req.body;

  if (!userId || !title || !body) {
    return res.status(400).json({ message: 'userId, title, and body are required.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const notificationPayload = {
      notification: {
        title,
        body,
      },
      data: {
        type: 'ADMIN_NOTIFICATION',
        ...data,
      },
    };

    await fcmService.sendToUser(userId, notificationPayload);

    res.status(200).json({ success: true, message: 'Notification sent successfully.' });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * @route   POST /api/admin/broadcast
 * @desc    Send a broadcast notification to all users
 * @access  Admin
 */
exports.sendAdminBroadcast = async (req, res) => {
    const { title, body, data } = req.body;

    if (!title || !body) {
        return res.status(400).json({ message: "Title and body are required." });
    }

    try {
        const users = await User.find({}, '_id');
        const userIds = users.map(user => user._id);

        if (userIds.length > 0) {
            const notificationPayload = {
              notification: {
                title,
                body,
              },
              data: {
                type: 'ADMIN_BROADCAST',
                ...data,
              },
            };
            await fcmService.sendToUsers(userIds, notificationPayload);
        }

        res.status(200).json({ message: "Admin notification sent to all users." });
    } catch (error) {
        console.error("Error sending admin broadcast:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
