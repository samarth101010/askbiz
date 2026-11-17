import React, { useState, useEffect } from 'react';
import { getConversations, getConversationMessages, deleteConversation } from '../api/chat';
import ConversationHistoryModal from './ConversationHistoryModal';
import {
  MessageSquare,
  Clock,
  Eye,
  Trash2,
  ExternalLink,
  Users,
  RefreshCw
} from 'lucide-react';

const ConversationList = ({ chatbotId, primaryColor = '#4F46E5' }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);

  const backendBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  const demoPageUrl = `${backendBaseUrl}/test-widget.html`;

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getConversations(chatbotId);
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatbotId) {
      fetchConversations();
    }
  }, [chatbotId]);

  const handleViewTranscript = async (conversation) => {
    try {
      setSelectedConversation(conversation);
      const res = await getConversationMessages(chatbotId, conversation._id);
      if (res.success) {
        setSelectedMessages(res.messages);
        setIsModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load transcript: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (conversationId) => {
    const confirmed = window.confirm('Delete this customer conversation session?');
    if (!confirmed) return;

    try {
      await deleteConversation(chatbotId, conversationId);
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete conversation.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900">
                Customer Conversations & Chat History
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                Phase 5 Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review live customer Q&A interactions collected through your embeddable widget
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchConversations}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
            title="Refresh Conversations"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href={demoPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition"
          >
            <span>Preview Live Widget (Demo Page)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Conversations Table / Empty State */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400">Loading conversation history...</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-700">No Customer Conversations Recorded Yet</p>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            Once you embed your widget or test it on the demo page, customer questions and responses will appear here in real-time.
          </p>
          <div className="pt-2">
            <a
              href={demoPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:underline"
            >
              <span>Open the Live Demo Website to test the floating widget &rarr;</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {conversations.map((conv) => (
            <div
              key={conv._id}
              className="p-4 bg-white hover:bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition"
            >
              <div className="flex items-start space-x-3 overflow-hidden">
                <div
                  style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {conv.visitorId}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                      {conv.messagesCount} Messages
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate max-w-lg mt-0.5 italic">
                    "{conv.lastMessage || 'Conversation started'}"
                  </p>
                  <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>Last active {new Date(conv.lastMessageAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  onClick={() => handleViewTranscript(conv)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Transcript</span>
                </button>
                <button
                  onClick={() => handleDelete(conv._id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete Conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transcript Modal */}
      <ConversationHistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        conversation={selectedConversation}
        messages={selectedMessages}
        primaryColor={primaryColor}
      />
    </div>
  );
};

export default ConversationList;
