import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShoppingCart({ isOpen, onClose }: ShoppingCartProps) {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartItemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      alert('Please sign in to checkout');
      navigate('/');
      return;
    }

    if (cart.length === 0) {
      return;
    }

    setProcessing(true);

    try {
      // Create orders for each item
      const orderPromises = cart.map(async (item) => {
        // Check stock availability
        const { data: listing, error: fetchError } = await supabase
          .from('listings')
          .select('stock_quantity')
          .eq('id', item.listing.id)
          .single();

        if (fetchError) throw fetchError;

        if (!listing || (listing.stock_quantity || 0) < item.quantity) {
          throw new Error(`${item.listing.title} is out of stock or insufficient quantity`);
        }

        // Create transaction
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            listing_id: item.listing.id,
            buyer_id: user.id,
            seller_id: item.listing.seller_id,
            amount: item.listing.starting_bid * item.quantity,
            payment_status: 'pending',
          });

        if (transactionError) throw transactionError;

        // Update stock quantity
        const newStock = (listing.stock_quantity || 0) - item.quantity;
        const { error: updateError } = await supabase
          .from('listings')
          .update({ 
            stock_quantity: newStock,
            status: newStock === 0 ? 'sold' : 'active'
          })
          .eq('id', item.listing.id);

        if (updateError) throw updateError;
      });

      await Promise.all(orderPromises);

      // Clear cart
      clearCart();
      onClose();

      // Success message
      alert(`✅ Order placed successfully! Total: $${getCartTotal().toFixed(2)}`);
      navigate('/dashboard');

    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to complete checkout. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/70 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="market-hero flex items-center justify-between p-6 text-white">
          <div className="flex items-center space-x-3">
            <ShoppingBag size={24} />
            <div>
              <h2 className="text-xl font-bold">Shopping Cart</h2>
              <p className="text-sm text-slate-300">
                {getCartItemCount()} {getCartItemCount() === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-slate-900/40"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-slate-500">
              <ShoppingBag size={64} className="mb-4" />
              <p className="text-lg font-medium text-slate-200">Your cart is empty</p>
              <p className="text-sm">Add store items to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.listing.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                >
                  <div className="flex items-start space-x-3">
                    <img
                      src={item.listing.images[0] || '/placeholder.jpg'}
                      alt={item.listing.title}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-slate-100">
                        {item.listing.title}
                      </h3>
                      <p className="mb-2 text-lg font-bold text-emerald-300">
                        ${item.listing.starting_bid.toFixed(2)}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.listing.id, item.quantity - 1)}
                            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200 transition-colors hover:bg-slate-800"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-medium text-slate-100">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.listing.id, item.quantity + 1)}
                            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200 transition-colors hover:bg-slate-800"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.listing.id)}
                          className="p-1 text-red-400 transition-colors hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-slate-400">
                        Subtotal: ${(item.listing.starting_bid * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="w-full py-2 text-sm font-medium text-red-400 hover:text-red-300"
                >
                  Clear Cart
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-slate-800 bg-slate-900/85 p-6">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="font-medium text-slate-100">${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Shipping</span>
                <span className="font-medium text-slate-100">Calculated at checkout</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2">
                <span className="text-lg font-bold text-white">Total</span>
                <span className="text-2xl font-bold text-emerald-300">
                  ${getCartTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={processing}
              className="market-button-primary flex w-full items-center justify-center space-x-2 py-4 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Checkout</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <p className="mt-3 text-center text-xs text-slate-500">
              Secure checkout powered by Constructive Designs
            </p>
          </div>
        )}
      </div>
    </>
  );
}
