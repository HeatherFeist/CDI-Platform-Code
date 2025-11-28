/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

// region ICONS
const AddIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);
const PaintIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l.477 2.387a2 2 0 001.806.547a2 2 0 001.022-.547l2.387-.477a6 6 0 003.86-.517l.318-.158a6 6 0 013.86-.517l2.387.477a2 2 0 001.806-.547a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 00-.517-3.86l-.477-2.387z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15l-4-4" />
    </svg>
);
const EraseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);
const MoveIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
);
const TextIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
);
const HighlightIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);
const SaveIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);
const HistoryIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
// endregion ICONS

type Tool = 'add' | 'paint' | 'erase' | 'move' | 'text' | 'highlight' | 'save' | 'history';

interface ToolbarProps {
  activeTool: Tool | null;
  onToolSelect: (tool: Tool) => void;
  isSceneImagePresent: boolean;
  onSaveAsClick: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolSelect, isSceneImagePresent, onSaveAsClick }) => {
  
  const getButtonClasses = (tool: Tool | 'save-as') => {
    const base = "flex flex-col items-center justify-center gap-1 p-2 rounded-lg w-20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";
    const active = "bg-blue-600 text-white shadow-lg scale-105";
    const inactive = "bg-white/80 text-zinc-700 hover:bg-white shadow-md";
    if (tool === 'save-as') return `${base} ${inactive}`;
    return `${base} ${activeTool === tool ? active : inactive}`;
  };

  const editToolsDisabled = !isSceneImagePresent;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-fade-in">
        <div className="flex flex-row flex-wrap justify-center gap-2 p-2 bg-black/20 backdrop-blur-md rounded-xl shadow-lg">
            <button 
                onClick={() => onToolSelect('add')} 
                className={getButtonClasses('add')}
                title="Add Product"
            >
                <AddIcon />
                <span className="text-xs font-bold mt-1">Add</span>
            </button>
            <button 
                onClick={() => onToolSelect('paint')} 
                className={getButtonClasses('paint')}
                title="Paint a Surface"
            >
                <PaintIcon />
                <span className="text-xs font-bold mt-1">Paint</span>
            </button>

            <div className="w-px bg-white/20 mx-1 self-stretch"></div>

            <button 
                onClick={() => onToolSelect('erase')} 
                className={getButtonClasses('erase')}
                title={editToolsDisabled ? "Upload a scene image first" : "Erase an Object"}
                disabled={editToolsDisabled}
            >
                <EraseIcon />
                <span className="text-xs font-bold mt-1">Erase</span>
            </button>
            <button 
                onClick={() => onToolSelect('move')} 
                className={getButtonClasses('move')}
                title={editToolsDisabled ? "Upload a scene image first" : "Move an Object"}
                disabled={editToolsDisabled}
            >
                <MoveIcon />
                <span className="text-xs font-bold mt-1">Move</span>
            </button>
             <button 
                onClick={() => onToolSelect('highlight')} 
                className={getButtonClasses('highlight')}
                title={editToolsDisabled ? "Upload a scene image first" : "Edit a Selected Area"}
                disabled={editToolsDisabled}
            >
                <HighlightIcon />
                <span className="text-xs font-bold mt-1">Highlight</span>
            </button>
            <button 
                onClick={() => onToolSelect('text')} 
                className={getButtonClasses('text')}
                title={editToolsDisabled ? "Upload a scene image first" : "Edit with Text"}
                disabled={editToolsDisabled}
            >
                <TextIcon />
                <span className="text-xs font-bold mt-1">Text Edit</span>
            </button>

            <div className="w-px bg-white/20 mx-1 self-stretch"></div>

             <button 
                onClick={onSaveAsClick} 
                className={getButtonClasses('save-as')}
                title={editToolsDisabled ? "Upload a scene image first" : "Save Current Design"}
                disabled={editToolsDisabled}
            >
                <SaveIcon />
                <span className="text-xs font-bold mt-1">Save As</span>
            </button>
             <button 
                onClick={() => onToolSelect('save')} 
                className={getButtonClasses('save')}
                title={"View Saved Designs"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span className="text-xs font-bold mt-1">My Designs</span>
            </button>
            <button 
                onClick={() => onToolSelect('history')} 
                className={getButtonClasses('history')}
                title={"View Prompt History"}
            >
                <HistoryIcon />
                <span className="text-xs font-bold mt-1">History</span>
            </button>
        </div>
    </div>
  );
};

export default Toolbar;
export type { Tool };