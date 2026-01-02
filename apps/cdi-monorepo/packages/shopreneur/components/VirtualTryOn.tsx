import React, { useState, useRef } from 'react';
import { Product, ProductCategory } from '../types';
import { generateTryOnImage } from '../services/geminiService';
import BusinessTip from './BusinessTip';
import { Camera, Upload, Sparkles, Loader2, RefreshCw, Shirt } from 'lucide-react';

interface VirtualTryOnProps {
  products: Product[];
}

const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ products }) => {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUserImage(result);
      setGeneratedImage(null); // Reset previous result
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!userImage || !selectedProduct) return;

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await generateTryOnImage(
        userImage,
        selectedProduct.name,
        selectedProduct.category,
        selectedProduct.description
      );

      if (result) {
        setGeneratedImage(result);
      } else {
        setError("Could not generate image. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong with the magic mirror! Try a different photo.");
    } finally {
      setLoading(false);
    }
  };

  // Filter products to only wearable items mostly
  const wearableProducts = products.filter(p => 
    p.category !== ProductCategory.TECH
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-display font-bold text-gray-900 mb-2">
          Virtual Dressing Room 🪞
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Upload a photo of yourself and let our AI Magic Mirror show you how you'd look with our latest drops!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Controls & Input */}
        <div className="space-y-8">
          
          {/* Step 1: Upload Photo */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                Upload Your Photo
              </h3>
              <BusinessTip 
                title="Photo Tip" 
                content="Good lighting is key! Face a window for the best natural light. Avoid dark shadows so the AI can fit the clothes perfectly." 
              />
            </div>
            
            <div 
              className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-colors h-64 flex flex-col items-center justify-center cursor-pointer ${userImage ? 'border-purple-300' : 'border-gray-300 hover:border-purple-400 bg-gray-50 hover:bg-purple-50'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {userImage ? (
                <img src={userImage} alt="User" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6">
                  <Camera className="mx-auto text-gray-400 mb-2" size={48} />
                  <p className="text-sm font-medium text-gray-600">Click to upload or take a selfie</p>
                  <p className="text-xs text-gray-400 mt-1">Full body or waist-up shots work best</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              {userImage && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                   <p className="text-white font-medium flex items-center gap-2"><Upload size={16}/> Change Photo</p>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Select Product */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
              Pick an Item
            </h3>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {wearableProducts.map(product => (
                <div 
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${selectedProduct?.id === product.id ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-gray-200'}`}
                >
                  <div className="aspect-square bg-gray-100">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] p-1 font-medium truncate text-center">{product.name}</p>
                </div>
              ))}
            </div>
            {wearableProducts.length === 0 && (
               <p className="text-sm text-gray-500 italic">Add fashion items to the shop to try them on!</p>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={!userImage || !selectedProduct || loading}
            className="w-full bg-gradient-to-r from-purple-600 to-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Working magic...
              </>
            ) : (
              <>
                <Sparkles />
                Try It On!
              </>
            )}
          </button>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
        </div>

        {/* Right Column: Result */}
        <div className="lg:h-[800px]">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100 h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
              The Reveal
            </h3>
            
            <div className="flex-1 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group">
              {generatedImage ? (
                <>
                  <img src={generatedImage} alt="Try On Result" className="w-full h-full object-contain" />
                  <a 
                    href={generatedImage} 
                    download={`try-on-${selectedProduct?.name}.png`}
                    className="absolute bottom-4 right-4 bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg font-medium text-sm hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Download Look
                  </a>
                </>
              ) : (
                <div className="text-center p-8 opacity-50">
                  {loading ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-purple-600 font-medium animate-pulse">Designing your new look...</p>
                    </div>
                  ) : (
                    <>
                      <Shirt size={64} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-400 font-medium">Your new look will appear here</p>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {generatedImage && selectedProduct && (
               <div className="mt-6 bg-purple-50 p-4 rounded-xl flex items-center justify-between">
                 <div>
                   <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-1">Items in this look</p>
                   <p className="font-bold text-gray-900">{selectedProduct.name}</p>
                 </div>
                 <button 
                  className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
                  onClick={() => alert('Added to wishlist!')} // Simplified for this view
                 >
                   Shop This Look
                 </button>
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default VirtualTryOn;