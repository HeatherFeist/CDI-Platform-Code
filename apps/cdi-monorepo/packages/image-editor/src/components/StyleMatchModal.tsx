
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback } from 'react';
import ImageUploader from './ImageUploader';
import { analyzeInspirationImage, StyleMatchResults, generateProductImage } from '../services/geminiService';
import { PaintColor, Product2D } from '../types';
import Spinner from './Spinner';

interface StyleMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Product2D) => void;
  onAddPaintColor: (color: PaintColor) => void;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const StyleMatchModal: React.FC<StyleMatchModalProps> = ({ isOpen, onClose, onAddProduct, onAddPaintColor }) => {
  const [inspirationFile, setInspirationFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<StyleMatchResults | null>(null);
  const [generatingProducts, setGeneratingProducts] = useState<Set<string>>(new Set());

  const handleClose = () => {
    setInspirationFile(null);
    setIsLoading(false);
    setError(null);
    setResults(null);
    setGeneratingProducts(new Set());
    onClose();
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setInspirationFile(file);
    setResults(null);
    setError(null);
    setIsLoading(true);
    setLoadingMessage('Analyzing style...');

    try {
      const analysisResults = await analyzeInspirationImage(file);
      setResults(analysisResults);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAddProduct = async (product: { name: string, description: string }) => {
    setGeneratingProducts(prev => new Set(prev).add(product.name));
    setLoadingMessage(`Generating "${product.name}"...`);
    setError(null);
    
    try {
      const prompt = `A photorealistic image of a ${product.name}, ${product.description}. The product should be on a plain white background with studio lighting, suitable for a product catalog.`;
      const imageUrl = await generateProductImage(prompt);
      const newProduct: Product2D = {
        type: '2d',
        id: `style-match-${Date.now()}`,
        name: product.name,
        imageUrl: imageUrl,
      };
      onAddProduct(newProduct);
      // Optionally, remove the product from the suggestion list after adding
      setResults(prev => prev ? ({ ...prev, products: prev.products.filter(p => p.name !== product.name) }) : null);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Failed to generate product "${product.name}": ${errorMessage}`);
    } finally {
      setGeneratingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.name);
        return newSet;
      });
      setLoadingMessage('');
    }
  };

  const handleAddPaintColor = (color: PaintColor) => {
    onAddPaintColor(color);
    setResults(prev => prev ? ({ ...prev, paintColors: prev.paintColors.filter(c => c.hex !== color.hex) }) : null);
  };
  
  if (!isOpen) return null;

  const handleModalContentClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 md:p-8 relative transform transition-all flex flex-col"
        style={{ height: '90vh', maxHeight: '800px' }}
        onClick={handleModalContentClick}
        role="document"
      >
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 transition-colors z-20"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
        <div className="text-center flex-shrink-0">
          <h2 className="text-2xl font-extrabold text-zinc-800">Style Match</h2>
          <p className="text-zinc-500 text-sm mt-1">Upload an inspiration photo to generate matching products and colors.</p>
        </div>

        <div className="mt-4 flex-grow overflow-y-auto pr-2">
            {!inspirationFile && (
                 <ImageUploader id="inspiration-uploader" onFileSelect={handleFileSelect} imageUrl={null} />
            )}

            {isLoading && (
                <div className="h-full flex flex-col items-center justify-center">
                    <Spinner />
                    <p className="mt-4 text-zinc-600">{loadingMessage || 'Loading...'}</p>
                </div>
            )}
            
            {error && (
                <div className="my-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg" role="alert">
                    <p><span className="font-bold">Error:</span> {error}</p>
                </div>
            )}

            {results && (
                <div className="animate-fade-in space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-zinc-800 mb-3">Suggested Products</h3>
                        {results.products.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {results.products.map((product) => (
                                    <div key={product.name} className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-bold text-zinc-900">{product.name}</h4>
                                            <p className="text-sm text-zinc-600 mt-1">{product.description}</p>
                                        </div>
                                        <button
                                            onClick={() => handleAddProduct(product)}
                                            disabled={generatingProducts.has(product.name)}
                                            className="w-full mt-4 px-4 py-2 bg-zinc-800 text-white text-sm font-bold rounded-md hover:bg-zinc-900 transition-colors disabled:bg-zinc-400 flex items-center justify-center gap-2"
                                        >
                                            {generatingProducts.has(product.name) ? <><Spinner /> Generating...</> : 'Generate & Add'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-zinc-500 text-sm">No new product suggestions found.</p>}
                    </div>
                     <div>
                        <h3 className="text-lg font-bold text-zinc-800 mb-3">Color Palette</h3>
                         {results.paintColors.length > 0 ? (
                            <div className="flex flex-wrap gap-4">
                                {results.paintColors.map((color) => (
                                    <div key={color.hex} className="flex flex-col items-center gap-2">
                                        <div 
                                            className="w-16 h-16 rounded-full border-4 border-white shadow-md"
                                            style={{ backgroundColor: color.hex }}
                                        ></div>
                                        <p className="text-xs text-center font-medium text-zinc-600 max-w-16 truncate">{color.name}</p>
                                        <button
                                            onClick={() => handleAddPaintColor(color)}
                                            className="text-xs font-bold text-blue-600 hover:underline"
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                         ) : <p className="text-zinc-500 text-sm">Could not extract a color palette.</p>}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StyleMatchModal;
