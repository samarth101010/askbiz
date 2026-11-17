import React, { useState, useRef, useEffect } from 'react';
import { askChatbot } from '../api/chat';
import {
  MessageSquare,
  Bot,
  User,
  Send,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Layers,
  AlertCircle
} from 'lucide-react';

const ChatPlayground = ({ chatbot, totalDocuments, totalChunks }) => {
  const chatMessagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [chatError, setChatError] = useState('');
  const [expandedSources, setExpandedSources] = useState({});

  useEffect(() => {
    if (chatbot) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: chatbot.welcomeMessage || 'Hi there! 👋 How can I help you today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: []
        }
      ]);
    }
  }, [chatbot]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnswering]);

  const handleSendMessage = async (textToSend) => {
    const query = typeof textToSend === 'string' ? textToSend : inputQuestion;
    if (!query || !query.trim() || isAnswering) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setChatError('');
    setIsAnswering(true);

    try {
      const data = await askChatbot(chatbot._id, query.trim());
      if (data.success) {
        const botReply = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: data.answer,
          sources: data.sources || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botReply]);
      }
    } catch (err) {
      setChatError(
        err.response?.data?.message || 'Failed to get an answer from the chatbot. Please try again.'
      );
    } finally {
      setIsAnswering(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: chatbot?.welcomeMessage || 'Hi there! 👋 How can I help you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: []
      }
    ]);
    setChatError('');
  };

  const toggleSourceView = (msgId) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      {/* Playground Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div
            style={{ backgroundColor: chatbot?.primaryColor || '#4F46E5' }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs"
          >
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">RAG Chat Playground</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                Phase 4 Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Ask questions to test retrieval from your {totalDocuments} document(s) ({totalChunks} chunks)
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 text-xs font-semibold shadow-2xs hover:bg-slate-50 transition"
          title="Reset Test Conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Chat</span>
        </button>
      </div>

      {/* Playground Messages Thread */}
      <div className="p-6 bg-slate-50/70 max-h-[460px] min-h-[320px] overflow-y-auto space-y-4">
        {chatError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{chatError}</span>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2.5 ${
              msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              style={{
                backgroundColor:
                  msg.sender === 'bot' ? (chatbot?.primaryColor || '#4F46E5') : '#0F172A'
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-2xs text-[11px] mt-0.5"
            >
              {msg.sender === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className="space-y-1.5 max-w-[85%] sm:max-w-[75%]">
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>

              {/* Starter Chips */}
              {msg.id === 'welcome' && chatbot?.suggestedQuestions?.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Suggested Starter Questions:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {chatbot.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-[11px] font-medium shadow-2xs transition text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="pt-1">
                  <button
                    onClick={() => toggleSourceView(msg.id)}
                    className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md transition"
                  >
                    <Layers className="w-3 h-3 text-emerald-600" />
                    <span>RAG Sources: {msg.sources.length} Chunks Retrieved</span>
                    {expandedSources[msg.id] ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  {expandedSources[msg.id] && (
                    <div className="mt-2 space-y-2 pl-2 border-l-2 border-emerald-300">
                      {msg.sources.map((src, i) => (
                        <div
                          key={i}
                          className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs text-[10px] space-y-1"
                        >
                          <div className="flex items-center justify-between text-slate-500 font-semibold">
                            <span className="text-slate-800 font-bold">
                              [{i + 1}] {src.documentName} (Chunk #{src.chunkIndex})
                            </span>
                            <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              Similarity: {(src.similarityScore * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-slate-600 italic font-mono bg-slate-50 p-1.5 rounded">
                            "{src.preview}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="text-[10px] text-slate-400 px-1">{msg.timestamp}</div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isAnswering && (
          <div className="flex items-center space-x-2.5">
            <div
              style={{ backgroundColor: chatbot?.primaryColor || '#4F46E5' }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0"
            >
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-2xs flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-150"></span>
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-300"></span>
              <span className="text-[11px] text-slate-400 pl-2">
                Searching knowledge chunks & generating grounded answer...
              </span>
            </div>
          </div>
        )}

        <div ref={chatMessagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ask a question about your business documents, policies, or pricing..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isAnswering}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isAnswering}
            style={{ backgroundColor: chatbot?.primaryColor || '#4F46E5' }}
            className="p-2.5 text-white rounded-xl shadow-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center flex-shrink-0"
            title="Send Question"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPlayground;
