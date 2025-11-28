import React, { useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { UploadedImage, SavedImage } from '../types';
import { ArrowRight, Loader2, ShieldCheck, History } from 'lucide-react';

interface MarketplacePanelProps {
  onGenerate: (prompt: string, baseImage: UploadedImage) => Promise<void>;
  isGenerating: boolean;
  history: SavedImage[];
}

export const MarketplacePanel: React.FC<MarketplacePanelProps> = ({ onGenerate, isGenerating, history }) => {
  const [productImage, setProductImage] = useState<UploadedImage | null>(null);
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (!productImage) return;

    const finalPrompt = `You are a professional product photographer editing an auction listing.
    TASK: Place the product from the source image into a new background scene.
    
    CRITICAL RULES FOR AUCTION INTEGRITY:
    1. PRESERVE PRODUCT: You MUST keep the product object EXACTLY as it appears in the original image.
    2. SHOW DEFECTS: Do NOT fix scratches, dents, rust, or wear. The buyer needs to see the true condition.
    3. PRESERVE GEOMETRY: Do not warp, resize, or crop the product itself significantly.
    
    SCENE GENERATION:
    - Create a new background described as: "${prompt}"
    - Ensure the lighting on the product matches the new background environment (shadows, reflections) naturally.
    - The final image should look like a professional photo shoot of the specific item in its current condition.`;

    onGenerate(finalPrompt, productImage);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Marketplace Studio</h2>
        <p className="text-slate-400">Create professional staging for your products without hiding their true condition.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Product Photo</h3>
          <ImageUploader 
            label="Upload Product"
            image={productImage}
            onUpload={setProductImage}
            onRemove={() => setProductImage(null)}
            className="h-80"
          />
          <div className="bg-emerald-900/20 border border-emerald-700/50 p-4 rounded-xl flex gap-3 items-start">
            <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-emerald-200 mb-1">True to Life Guarantee</p>
              <p className="text-xs text-emerald-200/70">
                AI is instructed to preserve all defects, scratches, and details for honest auction listings.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Background Setting</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
               {[
                 "On a clean white marble countertop with soft morning light",
                 "In a cozy rustic living room on a wooden table",
                 "Studio lighting with a solid dark grey background",
                 "Outdoors on a wooden deck with blurred nature background"
               ].map((preset, idx) => (
                 <button
                   key={idx}
                   onClick={() => setPrompt(preset)}
                   className="text-left text-xs p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
                 >
                   {preset}
                 </button>
               ))}
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the background scene... e.g. On a velvet podium with dramatic spotlighting."
              className="w-full h-40 bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none placeholder:text-slate-600 resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!productImage || !prompt || isGenerating}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" /> Staging Product...
              </>
            ) : (
              <>
                Generate Staged Photo <ArrowRight size={20} />
              </>
            )}
          </button>

           {/* History Section */}
           {history.length > 0 && (
            <div className="pt-8 border-t border-slate-800">
              <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
                <History size={20} /> CDI Marketplace Assets
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {history.map((item) => (
                  <div key={item.id} className="group relative rounded-lg overflow-hidden border border-slate-700 aspect-square">
                    <img src={item.imageUrl} alt="Saved Asset" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                      <p className="text-xs text-white font-medium truncate">Listing Ready</p>
                    </div>
                     <div className="absolute top-1 right-1 bg-blue-500/90 p-1 rounded-full">
                       <ArrowRight size={10} className="text-white -rotate-45" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};