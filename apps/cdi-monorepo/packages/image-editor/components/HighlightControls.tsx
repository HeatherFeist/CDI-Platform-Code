/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface HighlightControlsProps {
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onApply: () => void;
  onCancel: () => void;
  isApplyDisabled: boolean;
}

const HighlightControls: React.FC<HighlightControlsProps> = ({ brushSize, onBrushSizeChange, prompt, onPromptChange, onApply, onCancel, isApplyDisabled }) => {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApplyDisabled) {
      onApply();
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-black/70 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl flex items-center gap-4 animate-fade-in w-full max-w-2xl">
      <div className="flex items-center gap-2">
        <label htmlFor="highlightBrushSize" className="text-sm font-semibold whitespace-nowrap">Brush Size</label>
        <input
          id="highlightBrushSize"
          type="range"
          min="5"
          max="100"
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          className="w-24"
        />
      </div>
      <div className="w-px h-8 bg-white/20"></div>
      <form onSubmit={handleFormSubmit} className="flex-grow flex items-center gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe your edit for the selected area..."
          className="w-full bg-white/20 border border-white/30 rounded-md px-3 py-2 text-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          disabled={isApplyDisabled}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-md hover:bg-blue-500 transition-colors disabled:bg-blue-800 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Apply Edit
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-zinc-600 text-white text-sm font-bold rounded-md hover:bg-zinc-500 transition-colors"
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default HighlightControls;