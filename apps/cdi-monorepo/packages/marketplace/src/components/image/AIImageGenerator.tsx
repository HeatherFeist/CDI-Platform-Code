import React, { useState } from 'react';
import { Sparkles, Download, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { GeminiImageGenerator, ImageGenerationResult } from '../../services/GeminiImageGenerator';

interface AIImageGeneratorProps {
  productImage: File;
  onImageGenerated?: (imageUrl: string, imageData: string) => void;
  geminiApiKey: string;
}

export const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({
  productImage,
  onImageGenerated,
  geminiApiKey,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<ImageGenerationResult | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'model' | 'lifestyle' | 'studio' | 'flat-lay'>('model');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  const styles = [
    {
      id: 'model' as const,
      name: 'On Model',
      description: 'Show product worn by a professional model',
      icon: '👤',
    },
    {
      id: 'lifestyle' as const,
      name: 'Lifestyle',
      description: 'Product in real-life setting',
      icon: '🌟',
    },
    {
      id: 'studio' as const,
      name: 'Studio',
      description: 'Clean white background',
      icon: '📸',
    },
    {
      id: 'flat-lay' as const,
      name: 'Flat Lay',
      description: 'Styled from above',
      icon: '🎨',
    },
  ];

  const handleGenerateWithStyle = async () => {
    if (!geminiApiKey) {
      alert('Please add your Gemini API key in Settings first');
      return;
    }

    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const generator = new GeminiImageGenerator(geminiApiKey);
      const result = await generator.generateProductPhoto(
        productImage,
        selectedStyle,
        customPrompt
      );

      setGeneratedResult(result);

      if (result.success && result.imageUrl && result.imageData && onImageGenerated) {
        onImageGenerated(result.imageUrl, result.imageData);
      }
    } catch (error: any) {
      setGeneratedResult({
        success: false,
        error: error.message || 'Failed to generate image',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateWithCustomPrompt = async () => {
    if (!geminiApiKey) {
      alert('Please add your Gemini API key in Settings first');
      return;
    }

    if (!customPrompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGeneratedResult(null);

    try {
      const generator = new GeminiImageGenerator(geminiApiKey);
      const result = await generator.generateProductImage({
        prompt: customPrompt,
        referenceImage: productImage,
      });

      setGeneratedResult(result);

      if (result.success && result.imageUrl && result.imageData && onImageGenerated) {
        onImageGenerated(result.imageUrl, result.imageData);
      }
    } catch (error: any) {
      setGeneratedResult({
        success: false,
        error: error.message || 'Failed to generate image',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedResult?.success && generatedResult.imageData && generatedResult.mimeType) {
      const generator = new GeminiImageGenerator(geminiApiKey);
      generator.downloadImage(
        generatedResult.imageData,
        generatedResult.mimeType,
        'ai-generated-product-photo'
      );
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          AI Product Photo Generator
        </h3>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
          NEW
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Transform your product photo into professional marketplace images using AI
      </p>

      {/* Style Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Choose a Style:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => {
                setSelectedStyle(style.id);
                setShowCustomPrompt(false);
              }}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedStyle === style.id && !showCustomPrompt
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="text-2xl mb-1">{style.icon}</div>
              <div className="text-sm font-medium text-gray-900">{style.name}</div>
              <div className="text-xs text-gray-500">{style.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt Toggle */}
      <button
        onClick={() => setShowCustomPrompt(!showCustomPrompt)}
        className="text-sm text-purple-600 hover:text-purple-700 font-medium mb-4 flex items-center gap-1"
      >
        {showCustomPrompt ? '← Back to styles' : '✨ Or write a custom prompt'}
      </button>

      {/* Custom Prompt Input */}
      {showCustomPrompt && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Prompt:
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Example: Show this t-shirt on a female model in a casual outdoor park setting with natural sunlight"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
          />
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={showCustomPrompt ? handleGenerateWithCustomPrompt : handleGenerateWithStyle}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating AI Image...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate AI Product Photo
          </>
        )}
      </button>

      {/* Generated Image Display */}
      {generatedResult && (
        <div className="mt-4">
          {generatedResult.success ? (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border-2 border-green-200">
                <img
                  src={generatedResult.imageUrl}
                  alt="AI Generated"
                  className="w-full h-auto"
                />
                <div className="absolute top-2 right-2">
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    ✓ Generated
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setGeneratedResult(null)}
                  className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Another
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Generation Failed</p>
                  <p className="text-sm text-red-600 mt-1">{generatedResult.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>💡 Tip:</strong> AI-generated images work best when you upload a clear photo of your product.
          The AI will reimagine it in professional settings perfect for online selling!
        </p>
      </div>
    </div>
  );
};
