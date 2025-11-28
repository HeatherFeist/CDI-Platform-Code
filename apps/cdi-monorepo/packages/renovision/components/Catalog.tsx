/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Product, PaintColor, DesignPack, SavedDesign } from '../types';
import ObjectCard from './ObjectCard';
import DesignPackCard from './DesignPackCard';

interface CatalogProps {
  products: Product[];
  paintColors: PaintColor[];
  designPacks: DesignPack[];
  savedDesigns: SavedDesign[];
  onSelectProduct: (product: Product) => void;
  onSelectPaintColor: (color: PaintColor) => void;
  onSelectDesignPack: (packId: string) => void;
  onSelectSavedDesign: (design: SavedDesign) => void;
  onRemoveSavedDesign: (design: SavedDesign) => void;
  onAddProduct: () => void;
  onRemoveProduct: (productId: string | number) => void;
  onAddPaintColor: () => void;
  onPickFromScene: () => void;
  isColorPickingMode: boolean;
  activeItem: { type: string; id: number | string; } | null;
  activeDesignPackId: string | null;
  disabled: boolean;
  isLoggedIn: boolean;
}

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const EyedropperIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25l5.25 5.25-1.5 1.5-5.25-5.25-1.5-1.5L12 2.25zM7.5 8.25l6.75 6.75-5.25 5.25-6.75-6.75L7.5 8.25z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25L13.5 3.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6.75l-1.5 1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 14.25l1.5 1.5" />
    </svg>
);

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const SavedDesignCard: React.FC<{ design: SavedDesign; onClick: () => void; onRemove: () => void; }> = ({ design, onClick, onRemove }) => {
    const handleRemoveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove();
    };

    return (
        <div
            onClick={onClick}
            className="relative group bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-105 border border-zinc-200"
            role="button"
            aria-label="Load saved design"
        >
            <button
                onClick={handleRemoveClick}
                className="absolute top-1.5 right-1.5 z-10 p-1 bg-white/70 rounded-full text-zinc-600 hover:bg-white hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Remove design"
                title="Remove Design"
            >
                <TrashIcon />
            </button>
            <div className="aspect-video w-full bg-zinc-100 flex items-center justify-center">
                <img src={design.dataUrl} alt="Saved design thumbnail" className="w-full h-full object-contain" />
            </div>
        </div>
    );
};


