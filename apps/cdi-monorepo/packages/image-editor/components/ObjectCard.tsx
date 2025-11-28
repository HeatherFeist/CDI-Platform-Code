/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Product } from '../types';

interface ObjectCardProps {
    product: Product;
    isSelected: boolean;
    onClick?: () => void;
    onRemove?: () => void;
}

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const ObjectCard: React.FC<ObjectCardProps> = ({ product, isSelected, onRemove, onClick }) => {
    const cardClasses = `
        bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300
        ${onClick ? 'cursor-pointer hover:shadow-xl hover:scale-105' : ''}
        ${isSelected ? 'border-2 border-blue-500 shadow-xl scale-105' : 'border border-zinc-200'}
    `;

    const imageUrl = product.type === '3d' ? product.thumbnailUrl : product.imageUrl;
    
    const handleRemoveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRemove) {
            onRemove();
        }
    };

    return (
        <div className={`relative group ${cardClasses}`} onClick={onClick}>
            {onRemove && (
                <button
                    onClick={handleRemoveClick}
                    className="absolute top-1.5 right-1.5 z-10 p-1 bg-white/70 rounded-full text-zinc-600 hover:bg-white hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Remove ${product.name}`}
                    title={`Remove ${product.name}`}
                >
                    <CloseIcon />
                </button>
            )}
            <div className="aspect-square w-full bg-zinc-100 flex items-center justify-center">
                <img src={imageUrl} alt={product.name} className="w-full h-full object-contain" />
            </div>
            <div className="p-3 text-center">
                <h4 className="text-sm font-semibold text-zinc-700 truncate">{product.name}</h4>
            </div>
        </div>
    );
};

export default ObjectCard;