import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RenovationPanel } from './components/RenovationPanel';
import { MarketplacePanel } from './components/MarketplacePanel';
import { GeneralPanel } from './components/GeneralPanel';
import { ResultViewer } from './components/ResultViewer';
import { AppMode, UploadedImage, GenerationResult, SavedImage } from './types';
import { generateImageEdit } from './services/geminiService';
import { AlertCircle, CheckCircle2, Key, Sparkles, ArrowRight } from 'lucide-react';

// Internal type for history management
type HistoryItem = {
  result: GenerationResult;
  original: UploadedImage;
};

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);

  const [mode, setMode] = useState<AppMode>(AppMode.RENOVATION);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  
  // State for result management
  const [originalImage, setOriginalImage] = useState<UploadedImage | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  // History State
  const [sessionHistory, setSessionHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Saved/Library State
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    }
    setIsCheckingKey(false);
  };

  const handleConnectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Re-check after selection (race condition mitigation handled by user waiting for dialog)
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    }
  };

  // Reset result and history when mode changes
  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setGenerationResult(null);
    setOriginalImage(null);
    setSessionHistory([]);
    setHistoryIndex(-1);
    setError(null);
    setNotification(null);
  };

  const handleGeneration = async (prompt: string, baseImage: UploadedImage, refImages: UploadedImage[] = []) => {
    setIsGenerating(true);
    setError(null);
    setNotification(null);
    setOriginalImage(baseImage); // Store for comparison

    try {
      // Ensure we are using the latest key context
      const generatedBase64 = await generateImageEdit(
        'gemini-2.5-flash-image',
        prompt,
        baseImage.base64,
        baseImage.mimeType,
        refImages.map(img => ({ base64: img.base64, mimeType: img.mimeType }))
      );

      const newResult: GenerationResult = {
        imageUrl: generatedBase64,
        timestamp: Date.now(),
        prompt: prompt
      };

      setGenerationResult(newResult);

      // Update History Stack
      const newItem: HistoryItem = { result: newResult, original: baseImage };
      
      // If we are in the middle of the stack (due to undo), truncate future history
      const newHistory = sessionHistory.slice(0, historyIndex + 1);
      newHistory.push(newItem);
      
      setSessionHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during generation.");
      // If authorization failed, it might be a key issue
      if (err.message?.includes('403') || err.message?.includes('API key')) {
        setHasApiKey(false);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevItem = sessionHistory[newIndex];
      setHistoryIndex(newIndex);
      setGenerationResult(prevItem.result);
      setOriginalImage(prevItem.original);
    }
  };

  const handleRedo = () => {
    if (historyIndex < sessionHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const nextItem = sessionHistory[newIndex];
      setHistoryIndex(newIndex);
      setGenerationResult(nextItem.result);
      setOriginalImage(nextItem.original);
    }
  };

  const getTargetAppName = () => {
    switch (mode) {
      case AppMode.RENOVATION: return 'Renovision Pro';
      case AppMode.MARKETPLACE: return 'CDI Marketplace';
      default: return 'My Library';
    }
  };

  const handleSendToApp = async () => {
    if (!generationResult || !originalImage) return;

    setIsSending(true);
    
    // Simulate network delay for sending to external app
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newSavedImage: SavedImage = {
      ...generationResult,
      id: Math.random().toString(36).substr(2, 9),
      originalUrl: originalImage.previewUrl,
      mode: mode
    };

    setSavedImages(prev => [newSavedImage, ...prev]);
    
    const appName = getTargetAppName();
    setNotification(`Image successfully sent to ${appName}!`);
    setIsSending(false);

    // Clear notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);
  };

  if (isCheckingKey) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-slate-200">
        <div className="animate-pulse flex flex-col items-center">
          <Sparkles size={48} className="text-indigo-500 mb-4" />
          <p className="text-lg font-medium text-slate-400">Initializing CDI Image Editor...</p>
        </div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-slate-200 p-6">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-700 text-center space-y-8">
          <div className="flex justify-center">
            <div className="bg-indigo-600/20 p-4 rounded-2xl ring-1 ring-indigo-500/30">
               <Sparkles size={48} className="text-indigo-400" />
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-3">
              CDI Image Editor
            </h1>
            <p className="text-slate-400 leading-relaxed">
              Connect your Google account to access professional AI renovation and marketplace tools.
            </p>
          </div>

          <button
            onClick={handleConnectKey}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-3 group"
          >
            <Key size={20} className="group-hover:rotate-12 transition-transform" />
            Connect API Key
            <ArrowRight size={20} className="opacity-60 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="text-xs text-slate-500 pt-4 border-t border-slate-700">
            <p>Securely processed via Google AI Studio.</p>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline mt-1 inline-block">
              View Billing & Access Details
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-900 text-slate-200">
      <Sidebar currentMode={mode} onModeChange={handleModeChange} />
      
      <main className="flex-1 overflow-y-auto h-full relative">
        <div className="max-w-6xl mx-auto p-6 lg:p-12">
          
          {/* Notification Toast */}
          {notification && (
            <div className="fixed top-6 right-6 z-50 animate-fade-in-up bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 px-6 py-4 rounded-xl flex items-center gap-3 shadow-2xl backdrop-blur-md">
              <CheckCircle2 className="text-emerald-500" />
              <span className="font-medium">{notification}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="text-red-500" />
              <p>{error}</p>
            </div>
          )}

          {/* Panels */}
          <div className="bg-slate-800/30 rounded-3xl border border-slate-800 p-8 shadow-2xl backdrop-blur-sm">
            {mode === AppMode.RENOVATION && (
              <RenovationPanel 
                onGenerate={handleGeneration} 
                isGenerating={isGenerating} 
                history={savedImages.filter(img => img.mode === AppMode.RENOVATION)}
              />
            )}
            {mode === AppMode.MARKETPLACE && (
              <MarketplacePanel 
                onGenerate={(prompt, img) => handleGeneration(prompt, img)} 
                isGenerating={isGenerating} 
                history={savedImages.filter(img => img.mode === AppMode.MARKETPLACE)}
              />
            )}
            {mode === AppMode.GENERAL && (
              <GeneralPanel onGenerate={(prompt, img) => handleGeneration(prompt, img)} isGenerating={isGenerating} />
            )}
          </div>

          {/* Result Area */}
          <ResultViewer 
            original={originalImage} 
            result={generationResult}
            onSendToApp={handleSendToApp}
            appName={getTargetAppName()}
            isSending={isSending}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < sessionHistory.length - 1}
          />
          
        </div>
      </main>
    </div>
  );
};

export default App;