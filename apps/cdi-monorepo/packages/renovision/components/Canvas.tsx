import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApiKey } from '../hooks/useApiKey';
import { useAuth } from '../contexts/SupabaseAuthContext';
import ApiKeyModal from './ApiKeyModal';
import Spinner from './Spinner';
import { Product, PaintColor } from '../types';
import { generateEditedSceneFromText } from '../services/geminiService';
import { FeatureLock } from './common/FeatureLock';

const Canvas: React.FC = (): React.ReactElement => {
  // API Key Management
  const { apiKey, isLoaded: isApiKeyLoaded, hasValidKey, saveApiKey, clearApiKey } = useApiKey();
  const { user } = useAuth();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  
  // Canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [processedImage, setProcessedImage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  
  // History for undo functionality
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  
  // UI state
  const [error, setError] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Chat state
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Image upload handler
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setOriginalImage(url);
    setProcessedImage('');
    setImageHistory([]);
    setError('');
  }, []);

  // Trigger file input
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Process image with AI (placeholder)
  const processImage = useCallback(async () => {
    if (!hasValidKey) {
      setError('Please set up your API key first');
      setIsApiKeyModalOpen(true);
      return;
    }

    if (!originalImage) {
      setError('Please upload an image first');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      
      // Placeholder for actual AI processing
      console.log('Processing image with Gemini API...');
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, just use the original image as processed
      setProcessedImage(originalImage);
      setIsProcessing(false);
    } catch (err) {
      setError('Failed to process image with AI');
      setIsProcessing(false);
      console.error('Image processing error:', err);
    }
  }, [hasValidKey, originalImage]);

  // Helper to convert data URL to File
  const dataURLtoFile = useCallback((dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type: mime});
  }, []);

  // Undo last edit
  const handleUndo = useCallback(() => {
    if (imageHistory.length === 0) {
      setError('Nothing to undo');
      return;
    }
    
    const newHistory = [...imageHistory];
    const previousImage = newHistory.pop();
    setImageHistory(newHistory);
    
    if (previousImage) {
      setProcessedImage(previousImage);
    } else {
      setProcessedImage('');
    }
  }, [imageHistory]);

  // Download current image
  const handleDownload = useCallback(() => {
    const imageToDownload = processedImage || originalImage;
    if (!imageToDownload) {
      setError('No image to download');
      return;
    }

    const link = document.createElement('a');
    link.href = imageToDownload;
    link.download = `edited-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processedImage, originalImage]);

  // Save to local storage (placeholder for save to server)
  const handleSave = useCallback(() => {
    const imageToSave = processedImage || originalImage;
    if (!imageToSave) {
      setError('No image to save');
      return;
    }

    try {
      // For now, just download it
      // In future, this could save to a database or cloud storage
      handleDownload();
      
      // Show success message
      const successMessage = { 
        role: 'model' as const, 
        parts: [{ text: 'Image saved successfully! You can find it in your downloads folder.' }] 
      };
      setChatHistory(prev => [...prev, successMessage]);
    } catch (err) {
      setError('Failed to save image');
      console.error('Save error:', err);
    }
  }, [processedImage, originalImage, handleDownload]);

  // Chat message handler
  const handleSendMessage = useCallback(async (message: string) => {
    if (!hasValidKey) {
      setChatError('Please set up your API key first');
      return;
    }

    if (!originalImage) {
      setChatError('Please upload an image first');
      return;
    }

    setIsChatLoading(true);
    setChatError(null);
    
    try {
      // Add user message to history
      const userMessage = { role: 'user' as const, parts: [{ text: message }] };
      setChatHistory(prev => [...prev, userMessage]);
      
      console.log('Processing image edit with Gemini AI:', message);
      
      // Save current processed image to history before making changes
      if (processedImage) {
        setImageHistory(prev => [...prev, processedImage]);
      }
      
      // Use the processed image if it exists, otherwise use the original
      // This allows iterative edits to build on previous changes
      const currentImageUrl = processedImage || originalImage;
      
      // Convert the current image (data URL) to a File object
      let currentImageFile: File;
      if (processedImage && processedImage.startsWith('data:')) {
        // If we have a processed image as data URL, convert it to File
        currentImageFile = dataURLtoFile(processedImage, 'current-image.jpg');
        console.log('Using processed image for iterative edit');
      } else if (selectedFile) {
        // If no processed image yet, use the original uploaded file
        currentImageFile = selectedFile;
        console.log('Using original image for first edit');
      } else {
        throw new Error('No image file available');
      }
      
      // Call Gemini service to edit the image based on text prompt
      const { finalImageUrl, finalPrompt } = await generateEditedSceneFromText(
        currentImageFile,
        message,
        apiKey
      );
      
      console.log('Image edit completed successfully');
      
      // Update the processed image
      setProcessedImage(finalImageUrl);
      
      // Add AI response to chat
      const aiResponse = { 
        role: 'model' as const, 
        parts: [{ text: `I've applied your requested edit: "${message}". The updated image is now displayed on the canvas. You can toggle between the original and edited version using the "Show Original" button.` }] 
      };
      setChatHistory(prev => [...prev, aiResponse]);
      setIsChatLoading(false);
      
    } catch (error) {
      console.error('Error processing image edit:', error);
      setChatError(error instanceof Error ? error.message : 'Failed to process image edit');
      
      // Add error message to chat
      const errorResponse = { 
        role: 'model' as const, 
        parts: [{ text: `Sorry, I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or rephrase your request.` }] 
      };
      setChatHistory(prev => [...prev, errorResponse]);
      setIsChatLoading(false);
    }
  }, [hasValidKey, originalImage, processedImage, selectedFile, apiKey, dataURLtoFile, imageHistory]);

  // Canvas drawing effect
  useEffect(() => {
    if (!canvasRef.current || !originalImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageToShow = showOriginal ? originalImage : (processedImage || originalImage);
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = Math.min(img.width, 800);
      canvas.height = (img.height * canvas.width) / img.width;
      
      // Clear and draw image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    
    img.src = imageToShow;
  }, [originalImage, processedImage, showOriginal]);

  if (!isApiKeyLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <FeatureLock
      requiredSetup={['geminiApiKey']}
      featureName="AI Design Studio"
    >
      <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Constructive Home Reno Design Tool</h1>
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              )}
              <button
                onClick={() => setIsApiKeyModalOpen(true)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  hasValidKey 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}
              >
                {hasValidKey ? '✓ API Key Set' : 'Set API Key'}
              </button>
              <a 
                href="/business/dashboard"
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Business Portal
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="material-icons text-red-400">error</i>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!originalImage ? (
          /* Welcome / API Key Alert Section */
          <div className="text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Big Alert about API Key */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-xl p-8 text-white">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="material-icons text-4xl">info</span>
                    </div>
                  </div>
                  <div className="text-left flex-1">
                    <h2 className="text-2xl font-bold mb-2">🚀 Welcome to Constructive AI Design Studio!</h2>
                    <p className="text-lg text-white/90 mb-4">
                      Don't forget to get your API key to unlock powerful AI features!
                    </p>
                    <div className="bg-white/10 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold mb-2">✨ What you can do with AI:</p>
                      <ul className="text-sm space-y-1 text-white/90">
                        <li>• Transform room designs instantly</li>
                        <li>• Get smart material recommendations</li>
                        <li>• AI-powered cost estimates</li>
                        <li>• Visualize before & after</li>
                      </ul>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
                      >
                        <span className="material-icons mr-2">key</span>
                        Get Free API Key from Google
                      </a>
                      <button
                        onClick={() => setIsApiKeyModalOpen(true)}
                        className="inline-flex items-center justify-center px-6 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition border-2 border-white/40"
                      >
                        <span className="material-icons mr-2">settings</span>
                        Set API Key
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Portal CTA */}
              <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <span className="material-icons text-white text-4xl">business</span>
                    </div>
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Get Started?</h3>
                    <p className="text-gray-600 mb-4">
                      Head to the Business Portal to manage customers, create estimates, and run your business efficiently.
                    </p>
                    <a
                      href="/business/dashboard"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition shadow-lg"
                    >
                      <span className="material-icons mr-2">arrow_forward</span>
                      Go to Business Portal
                    </a>
                  </div>
                </div>
              </div>

              {/* Optional: Upload Section (de-emphasized) */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Want to try the AI design tool? Upload a room photo below.
                </p>
                <div className="text-center">
                  <button
                    onClick={handleUploadClick}
                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    <span className="material-icons mr-2 text-sm">add_photo_alternate</span>
                    Upload Room Photo (Optional)
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Design Interface */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Canvas Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Design Canvas</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowOriginal(!showOriginal)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                    >
                      {showOriginal ? 'Show Processed' : 'Show Original'}
                    </button>
                    <button
                      onClick={processImage}
                      disabled={isProcessing || !hasValidKey}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isProcessing ? 'Processing...' : 'Process with AI'}
                    </button>
                  </div>
                </div>
                
                <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                      <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                        <Spinner />
                        <span className="text-gray-900">Processing image with AI...</span>
                      </div>
                    </div>
                  )}
                  
                  <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto block"
                  />
                </div>

                {/* Image Info */}
                {selectedFile && (
                  <div className="mt-4 text-sm text-gray-600">
                    <p><strong>File:</strong> {selectedFile.name}</p>
                    <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleUndo}
                    disabled={imageHistory.length === 0}
                    className="px-4 py-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
                    title="Undo last edit"
                  >
                    <span>↶</span> Undo
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    disabled={!originalImage}
                    className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
                    title="Download image"
                  >
                    <span>⬇</span> Download
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={!originalImage}
                    className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
                    title="Save image"
                  >
                    <span>💾</span> Save
                  </button>

                  <button
                    onClick={processImage}
                    disabled={!hasValidKey || isProcessing}
                    className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isProcessing ? 'Processing...' : 'Enhance Room'}
                  </button>
                  
                  <button
                    onClick={handleUploadClick}
                    className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    <i className="material-icons mr-2 text-sm">add_photo_alternate</i>
                    New Photo
                  </button>

                  <button
                    onClick={() => setIsApiKeyModalOpen(true)}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                  >
                    API Settings
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/business/dashboard'}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium col-span-3"
                  >
                    Business Portal
                  </button>
                </div>
              </div>
            </div>

            {/* AI Chat Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border flex flex-col h-[calc(100vh-200px)] sticky top-6">
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 flex-shrink-0">
                  <div className="w-10 h-10 bg-zinc-800 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    DP
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Design Pro</h3>
                    <p className="text-xs text-gray-500">AI Design Assistant</p>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-grow p-4 overflow-y-auto space-y-3">
                  {chatHistory.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i className="material-icons text-gray-400 text-3xl">chat</i>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Welcome! I'm your AI Design Assistant.</p>
                      <p className="text-xs text-gray-500">Ask me about design ideas, color schemes, or project estimates!</p>
                    </div>
                  )}
                  
                  {chatHistory.map((chat, index) => (
                    <div key={index} className={`flex gap-2 ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {chat.role === 'model' && (
                        <div className="w-7 h-7 bg-zinc-800 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                          DP
                        </div>
                      )}
                      <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                        chat.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-gray-100 text-gray-900 rounded-bl-none'
                      }`}>
                        {chat.parts.map((part, i) => (
                          <p key={i} className="whitespace-pre-wrap">{part.text}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {isChatLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-7 h-7 bg-zinc-800 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                        DP
                      </div>
                      <div className="bg-gray-100 rounded-lg rounded-bl-none p-3">
                        <div className="flex items-center gap-2">
                          <Spinner />
                          <span className="text-gray-600 text-xs">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {chatError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs">
                      {chatError}
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-200 flex-shrink-0">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem('chatMessage') as HTMLInputElement;
                    if (input.value.trim() && !isChatLoading) {
                      handleSendMessage(input.value);
                      input.value = '';
                    }
                  }} className="flex items-center gap-2">
                    <input
                      type="text"
                      name="chatMessage"
                      placeholder="Ask for design advice..."
                      className="flex-grow bg-gray-50 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isChatLoading}
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading}
                      className="p-2 bg-zinc-800 text-white rounded-full hover:bg-zinc-900 disabled:bg-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
                      aria-label="Send message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </button>
                  </form>
                  
                  {!hasValidKey && (
                    <p className="text-xs text-amber-600 mt-2 text-center">
                      ⚠️ Set up your API key to enable chat
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Modals */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={saveApiKey}
        currentApiKey={apiKey}
      />
    </div>
    </FeatureLock>
  );
};

export default Canvas;