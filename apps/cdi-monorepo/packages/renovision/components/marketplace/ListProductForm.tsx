import React, { useState } from 'react';
import { Upload, Sparkles, DollarSign, Hammer, Tag, Package, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabase';
import { SavedDesignsPicker } from '../shared/SavedDesignsPicker';

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
}

export const ListProductForm: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'good',
    quantity: 1,
    auctionEnabled: false,
    auctionStartPrice: '',
    auctionDays: 7
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [aiDesignImages, setAIDesignImages] = useState<string[]>([]);
  const [showAIDesignPicker, setShowAIDesignPicker] = useState(false);
  
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [suggestedCategory, setSuggestedCategory] = useState<ProductCategory | null>(null);
  const [aiConfidence, setAIConfidence] = useState<number>(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // Load categories on mount
  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // AI categorization suggestion (when title/description changes)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.title || formData.description) {
        suggestCategory();
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timer);
  }, [formData.title, formData.description]);

  const suggestCategory = async () => {
    try {
      // Call Supabase function for AI categorization
      const { data, error } = await supabase.rpc('suggest_product_category', {
        product_title: formData.title,
        product_description: formData.description
      });

      if (error) throw error;

      // Get category details
      const { data: categoryData } = await supabase
        .from('product_categories')
        .select('*')
        .eq('id', data)
        .single();

      setSuggestedCategory(categoryData);
      setAIConfidence(0.85); // Placeholder - real AI would return confidence

      // Auto-select if not already chosen
      if (!selectedCategory) {
        setSelectedCategory(data);
      }
    } catch (err) {
      console.error('AI categorization error:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setLoading(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `marketplace/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('designs')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('designs')
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
      }

      setUploadedImages([...uploadedImages, ...newImages]);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAIDesigns = (designs: any[]) => {
    const imageUrls = designs.map(d => d.thumbnail_url).filter(Boolean);
    setAIDesignImages([...aiDesignImages, ...imageUrls]);
    setShowAIDesignPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      // Combine all images
      const allImages = [...uploadedImages, ...aiDesignImages];
      if (allImages.length === 0) {
        throw new Error('Please add at least one image');
      }

      // Prepare auction data
      const auctionEndDate = formData.auctionEnabled
        ? new Date(Date.now() + formData.auctionDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Insert product
      const { data, error } = await supabase
        .from('marketplace_products')
        .insert({
          seller_id: user.id,
          category_id: selectedCategory,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          condition: formData.condition,
          quantity: formData.quantity,
          auction_enabled: formData.auctionEnabled,
          auction_start_price: formData.auctionEnabled ? parseFloat(formData.auctionStartPrice) : null,
          auction_end_date: auctionEndDate,
          images: allImages,
          primary_image: allImages[0],
          ai_suggested_category: suggestedCategory?.id,
          ai_confidence_score: aiConfidence,
          status: aiConfidence >= 0.9 ? 'active' : 'pending' // Auto-approve high confidence
        })
        .select()
        .single();

      if (error) throw error;

      setSuccess(true);
      
      // Reset form
      setTimeout(() => {
        window.location.href = '/marketplace/seller-dashboard';
      }, 2000);

    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to list product');
    } finally {
      setLoading(false);
    }
  };

  const allImages = [...uploadedImages, ...aiDesignImages];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">List New Item</h1>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">✅ Product listed successfully! Redirecting...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Vintage Oak Dining Table"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* AI Category Suggestion */}
          {suggestedCategory && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    AI suggests: <span className="font-bold">{suggestedCategory.name}</span>
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Confidence: {Math.round(aiConfidence * 100)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a category...</option>
              {categories.filter(c => !c.parent_id).map(category => (
                <optgroup key={category.id} label={category.name}>
                  <option value={category.id}>{category.name} (All)</option>
                  {categories
                    .filter(sub => sub.parent_id === category.id)
                    .map(sub => (
                      <option key={sub.id} value={sub.id}>
                        └─ {sub.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your item in detail..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition *
            </label>
            <div className="grid grid-cols-5 gap-3">
              {['new', 'like-new', 'good', 'fair', 'salvage'].map(condition => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => setFormData({ ...formData, condition })}
                  className={`px-4 py-2 rounded-lg border-2 capitalize transition-all ${
                    formData.condition === condition
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos * (at least 1)
            </label>
            
            {/* Upload buttons */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Upload Photos</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowAIDesignPicker(true)}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition"
              >
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-gray-600">AI Generated Images</p>
              </button>
            </div>

            {/* Image previews */}
            {allImages.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {allImages.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`Product ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (uploadedImages.includes(url)) {
                          setUploadedImages(uploadedImages.filter(u => u !== url));
                        } else {
                          setAIDesignImages(aiDesignImages.filter(a => a !== url));
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price * (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Auction Toggle */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.auctionEnabled}
                onChange={(e) => setFormData({ ...formData, auctionEnabled: e.target.checked })}
                className="w-5 h-5 text-blue-600"
              />
              <div>
                <p className="font-medium">Enable Auction</p>
                <p className="text-sm text-gray-600">Let buyers bid on this item</p>
              </div>
            </label>

            {formData.auctionEnabled && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Bid
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.auctionStartPrice}
                      onChange={(e) => setFormData({ ...formData, auctionStartPrice: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required={formData.auctionEnabled}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (days)
                  </label>
                  <select
                    value={formData.auctionDays}
                    onChange={(e) => setFormData({ ...formData, auctionDays: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || allImages.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Listing Product...' : 'List Product'}
          </button>

          {aiConfidence >= 0.9 && (
            <p className="text-sm text-green-600 text-center">
              ✨ High confidence AI categorization - will be listed immediately!
            </p>
          )}
          {aiConfidence > 0 && aiConfidence < 0.9 && (
            <p className="text-sm text-yellow-600 text-center">
              ⚠️ Moderate confidence - will be reviewed before listing
            </p>
          )}
        </form>
      </div>

      {/* AI Design Picker Modal */}
      {showAIDesignPicker && (
        <SavedDesignsPicker
          onSelect={handleSelectAIDesigns}
          onClose={() => setShowAIDesignPicker(false)}
          allowMultiSelect={true}
          columns={4}
          maxHeight="600px"
        />
      )}
    </div>
  );
};
