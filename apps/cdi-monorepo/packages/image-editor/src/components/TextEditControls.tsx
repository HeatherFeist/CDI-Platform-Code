
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface TextEditControlsProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onApply: () => void;
  onCancel: () => void;
  isApplyDisabled: boolean;
}

const TextEditControls: React.FC<TextEditControlsProps> = ({ prompt, onPromptChange, onApply, onCancel, isApplyDisabled }) => {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApplyDisabled) {
      onApply();
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-black/70 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl flex items-center gap-4 animate-fade-in w-full max-w-2xl">
      <form onSubmit={handleFormSubmit} className="flex-grow flex items-center gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe your edit... (e.g., 'add a retro filter')"
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

export default TextEditControls;
