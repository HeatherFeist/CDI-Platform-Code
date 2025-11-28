import React, { useState } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  initialValue?: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, initialValue }) => {
  const [apiKey, setApiKey] = useState(initialValue || '');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('API key is required.');
      return;
    }
    setError(null);
    onSave(apiKey.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <h2 className="text-xl font-bold mb-2">Enter Your Gemini API Key</h2>
        <p className="text-sm text-zinc-600 mb-4">
          This app does not store or share your key. It is saved only in your browser and used for your own image generation. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Get your key here</a>.
        </p>
        <input
          type="text"
          className="w-full border border-zinc-300 rounded px-3 py-2 mb-2"
          placeholder="Paste your Gemini API key here..."
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          autoFocus
        />
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded bg-zinc-200 text-zinc-700 font-bold hover:bg-zinc-300">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700">Save Key</button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
