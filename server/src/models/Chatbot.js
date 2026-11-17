const mongoose = require('mongoose');

const chatbotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name for your chatbot'],
      trim: true,
      maxlength: [60, 'Chatbot name cannot exceed 60 characters']
    },
    businessName: {
      type: String,
      required: [true, 'Please provide your business or brand name'],
      trim: true,
      maxlength: [80, 'Business name cannot exceed 80 characters']
    },
    welcomeMessage: {
      type: String,
      default: 'Hi there! 👋 How can I help you today?',
      trim: true,
      maxlength: [300, 'Welcome message cannot exceed 300 characters']
    },
    primaryColor: {
      type: String,
      default: '#4F46E5', // Indigo-600 default
      trim: true,
      match: [/^#([0-9a-fA-F]{3}){1,2}$/, 'Please provide a valid hex color code (e.g. #4F46E5)']
    },
    suggestedQuestions: {
      type: [String],
      default: [
        'What are your business hours?',
        'Where can I find your pricing?',
        'How can I contact support?'
      ]
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Chatbot', chatbotSchema);
