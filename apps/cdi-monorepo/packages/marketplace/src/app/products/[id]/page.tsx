// src/app/products/[id]/page.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import ProductDetails from '@/components/listings/ProductDetails';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <p>We couldn't find the product you're looking for.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ProductDetails productId={id} />
      </div>
    </div>
  );
};

export default ProductPage;
