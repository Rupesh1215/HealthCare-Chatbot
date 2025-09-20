const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');

router.get('/history', auth, chatController.getChatHistory);
// Add other chat routes as needed

module.exports = router;