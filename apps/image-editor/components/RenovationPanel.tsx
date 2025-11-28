import React, { useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { UploadedImage, SavedImage } from '../types';
import { ArrowRight, Loader2, Plus, Hammer, History, FileText, PenTool, ClipboardList } from 'lucide-react';

interface RenovationPanelProps {
  onGenerate: (prompt: string, baseImage: UploadedImage, refImages: UploadedImage[]) => Promise<void>;
  isGenerating: boolean;
  history: SavedImage[];
}

type InputMode = 'manual' | 'estimate';

export const RenovationPanel: React.FC<RenovationPanelProps> = ({ onGenerate, isGenerating, history }) => {
  const [baseImage, setBaseImage] = useState<UploadedImage | null>(null);
  const [productImages, setProductImages] = useState<UploadedImage[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  
  // State for Manual Mode
  const [manualPrompt, setManualPrompt] = useState('');
  
  // State for Estimate Mode
  const [estimateText, setEstimateText] = useState('');

  const handleAddProduct = (img: UploadedImage) => {
    setProductImages(prev => [...prev, img]);
  };

  const handleRemoveProduct = (id: string) => {
    setProductImages(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = () => {
    if (!baseImage) return;
    
    let finalPrompt = '';

    if (inputMode === 'manual') {
      finalPrompt = `You are an expert interior designer and contractor. 
      TASK: Visualize the renovation of the room shown in the first image (Base Image).
      
      INPUTS:
      - Image 1: Base Room Photo (Before).
      - Subsequent Images: Products/Materials to install (Tiles, Cabinets, Fixtures).
      
      INSTRUCTIONS:
      1. INSTALLATION: Intelligently install the provided products into the base room. 
         - If a product is a floor tile, replace the existing flooring.
         - If a product is cabinetry or furniture, replace existing fixtures or place them logically in the room.
      2. DESIGN REQUEST: ${manualPrompt}
      3. REALISM: Maintain the original perspective, lighting, and structural details of the room. 
      4. OUTPUT: Generate a high-quality "After" photo showing the completed renovation.`;
    } else {
      finalPrompt = `You are an AI Construction Project Manager and Visualizer.
      TASK: Analyze the provided PROJECT ESTIMATE / SCOPE OF WORK and generate the "Finished Project" image.
      
      INPUTS:
      - Image 1: Current Site Condition (Before Photo).
      - Subsequent Images: Materials/Products specified in the estimate.
      
      PROJECT ESTIMATE / SCOPE OF WORK:
      """
      ${estimateText}
      """
      
      EXECUTION INSTRUCTIONS:
      1. ANALYZE SCOPE: Read the estimate above carefully. Identify every renovation task (e.g., "Demo floor", "Install vanity", "Paint walls").
      2. MATERIAL MATCHING: Match the provided product images to the items listed in the estimate.
      3. VISUALIZATION: Apply ONLY the changes listed in the estimate to the "Before Photo".
      4. ACCURACY: Ensure the final image reflects the completed state of the contract as described.
      5. IGNORE IRRELEVANT TEXT: Ignore pricing, dates, or administrative text in the estimate; focus only on visual changes.`;
    }
    
    onGenerate(finalPrompt, baseImage, productImages);
  };

  const isSubmitDisabled = !baseImage || (inputMode === 'manual' ? !manualPrompt : !estimateText) || isGenerating;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Hammer className="text-indigo-400" />
            Renovation Visualizer
          </h2>
          <p className="text-slate-400">Upload a "Before" photo and visualize the finished project.</p>
        </div>
        
        {/* Mode Toggle */}
        <div className="bg-slate-900 p-1 rounded-xl flex border border-slate-700">
          <button
            onClick={() => setInputMode('manual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              inputMode === 'manual' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool size={16} /> Manual
          </button>
          <button
            onClick={() => setInputMode('estimate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              inputMode === 'estimate' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={16} /> Analyze Estimate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">1. Site Photo (Before)</h3>
          <ImageUploader 
            label="Upload Site Photo"
            image={baseImage}
            onUpload={setBaseImage}
            onRemove={() => setBaseImage(null)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">2. Materials & Products</h3>
            <span className="text-xs text-slate-500">{productImages.length} items</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {productImages.map((img) => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden h-32 border border-slate-700 bg-slate-900">
                <img src={img.previewUrl} className="w-full h-full object-cover" alt="Product" />
                <button 
                  onClick={() => handleRemoveProduct(img.id)}
                  className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="rotate-45" size={16} />
                </button>
              </div>
            ))}
            
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors group">
               <Plus className="text-slate-500 group-hover:text-indigo-400 mb-1" />
               <span className="text-xs text-slate-500 group-hover:text-slate-300 text-center px-2">Add Material / Product</span>
               <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                 const file = e.target.files?.[0];
                 if(file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      handleAddProduct({
                        id: Math.random().toString(),
                        file,
                        previewUrl: reader.result as string,
                        base64: reader.result as string,
                        mimeType: file.type
                      });
                    };
                    reader.readAsDataURL(file);
                 }
               }} />
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
          3. {inputMode === 'manual' ? 'Design Instructions' : 'Project Estimate / Scope'}
        </h3>
        
        {inputMode === 'manual' ? (
          <div className="space-y-2">
            <textarea
              value={manualPrompt}
              onChange={(e) => setManualPrompt(e.target.value)}
              placeholder="e.g., Replace the old floor with the tile provided, install the vanity cabinet on the back wall, and paint the remaining walls a soft white."
              className="w-full h-40 bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder:text-slate-600 resize-none"
            />
          </div>
        ) : (
          <div className="space-y-2 animate-fade-in">
             <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-1">
              <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-3 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800 pb-2">
                   <ClipboardList size={14} /> Scope of Work Document
                </div>
                <textarea
                  value={estimateText}
                  onChange={(e) => setEstimateText(e.target.value)}
                  placeholder="Paste the project estimate or scope of work here...&#10;&#10;Example:&#10;1. Demolish existing bathtub.&#10;2. Install new walk-in shower using Tile A (Image 1).&#10;3. Replace vanity with Model X (Image 2)."
                  className="w-full h-48 bg-transparent border-none text-slate-200 focus:ring-0 outline-none placeholder:text-slate-600 resize-none font-mono text-sm"
                />
              </div>
             </div>
             <p className="text-xs text-slate-500 px-1">
               The AI will analyze the text above and apply the described changes using the uploaded materials.
             </p>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="animate-spin" /> {inputMode === 'estimate' ? 'Analyzing Scope...' : 'Installing Products...'}
          </>
        ) : (
          <>
            {inputMode === 'estimate' ? 'Visualize Estimate' : 'Generate After Image'} <ArrowRight size={20} />
          </>
        )}
      </button>

      {/* History Section */}
      {history.length > 0 && (
        <div className="pt-8 border-t border-slate-800">
          <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
            <History size={20} /> Renovision Pro Library
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {history.map((item) => (
              <div key={item.id} className="group relative rounded-lg overflow-hidden border border-slate-700 aspect-square">
                <img src={item.imageUrl} alt="Saved Renovation" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-xs text-white font-medium truncate">Sent to App</p>
                  <p className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</p>
                </div>
                <div className="absolute top-2 right-2 bg-green-500/90 p-1 rounded-full">
                   <ArrowRight size={12} className="text-white -rotate-45" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};