import React, { useRef } from 'react';
import { Gavel, Store, Repeat, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface ListingTypeSelectorProps {
  value: 'auction' | 'store' | 'trade' | 'digital';
  onChange: (type: 'auction' | 'store' | 'trade' | 'digital') => void;
}

const checkmark = (
  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const cards = [
  {
    type: 'auction' as const,
    emoji: '🔨',
    label: 'Auction',
    description: 'Time-limited competitive bidding',
    bullets: ['Buyers compete with bids', 'Set starting price & duration', 'Optional reserve price'],
    icon: <Gavel size={28} />,
    active: 'border-purple-500 bg-purple-50 ring-2 ring-purple-300 shadow-lg',
    iconBgActive: 'bg-purple-500',
    iconBgInactive: 'bg-purple-100',
    iconColorActive: 'text-white',
    iconColorInactive: 'text-purple-500',
    titleColorActive: 'text-purple-900',
    checkBg: 'bg-purple-500',
  },
  {
    type: 'store' as const,
    emoji: '🏪',
    label: 'Store Item',
    description: 'Fixed price, instant purchase',
    bullets: ['Set your price', 'Manage stock levels', 'Instant checkout'],
    icon: <Store size={28} />,
    active: 'border-green-500 bg-green-50 ring-2 ring-green-300 shadow-lg',
    iconBgActive: 'bg-green-500',
    iconBgInactive: 'bg-green-100',
    iconColorActive: 'text-white',
    iconColorInactive: 'text-green-600',
    titleColorActive: 'text-green-900',
    checkBg: 'bg-green-500',
  },
  {
    type: 'trade' as const,
    emoji: '🔄',
    label: 'Trade/Barter',
    description: 'Exchange items without money',
    bullets: ['Specify what you want', 'No money involved', 'Community trading'],
    icon: <Repeat size={28} />,
    active: 'border-blue-500 bg-blue-50 ring-2 ring-blue-300 shadow-lg',
    iconBgActive: 'bg-blue-500',
    iconBgInactive: 'bg-blue-100',
    iconColorActive: 'text-white',
    iconColorInactive: 'text-blue-600',
    titleColorActive: 'text-blue-900',
    checkBg: 'bg-blue-500',
  },
  {
    type: 'digital' as const,
    emoji: '💾',
    label: 'Digital Item',
    description: 'Sell downloadable files',
    bullets: ['PDFs, music, software & more', 'Instant download after purchase', 'No physical shipping'],
    icon: <Download size={28} />,
    active: 'border-orange-500 bg-orange-50 ring-2 ring-orange-300 shadow-lg',
    iconBgActive: 'bg-orange-500',
    iconBgInactive: 'bg-orange-100',
    iconColorActive: 'text-white',
    iconColorInactive: 'text-orange-600',
    titleColorActive: 'text-orange-900',
    checkBg: 'bg-orange-500',
  },
];

export default function ListingTypeSelector({ value, onChange }: ListingTypeSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -180 : 180, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-8">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        How do you want to list this item?
      </label>

      <div className="relative px-5">
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={16} className="text-gray-600" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {cards.map((card) => {
            const isActive = value === card.type;
            return (
              <button
                key={card.type}
                type="button"
                onClick={() => onChange(card.type)}
                className={`relative flex-shrink-0 flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-xl transition-all cursor-pointer overflow-hidden ${
                  isActive ? card.active : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
                style={{ width: '155px', height: isActive ? 'auto' : '155px', minHeight: '155px' }}
              >
                {isActive && (
                  <div className={`absolute top-2 right-2 w-5 h-5 ${card.checkBg} rounded-full flex items-center justify-center`}>
                    {checkmark}
                  </div>
                )}

                <div className={`p-3 rounded-xl mt-1 ${isActive ? card.iconBgActive : card.iconBgInactive}`}>
                  <span className={isActive ? card.iconColorActive : card.iconColorInactive}>
                    {card.icon}
                  </span>
                </div>

                <div className="text-center">
                  <div className={`font-semibold text-sm leading-tight ${isActive ? card.titleColorActive : 'text-gray-800'}`}>
                    {card.emoji} {card.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 leading-snug">{card.description}</div>
                </div>

                {isActive && (
                  <ul className="text-xs text-gray-600 space-y-1 text-left w-full border-t border-gray-200 pt-2 mt-auto">
                    {card.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-1">
                        <span className="shrink-0">✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ChevronRight size={16} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
}
