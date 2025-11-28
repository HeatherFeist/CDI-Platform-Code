import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Plus, ArrowLeft, Sparkles, Wand2, DollarSign, Lightbulb } from 'lucide-react';
import { supabase, Category, Listing } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { geminiAIService } from '../../services/GeminiAIService';
import { geminiImageService } from '../../services/GeminiImageService';
import ImageEnhancer from '../image/ImageEnhancer';

// Helper function to show AI configuration message
const showAIConfigMessage = () => {
  const goToSettings = window.confirm(
    'AI features require a Google Gemini API key.\n\n' +
    'Click OK to go to AI Settings and set up your free API key, or Cancel to continue without AI.'
  );
  if (goToSettings) {
    window.location.href = '/settings/ai';
  }
};

export default function EditListing() {
  const { id: listingId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [originalListing, setOriginalListing] = useState<Listing | null>(null);
  
  // AI Assistant states
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingPricing, setGeneratingPricing] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [showAITools, setShowAITools] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    condition: 'used',
    starting_bid: '',
    reserve_price: '',
    buy_now_price: '',
    bid_increment: '1',
    images: [] as string[],
  });

  useEffect(() => {
    if (!user || !listingId) {
      navigate('/');
      return;
    }
    fetchCategories();
    fetchListing();
  }, [listingId, user]);

  const fetchListing = async () => {
    if (!listingId) return;

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        setError('Listing not found');
        return;
      }

      // Check if user owns this listing
      if (data.seller_id !== user?.id) {
        setError('You do not have permission to edit this listing');
        navigate('/dashboard');
        return;
      }

      // Check if listing has bids
      const { count } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('listing_id', listingId);

      if (count && count > 0) {
        setError('Cannot edit a listing that has received bids');
        navigate(`/listings/${listingId}`);
        return;
      }

      setOriginalListing(data);
      setFormData({
        title: data.title,
        description: data.description,
        category_id: data.category_id || '',
        condition: data.condition,
        starting_bid: data.starting_bid.toString(),
        reserve_price: data.reserve_price?.toString() || '',
        buy_now_price: data.buy_now_price?.toString() || '',
        bid_increment: data.bid_increment.toString(),
        images: data.images || [],
      });
    } catch (err: any) {
      console.error('Error fetching listing:', err);
      setError(err.message || 'Failed to fetch listing');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('listing-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);

      setFormData({
        ...formData,
        images: [...formData.images, publicUrl],
      });

    } catch (error: any) {
      console.error('Error uploading image:', error);
      let errorMessage = 'Failed to upload image. ';
      
      if (error.message?.includes('bucket')) {
        errorMessage += 'Storage bucket not found. Please run SETUP_LISTING_IMAGES_BUCKET.sql in Supabase.';
      } else if (error.message?.includes('policy')) {
        errorMessage += 'Permission denied. Check storage policies in Supabase.';
      } else if (error.message?.includes('size')) {
        errorMessage += 'File too large. Max 5MB.';
      } else {
        errorMessage += error.message || 'Please check console for details.';
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleImageAdd = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files?.[0]) {
        handleImageUpload({ target } as React.ChangeEvent<HTMLInputElement>);
      }
    });
    input.click();
  };

  const handleImageRemove = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  // AI Functions (same as CreateListing)
  const generateDescription = async () => {
    if (!formData.title) {
      alert('Please enter a title first');
      return;
    }

    if (!geminiAIService.isConfigured()) {
      showAIConfigMessage();
      return;
    }

    setGeneratingDescription(true);
    try {
      const category = categories.find(c => c.id === formData.category_id);
      const description = await geminiAIService.generateDescription({
        title: formData.title,
        category: category?.name,
        condition: formData.condition,
        price: formData.starting_bid ? parseFloat(formData.starting_bid) : undefined
      });

      setFormData({ ...formData, description });
      alert('✨ AI generated description successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to generate description');
    } finally {
      setGeneratingDescription(false);
    }
  };

  const improveDescription = async () => {
    if (!formData.description) {
      alert('Please enter a description first');
      return;
    }

    if (!geminiAIService.isConfigured()) {
      showAIConfigMessage();
      return;
    }

    setGeneratingDescription(true);
    try {
      const improved = await geminiAIService.improveDescription(formData.description);
      setFormData({ ...formData, description: improved });
      alert('✨ Description improved successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to improve description');
    } finally {
      setGeneratingDescription(false);
    }
  };

  const suggestPricing = async () => {
    if (!formData.title) {
      alert('Please enter a title first');
      return;
    }

    if (!geminiAIService.isConfigured()) {
      showAIConfigMessage();
      return;
    }

    setGeneratingPricing(true);
    try {
      const category = categories.find(c => c.id === formData.category_id);
      const pricing = await geminiAIService.suggestPricing({
        title: formData.title,
        category: category?.name || 'General',
        condition: formData.condition
      });

      setFormData({
        ...formData,
        starting_bid: pricing.startingBid.toString(),
        reserve_price: pricing.reservePrice.toString(),
        buy_now_price: pricing.buyNowPrice.toString()
      });

      alert(`💰 AI Pricing Suggestion:\n\n${pricing.reasoning}`);
    } catch (error: any) {
      alert(error.message || 'Failed to suggest pricing');
    } finally {
      setGeneratingPricing(false);
    }
  };

  const analyzeFirstImage = async () => {
    // Note: Image analysis requires the original image file
    // In edit mode, we only have URLs, so this feature is not available
    alert('Image analysis is only available when creating new listings with fresh image uploads.');
    return;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user || !listingId) {
      setError('You must be logged in to edit a listing');
      return;
    }

    if (formData.images.length === 0) {
      setError('Please add at least one image');
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id || null,
        condition: formData.condition,
        images: formData.images,
        starting_bid: parseFloat(formData.starting_bid),
        current_bid: parseFloat(formData.starting_bid), // Reset current bid
        reserve_price: formData.reserve_price ? parseFloat(formData.reserve_price) : null,
        buy_now_price: formData.buy_now_price ? parseFloat(formData.buy_now_price) : null,
        bid_increment: parseFloat(formData.bid_increment),
      };

      const { error: updateError } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listingId);

      if (updateError) throw updateError;

      alert('✅ Listing updated successfully!');
      navigate(`/listings/${listingId}`);
    } catch (err: any) {
      console.error('Error updating listing:', err);
      setError(err.message || 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error && !originalListing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(`/listings/${listingId}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Listing
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Listing</h1>
          <p className="text-gray-600 mb-8">Update your auction listing details</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Vintage Camera in Excellent Condition"
                required
              />
            </div>

            {/* AI Assistant Panel - Same as CreateListing */}
            {geminiAIService.isConfigured() && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="text-purple-600" size={20} />
                    <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">BETA</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAITools(!showAITools)}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    {showAITools ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showAITools && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Let AI help you improve your listing!</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {formData.images.length > 0 && (
                        <button
                          type="button"
                          onClick={analyzeFirstImage}
                          disabled={analyzingImage}
                          className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
                        >
                          <Lightbulb size={16} />
                          <span className="text-sm font-medium">
                            {analyzingImage ? 'Analyzing...' : 'Analyze Image'}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={generateDescription}
                        disabled={generatingDescription || !formData.title}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
                      >
                        <Wand2 size={16} />
                        <span className="text-sm font-medium">
                          {generatingDescription ? 'Generating...' : 'Generate Description'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={suggestPricing}
                        disabled={generatingPricing || !formData.title}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
                      >
                        <DollarSign size={16} />
                        <span className="text-sm font-medium">
                          {generatingPricing ? 'Calculating...' : 'Suggest Pricing'}
                        </span>
                      </button>
                    </div>

                    {formData.description && (
                      <button
                        type="button"
                        onClick={improveDescription}
                        disabled={generatingDescription}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Sparkles size={16} />
                        <span className="text-sm font-medium">
                          {generatingDescription ? 'Improving...' : 'Improve Description with AI'}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your item in detail..."
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Condition
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="new">✨ New - Brand new, unused item</option>
                <option value="used">♻️ Used - Pre-owned item in good condition</option>
                <option value="handcrafted">🤲 Hand-crafted - Unique handmade item</option>
              </select>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleImageAdd}
                  disabled={uploading}
                  className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-center">
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-1"></div>
                        <span className="text-sm text-gray-600">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={24} className="mx-auto text-gray-400 mb-1" />
                        <span className="text-sm text-gray-600">Add Image</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* AI Image Enhancement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Photo Enhancement
              </label>
              <ImageEnhancer 
                onImageEnhanced={async (enhancedFile) => {
                  if (!user) return;
                  
                  setUploading(true);
                  try {
                    const fileExt = enhancedFile.name.split('.').pop();
                    const fileName = `${user.id}/${Date.now()}-enhanced.${fileExt}`;

                    const { error } = await supabase.storage
                      .from('listing-images')
                      .upload(fileName, enhancedFile);

                    if (error) throw error;

                    const { data: { publicUrl } } = supabase.storage
                      .from('listing-images')
                      .getPublicUrl(fileName);

                    setFormData({
                      ...formData,
                      images: [...formData.images, publicUrl],
                    });
                  } catch (error: any) {
                    console.error('Error uploading enhanced image:', error);
                    let errorMessage = 'Failed to upload enhanced image. ';
                    
                    if (error.message?.includes('bucket')) {
                      errorMessage += 'Storage bucket not found. See FIX_IMAGE_UPLOAD.md';
                    } else if (error.message?.includes('policy')) {
                      errorMessage += 'Permission denied. Check storage policies.';
                    } else {
                      errorMessage += error.message || 'Check console for details.';
                    }
                    
                    alert(errorMessage);
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Bid ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.starting_bid}
                  onChange={(e) => setFormData({ ...formData, starting_bid: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bid Increment ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.bid_increment}
                  onChange={(e) => setFormData({ ...formData, bid_increment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reserve Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.reserve_price}
                  onChange={(e) => setFormData({ ...formData, reserve_price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum price you'll accept</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buy Now Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.buy_now_price}
                  onChange={(e) => setFormData({ ...formData, buy_now_price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional"
                />
                <p className="text-xs text-gray-500 mt-1">Allow instant purchase</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
              <strong>Note:</strong> Updating the starting bid will reset the current bid to the new starting price.
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate(`/listings/${listingId}`)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
