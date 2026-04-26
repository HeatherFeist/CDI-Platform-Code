import React, { useState, useCallback } from 'react';
import { ProductSuggestion, ImageAnalysis } from '../../services/GoogleAIService';
import { unifiedAIService } from '../../services/UnifiedAIService';

interface AIListingAssistantProps {
  onListingGenerated: (listing: ProductSuggestion) => void;
  initialData?: {
    title?: string;
    category?: string;
    condition?: string;
    description?: string;
    price?: number;
  };
}

export const AIListingAssistant: React.FC<AIListingAssistantProps> = ({
  onListingGenerated,
  initialData
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    category: initialData?.category || '',
    condition: initialData?.condition || '',
    description: initialData?.description || '',
    price: initialData?.price || 0
  });
  const [generatedListing, setGeneratedListing] = useState<ProductSuggestion | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageAnalyses, setImageAnalyses] = useState<ImageAnalysis[]>([]);

  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedImages(files);
  }, []);

  const analyzeImages = async () => {
    if (selectedImages.length === 0) return;

    setLoading(true);
    try {
      const analyses = [];
      for (const file of selectedImages) {
        const base64 = await fileToBase64(file);
        // Try to use analyzeProductImage if available in unifiedAIService, otherwise fallback to googleAIService
        let analysis: ImageAnalysis;
        if (typeof (unifiedAIService as any).analyzeProductImage === 'function') {
          analysis = await (unifiedAIService as any).analyzeProductImage(
            base64.split(',')[1],
            formData.description
          );
        } else {
          // fallback to googleAIService for image analysis if not implemented in unifiedAIService
          const { googleAIService } = await import('../../services/GoogleAIService');
          analysis = await googleAIService.analyzeProductImage(
            base64.split(',')[1],
            formData.description
          );
        }
        analyses.push(analysis);
      }
      setImageAnalyses(analyses);
      // Update form data with insights from first image
      if (analyses.length > 0) {
        const firstAnalysis = analyses[0];
        setFormData(prev => ({
          ...prev,
          description: prev.description || firstAnalysis.description,
          category: prev.category || firstAnalysis.suggestedCategories[0] || '',
          condition: prev.condition || firstAnalysis.condition
        }));
      }
    } catch (error) {
      console.error('Error analyzing images:', error);
      alert('Failed to analyze images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateListing = async () => {
    setLoading(true);
    try {
      // Use unifiedAIService for product listing generation
      const description = await unifiedAIService.generateDescription(formData);
      // Use the same formData but override description with AI-generated one
      const listing: ProductSuggestion = {
        ...formData,
        description,
        // Fallbacks for other fields (simulate what googleAIService would return)
        suggestedPrice: formData.price || 0,
        category: formData.category || '',
        tags: [],
        seoKeywords: [],
      };
      setGeneratedListing(listing);
      onListingGenerated(listing);
    } catch (error) {
      console.error('Error generating listing:', error);
      alert('Failed to generate listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="market-panel p-6">
      <div className="flex items-center mb-6">
        <div className="mr-3 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 p-2 shadow-lg shadow-indigo-950/30">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">AI Listing Assistant</h2>
          <p className="text-slate-300">Let AI help you create the perfect product listing</p>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-300">
          Product Images (AI will analyze these)
        </label>
        <div className="rounded-2xl border-2 border-dashed border-slate-700 p-6 bg-slate-950/35">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
              className="flex cursor-pointer flex-col items-center"
          >
            <svg className="mb-2 h-12 w-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm text-slate-300">
              {selectedImages.length > 0 
                ? `${selectedImages.length} images selected` 
                : 'Click to upload images or drag and drop'
              }
            </span>
          </label>
        </div>
        
        {selectedImages.length > 0 && (
          <button
            onClick={analyzeImages}
            disabled={loading}
            className="market-button-primary mt-3 px-4 py-2 disabled:opacity-50"
          >
            {loading ? 'Analyzing Images...' : 'Analyze Images with AI'}
          </button>
        )}
      </div>

      {/* Image Analysis Results */}
      {imageAnalyses.length > 0 && (
        <div className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <h3 className="mb-2 font-medium text-emerald-200">AI Image Analysis</h3>
          {imageAnalyses.map((analysis, index) => (
            <div key={index} className="mb-3 last:mb-0">
              <p className="text-sm text-slate-100">
                <strong>Image {index + 1}:</strong> {analysis.description}
              </p>
              <p className="text-xs text-emerald-200">
                Condition: {analysis.condition} | 
                Estimated Value: ${analysis.estimatedValue} |
                Suggested Categories: {analysis.suggestedCategories.join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Manual Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="market-input w-full px-3 py-2"
            placeholder="Enter product title..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="market-input w-full px-3 py-2"
          >
            <option value="">Select category...</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing & Accessories</option>
            <option value="Home & Garden">Home & Garden</option>
            <option value="Books">Books & Media</option>
            <option value="Sports">Sports & Recreation</option>
            <option value="Art">Art & Crafts</option>
            <option value="Automotive">Automotive</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Condition
          </label>
          <select
            value={formData.condition}
            onChange={(e) => setFormData({...formData, condition: e.target.value})}
            className="market-input w-full px-3 py-2"
          >
            <option value="">Select condition...</option>
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Starting Price ($)
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
            className="market-input w-full px-3 py-2"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-slate-300">
          Basic Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="market-input w-full px-3 py-2"
          rows={3}
          placeholder="Provide any details about the item..."
        />
      </div>

      <button
        onClick={generateListing}
        disabled={loading || !formData.title}
        className="market-button-primary flex w-full items-center justify-center px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating AI-Enhanced Listing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Generate AI-Enhanced Listing
          </>
        )}
      </button>

      {/* Generated Listing Preview */}
      {generatedListing && (
        <div className="mt-6 rounded-2xl border border-indigo-400/20 bg-slate-950/35 p-6">
          <div className="flex items-center mb-4">
            <svg className="mr-2 h-6 w-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-white">AI-Generated Listing</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Optimized Title</label>
              <p className="mt-1 rounded-xl border border-white/10 bg-slate-900/70 p-2 text-slate-100">{generatedListing.title}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300">Enhanced Description</label>
              <p className="mt-1 whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-900/70 p-3 text-slate-100">{generatedListing.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Suggested Price</label>
                <p className="mt-1 rounded-xl border border-white/10 bg-slate-900/70 p-2 font-semibold text-slate-100">
                  ${generatedListing.suggestedPrice}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300">Category</label>
                <p className="mt-1 rounded-xl border border-white/10 bg-slate-900/70 p-2 text-slate-100">{generatedListing.category}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300">Tags</label>
                <div className="mt-1 rounded-xl border border-white/10 bg-slate-900/70 p-2">
                  {generatedListing.tags.map((tag, index) => (
                    <span key={index} className="mb-1 mr-1 inline-block rounded-full border border-indigo-400/20 bg-indigo-500/15 px-2 py-1 text-xs text-indigo-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300">SEO Keywords</label>
              <p className="mt-1 rounded-xl border border-white/10 bg-slate-900/70 p-2 text-sm text-slate-300">
                {generatedListing.seoKeywords.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};