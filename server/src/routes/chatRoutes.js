const express = require('express');
const router = express.Router();
const {
  askChatbot,
  getConversations,
  getConversationMessages,
  deleteConversation
} = require('../controllers/chatController');
const chatRateLimiter = require('../middleware/chatRateLimiter');
const { protect } = require('../middleware/auth');

// Public customer query endpoint (rate limited)
router.post('/:chatbotId', chatRateLimiter, askChatbot);

// Protected endpoints for business owner to review conversation history
router.get('/:chatbotId/conversations', protect, getConversations);
router.get('/:chatbotId/conversations/:conversationId', protect, getConversationMessages);
router.delete('/:chatbotId/conversations/:conversationId', protect, deleteConversation);

module.exports = router;
