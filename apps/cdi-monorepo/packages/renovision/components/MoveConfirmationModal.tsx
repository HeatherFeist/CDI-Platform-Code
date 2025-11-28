/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface MoveConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const MoveConfirmationModal: React.FC<MoveConfirmationModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-25 z-30 flex items-center justify-center p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center transform transition-all"
        role="document"
      >
        <h3 className="text-lg font-bold text-zinc-800">Confirm Object</h3>
        <p className="text-zinc-600 mt-2">
          Is this the object you'd like to move? The highlighted area will be lifted from the scene.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-zinc-200 text-zinc-800 text-sm font-bold rounded-md hover:bg-zinc-300 transition-colors"
          >
            No, Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-md hover:bg-blue-700 transition-colors"
          >
            Move It
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveConfirmationModal;