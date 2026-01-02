import React, { useState } from 'react';
import { Lightbulb } from 'lucide-react';

interface BusinessTipProps {
  title: string;
  content: string;
  className?: string;
}

const BusinessTip: React.FC<BusinessTipProps> = ({ title, content, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block ml-2 align-middle ${className} z-20`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-yellow-400 hover:text-yellow-500 transition-colors bg-yellow-50 p-1 rounded-full hover:bg-yellow-100 ring-1 ring-yellow-200"
        aria-label="Show tip"
      >
        <Lightbulb size={14} fill="currentColor" className="animate-pulse" />
      </button>
      
      {/* Tooltip Bubble */}
      <div 
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-white rounded-xl shadow-xl border border-yellow-200 text-left transform transition-all duration-200 origin-bottom ${
          isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
        }`}
      >
        {/* Arrow */}
        <div className="absolute -bottom-2 left-1/2 -ml-2 w-4 h-4 bg-white border-b border-r border-yellow-200 transform rotate-45"></div>
        
        {/* Content */}
        <div className="relative z-10 p-4">
          <h4 className="font-bold text-yellow-700 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
            <Lightbulb size={12} /> {title}
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed font-normal normal-case">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessTip;