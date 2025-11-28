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
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShoppingBag size={24} />
            <div>
              <h2 className="text-xl font-bold">Shopping Cart</h2>
              <p className="text-sm text-green-100">
                {getCartItemCount()} {getCartItemCount() === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-green-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingBag size={64} className="mb-4" />
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm">Add store items to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.listing.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start space-x-3">
                    <img
                      src={item.listing.images[0] || '/placeholder.jpg'}
                      alt={item.listing.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                        {item.listing.title}
                      </h3>
                      <p className="text-lg font-bold text-green-600 mb-2">
                        ${item.listing.starting_bid.toFixed(2)}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.listing.id, item.quantity - 1)}
                            className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.listing.id, item.quantity + 1)}
                            className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.listing.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Subtotal: ${(item.listing.starting_bid * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="w-full text-sm text-red-600 hover:text-red-700 font-medium py-2"
                >
                  Clear Cart
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-2xl text-green-600">
                  ${getCartTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={processing}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-lg font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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

            <p className="text-xs text-gray-500 text-center mt-3">
              Secure checkout powered by Constructive Designs
            </p>
          </div>
        )}
      </div>
    </>
  );
}
