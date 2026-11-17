import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Settings, BookOpen, Trash2, ArrowUpRight } from 'lucide-react';

const ChatbotCard = ({ chatbot, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Card Header with Bot Color Accent */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              style={{ backgroundColor: chatbot.primaryColor || '#4F46E5' }}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
            >
              <Bot className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-indigo-600 transition">
                {chatbot.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate">
                {chatbot.businessName}
              </p>
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              chatbot.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {chatbot.isActive ? 'Active' : 'Paused'}
          </span>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Welcome Message
            </span>
            <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
              "{chatbot.welcomeMessage}"
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Starter Questions ({chatbot.suggestedQuestions?.length || 0})
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {chatbot.suggestedQuestions?.slice(0, 2).map((q, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md truncate max-w-[200px]"
                >
                  {q}
                </span>
              ))}
              {(chatbot.suggestedQuestions?.length || 0) > 2 && (
                <span className="text-[10px] text-slate-400 font-medium self-center">
                  +{(chatbot.suggestedQuestions?.length || 0) - 2} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
        <Link
          to={`/chatbots/${chatbot._id}`}
          className="inline-flex items-center space-x-1.5 font-semibold text-indigo-600 hover:text-indigo-700 transition"
        >
          <BookOpen className="w-4 h-4" />
          <span>Manage Knowledge</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(chatbot)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
            title="Edit Chatbot Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(chatbot)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Delete Chatbot"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotCard;
