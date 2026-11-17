const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    chatbotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chatbot',
      required: true,
      index: true
    },
    sender: {
      type: String,
      enum: ['customer', 'assistant'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    sources: [
      {
        documentName: String,
        chunkIndex: Number,
        similarityScore: Number,
        preview: String
      }
    ]
  },
  {
    timestamps: true
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
