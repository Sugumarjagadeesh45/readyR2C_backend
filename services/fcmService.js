const admin = require("../config/firebase");
const FCMToken = require("../models/FCMToken");

/**
 * Core function to send FCM messages to a list of tokens.
 * It also handles the removal of invalid tokens from the database.
 *
 * @param {string[]} tokens An array of FCM registration tokens.
 * @param {object} payload The notification payload to send.
 *   - notification: { title: string, body: string }
 *   - data: { [key: string]: string }
 */
const sendNotification = async (tokens, payload) => {
  if (!tokens || tokens.length === 0) {
    return;
  }

  try {
    const response = await admin.messaging().sendToDevice(tokens, payload);

    const tokensToRemove = [];
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        console.error(
          "Failure sending notification to",
          tokens[index],
          error
        );
        // Cleanup the tokens who are not registered anymore.
        if (
          error.code === "messaging/invalid-registration-token" ||
          error.code === "messaging/registration-token-not-registered"
        ) {
          tokensToRemove.push(tokens[index]);
        }
      }
    });

    if (tokensToRemove.length > 0) {
      console.log("Removing invalid tokens:", tokensToRemove);
      await FCMToken.deleteMany({ token: { $in: tokensToRemove } });
    }
  } catch (error) {
    console.error("Error in sendNotification:", error);
  }
};

/**
 * Sends a notification to a single user by their user ID.
 * Fetches all tokens for the user and uses the core sendNotification function.
 *
 * @param {string} userId The ID of the user.
 * @param {object} payload The FCM payload.
 */
const sendToUser = async (userId, payload) => {
  try {
    const userTokens = await FCMToken.find({ userId }).select("token -_id");
    if (userTokens.length > 0) {
      const tokens = userTokens.map((t) => t.token);
      await sendNotification(tokens, payload);
    }
  } catch (error) {
    console.error(`Failed to fetch tokens for user ${userId}:`, error);
  }
};

/**
 * Sends the same notification to multiple users.
 * Optimized to fetch all tokens in a single query.
 *
 * @param {string[]} userIds Array of user IDs.
 * @param {object} payload The FCM payload.
 */
const sendToUsers = async (userIds, payload) => {
  try {
    const userTokens = await FCMToken.find({ userId: { $in: userIds } }).select("token -_id");
    if (userTokens.length > 0) {
      const tokens = userTokens.map((t) => t.token);
      await sendNotification(tokens, payload);
    }
  } catch (error) {
    console.error(`Failed to fetch tokens for multiple users:`, error);
  }
};


// --- Specific Notification Composer Functions ---

/**
 * Composes and sends a notification for a new message.
 * @param {string} recipientId The user ID of the message recipient.
 * @param {object} sender The user object of the sender (must have name and _id).
 * @param {object} message The message object (must have text and _id).
 */
const sendNewMessageNotification = async (recipientId, sender, message) => {
  const payload = {
    notification: {
      title: `New message from ${sender.name || 'a user'}`,
      body: message.text,
    },
    data: {
      type: 'NEW_MESSAGE',
      senderId: sender._id.toString(),
      messageId: message._id.toString(),
    },
  };
  await sendToUser(recipientId, payload);
};

/**
 * Composes and sends a notification for a new friend request.
 * @param {string} recipientId The user ID of the request recipient.
 * @param {object} sender The user object of the sender (must have name and _id).
 */
const sendFriendRequestNotification = async (recipientId, sender) => {
  const payload = {
    notification: {
      title: 'New Friend Request',
      body: `${sender.name || 'Someone'} sent you a friend request.`,
    },
    data: {
      type: 'FRIEND_REQUEST',
      senderId: sender._id.toString(),
    },
  };
  await sendToUser(recipientId, payload);
};

/**
 * Composes and sends a notification for an accepted friend request.
 * @param {string} originalSenderId The user ID of the person who sent the request.
 * @param {object} acceptor The user object of the person who accepted (must have name and _id).
 */
const sendFriendRequestAcceptedNotification = async (originalSenderId, acceptor) => {
    const payload = {
        notification: {
            title: 'Friend Request Accepted',
            body: `${acceptor.name || 'Someone'} accepted your friend request.`,
        },
        data: {
            type: 'FRIEND_REQUEST_ACCEPTED',
            acceptorId: acceptor._id.toString(),
        }
    };
    await sendToUser(originalSenderId, payload);
};

module.exports = {
  sendNotification,
  sendToUser,
  sendToUsers,
  sendNewMessageNotification,
  sendFriendRequestNotification,
  sendFriendRequestAcceptedNotification,
};
