const Chatbot = require('../models/Chatbot');

// @desc    Create a new chatbot
// @route   POST /api/chatbots
// @access  Private
exports.createChatbot = async (req, res, next) => {
  try {
    const { name, businessName, welcomeMessage, primaryColor, suggestedQuestions } = req.body;

    if (!name || !businessName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both chatbot name and business name.'
      });
    }

    const chatbot = await Chatbot.create({
      name,
      businessName,
      welcomeMessage: welcomeMessage || undefined,
      primaryColor: primaryColor || undefined,
      suggestedQuestions: Array.isArray(suggestedQuestions) ? suggestedQuestions.filter(q => q && q.trim()) : undefined,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Chatbot created successfully.',
      chatbot
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all chatbots for logged-in user
// @route   GET /api/chatbots
// @access  Private
exports.getChatbots = async (req, res, next) => {
  try {
    const chatbots = await Chatbot.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: chatbots.length,
      chatbots
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single chatbot by ID
// @route   GET /api/chatbots/:id
// @access  Private
exports.getChatbotById = async (req, res, next) => {
  try {
    const chatbot = await Chatbot.findById(req.params.id);

    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found.'
      });
    }

    // Ensure user owns this chatbot
    if (chatbot.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this chatbot.'
      });
    }

    res.status(200).json({
      success: true,
      chatbot
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public chatbot configuration (used by embeddable widget)
// @route   GET /api/chatbots/:id/public
// @access  Public
exports.getPublicChatbotConfig = async (req, res, next) => {
  try {
    const chatbot = await Chatbot.findById(req.params.id).select(
      'name businessName welcomeMessage primaryColor suggestedQuestions isActive'
    );

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

    res.status(200).json({
      success: true,
      chatbot
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update chatbot
// @route   PUT /api/chatbots/:id
// @access  Private
exports.updateChatbot = async (req, res, next) => {
  try {
    let chatbot = await Chatbot.findById(req.params.id);

    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found.'
      });
    }

    // Ensure ownership
    if (chatbot.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this chatbot.'
      });
    }

    const { name, businessName, welcomeMessage, primaryColor, suggestedQuestions, isActive } = req.body;

    if (name !== undefined) chatbot.name = name;
    if (businessName !== undefined) chatbot.businessName = businessName;
    if (welcomeMessage !== undefined) chatbot.welcomeMessage = welcomeMessage;
    if (primaryColor !== undefined) chatbot.primaryColor = primaryColor;
    if (Array.isArray(suggestedQuestions)) {
      chatbot.suggestedQuestions = suggestedQuestions.filter(q => q && q.trim());
    }
    if (isActive !== undefined) chatbot.isActive = Boolean(isActive);

    await chatbot.save();

    res.status(200).json({
      success: true,
      message: 'Chatbot updated successfully.',
      chatbot
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete chatbot
// @route   DELETE /api/chatbots/:id
// @access  Private
exports.deleteChatbot = async (req, res, next) => {
  try {
    const chatbot = await Chatbot.findById(req.params.id);

    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found.'
      });
    }

    if (chatbot.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this chatbot.'
      });
    }

    await chatbot.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Chatbot deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
