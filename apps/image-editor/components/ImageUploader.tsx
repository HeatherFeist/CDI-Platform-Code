import React, { useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { UploadedImage } from '../types';

interface ImageUploaderProps {
  label: string;
  image: UploadedImage | null;
  onUpload: (image: UploadedImage) => void;
  onRemove: () => void;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  image,
  onUpload,
  onRemove,
  className = ''
}) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const newImage: UploadedImage = {
        id: Math.random().toString(36).substr(2, 9),
        file: file,
        previewUrl: result,
        base64: result,
        mimeType: file.type
      };
      onUpload(newImage);
    };
    reader.readAsDataURL(file);
  }, [onUpload]);

  if (image) {
    return (
      <div className={`relative group rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 ${className}`}>
        <img 
          src={image.previewUrl} 
          alt="Uploaded preview" 
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={onRemove}
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform transition hover:scale-110"
          >
            <X size={20} />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs text-white p-2 truncate">
          {image.file.name}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-600 rounded-2xl cursor-pointer bg-slate-800/50 hover:bg-slate-800 transition-colors hover:border-indigo-500 group">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className="bg-slate-700 p-3 rounded-full mb-3 group-hover:bg-slate-600 transition-colors">
            <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />
          </div>
          <p className="mb-2 text-sm text-slate-300 font-medium">{label}</p>
          <p className="text-xs text-slate-500">SVG, PNG, JPG or WEBP</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};
