
import React, { useState } from 'react';
import { Product } from '../types';
import { 
  ShoppingBag, 
  Lock, 
  Play, 
  Video, 
  Package, 
  ShieldCheck, 
  ArrowRight, 
  Trash2, 
  AlertCircle 
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  userRole: 'shopper' | 'admin';
  onDelete?: (id: string) => void;
  onAddToCart: (product: Product, orderType: 'purchase' | 'gift') => void;
  onUploadReview?: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  userRole, 
  onDelete, 
  onAddToCart,
  onUploadReview 
}) => {
  const stockCount = product.stockCount || 0;
  const hasReview = !!product.videoUrl || product.videoReviewCompleted;
  
  // LOGIC: 1st unit is personal/review. 2nd+ unit is inventory.
  // Must have review AND at least 2 units total (1 personal + 1 for sale)
  const isUnlocked = hasReview && stockCount >= 2;
  const needsReview = stockCount >= 1 && !hasReview;
  const needsStock = hasReview && stockCount < 2;

  const getPlatformBadge = () => {
    switch(product.platform) {
      case 'Amazon': return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest">Amazon</span>;
      case 'Shein': return <span className="bg-white/20 text-white border border-white/30 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest">Shein</span>;
      case 'eBay': return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest">eBay</span>;
      default: return null;
    }
  };

  return (
    <div className={`glass-card rounded-[2.5rem] overflow-hidden group border transition-all duration-500 flex flex-col h-full bg-[#ffffff]/[0.02] ${isUnlocked ? 'border-indigo-500/30 ring-1 ring-indigo-500/10' : 'border-white/5 hover:border-white/20'}`}>
      <div className="relative h-72 overflow-hidden bg-slate-900">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className={`w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110 ${!isUnlocked ? 'grayscale-[0.5]' : ''}`}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="absolute top-4 right-4 z-10">
          {getPlatformBadge()}
        </div>

        {/* Status Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
           {needsReview ? (
             <span className="bg-rose-500/80 backdrop-blur-md text-white border border-rose-400 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
               <AlertCircle size={10} /> Action Required: Review
             </span>
           ) : needsStock ? (
             <span className="bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
               <Package size={10} /> Stock Required (1/2)
             </span>
           ) : isUnlocked ? (
             <span className="bg-emerald-500/20 backdrop-blur-md text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
               <ShieldCheck size={10} /> Enterprise Grade
             </span>
           ) : (
             <span className="bg-slate-500/20 backdrop-blur-md text-slate-400 border border-slate-500/30 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
               <Lock size={10} /> Incubator Phase
             </span>
           )}
        </div>

        {product.videoUrl && (
           <a href={product.videoUrl} target="_blank" className="absolute bottom-4 left-4 z-10 p-3 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 text-white hover:bg-indigo-600 transition-all shadow-xl">
              <Play size={16} fill="currentColor" />
           </a>
        )}
      </div>
      
      <div className="p-8 flex-1 flex flex-col space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{product.category}</p>
            <h3 className="text-xl font-display font-bold text-white tracking-tight leading-tight">{product.name}</h3>
          </div>
          <span className="text-xl font-display font-bold text-white">${product.price.toFixed(2)}</span>
        </div>
        
        <p className="text-slate-400 text-sm font-light leading-relaxed line-clamp-2">{product.description}</p>
        
        <div className="pt-4 mt-auto space-y-3">
          {needsReview && userRole === 'admin' ? (
            <button 
              onClick={() => onUploadReview?.(product.id)}
              className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Video size={14} /> Upload Video Review
            </button>
          ) : (
            <div className="flex gap-2">
              {isUnlocked ? (
                <button 
                  onClick={() => onAddToCart(product, 'purchase')}
                  className="flex-1 bg-white text-black py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2 group/btn shadow-xl"
                >
                  Direct Acquire <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button 
                  onClick={() => onAddToCart(product, 'gift')}
                  className="flex-1 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  {stockCount === 0 ? <><ShoppingBag size={12} /> Acquire Personal</> : <><Package size={12} /> Acquire Inventory</>}
                </button>
              )}
            </div>
          )}

          {!isUnlocked && (
            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center leading-relaxed">
                 {!hasReview ? "Step 1: Admin Video Review Required" : `Step 2: Purchase Customer Stock (${stockCount}/2)`}
              </p>
            </div>
          )}

          {userRole === 'admin' && (
             <div className="flex gap-2 pt-2 border-t border-white/5">
                <button onClick={() => onDelete?.(product.id)} className="p-2.5 text-slate-600 hover:text-red-400 transition-all" title="Retire Asset"><Trash2 size={14} /></button>
                <div className="flex-1 text-[8px] font-black uppercase text-slate-700 tracking-widest flex items-center justify-end gap-2">
                   Asset ID: {product.marketplaceId || 'Pending'}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
