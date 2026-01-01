import React, { useState } from 'react';
import { CartItem, ShopSettings, UserProfile } from '../types';
import { X, ShoppingBag, ExternalLink, Trash2, Gift, Lock, ShieldCheck, CheckCircle, Loader2, ArrowRight, ShoppingCart } from 'lucide-react';

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
  userProfile,
  onPurchaseComplete 
}) => {
  const [view, setView] = useState<'cart' | 'transferring' | 'confirm' | 'success'>('cart');
  
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const giftItems = cartItems.filter(item => item.orderType === 'gift');
  const personalItems = cartItems.filter(item => item.orderType === 'purchase');

  // Construct the Amazon Multi-Item Cart URL
  // Format: https://www.amazon.com/gp/aws/cart/add.html?ASIN.1=B0...&Quantity.1=1&ASIN.2=B0...&Quantity.2=1&AssociateTag=tag
  const generateAmazonBatchUrl = () => {
    const baseUrl = "https://www.amazon.com/gp/aws/cart/add.html?";
    const params = new URLSearchParams();
    
    // Add each item in the cart to the URL parameters
    cartItems.forEach((item, index) => {
      if (item.asin) {
        params.append(`ASIN.${index + 1}`, item.asin);
        params.append(`Quantity.${index + 1}`, item.quantity.toString());
      }
    });
    
    // Add the teen's associate tag so they (or the non-profit) get credit/data
    const tag = shopSettings.amazonAffiliateTag || 'cdi-nonprofit-20';
    params.append('AssociateTag', tag);
    
    return baseUrl + params.toString();
  };

  const handleCheckout = () => {
    setView('transferring');
    
    // Simulate a brief loading state for "Batching items..."
    setTimeout(() => {
      const amazonUrl = generateAmazonBatchUrl();
      window.open(amazonUrl, '_blank');
      // Move to confirmation view so the user can tell the app they finished
      setView('confirm');
    }, 1500);
  };

  const handleFinalConfirmation = () => {
    // This officially updates the inventory in the app
    if (onPurchaseComplete) {
      onPurchaseComplete(cartItems.map(i => i.id));
    }
    setView('success');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 transition-opacity backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-display font-bold text-gray-900 flex items-center gap-2">
              {view === 'success' ? (
                <span className="text-green-600 flex items-center gap-2"><CheckCircle /> Order Locked In</span>
              ) : view === 'confirm' ? (
                <span className="flex items-center gap-2 text-indigo-600 font-display">Confirm Order</span>
              ) : (
                <span className="flex items-center gap-2"><ShoppingBag className="text-primary" /> Your Empire Bag</span>
              )}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* VIEW: INITIAL CART */}
          {view === 'cart' && (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                       <ShoppingCart size={40} className="text-gray-200" />
                    </div>
                    <p className="font-medium text-gray-400">Your shopping bag is empty.</p>
                    <button onClick={onClose} className="text-primary font-bold hover:underline">Start Curating</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {giftItems.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-pink-600 uppercase tracking-wider flex items-center gap-2">
                          <Gift size={14} /> Inventory Gifts (Batch)
                        </h3>
                        <div className="bg-pink-50 p-4 rounded-2xl space-y-4 border border-pink-100 shadow-sm">
                          <p className="text-[11px] text-pink-700 leading-tight">
                            These items will be sent to the teen's business address. You'll checkout all {giftItems.length} items at once on Amazon.
                          </p>
                          {giftItems.map((item) => (
                            <CartItemRow key={item.id + 'gift'} item={item} onRemove={onRemoveItem} isGift />
                          ))}
                        </div>
                      </div>
                    )}

                    {personalItems.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Items</h3>
                        {personalItems.map((item) => (
                          <CartItemRow key={item.id + 'personal'} item={item} onRemove={onRemoveItem} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                        <span className="text-gray-500 text-xs block uppercase font-bold tracking-widest">Total Value</span>
                        <span className="text-2xl font-display font-bold text-gray-900">${total.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-gray-400 block">Processing via</span>
                        <span className="text-sm font-bold text-orange-500">Amazon Cart</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-black text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-gray-900 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                  >
                    <span>Proceed to Amazon</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <p className="text-[10px] text-center text-gray-400 mt-4 flex items-center justify-center gap-1 leading-relaxed">
                    <ShieldCheck size={12} className="text-green-500" /> 
                    This will bundle your items and open an Amazon window <br/> to finish the payment securely.
                  </p>
                </div>
              )}
            </>
          )}

          {/* VIEW: TRANSFERRING (LOADING) */}
          {view === 'transferring' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-white">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin"></div>
                <ShoppingCart className="absolute inset-0 m-auto text-orange-500" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Batching Your Items</h3>
                <p className="text-gray-500 text-sm mt-2">We're preparing your multi-item Amazon cart. One second!</p>
              </div>
              <div className="w-full max-w-xs space-y-2 opacity-60">
                 {cartItems.slice(0, 3).map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-left bg-gray-50 p-2 rounded">
                       <CheckCircle size={12} className="text-green-500" /> {item.name}
                    </div>
                 ))}
                 {cartItems.length > 3 && <div className="text-xs text-gray-400 italic">+ {cartItems.length - 3} more</div>}
              </div>
            </div>
          )}

          {/* VIEW: CONFIRMATION (Bridge step) */}
          {view === 'confirm' && (
            <div className="flex-1 flex flex-col p-8 bg-indigo-50/30">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100 space-y-6">
                  <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto">
                     <ExternalLink size={32} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900">Finish on Amazon</h3>
                    <p className="text-sm text-gray-500 mt-2">
                       We've opened your Amazon cart in a new tab. Please complete the purchase there.
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                     <p className="text-xs text-amber-800 font-bold flex items-center gap-2 mb-1">
                        <Lock size={12} /> Next Step:
                     </p>
                     <p className="text-[11px] text-amber-700 leading-normal">
                        Once you've placed the order on Amazon, come back here and click the <strong>"I've Ordered Everything"</strong> button to unlock the inventory for the girls!
                     </p>
                  </div>

                  <button 
                    onClick={handleFinalConfirmation}
                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    I've Ordered Everything
                  </button>

                  <button 
                    onClick={() => setView('cart')}
                    className="w-full text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
                  >
                    Need to change something? Go Back
                  </button>
               </div>
            </div>
          )}

          {/* VIEW: SUCCESS */}
          {view === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
               <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-bounce shadow-inner">
                 <CheckCircle size={48} />
               </div>
               <div>
                 <h3 className="text-3xl font-display font-bold text-gray-900 mb-2">Inventory Unlocked!</h3>
                 <p className="text-gray-500">
                   Thank you, Angel Investor! 💖 <br/>
                   The shop owner has been notified. They can now review these items and begin making profit!
                 </p>
               </div>
               
               <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 w-full text-left space-y-4">
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Business Impact</p>
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                       <Gift size={20} />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-gray-800">+{cartItems.length} New Assets</p>
                       <p className="text-[10px] text-gray-500">Inventory added to Admin Panel</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                       <CheckCircle size={20} />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-gray-800">100% Margin Mode</p>
                       <p className="text-[10px] text-gray-500">Selling features active for these items</p>
                    </div>
                 </div>
               </div>

               <button 
                 onClick={onClose} 
                 className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95"
               >
                 Return to Shop
               </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

interface CartItemRowProps {
  item: CartItem;
  onRemove: (id: string) => void;
  isGift?: boolean;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ item, onRemove, isGift = false }) => (
  <div className="flex gap-4 items-center animate-fadeIn">
    <div className="w-16 h-16 flex-shrink-0 bg-gray-200 rounded-xl overflow-hidden relative shadow-sm">
      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
      {isGift && (
        <div className="absolute inset-0 bg-pink-500/10 flex items-center justify-center">
          <Lock size={10} className="text-white drop-shadow-md opacity-50" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-bold text-gray-800 line-clamp-1 text-sm">{item.name}</h3>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{item.platform}</span>
        {isGift && <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 rounded-full font-bold">ASSET</span>}
        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 rounded-full font-bold">Qty: {item.quantity}</span>
      </div>
      <div className="flex justify-between items-center mt-1.5">
        <span className="font-bold text-sm text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
        <button 
          onClick={() => onRemove(item.id)}
          className="text-gray-300 hover:text-red-500 transition-colors p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  </div>
);

export default CartDrawer;