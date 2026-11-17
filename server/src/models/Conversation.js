const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    chatbotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chatbot',
      required: true,
      index: true
    },
    visitorId: {
      type: String,
      required: true,
      index: true
    },
    messagesCount: {
      type: Number,
      default: 0
    },
    lastMessage: {
      type: String,
      default: ''
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ chatbotId: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
