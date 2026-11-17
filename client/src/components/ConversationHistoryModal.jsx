import React from 'react';
import { X, MessageSquare, User, Bot, Clock } from 'lucide-react';

const ConversationHistoryModal = ({
  isOpen,
  onClose,
  conversation,
  messages = [],
  primaryColor = '#4F46E5'
}) => {
  if (!isOpen || !conversation) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div
              style={{ backgroundColor: primaryColor }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
            >
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Customer Conversation Transcript
              </h2>
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                <span className="font-mono">{conversation.visitorId}</span>
                <span>•</span>
                <span>{new Date(conversation.lastMessageAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages List */}
        <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/60 flex-1">
          {messages.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">
              No messages recorded in this conversation session.
            </p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg._id || idx}
                className={`flex items-start space-x-2.5 ${
                  msg.sender === 'customer' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                }`}
              >
                <div
                  style={{
                    backgroundColor: msg.sender === 'customer' ? '#0F172A' : primaryColor
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 text-[10px] mt-0.5"
                >
                  {msg.sender === 'customer' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className="max-w-[85%] space-y-1">
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'customer'
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="text-[10px] text-slate-400 px-1 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            Close Transcript
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationHistoryModal;
