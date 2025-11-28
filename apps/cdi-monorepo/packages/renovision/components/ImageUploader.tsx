/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useCallback, useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import CameraModal from './CameraModal';

export interface UploaderHandle {
    getMaskAsFile: () => Promise<File | null>;
    clearEraseMask: () => void;
    getImageRef: () => HTMLImageElement | null;
}

interface ImageUploaderProps {
  id: string;
  label?: string;
  onFileSelect: (file: File) => void;
  imageUrl: string | null;
  interactionMode?: 'place' | 'paint' | 'remove' | 'upload' | 'color-pick' | 'erase-draw' | 'move-select' | 'move-confirm';
  onPlacement?: (position: {x: number, y: number}, relativePosition: { xPercent: number; yPercent: number; }) => void;
  onColorPick?: (hex: string) => void;
  persistedOrbPosition?: { x: number; y: number } | null;
  showDebugButton?: boolean;
  onDebugClick?: () => void;
  isTouchHovering?: boolean;
  touchOrbPosition?: { x: number; y: number } | null;
  zoomLevel?: number;
  viewVersion?: number;
  isErasing?: boolean;
  brushSize?: number;
  onDraw?: () => void;
  selectionMaskUrl?: string | null;
}

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-zinc-500 mx-auto mb-2" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const WarningIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const CameraIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const componentToHex = (c: number): string => {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
};
const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};


