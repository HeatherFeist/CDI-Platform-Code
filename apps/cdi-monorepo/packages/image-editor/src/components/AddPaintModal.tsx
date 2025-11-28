
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ImageUploader from './ImageUploader';
import { PaintColor } from '../types';

interface AddPaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onColorSelect: (color: PaintColor) => void;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// region COLOR CONVERSION HELPERS
const componentToHex = (c: number): string => {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
};

const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
};

const rgbToHsv = (r: number, g: number, b: number): { h: number, s: number, v: number } => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
};

const hsvToRgb = (h: number, s: number, v: number): { r: number, g: number, b: number } => {
    s /= 100; v /= 100;
    const i = Math.floor((h / 360) * 6);
    const f = (h / 360) * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    let r = 0, g = 0, b = 0;
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};
// endregion

const AddPaintModal: React.FC<AddPaintModalProps> = ({ isOpen, onClose, onColorSelect }) => {
  const [activeTab, setActiveTab] = useState<'fromImage' | 'picker'>('fromImage');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentColorHex, setCurrentColorHex] = useState<string>('#475569'); // slate-600
  const [loupeData, setLoupeData] = useState<{ x: number, y: number, color: string } | null>(null);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const loupeRef = useRef<HTMLDivElement>(null);
  const svPanelRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);


  const imageUrl = imageFile ? URL.createObjectURL(imageFile) : null;

  const hsv = useMemo(() => {
    const rgb = hexToRgb(currentColorHex);
    return rgb ? rgbToHsv(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, v: 100 };
  }, [currentColorHex]);


  useEffect(() => {
    // Reset state when modal is closed
    if (!isOpen) {
      setImageFile(null);
      setLoupeData(null);
      setIsHoveringImage(false);
      setActiveTab('fromImage');
      setCurrentColorHex('#475569');
    }
  }, [isOpen]);
  
  // Cleanup object URL
  useEffect(() => {
    return () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }
  }, [imageUrl]);

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  const handleFileSelect = (file: File) => {
    setImageFile(file);
    setActiveTab('fromImage');
  };
  
  const extractColor = (e: React.MouseEvent<HTMLImageElement>): string | null => {
      const img = imageRef.current;
      if (!img) return null;

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

      const rect = img.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const canvasX = Math.floor((x / img.width) * img.naturalWidth);
      const canvasY = Math.floor((y / img.height) * img.naturalHeight);

      const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
      return rgbToHex(pixel[0], pixel[1], pixel[2]);
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    const hex = extractColor(e);
    if(hex) {
        setLoupeData({ x: e.clientX, y: e.clientY, color: hex });
        
        const loupe = loupeRef.current;
        const img = imageRef.current;
        if (loupe && img) {
            const rect = img.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            loupe.style.left = `${e.clientX}px`;
            loupe.style.top = `${e.clientY}px`;
            loupe.style.transform = `translate(-50%, -50%)`;
            loupe.style.backgroundImage = `url(${imageUrl})`;
            
            // Magnification logic
            const zoomLevel = 3;
            const bgSizeX = img.width * zoomLevel;
            const bgSizeY = img.height * zoomLevel;
            const bgPosX = (-x * zoomLevel) + (loupe.offsetWidth / 2);
            const bgPosY = (-y * zoomLevel) + (loupe.offsetHeight / 2);

            loupe.style.backgroundSize = `${bgSizeX}px ${bgSizeY}px`;
            loupe.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
            loupe.style.borderColor = hex;
        }
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
      const hex = extractColor(e);
      if(hex) setCurrentColorHex(hex);
  };

  const handleSaveColor = () => {
    if(currentColorHex) {
        onColorSelect({ name: `Custom ${currentColorHex}`, hex: currentColorHex });
    }
  };
  
  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith('#')) {
        value = `#${value}`;
    }
    setCurrentColorHex(value);
    // Basic validation could be added here if desired
  };
  
  const createDragHandler = (
    ref: React.RefObject<HTMLElement>,
    onDrag: (pos: {x: number, y: number}, rect: DOMRect) => void
  ) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const element = ref.current;
    if (!element) return;
    
    const rect = element.getBoundingClientRect();

    const updatePosition = (moveEvent: MouseEvent | Touch) => {
      const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(moveEvent.clientY - rect.top, rect.height));
      onDrag({ x, y }, rect);
    };

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
        updatePosition('touches' in moveEvent ? moveEvent.touches[0] : moveEvent);
    };

    const handleEnd = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
    };
    
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    updatePosition('touches' in e.nativeEvent ? e.nativeEvent.touches[0] : e.nativeEvent);
  };
  
  const handleSvDrag = useCallback((pos: {x: number, y: number}, rect: DOMRect) => {
      const s = (pos.x / rect.width) * 100;
      const v = 100 - (pos.y / rect.height) * 100;
      const { r, g, b } = hsvToRgb(hsv.h, s, v);
      setCurrentColorHex(rgbToHex(r, g, b));
  }, [hsv.h]);

  const handleHueDrag = useCallback((pos: {y: number}, rect: DOMRect) => {
      const h = (pos.y / rect.height) * 360;
      const { r, g, b } = hsvToRgb(h, hsv.s, hsv.v);
      setCurrentColorHex(rgbToHex(r, g, b));
  }, [hsv.s, hsv.v]);

  const tabButtonClasses = (tabName: 'fromImage' | 'picker') => 
    `catalog-tab flex-1 py-2 px-4 text-sm font-bold rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
      activeTab === tabName ? 'active' : 'bg-transparent text-zinc-500 hover:bg-zinc-200'
    }`;
    
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 md:p-8 relative transform transition-all"
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
        <div className="text-center mb-4">
          <h2 className="text-2xl font-extrabold text-zinc-800">Pick a Custom Color</h2>
        </div>

        <div className="p-1 bg-zinc-100 rounded-lg flex mb-4">
            <button onClick={() => setActiveTab('fromImage')} className={tabButtonClasses('fromImage')}>
                From Photo
            </button>
            <button onClick={() => setActiveTab('picker')} className={tabButtonClasses('picker')}>
                Color Picker
            </button>
        </div>
        
        {activeTab === 'fromImage' && (
            !imageUrl ? (
                <>
                    <p className="text-center text-zinc-600 mb-4">Upload a photo or take one with your device. Then, click on the image to select a color.</p>
                    <ImageUploader id="custom-paint-uploader" onFileSelect={handleFileSelect} imageUrl={null} />
                </>
            ) : (
                <div 
                    className="relative w-full aspect-video rounded-lg overflow-hidden border border-zinc-200"
                    onMouseEnter={() => setIsHoveringImage(true)}
                    onMouseLeave={() => setIsHoveringImage(false)}
                >
                    <img
                        ref={imageRef}
                        src={imageUrl}
                        alt="Color source"
                        className="w-full h-full object-contain color-picker-image"
                        onMouseMove={handleMouseMove}
                        onClick={handleImageClick}
                    />
                </div>
            )
        )}
        
        {activeTab === 'picker' && (
            <div className="flex gap-4">
                <div 
                    ref={svPanelRef}
                    className="relative w-full h-48 rounded-md cursor-crosshair"
                    style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)`}}
                    onMouseDown={createDragHandler(svPanelRef, handleSvDrag)}
                    onTouchStart={createDragHandler(svPanelRef, handleSvDrag)}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                    <div
                        className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{
                            left: `${hsv.s}%`,
                            top: `${100 - hsv.v}%`,
                            backgroundColor: currentColorHex,
                        }}
                    ></div>
                </div>
                <div 
                    ref={hueSliderRef}
                    className="relative w-8 h-48 rounded-md cursor-pointer bg-gradient-to-b from-red-500 via-yellow-500,green-500,blue-500,purple-500 to-red-500"
                    style={{backgroundImage: 'linear-gradient(to bottom, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'}}
                    onMouseDown={createDragHandler(hueSliderRef, handleHueDrag)}
                    onTouchStart={createDragHandler(hueSliderRef, handleHueDrag)}
                >
                    <div
                        className="absolute w-10 h-2 -left-1 rounded-sm bg-white/50 border-2 border-white/80 shadow-md transform -translate-y-1/2 pointer-events-none"
                        style={{ top: `${(hsv.h / 360) * 100}%` }}
                    ></div>
                </div>
            </div>
        )}

        <div className="w-full flex items-center justify-center gap-4 mt-6">
            <div 
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
                style={{ backgroundColor: currentColorHex || '#F0F0F0' }}
            ></div>
            <div className="flex flex-col">
                <label htmlFor="hex-input" className="text-sm text-zinc-500">Hex Code</label>
                <input
                    id="hex-input"
                    type="text"
                    value={currentColorHex}
                    onChange={handleHexInputChange}
                    className="text-2xl font-bold font-mono tracking-wider p-1 rounded-md border border-zinc-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    style={{ width: '150px' }}
                />
            </div>
        </div>
        
        <button
            onClick={handleSaveColor}
            disabled={!currentColorHex}
            className="w-full mt-6 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-md shadow-sm text-white bg-zinc-800 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors"
            title="Add this color to your palette"
        >
            Save Color
        </button>
        
        <div ref={loupeRef} className={`color-picker-loupe ${isHoveringImage ? 'visible' : ''}`}></div>
      </div>
    </div>
  );
};

export default AddPaintModal;
