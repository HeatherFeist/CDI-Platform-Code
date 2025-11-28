import React, { useState } from 'react';
import { UploadedImage, GenerationResult } from '../types';
import { Download, Eye, EyeOff, Send, CheckCircle, Undo, Redo } from 'lucide-react';

interface ResultViewerProps {
  original: UploadedImage | null;
  result: GenerationResult | null;
  onSendToApp?: () => void;
  appName?: string;
  isSending?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ 
  original, 
  result, 
  onSendToApp, 
  appName,
  isSending = false,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [showOriginal, setShowOriginal] = useState(false);

  if (!result) return null;

  return (
    <div className="mt-12 pt-12 border-t border-slate-800 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-white">Generated Result</h2>
        <div className="flex flex-wrap gap-3">
          {/* Undo / Redo Group */}
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 mr-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors rounded-l-lg border-r border-slate-700"
              title="Undo"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors rounded-r-lg"
              title="Redo"
            >
              <Redo size={18} />
            </button>
          </div>

          {original && (
            <button
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onMouseLeave={() => setShowOriginal(false)}
              onTouchStart={() => setShowOriginal(true)}
              onTouchEnd={() => setShowOriginal(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 select-none"
            >
              {showOriginal ? <EyeOff size={18} /> : <Eye size={18} />}
              <span className="hidden sm:inline">Hold to Compare</span>
            </button>
          )}
          
          <a
            href={result.imageUrl}
            download={`visionary-edit-${Date.now()}.png`}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600"
          >
            <Download size={18} />
            Download
          </a>

          {onSendToApp && appName && (
            <button
              onClick={onSendToApp}
              disabled={isSending}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold rounded-lg shadow-lg shadow-indigo-900/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {isSending ? (
                <CheckCircle size={18} className="animate-pulse" />
              ) : (
                <Send size={18} />
              )}
              {isSending ? 'Sending...' : `Send to ${appName}`}
            </button>
          )}
        </div>
      </div>

      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-black h-[500px] md:h-[600px] flex items-center justify-center group">
        {showOriginal && original ? (
          <div className="absolute inset-0 z-20">
             <img 
              src={original.previewUrl} 
              alt="Original" 
              className="w-full h-full object-contain animate-fade-in"
            />
             <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-white/10">
              Original
            </div>
          </div>
        ) : (
           <div className="absolute inset-0 z-10">
            <img 
              src={result.imageUrl} 
              alt="Generated Result" 
              className="w-full h-full object-contain animate-fade-in"
            />
            <div className="absolute top-4 left-4 bg-indigo-600/80 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm shadow-lg">
              AI Generated
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 text-center text-sm text-slate-500">
        Generated with Gemini 2.5 Flash Image
      </div>
    </div>
  );
};