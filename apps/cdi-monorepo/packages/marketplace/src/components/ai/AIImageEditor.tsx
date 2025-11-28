import { useState, useEffect } from 'react';
import { Wand2, Download, Loader2, Image as ImageIcon, Sparkles, Lock, Crown, AlertCircle } from 'lucide-react';
import { openAIImageEditor } from '../../services/OpenAIImageEditor';
import { AIUsageTracker } from '../../services/AIUsageTracker';
import { useAuth } from '../../contexts/AuthContext';

interface AIImageEditorProps {
  currentImage: File | string; // File object or URL
  onImageGenerated: (imageUrl: string) => void;
  userTier: 'free' | 'partner' | 'professional' | 'enterprise'; // User's subscription tier
}

export function AIImageEditor({ currentImage, onImageGenerated, userTier }: AIImageEditorProps) {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [usageStats, setUsageStats] = useState({ current: 0, limit: 0, canUse: true });

  // Define which tiers get access to AI image generation
  const hasAccess = ['partner', 'professional', 'enterprise'].includes(userTier);
  const isPremiumTier = ['professional', 'enterprise'].includes(userTier);

  // Check usage limits on mount
  useEffect(() => {
    if (user && hasAccess) {
      checkUsageLimits();
    }
  }, [user, hasAccess]);

  const checkUsageLimits = async () => {
    if (!user) return;
    
    const limits = await AIUsageTracker.checkLimit(user.id, 'image_editing');
    setUsageStats({
      current: limits.current_usage,
      limit: limits.tier_limit,
      canUse: limits.can_use
    });
  };

  const handleQuickEdit = async (
    style: 'model' | 'lifestyle' | 'studio' | 'wall' | 'flatlay',
    gender?: 'male' | 'female'
  ) => {
    if (!usageStats.canUse) {
      setError(`You've reached your monthly limit of ${usageStats.limit} images. Upgrade to get more!`);
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // Convert to File if it's a URL
      let imageFile: File;
      if (typeof currentImage === 'string') {
        imageFile = await openAIImageEditor.urlToFile(currentImage);
      } else {
        imageFile = currentImage;
      }

      const result = await openAIImageEditor.generateProductPhoto(
        imageFile,
        style,
        gender,
        user?.id
      );

      if (result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        setError(null);
        // Refresh usage stats
        await checkUsageLimits();
      } else {
        setError(result.error || 'Failed to generate image');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const handleCustomPrompt = async () => {
    if (!customPrompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      let imageFile: File;
      if (typeof currentImage === 'string') {
        imageFile = await openAIImageEditor.urlToFile(currentImage);
      } else {
        imageFile = currentImage;
      }

      const result = await openAIImageEditor.editProductImage(
        imageFile,
        customPrompt
      );

      if (result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        setError(null);
      } else {
        setError(result.error || 'Failed to generate image');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const handleUseImage = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage);
      setGeneratedImage(null);
    }
  };

  const handleDownload = async () => {
    if (generatedImage) {
      await openAIImageEditor.downloadImage(generatedImage, 'ai-generated-product');
    }
  };

  // If user doesn't have access, show upgrade prompt
  if (!hasAccess) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-300">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            AI Image Editor - Premium Feature
          </h3>
          <p className="text-gray-600 mb-4">
            Transform your product photos with AI - add models, change backgrounds, create lifestyle shots
          </p>
          
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-gray-900 mb-2">What you can do:</p>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>✨ Put products on professional models</li>
              <li>🏠 Create lifestyle setting photos</li>
              <li>📸 Generate studio backgrounds</li>
              <li>🖼️ Show art on gallery walls</li>
              <li>✨ Unlimited variations and edits</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-purple-50 rounded-lg p-4 mb-4 border border-green-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-green-600" />
              <p className="font-semibold text-gray-900">Available with Partner tier and above</p>
            </div>
            <p className="text-sm text-gray-600">
              Upgrade to unlock AI image generation and establish your store as a trusted seller
            </p>
          </div>

          <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-purple-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
            Upgrade to Partner Tier
          </button>

          <p className="text-xs text-gray-500 mt-3">
            💡 You still have access to AI text generation for descriptions and titles
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Image Editor</h3>
        {isPremiumTier && (
          <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full">
            {userTier.toUpperCase()}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Transform your product photos with AI - add models, change backgrounds, create lifestyle shots
      </p>

      {/* Usage Stats */}
      {usageStats.limit > 0 && (
        <div className="bg-white rounded-lg p-3 mb-4 border border-purple-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Monthly Usage:</span>
            <span className={`font-semibold ${usageStats.current >= usageStats.limit ? 'text-red-600' : 'text-green-600'}`}>
              {usageStats.current} / {usageStats.limit} images
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${usageStats.current >= usageStats.limit ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min((usageStats.current / usageStats.limit) * 100, 100)}%` }}
            />
          </div>
          {!usageStats.canUse && (
            <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
              <AlertCircle size={14} />
              <span>Monthly limit reached. Upgrade for more!</span>
            </div>
          )}
        </div>
      )}

      {/* Quick Style Buttons */}
      <div className="space-y-3 mb-4">
        <p className="text-sm font-medium text-gray-700">Quick Styles:</p>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleQuickEdit('model', 'female')}
            disabled={generating}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors text-sm disabled:opacity-50"
          >
            👩 Female Model
          </button>
          
          <button
            onClick={() => handleQuickEdit('model', 'male')}
            disabled={generating}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors text-sm disabled:opacity-50"
          >
            👨 Male Model
          </button>
          
          <button
            onClick={() => handleQuickEdit('lifestyle')}
            disabled={generating}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors text-sm disabled:opacity-50"
          >
            🏠 Lifestyle Shot
          </button>
          
          <button
            onClick={() => handleQuickEdit('studio')}
            disabled={generating}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors text-sm disabled:opacity-50"
          >
            📸 Studio Background
          </button>
          
          <button
            onClick={() => handleQuickEdit('wall')}
            disabled={generating}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors text-sm disabled:opacity-50"
          >
            🖼️ On Wall
          </button>
          
          <button
            onClick={() => handleQuickEdit('flatlay')}
            disabled={generating}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors text-sm disabled:opacity-50"
          >
            ✨ Flat Lay
          </button>
        </div>
      </div>

      {/* Custom Prompt */}
      <div className="mb-4">
        <button
          onClick={() => setShowCustomPrompt(!showCustomPrompt)}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          {showCustomPrompt ? '− Hide Custom Prompt' : '+ Use Custom Prompt'}
        </button>

        {showCustomPrompt && (
          <div className="mt-3">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="E.g., Show this t-shirt on a person at the beach at sunset"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              rows={3}
            />
            <button
              onClick={handleCustomPrompt}
              disabled={generating || !customPrompt.trim()}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              <Wand2 size={16} />
              Generate Custom
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {generating && (
        <div className="flex items-center justify-center py-8 bg-white rounded-lg border-2 border-dashed border-purple-300">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Generating image with AI...</p>
            <p className="text-xs text-gray-500 mt-1">This usually takes 10-30 seconds</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Generated Image Preview */}
      {generatedImage && !generating && (
        <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
          <p className="text-sm font-medium text-gray-700 mb-2">Generated Image:</p>
          <img
            src={generatedImage}
            alt="AI Generated"
            className="w-full rounded-lg mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={handleUseImage}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <ImageIcon size={16} />
              Use This Image
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>💡 Tips:</strong> AI image editing works best with PNG images that have transparent backgrounds. 
          For JPEG photos, try "Studio Background" or "Lifestyle Shot" for best results.
        </p>
      </div>
    </div>
  );
}
