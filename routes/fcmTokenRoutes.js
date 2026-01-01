const express = require("express");
const router = express.Router();
const fcmTokenController = require("../controllers/fcmTokenController");
const auth = require("../middleware/auth");

/**
 * @route   POST /api/notifications/register-token
 * @desc    Register or update an FCM token for a user
 * @access  Private
 */
router.post("/register-token", auth, fcmTokenController.registerToken);

module.exports = router;
