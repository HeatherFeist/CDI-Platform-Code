
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { DesignPack } from '../types';

interface DesignPackCardProps {
    pack: DesignPack;
    isSelected: boolean;
    onClick: () => void;
}

const DesignPackCard: React.FC<DesignPackCardProps> = ({ pack, isSelected, onClick }) => {
    const cardClasses = `
        bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300
        cursor-pointer hover:shadow-xl hover:scale-105
        ${isSelected ? 'border-2 border-blue-500 shadow-xl' : 'border border-zinc-200'}
        flex flex-col
    `;

    return (
        <div className={cardClasses} onClick={onClick} role="button" aria-pressed={isSelected}>
            <div className="aspect-video w-full bg-zinc-100 flex items-center justify-center overflow-hidden">
                <img src={pack.thumbnailUrl} alt={pack.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 text-left flex-grow flex flex-col">
                <h4 className="text-md font-bold text-zinc-800">{pack.name}</h4>
                <p className="text-xs text-zinc-600 mt-1 flex-grow">{pack.description}</p>
            </div>
        </div>
    );
};

export default DesignPackCard;
