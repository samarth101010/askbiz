import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getChatbotById, updateChatbot, deleteChatbot } from '../api/chatbot';
import {
  getKnowledgeSummary,
  uploadPDF,
  uploadText,
  getChunks,
  deleteDocument
} from '../api/knowledge';
import ChatbotModal from '../components/ChatbotModal';
import ChunkViewerModal from '../components/ChunkViewerModal';
import ChatPlayground from '../components/ChatPlayground';
import ConversationList from '../components/ConversationList';
import {
  Bot,
  ArrowLeft,
  Settings,
  BookOpen,
  Code2,
  Copy,
  Check,
  Upload,
  FileText,
  File,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const ChatbotDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Chatbot State
  const [chatbot, setChatbot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Knowledge Base State
  const [knowledge, setKnowledge] = useState({ totalDocuments: 0, totalChunks: 0, documents: [] });
  const [activeTab, setActiveTab] = useState('pdf');
  const [selectedFile, setSelectedFile] = useState(null);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [knowledgeSuccess, setKnowledgeSuccess] = useState('');
  const [knowledgeError, setKnowledgeError] = useState('');

  // Chunk Viewer Modal State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeDocForChunks, setActiveDocForChunks] = useState('');
  const [inspectChunks, setInspectChunks] = useState([]);

  const fetchChatbotData = async () => {
    try {
      setLoading(true);
      const botData = await getChatbotById(id);
      if (botData.success) {
        setChatbot(botData.chatbot);
      }

      const kbData = await getKnowledgeSummary(id);
      if (kbData.success) {
        setKnowledge(kbData);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load chatbot details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatbotData();
  }, [id]);

  const backendBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  const widgetScriptUrl = `${backendBaseUrl}/widget.js`;

  const handleCopySnippet = () => {
    const snippet = `<script src="${widgetScriptUrl}" data-chatbot-id="${id}" defer></script>`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleUpdate = async (updatedData) => {
    await updateChatbot(id, updatedData);
    await fetchChatbotData();
  };

  const handleDeleteBot = async () => {
    const confirmed = window.confirm(`Are you sure you want to delete "${chatbot.name}"?`);
    if (!confirmed) return;
    try {
      await deleteChatbot(id);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete chatbot.');
    }
  };

  // Upload PDF Handler
  const handleUploadPDF = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setKnowledgeError('Please select a PDF file first.');
      return;
    }

    setIsIngesting(true);
    setKnowledgeError('');
    setKnowledgeSuccess('');

    try {
      const res = await uploadPDF(id, selectedFile);
      setKnowledgeSuccess(res.message);
      setSelectedFile(null);
      const fileInput = document.getElementById('pdf-upload-input');
      if (fileInput) fileInput.value = '';

      const kbData = await getKnowledgeSummary(id);
      if (kbData.success) setKnowledge(kbData);
    } catch (err) {
      setKnowledgeError(err.response?.data?.message || 'Failed to upload and parse PDF.');
    } finally {
      setIsIngesting(false);
    }
  };

  // Upload Text Handler
  const handleUploadText = async (e) => {
    e.preventDefault();
    if (!textTitle.trim() || !textContent.trim()) {
      setKnowledgeError('Please provide both document title and text content.');
      return;
    }

    setIsIngesting(true);
    setKnowledgeError('');
    setKnowledgeSuccess('');

    try {
      const res = await uploadText(id, {
        title: textTitle.trim(),
        text: textContent.trim()
      });
      setKnowledgeSuccess(res.message);
      setTextTitle('');
      setTextContent('');

      const kbData = await getKnowledgeSummary(id);
      if (kbData.success) setKnowledge(kbData);
    } catch (err) {
      setKnowledgeError(err.response?.data?.message || 'Failed to ingest text knowledge.');
    } finally {
      setIsIngesting(false);
    }
  };

  // View Chunks Handler
  const handleInspectChunks = async (documentName) => {
    try {
      setActiveDocForChunks(documentName);
      const res = await getChunks(id, documentName);
      if (res.success) {
        setInspectChunks(res.chunks);
        setViewerOpen(true);
      }
    } catch (err) {
      alert('Failed to load chunks: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete Document Handler
  const handleDeleteDocument = async (documentName) => {
    const confirmed = window.confirm(
      `Delete document "${documentName}"? All associated vector embeddings will be removed from the knowledge base.`
    );
    if (!confirmed) return;

    try {
      await deleteDocument(id, documentName);
      const kbData = await getKnowledgeSummary(id);
      if (kbData.success) setKnowledge(kbData);
      setKnowledgeSuccess(`Document "${documentName}" deleted successfully.`);
    } catch (err) {
      setKnowledgeError(err.response?.data?.message || 'Failed to delete document.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Loading chatbot workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !chatbot) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm mb-4 inline-block">
          {error || 'Chatbot not found.'}
        </div>
        <div>
          <Link to="/" className="text-indigo-600 hover:underline text-sm font-semibold">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-white text-xs font-semibold transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Edit Branding & Prompts</span>
            </button>
            <button
              onClick={handleDeleteBot}
              className="text-xs font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
            >
              Delete Bot
            </button>
          </div>
        </div>

        {/* Chatbot Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div
              style={{ backgroundColor: chatbot.primaryColor || '#4F46E5' }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
            >
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900">{chatbot.name}</h1>
                <span
                  style={{ backgroundColor: `${chatbot.primaryColor}15`, color: chatbot.primaryColor }}
                  className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                >
                  {chatbot.primaryColor}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Business: <span className="font-semibold text-slate-700">{chatbot.businessName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium pl-2">Bot ID:</span>
            <code className="font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
              {chatbot._id}
            </code>
          </div>
        </div>

        {/* Phase 4: Live RAG Chat Playground */}
        <ChatPlayground
          chatbot={chatbot}
          totalDocuments={knowledge.totalDocuments}
          totalChunks={knowledge.totalChunks}
        />

        {/* Phase 3: RAG Knowledge Base Management Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-900">Knowledge Base (RAG Ingestion)</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Phase 3 Live
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload PDF documents or paste text. Text is split into ~500 char chunks, embedded via Gemini, and saved to MongoDB.
                </p>
              </div>
            </div>

            {/* Knowledge Stats */}
            <div className="flex items-center space-x-3">
              <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Documents</p>
                <p className="text-sm font-extrabold text-slate-800">{knowledge.totalDocuments}</p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Chunks</p>
                <p className="text-sm font-extrabold text-emerald-600">{knowledge.totalChunks}</p>
              </div>
            </div>
          </div>

          {/* Feedback alerts */}
          {knowledgeSuccess && (
            <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{knowledgeSuccess}</span>
            </div>
          )}
          {knowledgeError && (
            <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{knowledgeError}</span>
            </div>
          )}

          {/* Ingestion Tabs */}
          <div className="space-y-4">
            <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('pdf')}
                className={`pb-2.5 flex items-center space-x-2 transition border-b-2 ${
                  activeTab === 'pdf'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <File className="w-4 h-4" />
                <span>Upload PDF Document</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`pb-2.5 flex items-center space-x-2 transition border-b-2 ${
                  activeTab === 'text'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Paste Text / FAQs</span>
              </button>
            </div>

            {/* Tab 1: Upload PDF */}
            {activeTab === 'pdf' && (
              <form onSubmit={handleUploadPDF} className="space-y-4 pt-2">
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-400 transition bg-slate-50/50">
                  <input
                    id="pdf-upload-input"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="pdf-upload-input" className="cursor-pointer block space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        {selectedFile ? selectedFile.name : 'Click to select or drag and drop a PDF file'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {selectedFile
                          ? `${(selectedFile.size / 1024).toFixed(1)} KB selected`
                          : 'Company policy, price list, product catalog, or FAQs (Max 10MB)'}
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!selectedFile || isIngesting}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
                  >
                    {isIngesting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Extracting & Vectorizing PDF...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Vectorize & Ingest Document</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Paste Raw Text */}
            {activeTab === 'text' && (
              <form onSubmit={handleUploadText} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Return Policy, Pricing Guide, or Store FAQs"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Text Content *
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Paste your business details, policies, hours of operation, pricing breakdown, or FAQs here..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>Will be split into ~500 character chunks with 100 character overlap</span>
                    <span>{textContent.length} characters</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isIngesting || !textTitle.trim() || !textContent.trim()}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
                  >
                    {isIngesting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Embedding Text Chunks...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Vectorize & Store in Knowledge Base</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Ingested Documents List */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ingested Documents ({knowledge.documents.length})
            </h3>

            {knowledge.documents.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Knowledge Documents Added Yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upload a PDF or paste text above so your chatbot can answer questions using your business documents.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {knowledge.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white hover:bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition"
                  >
                    <div className="flex items-start space-x-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {doc.sourceType === 'pdf' ? (
                          <File className="w-5 h-5 text-red-500" />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{doc.documentName}</h4>
                        <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500">
                          <span className="capitalize font-semibold uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                            {doc.sourceType}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-600">{doc.chunkCount} Chunks</span>
                          <span>•</span>
                          <span>Added {new Date(doc.firstUploaded).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => handleInspectChunks(doc.documentName)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect Chunks</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.documentName)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Phase 5: Customer Conversations & Chat History */}
        <ConversationList chatbotId={id} primaryColor={chatbot.primaryColor} />

        {/* Embed Script Snippet (Phase 5) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
            <Code2 className="w-5 h-5 text-indigo-600" />
            <h3>Embeddable Widget Snippet</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Paste this snippet right before the closing <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">&lt;/body&gt;</code> tag on any website to embed your chatbot:
          </p>

          <div className="relative bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
            <code>
              {`<script src="${widgetScriptUrl}" data-chatbot-id="${chatbot._id}" defer></script>`}
            </code>
          </div>

          <button
            onClick={handleCopySnippet}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Snippet Copied to Clipboard!' : 'Copy Embed Code'}</span>
          </button>
        </div>
      </div>

      {/* Edit Chatbot Modal */}
      <ChatbotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleUpdate}
        editingChatbot={chatbot}
      />

      {/* Chunks Inspection Modal */}
      <ChunkViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        documentName={activeDocForChunks}
        chunks={inspectChunks}
      />
    </div>
  );
};

export default ChatbotDetails;
