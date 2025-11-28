/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Product, PaintColor, DesignPack, Product3D } from '../types';
import ObjectCard from './ObjectCard';
import DesignPackCard from './DesignPackCard';

interface CatalogProps {
  products: Product[];
  paints: PaintColor[];
  designPacks: DesignPack[];
  selectedItems: {
    product: Product | null;
    paint: PaintColor | null;
    pack: DesignPack | null;
  };
  onProductSelect: (product: Product) => void;
  onPaintSelect: (paint: PaintColor) => void;
  onDesignPackSelect: (pack: DesignPack) => void;
  onAddProductClick: () => void;
  onAddPaintClick: () => void;
  onRemoveCustomProduct: (product: Product) => void;
  onRemoveCustomPaint: (paint: PaintColor) => void;
  onView3DModel: (product: Product3D) => void;
  onGenerateProductClick: () => void;
  onStyleMatchClick: () => void;
}

type CatalogTab = 'products' | 'paints' | 'packs';

const Catalog: React.FC<CatalogProps> = ({ 
    products, paints, designPacks, selectedItems, 
    onProductSelect, onPaintSelect, onDesignPackSelect,
    onAddProductClick, onAddPaintClick, 
    onRemoveCustomProduct, onRemoveCustomPaint,
    onView3DModel, onGenerateProductClick, onStyleMatchClick,
}) => {
  const [activeTab, setActiveTab] = React.useState<CatalogTab>('products');

  const tabButtonClasses = (tabName: CatalogTab) => 
    `catalog-tab flex-1 py-2 px-4 text-sm font-bold rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
      activeTab === tabName ? 'active' : 'bg-transparent text-zinc-500 hover:bg-zinc-200'
    }`;
  
  const customProducts = products.filter(p => typeof p.id === 'string' && (p.id.startsWith('custom-') || p.id.startsWith('style-match-') || p.id.startsWith('ai-gen-')));
  const stockProducts = products.filter(p => !customProducts.includes(p));
  
  const customPaints = paints.filter(p => p.name.startsWith('Custom '));
  const stockPaints = paints.filter(p => !customPaints.includes(p));

  const renderProduct = (product: Product) => {
    const isCustom = typeof product.id === 'string' && (product.id.startsWith('custom-') || product.id.startsWith('style-match-') || product.id.startsWith('ai-gen-'));
    return (
        <div key={product.id} className="relative group">
             <ObjectCard 
                product={product} 
                isSelected={selectedItems.product?.id === product.id}
                onClick={() => onProductSelect(product)}
                onRemove={isCustom ? () => onRemoveCustomProduct(product) : undefined}
            />
             {product.type === '3d' && (
                <button
                    onClick={(e) => { e.stopPropagation(); onView3DModel(product as Product3D); }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 px-2 py-1 bg-black/60 text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="View in 3D"
                >
                    3D View
                </button>
            )}
        </div>
    );
  };
  
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-4xl">
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-2xl p-4">
            <div className="p-1 bg-zinc-100 rounded-lg flex mb-4">
                <button onClick={() => setActiveTab('products')} className={tabButtonClasses('products')}>
                    Products
                </button>
                <button onClick={() => setActiveTab('paints')} className={tabButtonClasses('paints')}>
                    Paints
                </button>
                <button onClick={() => setActiveTab('packs')} className={tabButtonClasses('packs')}>
                    Design Packs
                </button>
            </div>
            
            <div className="overflow-y-auto" style={{ maxHeight: '200px' }}>
                {activeTab === 'products' && (
                    <>
                        <div className="flex justify-end gap-2 mb-2 pr-1">
                            <button onClick={onStyleMatchClick} className="catalog-action-button">Style Match</button>
                            <button onClick={onGenerateProductClick} className="catalog-action-button">Generate with AI</button>
                            <button onClick={onAddProductClick} className="catalog-action-button">Add Your Own</button>
                        </div>
                        {customProducts.length > 0 && (
                            <>
                                <h4 className="catalog-section-header">Your Products</h4>
                                <div className="catalog-grid">
                                    {customProducts.map(renderProduct)}
                                </div>
                            </>
                        )}
                        <h4 className="catalog-section-header">Stock Products</h4>
                        <div className="catalog-grid">
                            {stockProducts.map(renderProduct)}
                        </div>
                    </>
                )}
                
                {activeTab === 'paints' && (
                     <>
                        <div className="flex justify-end gap-2 mb-2 pr-1">
                            <button onClick={onAddPaintClick} className="catalog-action-button">Add Custom Color</button>
                        </div>
                        {customPaints.length > 0 && (
                             <>
                                <h4 className="catalog-section-header">Your Colors</h4>
                                <div className="catalog-grid">
                                    {customPaints.map((color) => (
                                        <div key={color.hex} className="relative group">
                                            <div 
                                                onClick={() => onPaintSelect(color)}
                                                className={`w-full aspect-square rounded-lg shadow-md transition-all duration-300 cursor-pointer hover:scale-105 ${selectedItems.paint?.hex === color.hex ? 'border-4 border-blue-500 scale-105' : 'border border-zinc-200'}`}
                                                style={{ backgroundColor: color.hex }}
                                            ></div>
                                            <button
                                                onClick={() => onRemoveCustomPaint(color)}
                                                className="absolute top-1 right-1 z-10 p-1 bg-white/70 rounded-full text-zinc-600 hover:bg-white hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                                aria-label={`Remove ${color.name}`}
                                                title={`Remove ${color.name}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                            <p className="text-xs text-center font-semibold text-zinc-600 mt-1 truncate">{color.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        <h4 className="catalog-section-header">Curated Colors</h4>
                         <div className="catalog-grid">
                            {stockPaints.map((color) => (
                                <div key={color.hex} onClick={() => onPaintSelect(color)} className="flex flex-col items-center">
                                    <div 
                                        className={`w-full aspect-square rounded-lg shadow-md transition-all duration-300 cursor-pointer hover:scale-105 ${selectedItems.paint?.hex === color.hex ? 'border-4 border-blue-500 scale-105' : 'border border-zinc-200'}`}
                                        style={{ backgroundColor: color.hex }}
                                    ></div>
                                    <p className="text-xs text-center font-semibold text-zinc-600 mt-1 truncate">{color.name}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                
                {activeTab === 'packs' && (
                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                        {designPacks.map((pack) => (
                           <DesignPackCard 
                                key={pack.id}
                                pack={pack}
                                isSelected={selectedItems.pack?.id === pack.id}
                                onClick={() => onDesignPackSelect(pack)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Catalog;
