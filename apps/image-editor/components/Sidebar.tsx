import React from 'react';
import { AppMode } from '../types';
import { APP_MODES } from '../constants';
import { Home, ShoppingBag, Wand2, Sparkles, Key, Layers } from 'lucide-react';

interface SidebarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentMode, onModeChange }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home': return <Home size={20} />;
      case 'ShoppingBag': return <ShoppingBag size={20} />;
      case 'Wand': return <Wand2 size={20} />;
      default: return <Sparkles size={20} />;
    }
  };

  const handleChangeKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
  };

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Layers className="text-white" size={24} />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          CDI Image Editor
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {APP_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
              currentMode === mode.id
                ? 'bg-slate-800 text-indigo-400 shadow-lg shadow-indigo-900/10 border border-slate-700/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {getIcon(mode.icon)}
            <div className="flex flex-col items-start text-left">
              <span>{mode.label}</span>
            </div>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleChangeKey}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Key size={18} />
          <span>Change API Key</span>
        </button>
      </div>
    </aside>
  );
};