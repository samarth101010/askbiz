const mongoose = require('mongoose');
const Chatbot = require('../models/Chatbot');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { generateEmbedding, generateRAGAnswer } = require('../services/geminiService');
const { findTopSimilarChunks } = require('../utils/cosineSimilarity');

// Helper to verify that the logged-in user owns the chatbot
const verifyChatbotOwnership = async (chatbotId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(chatbotId)) {
    const error = new Error('Invalid Chatbot ID format');
    error.statusCode = 400;
    throw error;
  }

  const chatbot = await Chatbot.findOne({ _id: chatbotId, userId });
  if (!chatbot) {
    const error = new Error('Chatbot not found or you do not have permission to access it.');
    error.statusCode = 404;
    throw error;
  }
  return chatbot;
};

// @desc    Ask a question to the AI chatbot (RAG Pipeline + History Logging)
// @route   POST /api/chat/:chatbotId
// @access  Public (Embeddable widget & Test playground)
exports.askChatbot = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    const { question, conversationId, visitorId } = req.body;

    // 1. Input Validation
    if (!mongoose.Types.ObjectId.isValid(chatbotId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chatbot ID format.'
      });
    }

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid question.'
      });
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Question exceeds maximum limit of 500 characters.'
      });
    }

    // 2. Fetch Chatbot Config & Active Status
    const chatbot = await Chatbot.findById(chatbotId).select('name businessName isActive welcomeMessage');
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found.'
      });
    }

    if (!chatbot.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This chatbot is currently paused or inactive.'
      });
    }

    // 3. Find or Create Conversation Session
    let conversation;
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conversation = await Conversation.findOne({ _id: conversationId, chatbotId });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        chatbotId,
        visitorId: visitorId || `vis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        messagesCount: 0,
        lastMessage: trimmedQuestion
      });
    }

    // 4. Record Customer Message in MongoDB
    await Message.create({
      conversationId: conversation._id,
      chatbotId,
      sender: 'customer',
      text: trimmedQuestion
    });

    // 5. Fetch Knowledge Chunks from MongoDB
    const chunks = await KnowledgeChunk.find({ chatbotId }).select(
      'documentName chunkIndex text embedding'
    );

    let answer = '';
    let sources = [];

    if (chunks.length === 0) {
      answer = `I'm sorry, but ${chatbot.businessName} has not added any documents to my knowledge base yet. Please contact ${chatbot.businessName} directly for assistance.`;
    } else {
      // 6. Generate Embedding for the User Question
      const questionEmbedding = await generateEmbedding(trimmedQuestion);

      // 7. Compute Cosine Similarity & Pick Top 4 Most Relevant Chunks
      const topScoredChunks = findTopSimilarChunks(questionEmbedding, chunks, 4);
      const contextTexts = topScoredChunks.map((item) => item.chunk.text);

      // 8. Generate Grounded Answer with Gemini
      answer = await generateRAGAnswer({
        businessName: chatbot.businessName,
        question: trimmedQuestion,
        contextChunks: contextTexts
      });

      sources = topScoredChunks.map((item) => ({
        documentName: item.chunk.documentName,
        chunkIndex: item.chunk.chunkIndex,
        similarityScore: item.score,
        preview: item.chunk.text.substring(0, 160) + (item.chunk.text.length > 160 ? '...' : '')
      }));
    }

    // 9. Record Assistant Response in MongoDB
    await Message.create({
      conversationId: conversation._id,
      chatbotId,
      sender: 'assistant',
      text: answer,
      sources
    });

    // 10. Update Conversation Metadata
    conversation.messagesCount += 2;
    conversation.lastMessage = answer.substring(0, 140);
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.status(200).json({
      success: true,
      answer,
      sources,
      conversationId: conversation._id
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations for a chatbot (Business Owner History Viewer)
// @route   GET /api/chat/:chatbotId/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    await verifyChatbotOwnership(chatbotId, req.user.id);

    const conversations = await Conversation.find({ chatbotId })
      .sort({ lastMessageAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all messages for a specific conversation session
// @route   GET /api/chat/:chatbotId/conversations/:conversationId
// @access  Private
exports.getConversationMessages = async (req, res, next) => {
  try {
    const { chatbotId, conversationId } = req.params;
    await verifyChatbotOwnership(chatbotId, req.user.id);

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format.'
      });
    }

    const messages = await Message.find({ conversationId, chatbotId })
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a conversation and its messages
// @route   DELETE /api/chat/:chatbotId/conversations/:conversationId
// @access  Private
exports.deleteConversation = async (req, res, next) => {
  try {
    const { chatbotId, conversationId } = req.params;
    await verifyChatbotOwnership(chatbotId, req.user.id);

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format.'
      });
    }

    await Conversation.deleteOne({ _id: conversationId, chatbotId });
    await Message.deleteMany({ conversationId, chatbotId });

    res.status(200).json({
      success: true,
      message: 'Conversation and its messages were deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
