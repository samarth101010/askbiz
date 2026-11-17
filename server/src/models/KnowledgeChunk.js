const mongoose = require('mongoose');

const knowledgeChunkSchema = new mongoose.Schema(
  {
    chatbotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chatbot',
      required: true,
      index: true
    },
    documentName: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true
    },
    sourceType: {
      type: String,
      enum: ['pdf', 'text'],
      default: 'text'
    },
    chunkIndex: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: [true, 'Chunk text content is required']
    },
    embedding: {
      type: [Number],
      required: [true, 'Vector embedding is required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Embedding must be a non-empty array of numbers'
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast queries by chatbot and document
knowledgeChunkSchema.index({ chatbotId: 1, documentName: 1 });

module.exports = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
