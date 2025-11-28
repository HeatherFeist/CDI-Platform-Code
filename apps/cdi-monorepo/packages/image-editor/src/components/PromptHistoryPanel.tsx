/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { PromptHistoryItem } from '../types';

interface PromptHistoryPanelProps {
  isOpen: boolean;
  history: PromptHistoryItem[];
  onClose: () => void;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const PromptHistoryPanel: React.FC<PromptHistoryPanelProps> = ({ isOpen, history, onClose }) => {
  if (!isOpen) {
    return null;
  }
  
  const handlePanelClick = (e: React.MouseEvent) => {
      e.stopPropagation();
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-25 z-30"
      onClick={onClose}
    >
      <div 
        className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
        onClick={handlePanelClick}
      >
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 flex-shrink-0">
            <h2 className="text-lg font-extrabold text-zinc-800">Prompt History</h2>
            <button 
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors"
                aria-label="Close prompt history"
            >
                <CloseIcon />
            </button>
        </header>
        
        <div className="flex-grow p-4 overflow-y-auto">
            {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                    <p className="text-zinc-500 px-4">Your history of generated images and the prompts used to create them will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map(item => (
                        <div key={item.timestamp} className="bg-zinc-50 border border-zinc-200 rounded-lg overflow-hidden">
                            <img src={item.imageUrl} alt="Generated design" className="w-full h-auto object-cover" />
                            <div className="p-3">
                                <p className="text-xs text-zinc-500 mb-2">PROMPT</p>
                                <p className="text-sm text-zinc-700 whitespace-pre-wrap">{item.prompt}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PromptHistoryPanel;
