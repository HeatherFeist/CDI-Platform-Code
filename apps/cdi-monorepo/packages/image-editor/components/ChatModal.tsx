/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Estimate } from '../types';
import Spinner from './Spinner';

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


interface EstimateDisplayProps {
  estimate: Estimate;
  onDownload: () => void;
}

const EstimateDisplay: React.FC<EstimateDisplayProps> = ({ estimate, onDownload }) => {
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="bg-white border border-zinc-200 rounded-lg p-4 mt-2">
            <h4 className="font-bold text-lg text-zinc-800 mb-2">Project Estimate (Zip Code: {estimate.zipCode})</h4>
            
            <div className="mb-4">
                <h5 className="font-semibold text-zinc-700 mb-1">Materials</h5>
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 text-zinc-600">
                        <tr>
                            <th className="p-2">Item</th>
                            <th className="p-2 text-right">Qty</th>
                            <th className="p-2 text-right">Unit Cost</th>
                            <th className="p-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {estimate.materials.map((item, index) => (
                            <tr key={index} className="border-b border-zinc-100">
                                <td className="p-2">{item.item}</td>
                                <td className="p-2 text-right">{item.quantity}</td>
                                <td className="p-2 text-right">{formatCurrency(item.unitCost)}</td>
                                <td className="p-2 text-right font-medium">{formatCurrency(item.totalCost)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold bg-zinc-50">
                            <td colSpan={3} className="p-2 text-right">Materials Subtotal</td>
                            <td className="p-2 text-right">{formatCurrency(estimate.totalMaterialCost)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="mb-4">
                 <h5 className="font-semibold text-zinc-700 mb-1">Labor</h5>
                 <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 text-zinc-600">
                        <tr>
                            <th className="p-2">Task</th>
                            <th className="p-2 text-right">Hours</th>
                            <th className="p-2 text-right">Rate</th>
                            <th className="p-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {estimate.labor.map((item, index) => (
                            <tr key={index} className="border-b border-zinc-100">
                                <td className="p-2">{item.item}</td>
                                <td className="p-2 text-right">{item.quantity}</td>
                                <td className="p-2 text-right">{formatCurrency(item.unitCost)}/hr</td>
                                <td className="p-2 text-right font-medium">{formatCurrency(item.totalCost)}</td>
                            </tr>
                        ))}
                    </tbody>
                     <tfoot>
                        <tr className="font-bold bg-zinc-50">
                            <td colSpan={3} className="p-2 text-right">Labor Subtotal</td>
                            <td className="p-2 text-right">{formatCurrency(estimate.totalLaborCost)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="border-t-2 border-zinc-200 pt-3 mt-4 text-right">
                <p className="text-xl font-bold text-zinc-800">Total Project Cost: {formatCurrency(estimate.totalProjectCost)}</p>
            </div>

            {estimate.notes && (
                <div className="mt-4 text-xs text-zinc-500 bg-zinc-50 p-3 rounded-md">
                    <p><strong>Notes:</strong> {estimate.notes}</p>
                </div>
            )}

            <button
                onClick={onDownload}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zinc-800 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors"
            >
                <DownloadIcon />
                Download Estimate
            </button>
        </div>
    );
};


interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  error: string | null;
  onDownloadEstimate?: (estimate: Estimate) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, history, onSendMessage, isLoading, error, onDownloadEstimate }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isLoading]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-end justify-center p-0 sm:items-center sm:p-4 animate-fade-in"
      onClick={onClose}
    >
        <div 
            className="bg-zinc-50 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col transform transition-all"
            style={{ height: '90vh', maxHeight: '700px' }}
            onClick={handleModalContentClick}
            role="dialog"
            aria-modal="true"
        >
            <header className="flex items-center justify-between p-4 border-b border-zinc-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 text-white rounded-full flex items-center justify-center font-bold text-xl">
                        DP
                    </div>
                    <div>
                        <h2 className="text-lg font-extrabold text-zinc-800">Design Pro</h2>
                        <p className="text-sm text-zinc-500">Your AI Carpenter & Designer</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors"
                    aria-label="Close chat"
                >
                    <CloseIcon />
                </button>
            </header>

            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {history.map((chat, index) => (
                    <div key={index} className={`flex items-end gap-2 ${chat.role === 'user' ? 'justify-end' : ''}`}>
                         {chat.role === 'model' && (
                            <div className="w-8 h-8 bg-zinc-800 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">DP</div>
                         )}
                        <div className={`max-w-md lg:max-w-lg p-3 rounded-2xl ${chat.role === 'user' ? 'bg-zinc-800 text-white rounded-br-none' : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-none'}`}>
                            {chat.parts.map((part, i) => <p key={i} className="whitespace-pre-wrap">{part.text}</p>)}
                            {chat.estimate && onDownloadEstimate && <EstimateDisplay estimate={chat.estimate} onDownload={() => onDownloadEstimate(chat.estimate!)} />}
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-end gap-2">
                         <div className="w-8 h-8 bg-zinc-800 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">DP</div>
                         <div className="max-w-md p-3 rounded-2xl bg-white border border-zinc-200 text-zinc-800 rounded-bl-none">
                            <div className="flex items-center gap-2">
                                <Spinner />
                                <span className="text-zinc-500 text-sm">Design Pro is typing...</span>
                            </div>
                         </div>
                    </div>
                )}
                {error && <p className="text-red-500 text-sm p-2 bg-red-100 rounded-md">{error}</p>}
                <div ref={messagesEndRef} />
            </div>

            <footer className="p-4 border-t border-zinc-200 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask for design advice or an estimate..."
                        className="w-full bg-white border border-zinc-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !message.trim()}
                        className="p-2 bg-zinc-800 text-white rounded-full hover:bg-zinc-900 disabled:bg-zinc-400 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
                        aria-label="Send message"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </form>
            </footer>
        </div>
    </div>
  );
};

export default ChatModal;
