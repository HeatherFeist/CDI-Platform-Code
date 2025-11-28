// src/components/image/ImageGallery.tsx
import React, { useState } from 'react';

interface ImageGalleryProps {
  imageUrls: string[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ imageUrls }) => {
  const [mainImage, setMainImage] = useState(imageUrls[0] || '/placeholder.png');

  if (!imageUrls || imageUrls.length === 0) {
    return <img src="/placeholder.png" alt="Product placeholder" className="w-full h-auto object-cover rounded-lg" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
        <img src={mainImage} alt="Main product" className="w-full h-full object-contain" />
      </div>
      {imageUrls.length > 1 && (
        <div className="flex gap-2">
          {imageUrls.map((url, index) => (
            <div
              key={index}
              className={`w-20 h-20 rounded-md overflow-hidden cursor-pointer border-2 ${mainImage === url ? 'border-primary' : 'border-transparent'}`}
              onClick={() => setMainImage(url)}
            >
              <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
