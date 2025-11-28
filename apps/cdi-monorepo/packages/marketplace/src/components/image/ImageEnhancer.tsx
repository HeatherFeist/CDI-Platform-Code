import { useState, useRef, useEffect } from 'react';
import { Camera, Sparkles, Check, X, RefreshCw, Image as ImageIcon, AlertCircle, ThumbsUp, ThumbsDown, Send, MessageSquare } from 'lucide-react';
import { geminiImageService } from '../../services/GeminiImageService';

interface ImageEnhancerProps {
  onImageEnhanced?: (enhancedFile: File) => void;
  onAnalysisComplete?: (analysis: any) => void;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function ImageEnhancer({ onImageEnhanced, onAnalysisComplete }: ImageEnhancerProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [coaching, setCoaching] = useState<any>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setEnhancedUrl(null);
    setAnalysis(null);
    setCoaching(null);

    // Auto-analyze
    analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    if (!geminiImageService.isConfigured()) {
      alert('Image enhancement requires a Gemini API key. Add VITE_GEMINI_API_KEY to your .env file.');
      return;
    }

    setAnalyzing(true);
    try {
      const [quality, coachingResult] = await Promise.all([
        geminiImageService.analyzeImageQuality(file),
        geminiImageService.getPhotoCoaching(file, 'product')
      ]);

      setAnalysis(quality);
      setCoaching(coachingResult);
      onAnalysisComplete?.(quality);
    } catch (error: any) {
      console.error('Analysis error:', error);
      alert(error.message || 'Failed to analyze image');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCustomRequest = async () => {
    if (!selectedImage || !customPrompt.trim()) {
      alert('Please enter a request for the AI');
      return;
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: customPrompt,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    const userPrompt = customPrompt;
    setCustomPrompt('');
    setIsProcessing(true);
    
    try {
      // Use Gemini to analyze the image and provide guidance based on the prompt
      const response = await geminiImageService.getCustomEditGuidance(selectedImage, userPrompt);
      
      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'ai',
        content: response,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
      
      // Check if request involves enhancement we can do
      const lowerPrompt = userPrompt.toLowerCase();
      if (lowerPrompt.includes('enhance') || lowerPrompt.includes('improve') || 
          lowerPrompt.includes('brighten') || lowerPrompt.includes('sharpen') ||
          lowerPrompt.includes('fix')) {
        // Ask if they want auto-enhancement
        setTimeout(() => {
          const followUpMessage: ChatMessage = {
            id: Date.now() + 2,
            role: 'ai',
            content: '💡 I can apply basic enhancements now! Would you like me to auto-enhance your image? Just type "yes enhance" or click the Auto-Enhance button below.',
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, followUpMessage]);
        }, 1000);
      }
      
      // Check for "yes enhance" response
      if (lowerPrompt.includes('yes') && (lowerPrompt.includes('enhance') || lowerPrompt.includes('improve'))) {
        await handleAutoEnhance();
      }
    } catch (error: any) {
      console.error('Custom request error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'ai',
        content: `Sorry, I encountered an error: ${error.message || 'Please try again.'}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomRequest();
    }
  };

  const handleAutoEnhance = async () => {
    if (!selectedImage) return;

    setEnhancing(true);
    try {
      const result = await geminiImageService.autoEnhance(selectedImage);
      
      const enhancedFile = new File([result.enhancedImage], selectedImage.name, {
        type: 'image/jpeg'
      });

      setEnhancedUrl(URL.createObjectURL(result.enhancedImage));
      onImageEnhanced?.(enhancedFile);

      alert(`✨ Image Enhanced!\n\nImprovements:\n${result.changes.join('\n')}\n\nScore: ${result.beforeScore} → ${result.afterScore}`);
    } catch (error: any) {
      console.error('Enhancement error:', error);
      alert(error.message || 'Failed to enhance image');
    } finally {
      setEnhancing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'bg-green-100 text-green-800';
    if (grade === 'B') return 'bg-blue-100 text-blue-800';
    if (grade === 'C') return 'bg-yellow-100 text-yellow-800';
    if (grade === 'D') return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (!geminiImageService.isConfigured()) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-purple-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-purple-900">AI Image Enhancement Available</h4>
            <p className="text-sm text-purple-700 mt-1">
              Add your Gemini API key to enable smart photo analysis and enhancement.
            </p>
            <code className="text-xs bg-purple-100 px-2 py-1 rounded mt-2 inline-block">
              VITE_GEMINI_API_KEY=your-key-here
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="relative">
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-500 hover:bg-purple-50 transition-all">
            {!previewUrl ? (
              <div>
                <Camera size={48} className="mx-auto text-purple-400 mb-3" />
                <p className="text-lg font-semibold text-gray-700">Upload Photo for Analysis</p>
                <p className="text-sm text-gray-500 mt-2">AI will analyze quality and suggest improvements</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* Original */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Original</p>
                  <img src={previewUrl} alt="Original" className="w-full h-48 object-contain rounded-lg" />
                </div>

                {/* Enhanced */}
                {enhancedUrl && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Enhanced ✨</p>
                    <img src={enhancedUrl} alt="Enhanced" className="w-full h-48 object-contain rounded-lg border-2 border-green-500" />
                  </div>
                )}
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* Analysis Results */}
      {analyzing && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-center space-x-3">
            <RefreshCw size={20} className="text-purple-600 animate-spin" />
            <span className="text-gray-700">Analyzing photo quality...</span>
          </div>
        </div>
      )}

      {analysis && coaching && (
        <div className="space-y-4">
          {/* Quality Score */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Sparkles size={20} className="text-purple-600 mr-2" />
                Photo Quality Analysis
              </h3>
              <div className="flex items-center space-x-2">
                <span className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}
                </span>
                <span className="text-gray-500 text-sm">/100</span>
              </div>
            </div>

            {/* Grade Badge */}
            <div className="flex items-center space-x-3 mb-4">
              <span className={`px-3 py-1 rounded-full font-bold text-lg ${getGradeColor(coaching.currentGrade)}`}>
                Grade: {coaching.currentGrade}
              </span>
              {analysis.overallScore >= 80 ? (
                <span className="flex items-center text-green-600 text-sm">
                  <ThumbsUp size={16} className="mr-1" />
                  Excellent quality!
                </span>
              ) : analysis.canImprove ? (
                <span className="flex items-center text-yellow-600 text-sm">
                  <AlertCircle size={16} className="mr-1" />
                  Can be improved
                </span>
              ) : (
                <span className="flex items-center text-red-600 text-sm">
                  <ThumbsDown size={16} className="mr-1" />
                  Needs work
                </span>
              )}
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {coaching.strengths.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-700 text-sm mb-2 flex items-center">
                    <Check size={16} className="mr-1" />
                    Strengths
                  </h4>
                  <ul className="space-y-1">
                    {coaching.strengths.map((strength: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {coaching.weaknesses.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-700 text-sm mb-2 flex items-center">
                    <X size={16} className="mr-1" />
                    Needs Improvement
                  </h4>
                  <ul className="space-y-1">
                    {coaching.weaknesses.map((weakness: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Issues */}
            {analysis.issues.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-red-900 text-sm mb-2">Issues Detected:</h4>
                <ul className="space-y-1">
                  {analysis.issues.map((issue: string, idx: number) => (
                    <li key={idx} className="text-sm text-red-700">• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Fixes */}
            {coaching.quickFixes.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 text-sm mb-2 flex items-center">
                  <Sparkles size={16} className="mr-1" />
                  Quick Fixes:
                </h4>
                <ul className="space-y-1">
                  {coaching.quickFixes.map((fix: string, idx: number) => (
                    <li key={idx} className="text-sm text-blue-700">
                      {idx + 1}. {fix}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Detailed Guide */}
          {coaching.detailedGuide && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                <ImageIcon size={16} className="mr-2" />
                Photo Coach Advice:
              </h4>
              <p className="text-sm text-purple-800 leading-relaxed">{coaching.detailedGuide}</p>
            </div>
          )}

          {/* AI Chat Interface */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-lg overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="text-white" size={20} />
                <h4 className="font-semibold text-white">Chat with Gemini AI</h4>
              </div>
              {chatMessages.length > 0 && (
                <button
                  onClick={() => setChatMessages([])}
                  className="text-white/80 hover:text-white text-xs underline"
                >
                  Clear Chat
                </button>
              )}
            </div>

            {/* Chat Messages */}
            <div className="bg-white p-4 max-h-96 overflow-y-auto space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="mx-auto text-indigo-400 mb-3" size={32} />
                  <p className="text-gray-600 text-sm mb-2">Ask me anything about editing your photo!</p>
                  <p className="text-gray-500 text-xs">Try: "Put this shirt on a model" or "Remove the background"</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <RefreshCw size={14} className="text-indigo-600 animate-spin" />
                      <span className="text-sm text-gray-600">Gemini is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestions */}
            {chatMessages.length === 0 && (
              <div className="bg-indigo-50/50 p-3 border-t border-indigo-200">
                <p className="text-xs font-semibold text-indigo-900 mb-2">Quick Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCustomPrompt('Put this shirt on a model to show how it looks')}
                    className="px-3 py-1 bg-white border border-indigo-300 text-indigo-700 rounded-full text-xs hover:bg-indigo-50 transition-colors"
                  >
                    👕 Put on Model
                  </button>
                  <button
                    onClick={() => setCustomPrompt('Remove the background completely')}
                    className="px-3 py-1 bg-white border border-indigo-300 text-indigo-700 rounded-full text-xs hover:bg-indigo-50 transition-colors"
                  >
                    🎨 Remove Background
                  </button>
                  <button
                    onClick={() => setCustomPrompt('Make this photo more professional for selling')}
                    className="px-3 py-1 bg-white border border-indigo-300 text-indigo-700 rounded-full text-xs hover:bg-indigo-50 transition-colors"
                  >
                    ✨ Make Professional
                  </button>
                  <button
                    onClick={() => setCustomPrompt('Fix lighting and colors')}
                    className="px-3 py-1 bg-white border border-indigo-300 text-indigo-700 rounded-full text-xs hover:bg-indigo-50 transition-colors"
                  >
                    💡 Fix Lighting
                  </button>
                </div>
              </div>
            )}

            {/* Chat Input */}
            <div className="bg-white p-4 border-t border-indigo-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Gemini: 'Put this shirt on a model', 'Remove background', etc..."
                  className="flex-1 px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleCustomRequest}
                  disabled={isProcessing || !customPrompt.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send size={18} />
                  <span className="font-medium">Send</span>
                </button>
              </div>
            </div>
          </div>

          {/* Enhancement Button */}
          {analysis.canImprove && (
            <button
              onClick={handleAutoEnhance}
              disabled={enhancing}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2"
            >
              {enhancing ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  <span>Enhancing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Auto-Enhance Photo</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
