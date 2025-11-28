
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface EraseControlsProps {
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onApply: () => void;
  onCancel: () => void;
  isApplyDisabled: boolean;
}

const EraseControls: React.FC<EraseControlsProps> = ({ brushSize, onBrushSizeChange, onApply, onCancel, isApplyDisabled }) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-black/70 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl flex items-center gap-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <label htmlFor="brushSize" className="text-sm font-semibold whitespace-nowrap">Brush Size</label>
        <input
          id="brushSize"
          type="range"
          min="5"
          max="100"
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          className="w-32"
        />
      </div>
      <div className="w-px h-8 bg-white/20"></div>
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-zinc-600 text-white text-sm font-bold rounded-md hover:bg-zinc-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onApply}
          disabled={isApplyDisabled}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-md hover:bg-blue-500 transition-colors disabled:bg-blue-800 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          Apply Erase
        </button>
      </div>
    </div>
  );
};

export default EraseControls;
