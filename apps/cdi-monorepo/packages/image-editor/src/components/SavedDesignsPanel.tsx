
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SavedDesign } from '../types';

interface SavedDesignsPanelProps {
    isOpen: boolean;
    designs: SavedDesign[];
    onClose: () => void;
    onLoadDesign: (design: SavedDesign) => void;
    onDeleteDesign: (design: SavedDesign) => void;
    onExportDesign?: (design: SavedDesign, destination: 'marketplace' | 'renovision') => void;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const SavedDesignsPanel: React.FC<SavedDesignsPanelProps> = ({ isOpen, designs, onClose, onLoadDesign, onDeleteDesign }) => {
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
            <h2 className="text-lg font-extrabold text-zinc-800">My Saved Designs</h2>
            <button 
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors"
                aria-label="Close saved designs"
            >
                <CloseIcon />
            </button>
        </header>
        
        <div className="flex-grow p-2 overflow-y-auto">
            {designs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                    <p className="text-zinc-500">You haven't saved any designs yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {designs.map(design => (
                        <div key={design.id} className="group relative rounded-lg overflow-hidden border border-zinc-200 aspect-square">
                            <img src={design.dataUrl} alt={design.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
                                <p className="text-white font-bold text-sm truncate">{design.name}</p>
                                <div className="flex flex-col gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => onLoadDesign(design)}
                                            className="text-xs bg-white text-zinc-800 font-bold px-2 py-1 rounded-md hover:bg-zinc-200"
                                        >
                                            Load
                                        </button>
                                        <button
                                            onClick={() => onDeleteDesign(design)}
                                            className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                                            title="Delete design"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => onExportDesign && onExportDesign(design, 'marketplace')}
                                            className="text-xs bg-blue-600 text-white font-bold px-2 py-1 rounded-md hover:bg-blue-700"
                                            title="Send to Marketplace"
                                        >
                                            Send to Marketplace
                                        </button>
                                        <button
                                            onClick={() => onExportDesign && onExportDesign(design, 'renovision')}
                                            className="text-xs bg-green-600 text-white font-bold px-2 py-1 rounded-md hover:bg-green-700"
                                            title="Send to Renovision"
                                        >
                                            Send to Renovision
                                        </button>
                                    </div>
                                </div>
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

export default SavedDesignsPanel;
