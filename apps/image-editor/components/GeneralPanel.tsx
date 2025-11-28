import React, { useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { UploadedImage } from '../types';
import { ArrowRight, Loader2 } from 'lucide-react';

interface GeneralPanelProps {
  onGenerate: (prompt: string, baseImage: UploadedImage) => Promise<void>;
  isGenerating: boolean;
}

export const GeneralPanel: React.FC<GeneralPanelProps> = ({ onGenerate, isGenerating }) => {
  const [baseImage, setBaseImage] = useState<UploadedImage | null>(null);
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (!baseImage) return;
    const finalPrompt = `You are an advanced AI image editor.
    TASK: Edit the provided image according to the following instructions.
    
    INSTRUCTIONS: ${prompt}
    
    Make the edits seamless and photorealistic.`;
    
    onGenerate(finalPrompt, baseImage);
  };

  return (
    <div className="space-y-8 animate-fade-in">
       <div>
        <h2 className="text-2xl font-bold text-white mb-2">Creative Editor</h2>
        <p className="text-slate-400">Make complex, multi-step edits to any image using natural language.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/2 space-y-4">
           <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Source Image</h3>
           <ImageUploader 
            label="Upload Image to Edit"
            image={baseImage}
            onUpload={setBaseImage}
            onRemove={() => setBaseImage(null)}
          />
        </div>

        <div className="w-full lg:w-1/2 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Edit Instructions</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Change the sky to a sunset, remove the car from the driveway, and make the grass greener."
              className="w-full h-64 bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none placeholder:text-slate-600 resize-none"
            />
            <p className="text-xs text-slate-500">
              Tip: You can ask for multiple changes at once. Be specific about what to keep and what to change.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!baseImage || !prompt || isGenerating}
            className="w-full py-4 mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" /> Processing Edits...
              </>
            ) : (
              <>
                Apply Edits <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};