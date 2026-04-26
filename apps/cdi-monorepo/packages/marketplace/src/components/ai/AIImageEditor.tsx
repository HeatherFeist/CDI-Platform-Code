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
      <div className="market-panel border border-indigo-400/20 p-6">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-xl shadow-indigo-950/40">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-white">
            AI Image Editor - Premium Feature
          </h3>
          <p className="mb-4 text-slate-300">
            Transform your product photos with AI - add models, change backgrounds, create lifestyle shots
          </p>
          
          <div className="mb-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <p className="mb-2 text-sm font-medium text-white">What you can do:</p>
            <ul className="space-y-1 text-left text-sm text-slate-300">
              <li>✨ Put products on professional models</li>
              <li>🏠 Create lifestyle setting photos</li>
              <li>📸 Generate studio backgrounds</li>
              <li>🖼️ Show art on gallery walls</li>
              <li>✨ Unlimited variations and edits</li>
            </ul>
          </div>

          <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-emerald-300" />
              <p className="font-semibold text-white">Available with Partner tier and above</p>
            </div>
            <p className="text-sm text-slate-300">
              Upgrade to unlock AI image generation and establish your store as a trusted seller
            </p>
          </div>

          <button className="market-button-primary px-6 py-3 font-semibold">
            Upgrade to Partner Tier
          </button>

          <p className="mt-3 text-xs text-slate-500">
            💡 You still have access to AI text generation for descriptions and titles
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="market-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-indigo-300" />
        <h3 className="text-lg font-semibold text-white">AI Image Editor</h3>
        {isPremiumTier && (
          <span className="rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 px-2 py-1 text-xs font-bold text-white">
            {userTier.toUpperCase()}
          </span>
        )}
      </div>

      <p className="mb-4 text-sm text-slate-300">
        Transform your product photos with AI - add models, change backgrounds, create lifestyle shots
      </p>

      {/* Usage Stats */}
      {usageStats.limit > 0 && (
        <div className="mb-4 rounded-xl border border-white/10 bg-slate-950/35 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Monthly Usage:</span>
            <span className={`font-semibold ${usageStats.current >= usageStats.limit ? 'text-red-300' : 'text-emerald-300'}`}>
              {usageStats.current} / {usageStats.limit} images
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
            <div 
              className={`h-2 rounded-full transition-all ${usageStats.current >= usageStats.limit ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min((usageStats.current / usageStats.limit) * 100, 100)}%` }}
            />
          </div>
          {!usageStats.canUse && (
            <div className="mt-2 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle size={14} />
              <span>Monthly limit reached. Upgrade for more!</span>
            </div>
          )}
        </div>
      )}

      {/* Quick Style Buttons */}
      <div className="space-y-3 mb-4">
        <p className="text-sm font-medium text-slate-300">Quick Styles:</p>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleQuickEdit('model', 'female')}
            disabled={generating}
            className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white disabled:opacity-50"
          >
            👩 Female Model
          </button>
          
          <button
            onClick={() => handleQuickEdit('model', 'male')}
            disabled={generating}
            className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white disabled:opacity-50"
          >
            👨 Male Model
          </button>
          
          <button
            onClick={() => handleQuickEdit('lifestyle')}
            disabled={generating}
            className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white disabled:opacity-50"
          >
            🏠 Lifestyle Shot
          </button>
          
          <button
            onClick={() => handleQuickEdit('studio')}
            disabled={generating}
            className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white disabled:opacity-50"
          >
            📸 Studio Background
          </button>
          
          <button
            onClick={() => handleQuickEdit('wall')}
            disabled={generating}
            className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white disabled:opacity-50"
          >
            🖼️ On Wall
          </button>
          
          <button
            onClick={() => handleQuickEdit('flatlay')}
            disabled={generating}
            className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white disabled:opacity-50"
          >
            ✨ Flat Lay
          </button>
        </div>
      </div>

      {/* Custom Prompt */}
      <div className="mb-4">
        <button
          onClick={() => setShowCustomPrompt(!showCustomPrompt)}
          className="text-sm font-medium text-indigo-300 hover:text-indigo-200"
        >
          {showCustomPrompt ? '− Hide Custom Prompt' : '+ Use Custom Prompt'}
        </button>

        {showCustomPrompt && (
          <div className="mt-3">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="E.g., Show this t-shirt on a person at the beach at sunset"
              className="market-input w-full px-3 py-2 text-sm"
              rows={3}
            />
            <button
              onClick={handleCustomPrompt}
              disabled={generating || !customPrompt.trim()}
              className="market-button-primary mt-2 flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
            >
              <Wand2 size={16} />
              Generate Custom
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {generating && (
        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-indigo-400/30 bg-slate-950/35 py-8">
          <div className="text-center">
            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-indigo-300" />
            <p className="text-sm text-slate-300">Generating image with AI...</p>
            <p className="mt-1 text-xs text-slate-500">This usually takes 10-30 seconds</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Generated Image Preview */}
      {generatedImage && !generating && (
        <div className="rounded-2xl border border-indigo-400/20 bg-slate-950/35 p-4">
          <p className="mb-2 text-sm font-medium text-slate-300">Generated Image:</p>
          <img
            src={generatedImage}
            alt="AI Generated"
            className="mb-3 w-full rounded-xl"
          />
          <div className="flex gap-2">
            <button
              onClick={handleUseImage}
              className="market-button-primary flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium"
            >
              <ImageIcon size={16} />
              Use This Image
            </button>
            <button
              onClick={handleDownload}
              className="market-button-secondary flex items-center gap-2 px-4 py-2 text-sm"
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3">
        <p className="text-xs text-cyan-100">
          <strong>💡 Tips:</strong> AI image editing works best with PNG images that have transparent backgrounds. 
          For JPEG photos, try "Studio Background" or "Lifestyle Shot" for best results.
        </p>
      </div>
    </div>
  );
}
