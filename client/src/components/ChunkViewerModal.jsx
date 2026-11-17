import React from 'react';
import { X, Layers, FileText, CheckCircle2 } from 'lucide-react';

const ChunkViewerModal = ({ isOpen, onClose, documentName, chunks = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Vectorized Chunks Inspector
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-md">
                Document: <span className="font-semibold text-slate-700">{documentName}</span> ({chunks.length} chunks)
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

        {/* Chunks List */}
        <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50 flex-1">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Each chunk below has been converted into a 768-dimensional Gemini embedding stored in MongoDB. When a customer asks a question, AskBiz calculates cosine similarity to fetch the most relevant chunk!
            </span>
          </div>

          {chunks.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">No chunks found for this document.</p>
          ) : (
            chunks.map((chunk, index) => (
              <div
                key={chunk._id || index}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2 hover:border-indigo-300 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono font-bold text-slate-700 text-[11px]">
                      Chunk #{chunk.chunkIndex !== undefined ? chunk.chunkIndex : index}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {chunk.text.length} characters
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    768-dim Vector Linked
                  </span>
                </div>

                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {chunk.text}
                </p>
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
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChunkViewerModal;
