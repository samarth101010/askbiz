import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Bot, Send, Sparkles } from 'lucide-react';

const PRESET_COLORS = [
  '#4F46E5', // Indigo
  '#2563EB', // Blue
  '#0D9488', // Teal
  '#059669', // Emerald
  '#D97706', // Amber
  '#E11D48', // Rose
  '#7C3AED', // Violet
  '#0F172A', // Slate
];

const ChatbotModal = ({ isOpen, onClose, onSave, editingChatbot = null }) => {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi there! 👋 How can I help you today?');
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    'What are your business hours?',
    'Where can I find your pricing?'
  ]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingChatbot) {
      setName(editingChatbot.name || '');
      setBusinessName(editingChatbot.businessName || '');
      setWelcomeMessage(editingChatbot.welcomeMessage || 'Hi there! 👋 How can I help you today?');
      setPrimaryColor(editingChatbot.primaryColor || '#4F46E5');
      setSuggestedQuestions(editingChatbot.suggestedQuestions || []);
    } else {
      setName('');
      setBusinessName('');
      setWelcomeMessage('Hi there! 👋 How can I help you today?');
      setPrimaryColor('#4F46E5');
      setSuggestedQuestions([
        'What are your business hours?',
        'Where can I find your pricing?'
      ]);
    }
    setError('');
  }, [editingChatbot, isOpen]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      if (suggestedQuestions.length >= 4) {
        setError('Maximum 4 suggested questions allowed.');
        return;
      }
      setSuggestedQuestions([...suggestedQuestions, newQuestion.trim()]);
      setNewQuestion('');
      setError('');
    }
  };

  const handleRemoveQuestion = (index) => {
    setSuggestedQuestions(suggestedQuestions.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !businessName.trim()) {
      setError('Please provide both Chatbot Name and Business Name.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        name: name.trim(),
        businessName: businessName.trim(),
        welcomeMessage: welcomeMessage.trim(),
        primaryColor,
        suggestedQuestions
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save chatbot. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingChatbot ? 'Edit Chatbot' : 'Create New Chatbot'}
              </h2>
              <p className="text-xs text-slate-500">
                Customize your assistant's identity, welcome message, and branding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Column Form & Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[75vh] overflow-y-auto">
          {/* Form Column */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Chatbot Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Support Assistant"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Business / Store Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Health Clinic"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Welcome Message
              </label>
              <textarea
                rows={3}
                placeholder="Greet visitors when they first open the chat..."
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Brand Color
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setPrimaryColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-7 h-7 rounded-full shadow-sm transition transform hover:scale-110 flex items-center justify-center ${
                      primaryColor.toLowerCase() === color.toLowerCase()
                        ? 'ring-2 ring-offset-2 ring-indigo-500 scale-105'
                        : ''
                    }`}
                  >
                    {primaryColor.toLowerCase() === color.toLowerCase() && (
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                    )}
                  </button>
                ))}
                <div className="flex items-center space-x-1.5 ml-2 border border-slate-300 rounded-lg px-2 py-1 bg-slate-50">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 text-xs font-mono uppercase bg-transparent border-0 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Suggested Starter Prompts (Max 4)
              </label>
              <div className="space-y-2 mb-2">
                {suggestedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700"
                  >
                    <span className="truncate pr-2">{q}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {suggestedQuestions.length < 4 && (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. What is your return policy?"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddQuestion();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingChatbot ? 'Save Changes' : 'Create Chatbot'}
              </button>
            </div>
          </form>

          {/* Live Preview Column */}
          <div className="lg:col-span-5 bg-slate-100 p-6 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-center items-center">
            <div className="w-full max-w-sm">
              <div className="flex items-center space-x-1.5 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Live Widget Simulator</span>
              </div>

              {/* Mock Chat Window */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden text-xs">
                {/* Chatbot Header */}
                <div
                  style={{ backgroundColor: primaryColor }}
                  className="px-4 py-3 text-white flex items-center space-x-2.5 transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="leading-tight">
                    <h4 className="font-bold text-sm truncate max-w-[180px]">
                      {name.trim() || 'Chatbot Preview'}
                    </h4>
                    <p className="text-[10px] text-white/80 truncate max-w-[180px]">
                      {businessName.trim() || 'Your Business'}
                    </p>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="p-4 bg-slate-50/70 min-h-[190px] space-y-3">
                  {/* Bot Welcome Bubble */}
                  <div className="flex items-start space-x-2">
                    <div
                      style={{ backgroundColor: primaryColor }}
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white"
                    >
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-2.5 text-slate-800 shadow-sm max-w-[85%] leading-relaxed text-[11px]">
                      {welcomeMessage || 'Hi there! How can I help you today?'}
                    </div>
                  </div>

                  {/* Suggested Question Chips */}
                  {suggestedQuestions.length > 0 && (
                    <div className="pl-8 space-y-1.5 pt-1">
                      <p className="text-[10px] font-semibold text-slate-400">Suggested Questions:</p>
                      {suggestedQuestions.map((q, idx) => (
                        <div
                          key={idx}
                          className="bg-white hover:bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 text-[10px] text-slate-700 cursor-pointer shadow-2xs truncate"
                        >
                          {q}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chat Input Bar */}
                <div className="p-2.5 bg-white border-t border-slate-100 flex items-center space-x-2">
                  <input
                    type="text"
                    disabled
                    placeholder="Ask a question..."
                    className="flex-1 bg-slate-100 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    style={{ backgroundColor: primaryColor }}
                    className="p-1.5 rounded-lg text-white"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Floating Trigger Bubble Mock */}
              <div className="mt-4 flex justify-end">
                <div
                  style={{ backgroundColor: primaryColor }}
                  className="w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg transition-colors duration-200"
                >
                  <Bot className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotModal;
