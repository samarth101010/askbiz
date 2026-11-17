const express = require('express');
const router = express.Router();
const {
  createChatbot,
  getChatbots,
  getChatbotById,
  getPublicChatbotConfig,
  updateChatbot,
  deleteChatbot
} = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');

// Public widget config route (no auth needed)
router.get('/:id/public', getPublicChatbotConfig);

// All routes below require JWT authentication
router.use(protect);

router.route('/')
  .get(getChatbots)
  .post(createChatbot);

router.route('/:id')
  .get(getChatbotById)
  .put(updateChatbot)
  .delete(deleteChatbot);

module.exports = router;