const Catalog: React.FC<CatalogProps> = ({ products, paintColors, designPacks, savedDesigns, onSelectProduct, onSelectPaintColor, onSelectDesignPack, onSelectSavedDesign, onRemoveSavedDesign, onAddProduct, onRemoveProduct, onAddPaintColor, onPickFromScene, isColorPickingMode, activeItem, activeDesignPackId, disabled, isLoggedIn }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'paint' | 'styles' | 'designs'>('products');

  const tabButtonClasses = (tabName: 'products' | 'paint' | 'styles' | 'designs') => 
    `catalog-tab flex-1 py-2 px-4 text-sm font-bold rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
      activeTab === tabName ? 'active' : 'bg-transparent text-zinc-500 hover:bg-zinc-200'
    }`;

  const handlePackClick = (pack: DesignPack) => {
    if (activeDesignPackId !== pack.id) {
        setActiveTab('products');
    }
    onSelectDesignPack(pack.id);
  };

  const activeDesignPack = designPacks.find(p => p.id === activeDesignPackId);
    
  return (
    <div className={`bg-zinc-50 rounded-lg p-4 h-full border border-zinc-200 ${disabled ? 'catalog-disabled' : ''}`}>
        {activeDesignPack && (
            <div className="p-3 mb-4 bg-blue-100 border border-blue-200 rounded-lg flex justify-between items-center animate-fade-in">
                <p className="text-sm text-blue-800">
                    <span className="font-bold">{activeDesignPack.name}</span> style is active.
                </p>
                <button 
                    onClick={() => onSelectDesignPack(activeDesignPack.id)} // Toggles it off
                    className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    aria-label={`Clear ${activeDesignPack.name} style filter`}
                    title="Clear Style Filter"
                >
                    Clear
                </button>
            </div>
        )}
        <div className="p-1 bg-zinc-100 rounded-lg flex mb-4">
            <button onClick={() => setActiveTab('products')} className={tabButtonClasses('products')}>
                Products
            </button>
            <button onClick={() => setActiveTab('paint')} className={tabButtonClasses('paint')}>
                Paint
            </button>
             <button onClick={() => setActiveTab('styles')} className={tabButtonClasses('styles')}>
                Styles
            </button>
            <button onClick={() => setActiveTab('designs')} className={tabButtonClasses('designs')}>
                My Designs
            </button>
        </div>

        {activeTab === 'products' && (
            <div className="flex flex-col">
                {!activeDesignPack && (
                    <button
                        onClick={onAddProduct}
                        className="w-full mb-4 bg-white rounded-lg transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-blue-500 border-2 border-dashed border-zinc-300 flex items-center justify-center text-center p-3 text-zinc-600 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label="Add your own product"
                        title="Add Your Own Product"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-sm font-semibold ml-2">Add Your Own Product</span>
                    </button>
                )}
                <div className="grid grid-cols-2 gap-4">
                    {products.length === 0 && activeDesignPack ? (
                        <p className="col-span-2 text-center text-zinc-500 py-8">No products in the <span className="font-semibold">{activeDesignPack.name}</span> style pack.</p>
                    ) : (
                        products.map(product => (
                            <ObjectCard 
                                key={product.id}
                                product={product} 
                                isSelected={activeItem?.type === 'product' && activeItem.id === product.id}
                                onClick={() => onSelectProduct(product)}
                                onRemove={() => onRemoveProduct(product.id)}
                            />
                        ))
                    )}
                </div>
            </div>
        )}
        
        {activeTab === 'paint' && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                 {paintColors.length === 0 && activeDesignPack ? (
                     <p className="col-span-full text-center text-zinc-500 py-8">No paints in the <span className="font-semibold">{activeDesignPack.name}</span> style pack.</p>
                ) : (
                    paintColors.map(color => (
                        <div key={color.name} className="flex flex-col items-center" onClick={() => onSelectPaintColor(color)}>
                            <div 
                                className={`paint-swatch w-16 h-16 rounded-full cursor-pointer border-4 border-white shadow-md ${activeItem?.type === 'paint' && activeItem.id === color.name ? 'selected' : ''}`}
                                style={{ backgroundColor: color.hex, '--tw-shadow-color': color.hex } as React.CSSProperties}
                                role="button"
                                aria-label={`Select paint color ${color.name}`}
                            ></div>
                            <p className="text-xs text-center mt-2 font-medium text-zinc-600">{color.name}</p>
                        </div>
                    ))
                )}
                {!activeDesignPack && (
                    <>
                        <div 
                            onClick={onAddPaintColor}
                            className="flex flex-col items-center justify-center cursor-pointer group"
                            role="button"
                            aria-label="Add custom paint color from a photo"
                            title="Add Color from Photo"
                        >
                            <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center border-4 border-white shadow-md group-hover:bg-zinc-300 transition-colors">
                                <CameraIcon />
                            </div>
                            <p className="text-xs text-center mt-2 font-medium text-zinc-600">Add from Photo</p>
                        </div>
                        <div 
                            onClick={onPickFromScene}
                            className="flex flex-col items-center justify-center cursor-pointer group"
                            role="button"
                            aria-label="Pick color from scene"
                            title="Pick Color from Scene"
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-white shadow-md group-hover:bg-zinc-300 transition-colors ${isColorPickingMode ? 'bg-blue-200 ring-2 ring-blue-500' : 'bg-zinc-200'}`}>
                                <EyedropperIcon />
                            </div>
                            <p className="text-xs text-center mt-2 font-medium text-zinc-600">Pick from Scene</p>
                        </div>
                    </>
                )}
            </div>
        )}

        {activeTab === 'styles' && (
            <div className="grid grid-cols-2 gap-4">
                {designPacks.map(pack => (
                    <DesignPackCard
                        key={pack.id}
                        pack={pack}
                        isSelected={activeDesignPackId === pack.id}
                        onClick={() => handlePackClick(pack)}
                    />
                ))}
            </div>
        )}

        {activeTab === 'designs' && (
            <div className="grid grid-cols-2 gap-4">
                {!isLoggedIn ? (
                     <p className="col-span-2 text-center text-zinc-500 py-8">Please log in to view and save your designs across devices.</p>
                ) : savedDesigns.length === 0 ? (
                    <p className="col-span-2 text-center text-zinc-500 py-8">No saved designs yet. Click the bookmark icon on a scene to save it.</p>
                ) : (
                    savedDesigns.map((design) => (
                        <SavedDesignCard
                            key={design.id}
                            design={design}
                            onClick={() => onSelectSavedDesign(design)}
                            onRemove={() => onRemoveSavedDesign(design)}
                        />
                    ))
                )}
            </div>
        )}
    </div>
  );
};

export default Catalog;