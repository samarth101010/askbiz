import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getChatbots, createChatbot, updateChatbot, deleteChatbot } from '../api/chatbot';
import ChatbotCard from '../components/ChatbotCard';
import ChatbotModal from '../components/ChatbotModal';
import {
  Bot,
  Plus,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const DashboardHome = () => {
  const { user } = useAuth();
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChatbot, setEditingChatbot] = useState(null);

  const fetchChatbots = async () => {
    try {
      setLoading(true);
      const data = await getChatbots();
      if (data.success) {
        setChatbots(data.chatbots);
      }
    } catch (err) {
      console.error('Failed to load chatbots:', err);
      setError('Unable to load chatbots. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatbots();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingChatbot(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (chatbot) => {
    setEditingChatbot(chatbot);
    setIsModalOpen(true);
  };

  const handleSaveChatbot = async (chatbotData) => {
    if (editingChatbot) {
      await updateChatbot(editingChatbot._id, chatbotData);
    } else {
      await createChatbot(chatbotData);
    }
    await fetchChatbots();
  };

  const handleDeleteChatbot = async (chatbot) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${chatbot.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteChatbot(chatbot._id);
      setChatbots(chatbots.filter((b) => b._id !== chatbot._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete chatbot.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Phase 2 Activated: Chatbot Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-indigo-100 text-sm max-w-xl">
              Create, brand, and customize AI chatbots for your business. In Phase 3, you'll be able to upload PDFs to train each chatbot!
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-md transition whitespace-nowrap self-start md:self-center"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Chatbot</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="flex items-center space-x-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Status & Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Your Chatbots</p>
              <h3 className="text-2xl font-extrabold text-slate-900">{chatbots.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active Bots</p>
              <h3 className="text-2xl font-extrabold text-slate-900">
                {chatbots.filter((b) => b.isActive).length}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Roadmap Progress</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs font-bold text-slate-800">Phase 2 / 6</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chatbots Section Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Chatbots</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a chatbot to manage its knowledge base or customize widget styling
            </p>
          </div>
          {chatbots.length > 0 && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Chatbot</span>
            </button>
          )}
        </div>

        {/* Chatbots Grid / Empty State */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium text-slate-500">Loading your chatbots...</p>
          </div>
        ) : chatbots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatbots.map((chatbot) => (
              <ChatbotCard
                key={chatbot._id}
                chatbot={chatbot}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteChatbot}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">No Chatbots Created Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                You haven't created any chatbots yet. Click below to create your first business chatbot, customize brand colors, and set up your welcome message!
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-xs shadow-md shadow-indigo-200 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Chatbot</span>
            </button>
          </div>
        )}
      </div>

      {/* Chatbot Create/Edit Modal */}
      <ChatbotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveChatbot}
        editingChatbot={editingChatbot}
      />
    </div>
  );
};

export default DashboardHome;