const ImageUploader = forwardRef<UploaderHandle, ImageUploaderProps>(({ id, label, onFileSelect, imageUrl, interactionMode = 'upload', onPlacement, onColorPick, persistedOrbPosition, showDebugButton, onDebugClick, isTouchHovering = false, touchOrbPosition = null, zoomLevel = 1, viewVersion = 0, isErasing = false, brushSize = 30, onDraw, selectionMaskUrl }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const loupeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brushCursorRef = useRef<HTMLDivElement>(null);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [orbPosition, setOrbPosition] = useState<{x: number, y: number} | null>(null);
  const [fileTypeError, setFileTypeError] = useState<string | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isHoveringImage, setIsHoveringImage] = useState(false);

  // Pan and zoom state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panState = useRef({ startX: 0, startY: 0, initialPanX: 0, initialPanY: 0 });
  const didPan = useRef(false);
  
  // Erase drawing state
  const drawingPoints = useRef<Array<{ x: number, y: number }[]>>([]);
  const isDrawing = useRef(false);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getMaskAsFile: async (): Promise<File | null> => {
        const img = imgRef.current;
        const canvas = canvasRef.current;
        if (!img || !canvas || drawingPoints.current.length === 0) return null;

        const MAX_DIMENSION = 1024;
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = MAX_DIMENSION;
        maskCanvas.height = MAX_DIMENSION;
        const ctx = maskCanvas.getContext('2d');
        if (!ctx) return null;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, MAX_DIMENSION, MAX_DIMENSION);

        const { naturalWidth, naturalHeight } = img;
        const aspectRatio = naturalWidth / naturalHeight;
        let contentWidth, contentHeight;
        if (aspectRatio > 1) { // Landscape
            contentWidth = MAX_DIMENSION;
            contentHeight = MAX_DIMENSION / aspectRatio;
        } else { // Portrait or square
            contentHeight = MAX_DIMENSION;
            contentWidth = MAX_DIMENSION * aspectRatio;
        }
        const offsetX = (MAX_DIMENSION - contentWidth) / 2;
        const offsetY = (MAX_DIMENSION - contentHeight) / 2;
        
        const { width: displayedWidth, height: displayedHeight } = canvas.getBoundingClientRect();
        const scaleX = contentWidth / displayedWidth;
        const scaleY = contentHeight / displayedHeight;

        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'white';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        drawingPoints.current.forEach(path => {
            if (path.length === 0) return;
            ctx.lineWidth = brushSize * scaleX; // Scale brush size
            ctx.beginPath();
            ctx.moveTo(path[0].x * scaleX + offsetX, path[0].y * scaleY + offsetY);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x * scaleX + offsetX, path[i].y * scaleY + offsetY);
            }
            ctx.stroke();
            if (path.length === 1) {
                ctx.arc(path[0].x * scaleX + offsetX, path[0].y * scaleY + offsetY, ctx.lineWidth / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        return new Promise((resolve) => {
            maskCanvas.toBlob(blob => {
                if (blob) resolve(new File([blob], 'mask.png', { type: 'image/png' }));
                else resolve(null);
            }, 'image/png');
        });
    },
    clearEraseMask: () => {
        drawingPoints.current = [];
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    },
    getImageRef: () => imgRef.current,
  }));

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; // red-500 with opacity
    ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    drawingPoints.current.forEach(path => {
        if (path.length === 0) return;
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();

        // Draw circles at start/end for smoother path ends
        if (path.length === 1) { // For single click dots
             ctx.arc(path[0].x, path[0].y, brushSize / 2, 0, Math.PI * 2);
             ctx.fill();
        }
    });
  }, [brushSize]);
  
  // Reset pan when view version changes (e.g., new image loaded or reset clicked)
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
    drawingPoints.current = [];
  }, [viewVersion]);

  useEffect(() => {
    if (!imageUrl) {
      setFileTypeError(null);
      drawingPoints.current = [];
    }
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (isErasing && canvas) {
        const resizeObserver = new ResizeObserver(() => {
            const img = imgRef.current;
            if (img) {
                const rect = img.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                redrawCanvas();
            }
        });
        if(imgRef.current) resizeObserver.observe(imgRef.current);
        return () => resizeObserver.disconnect();
    }
  }, [isErasing, redrawCanvas]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setFileTypeError('For best results, please use PNG, JPG, or JPEG formats.');
      } else {
        setFileTypeError(null);
      }
      onFileSelect(file);
    }
  };

  const extractColor = useCallback((clientX: number, clientY: number): string | null => {
      const img = imgRef.current;
      if (!img || !img.src) return null;
      
      const imgRect = img.getBoundingClientRect();
      if (clientX < imgRect.left || clientX > imgRect.right || clientY < imgRect.top || clientY > imgRect.bottom) {
          return null;
      }

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

      const imageX = clientX - imgRect.left;
      const imageY = clientY - imgRect.top;

      const canvasX = Math.floor((imageX / imgRect.width) * img.naturalWidth);
      const canvasY = Math.floor((imageY / imgRect.height) * img.naturalHeight);
      
      const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
      return rgbToHex(pixel[0], pixel[1], pixel[2]);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    if (interactionMode === 'color-pick' && !isPanning && imgRef.current) {
        handleMouseMoveForLoupe(e);
    }

    if (brushCursorRef.current && isErasing) {
        brushCursorRef.current.style.left = `${clientX}px`;
        brushCursorRef.current.style.top = `${clientY}px`;
    }
  };

  const handleMouseMoveForLoupe = (e: React.MouseEvent<HTMLDivElement>) => {
    const hex = extractColor(e.clientX, e.clientY);
    if(hex) {        
        const loupe = loupeRef.current;
        const img = imgRef.current;
        if (loupe && img) {
            loupe.style.left = `${e.clientX}px`;
            loupe.style.top = `${e.clientY}px`;
            loupe.style.transform = `translate(-50%, -50%)`;
            loupe.style.backgroundImage = `url(${imageUrl})`;
            
            const zoomLevelLoupe = 3;
            const imgRect = img.getBoundingClientRect();
            const bgSizeX = imgRect.width * zoomLevelLoupe;
            const bgSizeY = imgRect.height * zoomLevelLoupe;
            const bgPosX = (-(e.clientX - imgRect.left) * zoomLevelLoupe) + (loupe.offsetWidth / 2);
            const bgPosY = (-(e.clientY - imgRect.top) * zoomLevelLoupe) + (loupe.offsetHeight / 2);

            loupe.style.backgroundSize = `${bgSizeX}px ${bgSizeY}px`;
            loupe.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
            loupe.style.borderColor = hex;
        }
    }
  };
  
  const getPointInCanvas = useCallback((clientX: number, clientY: number, currentTarget: HTMLElement) => {
    const img = imgRef.current;
    if (!img) return null;

    const imgRect = img.getBoundingClientRect();
    if (clientX < imgRect.left || clientX > imgRect.right || clientY < imgRect.top || clientY > imgRect.bottom) {
        return null;
    }
    const containerRect = currentTarget.getBoundingClientRect();
    return {
        x: clientX - containerRect.left,
        y: clientY - containerRect.top
    };
  }, []);

  const handlePlacementEvent = useCallback((clientX: number, clientY: number, currentTarget: HTMLDivElement) => {
    const img = imgRef.current;
    if (!img || !onPlacement) return;

    const imgRect = img.getBoundingClientRect();
    
    if (clientX < imgRect.left || clientX > imgRect.right || clientY < imgRect.top || clientY > imgRect.bottom) {
        console.warn("Action was outside the image boundaries.");
        return;
    }

    const imageX = clientX - imgRect.left;
    const imageY = clientY - imgRect.top;

    const xPercent = (imageX / imgRect.width) * 100;
    const yPercent = (imageY / imgRect.height) * 100;

    const containerRect = currentTarget.getBoundingClientRect();
    const pointX = clientX - containerRect.left;
    const pointY = clientY - containerRect.top;

    onPlacement({ x: pointX, y: pointY }, { xPercent, yPercent });
  }, [onPlacement]);

  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(true);
      if (interactionMode === 'place') {
          const rect = event.currentTarget.getBoundingClientRect();
          setOrbPosition({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
          });
      }
  }, [interactionMode]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(false);
      setOrbPosition(null);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(false);
      setOrbPosition(null);

      if (interactionMode === 'place') {
          handlePlacementEvent(event.clientX, event.clientY, event.currentTarget);
      } else {
          const file = event.dataTransfer.files?.[0];
          if (file && file.type.startsWith('image/')) {
              const allowedTypes = ['image/jpeg', 'image/png'];
              if (!allowedTypes.includes(file.type)) {
                  setFileTypeError('For best results, please use PNG, JPG, or JPEG formats.');
              } else {
                  setFileTypeError(null);
              }
              onFileSelect(file);
          }
      }
  }, [interactionMode, onFileSelect, handlePlacementEvent]);

  // --- Pan & Draw Logic ---
  const handlePanMove = useCallback((e: MouseEvent | TouchEvent) => {
    didPan.current = true;
    const moveEvent = 'touches' in e ? e.touches[0] : e;
    
    if (isErasing && isDrawing.current) {
        const point = getPointInCanvas(moveEvent.clientX, moveEvent.clientY, e.currentTarget as HTMLElement);
        if (point) {
            drawingPoints.current[drawingPoints.current.length - 1].push(point);
            redrawCanvas();
        }
    } else if (isPanning) {
        const dx = moveEvent.clientX - panState.current.startX;
        const dy = moveEvent.clientY - panState.current.startY;
        setPanOffset({
            x: panState.current.initialPanX + dx / zoomLevel,
            y: panState.current.initialPanY + dy / zoomLevel,
        });
    }
  }, [zoomLevel, isPanning, isErasing, getPointInCanvas, redrawCanvas]);

  const handlePanEnd = useCallback(() => {
    if (isErasing && isDrawing.current) {
        if (drawingPoints.current.some(p => p.length > 0)) onDraw?.();
    }
    isDrawing.current = false;
    setIsPanning(false);
  }, [isErasing, onDraw]);
  
  useEffect(() => {
    const currentTarget = imgRef.current?.parentElement;
    if ((isPanning || (isErasing && isDrawing.current)) && currentTarget) {
        document.addEventListener('mousemove', handlePanMove);
        document.addEventListener('mouseup', handlePanEnd);
        document.addEventListener('touchmove', handlePanMove);
        document.addEventListener('touchend', handlePanEnd);
        return () => {
            document.removeEventListener('mousemove', handlePanMove);
            document.removeEventListener('mouseup', handlePanEnd);
            document.removeEventListener('touchmove', handlePanMove);
            document.removeEventListener('touchend', handlePanEnd);
        };
    }
  }, [isPanning, isErasing, handlePanMove, handlePanEnd]);
  
  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (e.type === 'mousedown' && (e.nativeEvent as MouseEvent).button !== 0) return;
    if (interactionMode === 'move-confirm') return;
    const point = 'touches' in e ? e.touches[0] : e;
    
    didPan.current = false;

    if (isErasing) {
        isDrawing.current = true;
        const canvasPoint = getPointInCanvas(point.clientX, point.clientY, e.currentTarget);
        if (canvasPoint) {
            drawingPoints.current.push([canvasPoint]);
            redrawCanvas();
        }
    } else if (interactionMode !== 'upload' && zoomLevel > 1) {
        panState.current = { startX: point.clientX, startY: point.clientY, initialPanX: panOffset.x, initialPanY: panOffset.y };
        setIsPanning(true);
    }
  };
  
  const handlePointerUp = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (didPan.current && !isDrawing.current) {
        return;
    }

    if (interactionMode === 'move-confirm') return;

    const point = 'changedTouches' in e ? e.changedTouches[0] : e;

    if (!imgRef.current) {
        if (interactionMode === 'upload' && !imageUrl) {
          inputRef.current?.click();
        }
        return;
    }
    
    if (interactionMode === 'color-pick') {
        const hex = extractColor(point.clientX, point.clientY);
        if (hex && onColorPick) onColorPick(hex);
        return;
    }

    if (interactionMode === 'place' || interactionMode === 'paint' || interactionMode === 'remove' || interactionMode === 'move-select') {
      handlePlacementEvent(point.clientX, point.clientY, e.currentTarget);
    }
  };


  const handleFileFromCamera = (file: File) => {
    onFileSelect(file);
    setIsCameraModalOpen(false); // Close modal after capture
  };
  
  const showHoverState = (isDraggingOver && interactionMode === 'place') || isTouchHovering;
  const currentOrbPosition = orbPosition || touchOrbPosition;
  const isActionable = interactionMode !== 'upload' || !imageUrl;

  let cursorClass = 'cursor-default';
  if (isActionable) {
      if (isPanning) cursorClass = 'cursor-grabbing';
      else if (zoomLevel > 1 && !isErasing) cursorClass = 'cursor-grab';
      else if (isErasing) cursorClass = 'cursor-none';
      else if (interactionMode === 'move-confirm') cursorClass = 'cursor-default';
      else if (interactionMode === 'color-pick') cursorClass = 'color-picker-image';
      else if (interactionMode === 'move-select') cursorClass = 'cursor-pointer';
      else if (interactionMode === 'place' || interactionMode === 'paint' || interactionMode === 'remove') cursorClass = 'cursor-crosshair';
      else if (interactionMode === 'upload') cursorClass = 'cursor-pointer';
  }


  const uploaderClasses = `w-full aspect-video bg-zinc-100 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-300 relative overflow-hidden touch-none ${
      showHoverState ? 'border-blue-500 bg-blue-50 is-dragging-over'
    : (interactionMode !== 'upload') ? `border-zinc-400 ${cursorClass}`
    : `border-zinc-300 hover:border-blue-500 ${cursorClass}`
  }`;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-center items-baseline gap-3 mb-4" style={{ minHeight: '1.75rem' /* Prevent layout shift */ }}>
        {label && <h3 className="text-xl font-semibold text-zinc-700">{label}</h3>}
        {imageUrl && (
            <button 
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-sm font-semibold text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
                Change
            </button>
        )}
      </div>
      <div
        className={uploaderClasses}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
        onDragOver={isActionable ? handleDragOver : undefined}
        onDragLeave={isActionable ? handleDragLeave : undefined}
        onDrop={isActionable ? handleDrop : undefined}
        onMouseEnter={() => setIsHoveringImage(true)}
        onMouseLeave={() => setIsHoveringImage(false)}
        onMouseMove={handleMouseMove}
        data-dropzone-id={id}
      >
        <input
          type="file"
          id={id}
          ref={inputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg"
          className="hidden"
        />
        {imageUrl ? (
          <>
            <img 
              ref={imgRef}
              src={imageUrl} 
              alt={label || 'Uploaded Scene'} 
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: 'center',
                willChange: 'transform',
              }}
              draggable="false"
              onLoad={redrawCanvas}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{
                  transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  transformOrigin: 'center',
                  willChange: 'transform',
              }}
            />
            {selectionMaskUrl && (
                <div 
                    className="absolute top-0 left-0 w-full h-full bg-blue-500 opacity-50 pointer-events-none"
                    style={{
                        maskImage: `url(${selectionMaskUrl})`,
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                        transformOrigin: 'center',
                        willChange: 'transform',
                    }}
                />
            )}
            <div 
                className="drop-orb" 
                style={{ 
                    left: currentOrbPosition ? currentOrbPosition.x : -9999, 
                    top: currentOrbPosition ? currentOrbPosition.y : -9999 
                }}
            ></div>
            {persistedOrbPosition && (
                <div 
                    className="drop-orb" 
                    style={{ 
                        left: persistedOrbPosition.x, 
                        top: persistedOrbPosition.y,
                        opacity: 1,
                        transform: 'translate(-50%, -50%) scale(1)',
                        transition: 'none',
                    }}
                ></div>
            )}
            {showDebugButton && onDebugClick && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDebugClick();
                    }}
                    className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-opacity-80 transition-all z-20 shadow-lg"
                    aria-label="Show debug view"
                    title="Show Debug View"
                >
                    Debug
                </button>
            )}
            <div ref={loupeRef} className={`color-picker-loupe ${isHoveringImage && interactionMode === 'color-pick' ? 'visible' : ''}`}></div>
          </>
        ) : (
          <div className="text-center text-zinc-500 p-4 flex flex-col items-center justify-center h-full">
            <UploadIcon />
            <p className="mt-1 text-sm">Click to upload or drag & drop</p>
            <div className="flex items-center w-full max-w-xs my-4">
                <div className="flex-grow border-t border-zinc-200"></div>
                <span className="flex-shrink mx-2 text-xs text-zinc-400">OR</span>
                <div className="flex-grow border-t border-zinc-200"></div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCameraModalOpen(true);
              }}
              type="button"
              className="inline-flex items-center px-4 py-2 border border-zinc-300 text-sm font-medium rounded-md shadow-sm text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              title="Use Camera to Take a Photo"
            >
              <CameraIcon />
              Use Camera
            </button>
          </div>
        )}
      </div>
      {fileTypeError && (
        <div className="w-full mt-2 text-sm text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-lg p-3 flex items-center animate-fade-in" role="alert">
            <WarningIcon />
            <span>{fileTypeError}</span>
        </div>
      )}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleFileFromCamera}
      />
      {isErasing && isHoveringImage && (
          <div
              ref={brushCursorRef}
              className="fixed rounded-full border-2 border-white bg-red-500/50 pointer-events-none z-50 shadow-lg"
              style={{
                  width: `${brushSize}px`,
                  height: `${brushSize}px`,
                  transform: 'translate(-50%, -50%)',
              }}
          ></div>
      )}
    </div>
  );
});

export default ImageUploader;