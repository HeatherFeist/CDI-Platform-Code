import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, ArrowLeft, Sparkles, Wand2, DollarSign, Lightbulb, Repeat, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase, DeliveryOption } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { geminiAIService } from '../../services/GeminiAIService';
import { geminiImageService } from '../../services/GeminiImageService';
import { GeminiPricingService } from '../../services/GeminiPricingService';
import { GeminiProductImageService } from '../../services/GeminiProductImageService';
import { GeminiCategorizationService } from '../../services/GeminiCategorizationService';
import ImageEnhancer from '../image/ImageEnhancer';
import { AIImageEditor } from '../ai/AIImageEditor';
import ListingTypeSelector from './ListingTypeSelector';
import StorePricingFields from './StorePricingFields';
import DeliveryOptions from './DeliveryOptions';

interface ListingFormData {
  title: string;
  description: string;
  category_id: string;
  style?: string;
  condition: string;
  starting_bid: string;
  reserve_price: string;
  buy_now_price: string;
  bid_increment: string;
  duration: string;
  images: string[];
  stock_quantity: string;
  compare_at_price: string;
  allow_offers: boolean;
  trade_for: string;
  trade_preferences: string;
  delivery_options: DeliveryOption[];
  seller_address: string;
  pickup_instructions: string;
}

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

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [listingType, setListingType] = useState<'auction' | 'store' | 'trade'>('store');
  
  // AI Assistant states
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingPricing, setGeneratingPricing] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [showAITools, setShowAITools] = useState(true);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [userTier, setUserTier] = useState<'free' | 'partner' | 'professional' | 'enterprise'>('free');

  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    category_id: '',
    style: '',
    condition: 'used',
    starting_bid: '',
    reserve_price: '',
    buy_now_price: '',
    bid_increment: '1',
    duration: '7',
    images: [] as string[],
    // Store-specific fields
    stock_quantity: '1',
    compare_at_price: '',
    allow_offers: false,
    // Trade-specific fields
    trade_for: '',
    trade_preferences: '',
    // Delivery options
    delivery_options: [] as DeliveryOption[],
    seller_address: '',
    pickup_instructions: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchUserTier();
    // Load Gemini API key from localStorage
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setGeminiApiKey(storedKey);
    }
  }, [user]);

  const fetchUserTier = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('member_stores')
        .select('tier')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      if (data?.tier) {
        setUserTier(data.tier as 'free' | 'partner' | 'professional' | 'enterprise');
      }
    } catch (error) {
      console.error('Error fetching user tier:', error);
      // Default to free tier if error
      setUserTier('free');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Save the first uploaded image file for AI generation
    if (formData.images.length === 0) {
      setProductImageFile(file);
    }

    setUploading(true);
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('listing-images')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);

      // Add to form data
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
      // Reset file input
      event.target.value = '';
    }
  };

  const handleImageAdd = () => {
    // Create a hidden file input and trigger it
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

  const handleImageAddByUrl = () => {
    const url = prompt('Enter image URL (optional - you can also upload files):');
    if (url && url.trim()) {
      // Basic URL validation
      try {
        new URL(url.trim());
        setFormData({
          ...formData,
          images: [...formData.images, url.trim()],
        });
      } catch {
        alert('Please enter a valid URL');
      }
    }
  };

  const handleImageRemove = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  // AI Functions
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
    if (formData.images.length === 0) {
      alert('Please upload an image first');
      return;
    }

    if (!geminiImageService.isConfigured()) {
      showAIConfigMessage();
      return;
    }

    setAnalyzingImage(true);
    try {
      // Convert image URL to File object for analysis
      const response = await fetch(formData.images[0]);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });
      
      const analysis = await geminiImageService.analyzeImageForListing(file);
      
      // Find matching category
      const matchingCategory = categories.find(c => 
        c.name.toLowerCase().includes(analysis.suggestedCategory.toLowerCase()) ||
        analysis.suggestedCategory.toLowerCase().includes(c.name.toLowerCase())
      );

      setFormData({
        ...formData,
        title: analysis.suggestedTitle,
        category_id: matchingCategory?.id || formData.category_id,
        condition: analysis.condition,
        starting_bid: analysis.estimatedValue.min.toString()
      });

      alert(`🔍 AI Analysis Complete!\n\nItem: ${analysis.itemType}\nCondition: ${analysis.condition}\nKey Features: ${analysis.keyFeatures.join(', ')}\nEstimated Value: $${analysis.estimatedValue.min}-$${analysis.estimatedValue.max}`);
    } catch (error: any) {
      alert(error.message || 'Failed to analyze image');
    } finally {
      setAnalyzingImage(false);
    }
  };

  // NEW AI FEATURES - Auto-Fill Product Details
  const handleAutoFillFromImage = async () => {
    if (!productImageFile) {
      alert('Please upload a product image first');
      return;
    }

    if (!geminiApiKey) {
      showAIConfigMessage();
      return;
    }

    setAnalyzingImage(true);
    setError('');

    try {
      const categorizationService = new GeminiCategorizationService(geminiApiKey);
      const analysis = await categorizationService.analyzeProduct(productImageFile);

      // Find matching category from database
      const matchingCategory = categories.find(c => 
        c.name.toLowerCase().includes(analysis.category.toLowerCase()) ||
        analysis.category.toLowerCase().includes(c.name.toLowerCase())
      );

      // Auto-fill form with AI analysis
      setFormData({
        ...formData,
        title: analysis.title,
        description: analysis.description,
        category_id: matchingCategory?.id || formData.category_id,
        condition: analysis.condition,
      });

      alert(`✨ Product Analyzed (${analysis.confidence}% confidence)\n\n` +
            `Category: ${analysis.category}\n` +
            `${analysis.brand ? `Brand: ${analysis.brand}\n` : ''}` +
            `Condition: ${analysis.condition}\n\n` +
            `Form fields auto-filled!`);
    } catch (error: any) {
      setError(`AI analysis failed: ${error.message}`);
      console.error('Auto-fill error:', error);
    } finally {
      setAnalyzingImage(false);
    }
  };

  // NEW AI FEATURES - Smart Pricing
  const handleSmartPricing = async () => {
    if (!productImageFile && !formData.title) {
      alert('Please upload an image or enter a title first');
      return;
    }

    if (!geminiApiKey) {
      showAIConfigMessage();
      return;
    }

    setGeneratingPricing(true);
    setError('');

    try {
      const pricingService = new GeminiPricingService(geminiApiKey);
      const category = categories.find(c => c.id === formData.category_id);

      const result = await pricingService.analyzePricing({
        title: formData.title,
        description: formData.description,
        category: category?.name,
        condition: formData.condition as any,
        brand: undefined,
        imageUrl: formData.images[0],
      });

      // Update pricing fields based on listing type
      if (listingType === 'auction') {
        setFormData({
          ...formData,
          starting_bid: result.priceRange.min.toFixed(2),
          reserve_price: result.suggestedPrice.toFixed(2),
          buy_now_price: result.priceRange.max.toFixed(2),
        });
      } else {
        setFormData({
          ...formData,
          buy_now_price: result.suggestedPrice.toFixed(2),
          compare_at_price: result.priceRange.max.toFixed(2),
        });
      }

      alert(`💰 Smart Pricing (${result.confidence}% confidence)\n\n` +
            `Suggested: $${result.suggestedPrice.toFixed(2)}\n` +
            `Range: $${result.priceRange.min.toFixed(2)} - $${result.priceRange.max.toFixed(2)}\n\n` +
            `${result.reasoning}\n\n` +
            `Market: ${result.marketInsights.demandLevel} demand`);
    } catch (error: any) {
      setError(`Pricing analysis failed: ${error.message}`);
      console.error('Pricing error:', error);
    } finally {
      setGeneratingPricing(false);
    }
  };

  // NEW AI FEATURES - Remove Background
  const handleRemoveBackground = async () => {
    if (!productImageFile) {
      alert('Please upload a product image first');
      return;
    }

    if (!geminiApiKey) {
      showAIConfigMessage();
      return;
    }

    setUploading(true);
    setError('');

    try {
      const imageService = new GeminiProductImageService(geminiApiKey);
      const result = await imageService.removeBackground(productImageFile);

      // Upload enhanced image to Supabase
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `enhanced-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const fileExt = 'jpg';
      const fileName = `${user!.id}/${Date.now()}-enhanced.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);

      setFormData({
        ...formData,
        images: [...formData.images, publicUrl],
      });

      alert('✨ Background removed! Enhanced image added to listing.');
    } catch (error: any) {
      setError(`Background removal failed: ${error.message}`);
      console.error('Background removal error:', error);
    } finally {
      setUploading(false);
    }
  };

  // NEW AI FEATURES - Generate Lifestyle Image
  const handleGenerateLifestyleImage = async () => {
    if (!productImageFile) {
      alert('Please upload a product image first');
      return;
    }

    if (!geminiApiKey) {
      showAIConfigMessage();
      return;
    }

    setUploading(true);
    setError('');

    try {
      const imageService = new GeminiProductImageService(geminiApiKey);
      const result = await imageService.generateLifestyleImage(
        productImageFile,
        'modern interior with natural lighting, product photography style'
      );

      // Upload generated image to Supabase
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `lifestyle-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const fileExt = 'jpg';
      const fileName = `${user!.id}/${Date.now()}-lifestyle.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);

      setFormData({
        ...formData,
        images: [...formData.images, publicUrl],
      });

      alert('✨ Lifestyle image generated! Added to listing.');
    } catch (error: any) {
      setError(`Image generation failed: ${error.message}`);
      console.error('Lifestyle image error:', error);
    } finally {
      setUploading(false);
    }
  };

  // NEW AI FEATURES - Enhance Image Quality
  const handleEnhanceImage = async () => {
    if (!productImageFile) {
      alert('Please upload a product image first');
      return;
    }

    if (!geminiApiKey) {
      showAIConfigMessage();
      return;
    }

    setUploading(true);
    setError('');

    try {
      const imageService = new GeminiProductImageService(geminiApiKey);
      const result = await imageService.enhanceImageQuality(productImageFile);

      // Upload enhanced image to Supabase
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `enhanced-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const fileExt = 'jpg';
      const fileName = `${user!.id}/${Date.now()}-enhanced.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName);

      setFormData({
        ...formData,
        images: [...formData.images, publicUrl],
      });

      alert('✨ Image enhanced! Improved version added to listing.');
    } catch (error: any) {
      setError(`Image enhancement failed: ${error.message}`);
      console.error('Enhancement error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be logged in to create a listing');
      return;
    }

    if (formData.images.length === 0) {
      setError('Please add at least one image');
      return;
    }

    setLoading(true);

    try {
      const startTime = new Date();
      
      // Build listing data based on type
      const listingData: any = {
        seller_id: user.id,
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id || null,
        condition: formData.condition,
        images: formData.images,
        listing_type: listingType,
        status: 'active',
      };

      // Set start_time for all listings
      listingData.start_time = startTime.toISOString();

      if (listingType === 'auction') {
        // Auction-specific fields
        const endTime = new Date();
        endTime.setDate(endTime.getDate() + parseInt(formData.duration));
        
        listingData.starting_bid = parseFloat(formData.starting_bid);
        listingData.current_bid = parseFloat(formData.starting_bid);
        listingData.reserve_price = formData.reserve_price ? parseFloat(formData.reserve_price) : null;
        listingData.buy_now_price = formData.buy_now_price ? parseFloat(formData.buy_now_price) : null;
        listingData.bid_increment = parseFloat(formData.bid_increment);
        listingData.end_time = endTime.toISOString();
        listingData.stock_quantity = 1;
      } else if (listingType === 'store') {
        // Store item fields
        listingData.starting_bid = parseFloat(formData.starting_bid); // Use starting_bid as price field
        listingData.current_bid = parseFloat(formData.starting_bid);
        listingData.stock_quantity = parseInt(formData.stock_quantity);
        listingData.compare_at_price = formData.compare_at_price ? parseFloat(formData.compare_at_price) : null;
        listingData.allow_offers = formData.allow_offers;
        // No end_time, bid_increment, duration for store items
      } else if (listingType === 'trade') {
        // Trade/barter item fields
        listingData.starting_bid = 0; // No money involved
        listingData.current_bid = 0;
        listingData.stock_quantity = 1;
        listingData.trade_for = formData.trade_for;
        listingData.trade_preferences = formData.trade_preferences;
        listingData.allow_offers = true; // Always allow trade offers
        // No end_time, no prices
      }

      // Add delivery options (for both auction and store)
      listingData.delivery_options = formData.delivery_options;
      listingData.seller_address = formData.seller_address || null;
      listingData.pickup_instructions = formData.pickup_instructions || null;

      // Debug: Log what we're sending to the database
      console.log('🎯 Creating listing with type:', listingData.listing_type);
      console.log('📦 Full listing data:', JSON.stringify(listingData, null, 2));

      const { error: insertError } = await supabase
        .from('listings')
        .insert([listingData]);

      if (insertError) throw insertError;

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error creating listing:', err);
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">List an Item</h1>
          <p className="text-gray-600 mb-8">Sell through auction or fixed price in your store</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Listing Type Selector */}
            <ListingTypeSelector value={listingType} onChange={setListingType} />

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

            {/* AI Assistant Panel */}
            {geminiAIService.isConfigured() && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="text-purple-600" size={20} />
                    <h3 className="font-semibold text-gray-900">AI Assistant (Gemini)</h3>
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
                    <p className="text-sm text-gray-600">Let AI help you create a compelling listing!</p>
                    
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
                {categories
                  .filter((category) => !category.parent_id)
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
            {/* Style selection for subcategories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style (optional)
              </label>
              <select
                value={formData.style || ''}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a style</option>
                {categories
                  .filter((category) => category.parent_id)
                  .map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>

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
                        <span className="text-sm text-gray-600">Upload Image</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
              
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={handleImageAddByUrl}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Or add image by URL
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Click to add image URLs. For stock photos, try{' '}
                <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Pexels
                </a>
              </p>
            </div>

            {/* NEW AI ASSISTANT TOOLBAR */}
            {productImageFile && geminiApiKey && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-2">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">AI Listing Assistant</h3>
                      <p className="text-sm text-gray-600">Let AI help you create the perfect listing</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAITools(!showAITools)}
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    {showAITools ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showAITools && (
                  <>
                    {/* Error/Success Messages */}
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                        <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* AI Tools Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Auto-Fill Product Details */}
                      <button
                        type="button"
                        onClick={handleAutoFillFromImage}
                        disabled={analyzingImage || uploading}
                        className="flex items-center gap-3 p-4 bg-white border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {analyzingImage ? (
                          <Loader2 className="w-5 h-5 text-purple-600 animate-spin flex-shrink-0" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0" />
                        )}
                        <div className="text-left flex-1">
                          <div className="font-semibold text-gray-900 text-sm">Auto-Fill Details</div>
                          <div className="text-xs text-gray-600">AI analyzes your photo</div>
                        </div>
                      </button>

                      {/* AI Pricing Suggestion */}
                      <button
                        type="button"
                        onClick={handleSmartPricing}
                        disabled={generatingPricing || uploading}
                        className="flex items-center gap-3 p-4 bg-white border-2 border-green-200 rounded-lg hover:border-green-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingPricing ? (
                          <Loader2 className="w-5 h-5 text-green-600 animate-spin flex-shrink-0" />
                        ) : (
                          <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0" />
                        )}
                        <div className="text-left flex-1">
                          <div className="font-semibold text-gray-900 text-sm">Smart Pricing</div>
                          <div className="text-xs text-gray-600">AI suggests price</div>
                        </div>
                      </button>

                      {/* Remove Background */}
                      <button
                        type="button"
                        onClick={handleRemoveBackground}
                        disabled={uploading}
                        className="flex items-center gap-3 p-4 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                        <div className="text-left flex-1">
                          <div className="font-semibold text-gray-900 text-sm">Remove Background</div>
                          <div className="text-xs text-gray-600">Clean product photo</div>
                        </div>
                      </button>

                      {/* Enhance Image */}
                      <button
                        type="button"
                        onClick={handleEnhanceImage}
                        disabled={uploading}
                        className="flex items-center gap-3 p-4 bg-white border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? (
                          <Loader2 className="w-5 h-5 text-orange-600 animate-spin flex-shrink-0" />
                        ) : (
                          <Wand2 className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        )}
                        <div className="text-left flex-1">
                          <div className="font-semibold text-gray-900 text-sm">Enhance Quality</div>
                          <div className="text-xs text-gray-600">Improve brightness & clarity</div>
                        </div>
                      </button>
                    </div>

                    {/* Help Text */}
                    <p className="mt-4 text-xs text-gray-600 text-center">
                      💡 Upload a product photo to unlock AI-powered listing assistance
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Show AI setup prompt if no API key */}
            {!geminiApiKey && formData.images.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">AI Features Available</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Get instant product analysis, pricing suggestions, and image enhancements with AI.
                    </p>
                    <a
                      href="/settings/ai"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                    >
                      Set up your free Gemini API key →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* AI Image Enhancement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Photo Enhancement
              </label>
              <ImageEnhancer 
                onImageEnhanced={async (enhancedFile) => {
                  // Upload enhanced image
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

            {/* AI Product Image Editor - Tier-Gated */}
            {productImageFile && (
              <div className="mt-6">
                <AIImageEditor
                  currentImage={productImageFile}
                  userTier={userTier}
                  onImageGenerated={async (imageUrl) => {
                    // Upload the AI-generated image to storage
                    if (!user) return;
                    
                    setUploading(true);
                    try {
                      // Fetch the image from the URL (DALL-E returns a URL)
                      const response = await fetch(imageUrl);
                      const blob = await response.blob();
                      
                      const fileName = `${user.id}/${Date.now()}-ai-generated.png`;

                      const { error } = await supabase.storage
                        .from('listing-images')
                        .upload(fileName, blob);

                      if (error) throw error;

                      const { data: { publicUrl } } = supabase.storage
                        .from('listing-images')
                        .getPublicUrl(fileName);

                      setFormData({
                        ...formData,
                        images: [...formData.images, publicUrl],
                      });

                      alert('AI-generated image added to your listing! ✨');
                    } catch (error: any) {
                      console.error('Error uploading AI-generated image:', error);
                      alert('Failed to upload AI-generated image: ' + (error.message || 'Unknown error'));
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </div>
            )}

            {/* Conditional Pricing Section */}
            {listingType === 'auction' ? (
              <>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auction Duration (Days) *
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                        <option value="1">1 day</option>
                    <option value="3">3 days</option>
                    <option value="5">5 days</option>
                    <option value="7">7 days</option>
                    <option value="10">10 days</option>
                    <option value="14">14 days</option>
                  </select>
                </div>
              </>
            ) : listingType === 'store' ? (
              <StorePricingFields
                price={formData.buy_now_price}
                compareAtPrice={formData.compare_at_price}
                stockQuantity={formData.stock_quantity}
                allowOffers={formData.allow_offers}
                onChange={(field, value) => {
                  // Map field names from camelCase to snake_case to match formData structure
                  const fieldMapping: { [key: string]: string } = {
                    'price': 'buy_now_price',
                    'compareAtPrice': 'compare_at_price', 
                    'stockQuantity': 'stock_quantity',
                    'allowOffers': 'allow_offers'
                  };
                  
                  const mappedField = fieldMapping[field] || field;
                  setFormData({ ...formData, [mappedField]: value });
                }}
              />
            ) : (
              /* Trade/Barter Fields */
              <div className="space-y-6 bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                <div className="flex items-center space-x-2 text-blue-700 mb-4">
                  <Repeat size={24} />
                  <h3 className="text-lg font-semibold">Trade/Barter Details</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What are you looking for in trade? *
                  </label>
                  <input
                    type="text"
                    value={formData.trade_for}
                    onChange={(e) => setFormData({ ...formData, trade_for: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Vintage camera, Power tools, Musical instruments"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Be specific about what you'd like to trade for</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trade Preferences (Optional)
                  </label>
                  <textarea
                    value={formData.trade_preferences}
                    onChange={(e) => setFormData({ ...formData, trade_preferences: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional details about trades you're willing to consider, condition requirements, etc."
                  />
                </div>

                <div className="bg-blue-100 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> No money is exchanged in trade listings. Interested traders will contact you directly to arrange the exchange.
                  </p>
                </div>
              </div>
            )}

            {/* Delivery Options */}
            <div className="border-t pt-6">
              <DeliveryOptions
                options={formData.delivery_options}
                onChange={(options) => setFormData({ ...formData, delivery_options: options })}
                sellerAddress={formData.seller_address}
                onAddressChange={(address) => setFormData({ ...formData, seller_address: address })}
                pickupInstructions={formData.pickup_instructions}
                onInstructionsChange={(instructions) => setFormData({ ...formData, pickup_instructions: instructions })}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? 'Creating...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
