
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';

interface SaveDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  isLoading: boolean;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SaveDesignModal: React.FC<SaveDesignModalProps> = ({ isOpen, onClose, onSave, isLoading }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset name when modal opens
      setName(`My Design ${new Date().toLocaleDateString()}`);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };
  
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 md:p-8 relative transform transition-all flex flex-col gap-4"
        onClick={handleModalContentClick}
        role="document"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 transition-colors z-10"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-zinc-800">Save Your Design</h2>
          <p className="text-zinc-500 text-sm mt-1">Save this design to access it later or from other apps.</p>
        </div>
        
        <div className="flex flex-col gap-1">
            <label htmlFor="design-name" className="font-semibold text-zinc-700 text-sm">Design Name</label>
            <input
                id="design-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Living Room Concept 1"
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
            />
        </div>

        <button
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
            className="w-full mt-2 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-md shadow-sm text-white bg-zinc-800 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors"
        >
            {isLoading ? <Spinner /> : 'Save to My Designs'}
        </button>
      </div>
    </div>
  );
};

export default SaveDesignModal;
