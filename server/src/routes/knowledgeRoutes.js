const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  uploadPDF,
  uploadText,
  getKnowledgeSummary,
  getChunks,
  deleteDocument
} = require('../controllers/knowledgeController');
const { protect } = require('../middleware/auth');

// Multer in-memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB maximum
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files (.pdf) are supported.'), false);
    }
  }
});

// All knowledge base management routes require JWT authentication
router.use(protect);

router.post('/:chatbotId/upload-pdf', upload.single('file'), uploadPDF);
router.post('/:chatbotId/upload-text', uploadText);
router.get('/:chatbotId', getKnowledgeSummary);
router.get('/:chatbotId/chunks', getChunks);
router.delete('/:chatbotId/document', deleteDocument);

module.exports = router;
