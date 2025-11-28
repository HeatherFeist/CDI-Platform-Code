/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { generateProductImage } from '../services/geminiService';
import { Product2D } from '../types';
import Spinner from './Spinner';

interface GenerateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Product2D) => void;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

const GenerateProductModal: React.FC<GenerateProductModalProps> = ({ isOpen, onClose, onAddProduct }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const handleClose = () => {
    setPrompt('');
    setIsLoading(false);
    setError(null);
    setGeneratedImageUrl(null);
    onClose();
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);
    try {
      const imageUrl = await generateProductImage(prompt);
      setGeneratedImageUrl(imageUrl);
    } catch (e) {
      const message = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    if (!generatedImageUrl) return;
    const file = dataURLtoFile(generatedImageUrl, `ai-${Date.now()}.png`);
    const newProduct: Product2D = {
      type: '2d',
      id: `ai-gen-${Date.now()}`,
      name: prompt.substring(0, 30) || 'AI Generated Product',
      imageUrl: generatedImageUrl,
    };
    onAddProduct(newProduct);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl p-6 md:p-8 relative transform transition-all flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 transition-colors z-20"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-zinc-800">Generate Product with AI</h2>
          <p className="text-zinc-500 text-sm mt-1">Describe the product you want to create.</p>
        </div>
        
        <div className="flex flex-col gap-2">
            <label htmlFor="prompt-input" className="font-semibold text-zinc-700">Prompt</label>
            <textarea
                id="prompt-input"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A plush, emerald green velvet armchair with gold legs"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
            />
        </div>

        <div className="aspect-square w-full bg-zinc-100 border-2 border-dashed rounded-lg flex items-center justify-center">
            {isLoading ? (
                <div className="text-center">
                    <Spinner />
                    <p className="mt-2 text-zinc-600">Generating...</p>
                </div>
            ) : error ? (
                 <p className="text-red-600 p-4">{error}</p>
            ) : generatedImageUrl ? (
                <img src={generatedImageUrl} alt="Generated product" className="max-w-full max-h-full object-contain" />
            ) : (
                <p className="text-zinc-500">Your generated image will appear here.</p>
            )}
        </div>
        
        {generatedImageUrl ? (
            <div className="flex gap-2">
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full px-4 py-2 bg-zinc-600 text-white text-sm font-bold rounded-md hover:bg-zinc-700 transition-colors disabled:bg-zinc-400"
                >
                    Generate Again
                </button>
                 <button
                    onClick={handleAdd}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-md hover:bg-blue-700 transition-colors"
                >
                    Add to Catalog
                </button>
            </div>
        ) : (
             <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="w-full px-4 py-3 bg-zinc-800 text-white text-base font-bold rounded-md hover:bg-zinc-900 transition-colors disabled:bg-zinc-400"
            >
                {isLoading ? 'Generating...' : 'Generate Image'}
            </button>
        )}
      </div>
    </div>
  );
};

export default GenerateProductModal;
