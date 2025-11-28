// src/components/listings/ProductDetails.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import ImageGallery from '@/components/image/ImageGallery';

interface ProductDetailsProps {
  productId: string;
  isEmbed?: boolean;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ productId, isEmbed = false }) => {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles (
            username
          )
        `)
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product. Please try again.');
      } else {
        setProduct(data);
      }
      setLoading(false);
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, 1); // Use the correct function and pass the product object
      if (isEmbed) {
        // In an embed, we might want to redirect to the cart on the main site
        if (window.top) {
          window.top.location.href = '/cart';
        }
      }
      // The notification is now handled by the CartContext, so we can remove the alert.
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading Product...</div>;
  }

  if (error || !product) {
    return <div className="text-center p-10 text-red-500">{error || 'Product not found.'}</div>;
  }

  const containerClass = isEmbed
    ? 'w-full max-w-md mx-auto bg-white rounded-lg overflow-hidden'
    : 'grid grid-cols-1 md:grid-cols-2 gap-8';

  return (
    <div className={containerClass}>
      <div>
        <ImageGallery imageUrls={product.image_urls || []} />
      </div>
      <div className="p-4 md:p-6">
        <h1 className={`font-bold ${isEmbed ? 'text-2xl' : 'text-4xl'} mb-2`}>{product.title}</h1>
        <p className="text-gray-600 text-sm mb-4">Sold by {product.profiles?.username || 'Unknown Seller'}</p>
        <p className="text-gray-800 mb-4">{product.description}</p>
        
        <div className="flex items-center justify-between mb-6">
          <p className={`text-3xl font-bold ${isEmbed ? 'text-blue-600' : 'text-primary'}`}>
            ${Number(product.starting_bid || product.buy_now_price || 0).toFixed(2)}
          </p>
          {product.stock_quantity > 0 && (
            <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
              {product.stock_quantity} in stock
            </span>
          )}
        </div>

        <button 
          onClick={handleAddToCart} 
          disabled={product.stock_quantity === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
        </button>

        {isEmbed && (
          <p className="text-xs text-center text-gray-500 mt-4">
            Powered by <a href={window.top?.location.origin} target="_blank" rel="noopener noreferrer" className="font-bold">Our Marketplace</a>
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
