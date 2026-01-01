const mongoose = require('mongoose');
const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');
const User = require('../models/userModel');
const fcmService = require('../services/fcmService');

/**
 * @route   POST /api/chat/send
 * @desc    Send a new chat message to another user
 * @access  Private
 */
exports.sendChatMessage = async (req, res) => {
  const { to, message } = req.body;
  const senderId = req.user._id;

  if (!to || !message) {
    return res.status(400).json({ message: 'Recipient (to) and message are required.' });
  }

  try {
    let recipient;
    if (mongoose.Types.ObjectId.isValid(to)) {
      recipient = await User.findById(to);
    } else {
      recipient = await User.findOne({ userId: to });
    }

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found.' });
    }

    req.body.recipientId = recipient._id;
    req.body.text = message;

    return exports.sendMessage(req, res);
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * @route   POST /api/messages/send
 * @desc    Send a new message to another user
 * @access  Private
 */
exports.sendMessage = async (req, res) => {
  const { recipientId, text, attachment } = req.body;
  const senderId = req.user._id;

  if (!recipientId || (!text && !attachment)) {
    return res.status(400).json({ message: 'Recipient ID and text or attachment are required.' });
  }

  try {
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, recipientId],
      });
      await conversation.save();
    }

    const newMessage = new Message({
      conversationId: conversation._id,
      sender: senderId,
      recipient: recipientId,
      text: text,
      attachment: attachment,
    });
    await newMessage.save();

    const sender = req.user;
    fcmService.sendNewMessageNotification(recipientId, sender, newMessage);

    res.status(201).json({ success: true, message: 'Message sent successfully.', data: newMessage });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


/**
 * @route   GET /api/messages/:otherUserId
 * @desc    Get message history with another user
 * @access  Private
 */
exports.getMessages = async (req, res) => {
    const currentUserId = req.user._id;
    const otherUserId = req.params.otherUserId;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      // It's possible the client is passing a userId string, not an ObjectId
      const otherUser = await User.findOne({ userId: otherUserId });
      if (otherUser) {
        otherUserId = otherUser._id;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid or unknown otherUserId provided.' });
      }
    }

    try {
        const conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, otherUserId] },
        });

        if (!conversation) {
            return res.status(200).json({ success: true, data: [] });
        }

        const messages = await Message.find({ conversationId: conversation._id })
        .sort({ createdAt: 'asc' })
        .populate('sender', 'name profilePicture')
        .populate('recipient', 'name profilePicture');

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}
