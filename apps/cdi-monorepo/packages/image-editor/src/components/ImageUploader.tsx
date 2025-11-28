
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useState, useCallback } from 'react';
import CameraModal from './CameraModal';

interface ImageUploaderProps {
  id: string;
  onFileSelect: (file: File) => void;
  imageUrl: string | null;
}

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);
const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


const ImageUploader: React.FC<ImageUploaderProps> = ({ id, onFileSelect, imageUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFileSelect(event.target.files[0]);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onFileSelect(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  }, [onFileSelect]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleCameraCapture = (file: File) => {
    onFileSelect(file);
    setIsCameraOpen(false);
  };

  const baseClasses = "relative w-full aspect-video rounded-lg border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center text-center p-4 transition-colors duration-300";
  const draggingClasses = "border-blue-500 bg-blue-50";
  const hoverClasses = "hover:border-zinc-400 hover:bg-zinc-50";

  return (
    <>
      <div 
        className={`${baseClasses} ${isDragging ? draggingClasses : hoverClasses} ${imageUrl ? 'border-solid' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <input
          id={id}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {imageUrl ? (
            <img src={imageUrl} alt="Uploaded scene" className="absolute inset-0 w-full h-full object-contain" />
        ) : (
            <div className="flex flex-col items-center">
                <UploadIcon />
                <p className="mt-2 text-sm text-zinc-600">
                    <span className="font-semibold">Drag & drop</span> an image here, or click to select a file.
                </p>
            </div>
        )}
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-zinc-300 text-sm font-bold rounded-md shadow-sm text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors"
        >
          {imageUrl ? 'Change Image' : 'Upload from Device'}
        </button>
        <button
          onClick={() => setIsCameraOpen(true)}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-bold rounded-md shadow-sm text-white bg-zinc-800 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors"
        >
          <CameraIcon />
          Take Photo
        </button>
      </div>
      <CameraModal 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </>
  );
};

export default ImageUploader;
