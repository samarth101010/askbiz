const mongoose = require('mongoose');
const Chatbot = require('../models/Chatbot');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const { chunkText } = require('../utils/textChunker');
const { batchEmbedChunks } = require('../services/geminiService');

// Helper to extract text from PDF buffer using unpdf with pdf-parse fallback
async function extractTextFromPDF(buffer) {
  try {
    const { extractText } = await import('unpdf');
    const result = await extractText(new Uint8Array(buffer));
    const text = Array.isArray(result.text) ? result.text.join('\n') : (result.text || '');
    if (text.trim().length > 0) {
      return text;
    }
  } catch (err) {
    console.warn('[PDF Parser] unpdf extraction error, trying fallback:', err.message);
  }

  // Fallback to pdf-parse
  try {
    const pdf = require('pdf-parse');
    const data = await pdf(buffer);
    return data.text || '';
  } catch (err) {
    throw new Error(`Could not parse PDF text: ${err.message}`);
  }
}

// Helper to verify that the logged-in user owns the chatbot
const verifyChatbotOwnership = async (chatbotId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(chatbotId)) {
    const error = new Error('Invalid Chatbot ID format');
    error.statusCode = 400;
    throw error;
  }

  const chatbot = await Chatbot.findOne({ _id: chatbotId, userId });
  if (!chatbot) {
    const error = new Error('Chatbot not found or you do not have permission to modify it.');
    error.statusCode = 404;
    throw error;
  }
  return chatbot;
};

// @desc    Upload and ingest PDF document into RAG Knowledge Base
// @route   POST /api/knowledge/:chatbotId/upload-pdf
// @access  Private
exports.uploadPDF = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    await verifyChatbotOwnership(chatbotId, req.user.id);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a PDF file to upload.'
      });
    }

    const documentName = req.file.originalname || `document_${Date.now()}.pdf`;

    // 1. Extract text from PDF buffer
    let rawText = '';
    try {
      rawText = await extractTextFromPDF(req.file.buffer);
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        message: `Failed to extract text from PDF: ${parseErr.message}`
      });
    }

    if (!rawText.trim() || rawText.trim().length < 15) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded PDF contains no readable text. It may be a scanned image or empty document.'
      });
    }

    // 2. Split extracted text into ~500 character semantic chunks with overlap
    const chunks = chunkText(rawText, 500, 100);

    if (chunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not generate meaningful chunks from this document.'
      });
    }

    console.log(`[RAG Ingestion] Document "${documentName}": Extracted ${rawText.length} chars into ${chunks.length} chunks.`);

    // 3. Generate Gemini vector embeddings for each chunk
    const embeddings = await batchEmbedChunks(chunks);

    // 4. Clean up any existing chunks for the same document name to prevent duplicate bloating
    await KnowledgeChunk.deleteMany({ chatbotId, documentName });

    // 5. Bulk insert knowledge chunks into MongoDB
    const chunkDocuments = chunks.map((chunkText, index) => ({
      chatbotId,
      documentName,
      sourceType: 'pdf',
      chunkIndex: index,
      text: chunkText,
      embedding: embeddings[index]
    }));

    await KnowledgeChunk.insertMany(chunkDocuments);

    res.status(201).json({
      success: true,
      message: `Document "${documentName}" ingested successfully! Created ${chunks.length} vectorized chunks.`,
      documentName,
      sourceType: 'pdf',
      chunksCount: chunks.length,
      totalCharacters: rawText.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ingest raw text or FAQ content directly
// @route   POST /api/knowledge/:chatbotId/upload-text
// @access  Private
exports.uploadText = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    await verifyChatbotOwnership(chatbotId, req.user.id);

    const { title, text } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a title for this text document (e.g. "Store Policies & FAQs").'
      });
    }

    if (!text || text.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Please provide text content of at least 20 characters.'
      });
    }

    const documentName = title.trim();

    // 1. Chunk text
    const chunks = chunkText(text.trim(), 500, 100);

    // 2. Generate embeddings
    const embeddings = await batchEmbedChunks(chunks);

    // 3. Remove existing document with same title if present
    await KnowledgeChunk.deleteMany({ chatbotId, documentName });

    // 4. Store in MongoDB
    const chunkDocuments = chunks.map((chunkText, index) => ({
      chatbotId,
      documentName,
      sourceType: 'text',
      chunkIndex: index,
      text: chunkText,
      embedding: embeddings[index]
    }));

    await KnowledgeChunk.insertMany(chunkDocuments);

    res.status(201).json({
      success: true,
      message: `Text knowledge "${documentName}" ingested successfully! Created ${chunks.length} vectorized chunks.`,
      documentName,
      sourceType: 'text',
      chunksCount: chunks.length,
      totalCharacters: text.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all documents and knowledge stats for a chatbot
// @route   GET /api/knowledge/:chatbotId
// @access  Private
exports.getKnowledgeSummary = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    await verifyChatbotOwnership(chatbotId, req.user.id);

    const objectId = new mongoose.Types.ObjectId(chatbotId);

    // Aggregate by documentName
    const documents = await KnowledgeChunk.aggregate([
      { $match: { chatbotId: objectId } },
      {
        $group: {
          _id: '$documentName',
          documentName: { $first: '$documentName' },
          sourceType: { $first: '$sourceType' },
          chunkCount: { $sum: 1 },
          firstUploaded: { $min: '$createdAt' },
          sampleChunk: { $first: '$text' }
        }
      },
      { $sort: { firstUploaded: -1 } }
    ]);

    const totalChunks = documents.reduce((acc, doc) => acc + doc.chunkCount, 0);

    res.status(200).json({
      success: true,
      totalDocuments: documents.length,
      totalChunks,
      documents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed chunks for a document
// @route   GET /api/knowledge/:chatbotId/chunks
// @access  Private
exports.getChunks = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    const { documentName } = req.query;
    await verifyChatbotOwnership(chatbotId, req.user.id);

    const filter = { chatbotId };
    if (documentName) {
      filter.documentName = documentName;
    }

    const chunks = await KnowledgeChunk.find(filter)
      .select('documentName sourceType chunkIndex text createdAt')
      .sort({ chunkIndex: 1 });

    res.status(200).json({
      success: true,
      count: chunks.length,
      chunks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete all chunks for a specific document
// @route   DELETE /api/knowledge/:chatbotId/document
// @access  Private
exports.deleteDocument = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    const { documentName } = req.body;
    await verifyChatbotOwnership(chatbotId, req.user.id);

    if (!documentName) {
      return res.status(400).json({
        success: false,
        message: 'Please specify the documentName to delete.'
      });
    }

    const result = await KnowledgeChunk.deleteMany({ chatbotId, documentName });

    res.status(200).json({
      success: true,
      message: `Document "${documentName}" and its ${result.deletedCount} chunks were deleted.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};
