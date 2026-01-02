
import React, { useState } from 'react';
import { CartItem, ShopSettings, UserProfile } from '../types';
import { X, ShoppingBag, ExternalLink, Trash2, Gift, ShieldCheck, CheckCircle, Loader2, ArrowRight, ShoppingCart, Info, RotateCcw, AlertTriangle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (id: string) => void;
  shopSettings: ShopSettings;
  userProfile?: UserProfile;
  onPurchaseComplete?: (itemIds: string[]) => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  onRemoveItem, 
  shopSettings, 
  onPurchaseComplete 
}) => {
  const [view, setView] = useState<'cart' | 'transferring' | 'confirm' | 'success'>('cart');
  
  const amazonItems = cartItems.filter(i => i.platform === 'Amazon');
  const otherItems = cartItems.filter(i => i.platform !== 'Amazon');
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const generateAmazonBatchUrl = () => {
    // Note: This requires valid ASINs. If ASIN is a placeholder, Amazon will reject.
    const baseUrl = "https://www.amazon.com/gp/aws/cart/add.html?";
    const params = new URLSearchParams();
    amazonItems.forEach((item, index) => {
      // Use ASIN strictly for batching; Amazon doesn't support batching by Name/ID easily
      const identifier = item.asin || item.marketplaceId || '';
      if (identifier) {
        params.append(`ASIN.${index + 1}`, identifier);
        params.append(`Quantity.${index + 1}`, item.quantity.toString());
      }
    });
    const tag = shopSettings.amazonAffiliateTag || 'shopreneur-20';
    params.append('AssociateTag', tag);
    return baseUrl + params.toString();
  };

  const handleCheckout = () => {
    if (amazonItems.length > 0) {
      setView('transferring');
      setTimeout(() => {
        const amazonUrl = generateAmazonBatchUrl();
        // If no valid ASINs were found, show warning instead of redirecting
        if (!amazonUrl.includes('ASIN.1')) {
           alert("Lifecycle Error: Amazon assets require a valid ASIN for batch fulfillment. Please update Asset Ledger.");
           setView('cart');
           return;
        }
        window.open(amazonUrl, '_blank');
        setView('confirm');
      }, 1500);
    } else {
      setView('confirm');
    }
  };

  const handleFinalConfirmation = () => {
    if (onPurchaseComplete) {
      onPurchaseComplete(cartItems.map(i => i.id));
    }
    setView('success');
  };

  const handleCancelVerification = () => {
    setView('cart');
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 transition-opacity" onClick={onClose} />
      )}

      <div className={`fixed inset-y-0 right-0 max-w-md w-full glass-card border-l border-white/10 shadow-3xl z-50 transform transition-transform duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full bg-[#020617]/95">
          
          <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
              <ShoppingBag className="text-indigo-400" /> Organizational Bag
            </h2>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white rounded-full transition-colors"><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-40">
                <ShoppingCart size={64} className="text-slate-700" />
                <p className="font-light text-slate-500 italic">No assets tagged for acquisition.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {amazonItems.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
                       <ShieldCheck size={12} /> Amazon Batch Fulfillment
                    </h3>
                    <div className="space-y-4">
                      {amazonItems.map((item) => (
                        <div key={item.id} className="flex gap-4 items-center group bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                          <img src={item.imageUrl} className="w-16 h-16 rounded-xl object-cover bg-slate-800" alt="" />
                          <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-slate-200 text-sm truncate">{item.name}</h4>
                             <p className={`text-[10px] font-bold uppercase tracking-widest ${item.asin ? 'text-orange-500' : 'text-red-500 flex items-center gap-1'}`}>
                                {item.asin ? `ASIN: ${item.asin}` : <><AlertTriangle size={10}/> Missing ASIN</>}
                             </p>
                             <div className="flex justify-between items-center mt-2">
                                <span className="text-white font-bold text-xs">${item.price.toFixed(2)}</span>
                                <button onClick={() => onRemoveItem(item.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {otherItems.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                       <ExternalLink size={12} /> Marketplace Direct Links
                    </h3>
                    <div className="space-y-4">
                      {otherItems.map((item) => (
                        <div key={item.id} className="flex gap-4 items-center group bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                          <img src={item.imageUrl} className="w-16 h-16 rounded-xl object-cover bg-slate-800" alt="" />
                          <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-slate-200 text-sm truncate">{item.name}</h4>
                             <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${item.platform === 'Shein' ? 'bg-white text-black border-white' : 'bg-blue-600/20 text-blue-400 border-blue-500/30'}`}>
                                  {item.platform}
                                </span>
                                <a href={item.affiliateLink} target="_blank" className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1">
                                  Affiliate Hub <ExternalLink size={10} />
                                </a>
                             </div>
                             <div className="flex justify-between items-center mt-2">
                                <span className="text-white font-bold text-xs">${item.price.toFixed(2)}</span>
                                <button onClick={() => onRemoveItem(item.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {cartItems.length > 0 && view === 'cart' && (
            <div className="p-8 border-t border-white/5 bg-white/[0.02] space-y-6">
              <div className="flex justify-between items-center">
                <div>
                    <span className="text-slate-500 text-[10px] block uppercase font-black tracking-widest">Aggregate Val</span>
                    <span className="text-3xl font-display font-bold text-white">${total.toFixed(2)}</span>
                </div>
                {amazonItems.length > 0 && (
                  <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-black tracking-widest">Amazon Logistics</span>
                      <span className="text-xs font-bold text-orange-400">Batch Enabled</span>
                  </div>
                )}
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex gap-3">
                 <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                 <p className="text-[10px] text-slate-500 leading-relaxed font-light">
                   Amazon checkout will open in a new tab. After purchase, return here to verify assets for inventory sync.
                 </p>
              </div>
              
              <button 
                onClick={handleCheckout}
                className="w-full bg-white text-black font-black uppercase tracking-widest py-5 rounded-2xl shadow-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95 group"
              >
                <span>Synchronize & Checkout</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {view === 'confirm' && (
            <div className="flex-1 p-8 flex flex-col justify-center space-y-8">
               <div className="glass-card p-8 rounded-3xl border border-indigo-500/20 text-center space-y-6">
                  <ExternalLink size={48} className="mx-auto text-indigo-400" />
                  <h3 className="text-2xl font-display font-bold text-white">Finalize Transaction</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Once the assets are acquired on Amazon/Shein, click below to verify and lock them into the boutique inventory.
                  </p>
                  
                  <div className="space-y-3">
                    <button onClick={handleFinalConfirmation} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-500 transition-all shadow-xl">
                      Verify & Commit Assets
                    </button>
                    <button onClick={handleCancelVerification} className="w-full bg-white/5 text-slate-400 py-4 rounded-xl hover:text-white transition-all flex items-center justify-center gap-2">
                       <RotateCcw size={14} /> Failed / Go Back
                    </button>
                  </div>
               </div>
            </div>
          )}

          {view === 'success' && (
             <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
                <div className="w-24 h-24 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/20 animate-bounce">
                   <CheckCircle size={48} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-display font-bold text-white">Logistics Complete</h3>
                  <p className="text-slate-400 font-light">Assets are now marked as "Received". Remember to upload your video review to unlock global marketplace sales!</p>
                </div>
                <button onClick={onClose} className="w-full bg-white text-black py-4 rounded-xl font-bold">Return to Hub</button>
             </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
