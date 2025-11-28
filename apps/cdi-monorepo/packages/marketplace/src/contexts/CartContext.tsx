import React, { createContext, useContext, useState, useEffect } from 'react';
import { Listing } from '../lib/supabase';

export interface CartItem {
  listing: Listing;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (listing: Listing, quantity?: number) => void;
  removeFromCart: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  isInCart: (listingId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('traderBidCart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('traderBidCart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (listing: Listing, quantity: number = 1) => {
    // Validation
    if (listing.listing_type !== 'store') {
      alert('Only store items can be added to cart. Auction items require bidding.');
      return;
    }

    if (listing.stock_quantity === 0) {
      alert('This item is out of stock.');
      return;
    }

    if (quantity > (listing.stock_quantity || 0)) {
      alert(`Only ${listing.stock_quantity} units available.`);
      return;
    }

    setCart((prevCart) => {
      // Check if item already in cart
      const existingItem = prevCart.find(item => item.listing.id === listing.id);
      
      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        
        if (newQuantity > (listing.stock_quantity || 0)) {
          alert(`Cannot add more than ${listing.stock_quantity} units.`);
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.listing.id === listing.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Add new item
        return [...prevCart, { listing, quantity }];
      }
    });

    // Success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
          <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
        </svg>
        <span>Added to cart!</span>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const removeFromCart = (listingId: string) => {
    setCart((prevCart) => prevCart.filter(item => item.listing.id !== listingId));
  };

  const updateQuantity = (listingId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(listingId);
      return;
    }

    setCart((prevCart) => {
      return prevCart.map(item => {
        if (item.listing.id === listingId) {
          // Check stock limit
          if (quantity > (item.listing.stock_quantity || 0)) {
            alert(`Only ${item.listing.stock_quantity} units available.`);
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.listing.starting_bid * item.quantity);
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const isInCart = (listingId: string) => {
    return cart.some(item => item.listing.id === listingId);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
