// src/app/products/embed/[id]/page.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import ProductDetails from '@/components/listings/ProductDetails';

const EmbeddedProductPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="text-center py-10 font-sans">
        <h1 className="text-xl font-bold">Product not found</h1>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white">
      <ProductDetails productId={id} isEmbed={true} />
    </div>
  );
};

export default EmbeddedProductPage;
