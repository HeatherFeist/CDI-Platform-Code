
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Spinner from './Spinner';

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const CaptureIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 11 2s10 4.477 10 10z" />
    </svg>
);

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
        setError(null);
        setIsLoading(true);

        const startCamera = async () => {
            try {
              if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                  throw new Error("Camera API is not supported in this browser.");
              }
              const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
              });
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    setIsLoading(false);
                };
                streamRef.current = stream;
              }
            } catch (err) {
              console.error("Camera error:", err);
              if (err instanceof Error) {
                  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                      setError("Camera permission was denied. Please allow camera access in your browser settings.");
                  } else {
                      setError("Could not access the camera. It may be in use by another application or not available.");
                  }
              } else {
                  setError("An unknown error occurred while accessing the camera.");
              }
              setIsLoading(false);
            }
        };
        startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };
  
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
        <div 
            className="bg-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl p-4 md:p-6 relative transform transition-all flex flex-col text-white"
            style={{ height: '90vh', maxHeight: '700px' }}
            onClick={handleModalContentClick}
            role="document"
        >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-20"
              aria-label="Close camera"
            >
              <CloseIcon />
            </button>
            <div className="text-center mb-4 flex-shrink-0">
              <h2 className="text-2xl font-extrabold">Take a Photo</h2>
            </div>
            <div className="w-full h-full bg-black rounded-lg relative overflow-hidden flex-grow flex items-center justify-center">
                {(isLoading && !error) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <Spinner />
                        <p className="mt-4 text-zinc-400">Starting camera...</p>
                    </div>
                )}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black p-4">
                        <p className="text-red-400 text-center">{error}</p>
                    </div>
                )}
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    muted
                    className={`w-full h-full object-contain transition-opacity duration-300 ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
                />
                <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
            <div className="mt-4 flex-shrink-0 flex justify-center items-center h-20">
                <button
                    onClick={handleCapture}
                    disabled={isLoading || !!error}
                    className="p-2 text-white/80 hover:text-white disabled:text-white/30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                    aria-label="Capture photo"
                    title="Capture Photo"
                >
                    <CaptureIcon />
                </button>
            </div>
        </div>
    </div>
  );
};

export default CameraModal;
