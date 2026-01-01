import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingCart, Gift, Trash2, Video, X, Edit2, Share2, Facebook, Twitter, Link, ChevronLeft, ChevronRight, Lock, Package } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  userRole: 'shopper' | 'admin';
  tier?: 'Starter' | 'Entrepreneur' | 'Empire'; // Pass current tier
  onDelete?: (id: string) => void;
  onEdit?: (product: Product) => void;
  onAddToCart: (product: Product, orderType: 'purchase' | 'gift') => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, userRole, tier = 'Starter', onDelete, onEdit, onAddToCart }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const allImages = [product.imageUrl, ...(product.additionalImages || [])];
  
  // Logic: 
  // 1. First item is always Demo Unit (Not sellable).
  // 2. Sellable Stock = Total Count - 1.
  // 3. To Sell: Need sellable stock (>0) AND a review video.
  const totalStock = product.stockCount || 0;
  const sellableStock = Math.max(0, totalStock - 1);
  const hasReviewVideo = !!product.videoUrl;
  
  // A shopper can BUY FROM TEEN if: There is sellable stock AND video exists.
  const canBuyFromTeen = sellableStock > 0 && hasReviewVideo;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleShare = (platform: string) => {
    const productUrl = encodeURIComponent(`https://shopreneur.app/product/${product.id}`);
    const text = encodeURIComponent(`Check out ${product.name}!`);
    
    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${productUrl}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${productUrl}`, '_blank');
    } else {
      alert(`Link copied to clipboard: https://shopreneur.app/product/${product.id}`);
    }
    setShowShareMenu(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full border border-pink-100 group relative">
      <div className="relative h-64 overflow-hidden bg-gray-100 group">
        {showVideo && product.videoUrl ? (
          <div className="absolute inset-0 z-20 bg-black flex flex-col">
            <button 
              onClick={() => setShowVideo(false)}
              className="absolute top-2 right-2 z-30 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={16} />
            </button>
            <video 
              src={product.videoUrl} 
              controls 
              autoPlay 
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <>
             <img 
              src={allImages[currentImageIndex]} 
              alt={product.name} 
              className={`w-full h-full object-cover transform transition-transform duration-500 ${!canBuyFromTeen ? 'grayscale-[10%]' : ''}`}
            />
            
            {/* Gallery Navigation */}
            {allImages.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <ChevronRight size={16} />
                </button>
                {/* Dots Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {allImages.map((_, idx) => (
                    <div key={idx} className={`w-1.5 h-1.5 rounded-full shadow-sm transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}

            {hasReviewVideo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVideo(true);
                }}
                className="absolute bottom-3 right-3 bg-white/90 text-black p-2 rounded-full shadow-md hover:scale-110 transition-transform flex items-center gap-1.5 text-xs font-bold px-3 border border-gray-200 z-10"
              >
                <Video size={14} className="text-purple-600" />
                Watch Review
              </button>
            )}
          </>
        )}
       
        <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-gray-700 pointer-events-none z-10">
          {product.category}
        </div>

        {/* Stock Status Badge for Admin/User */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
           {totalStock === 0 && (
             <span className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-bold">Wishlist Only</span>
           )}
           {totalStock === 1 && (
             <span className="bg-purple-500/90 text-white px-2 py-1 rounded text-[10px] font-bold">Demo Unit Only</span>
           )}
           {sellableStock > 0 && (
             <span className="bg-green-500/90 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
               <Package size={10} /> {sellableStock} In Stock
             </span>
           )}
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-800 leading-tight">{product.name}</h3>
          <span className="text-lg font-semibold text-primary">${product.price.toFixed(2)}</span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 flex-1">{product.description}</p>
        
        <div className="mt-auto space-y-2">
          {/* Action Buttons based on Inventory Logic */}
          
          <div className="flex gap-2">
            {canBuyFromTeen ? (
              // SURPLUS MODE: User buys from Teen's Inventory (Profit)
              <button 
                onClick={() => onAddToCart(product, 'purchase')}
                className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors active:scale-95 transform duration-100"
              >
                <ShoppingCart size={16} />
                <span>Buy Now</span>
              </button>
            ) : (
              // WISHLIST/DEMO MODE: User buys FOR Teen (Gift)
              <button 
                onClick={() => onAddToCart(product, 'gift')}
                className="flex-1 flex items-center justify-center gap-2 bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 transition-colors active:scale-95 transform duration-100 shadow-md shadow-pink-200"
              >
                <Gift size={16} />
                <span>
                  {totalStock === 0 ? 'Gift First One' : 'Gift to Stock Up'}
                </span>
              </button>
            )}

            {/* Share Button with Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="bg-gray-100 text-gray-700 p-2.5 rounded-lg hover:bg-gray-200 transition-colors"
                title="Share with friends"
              >
                <Share2 size={18} />
              </button>
              
              {showShareMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-fadeIn">
                   <p className="text-xs font-bold text-gray-500 px-2 py-1">Share to...</p>
                   <button onClick={() => handleShare('facebook')} className="w-full flex items-center gap-2 px-2 py-2 hover:bg-blue-50 rounded-lg text-sm text-gray-700">
                     <Facebook size={16} className="text-blue-600" /> Facebook
                   </button>
                   <button onClick={() => handleShare('twitter')} className="w-full flex items-center gap-2 px-2 py-2 hover:bg-blue-50 rounded-lg text-sm text-gray-700">
                     <Twitter size={16} className="text-blue-400" /> X / Twitter
                   </button>
                   <button onClick={() => handleShare('copy')} className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700">
                     <Link size={16} className="text-gray-400" /> Copy Link
                   </button>
                </div>
              )}
            </div>
          </div>

          {/* Helper Text for Shoppers */}
          <div className="text-center text-[10px] text-gray-400 font-medium pt-1">
            {!canBuyFromTeen ? (
               totalStock === 0 
                 ? "Help launch this product by gifting the demo unit!" 
                 : "Out of stock! Gift one to help them restock."
            ) : (
               "In Stock! 100% of profit goes to the teen creator."
            )}
          </div>

          {/* Admin Edit & Delete */}
          {userRole === 'admin' && (
             <div className="flex gap-2 mt-2">
                {onEdit && (
                  <button 
                    onClick={() => onEdit(product)}
                    className="flex-1 flex items-center justify-center gap-1 text-blue-600 text-xs bg-blue-50 border border-blue-100 rounded-lg py-1.5 hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={() => onDelete(product.id)}
                    className="flex-1 flex items-center justify-center gap-1 text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg py-1.5 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={12} />
                    Remove
                  </button>
                )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;