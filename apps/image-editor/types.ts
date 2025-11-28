export enum AppMode {
  RENOVATION = 'RENOVATION',
  MARKETPLACE = 'MARKETPLACE',
  GENERAL = 'GENERAL'
}

export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface GenerationResult {
  imageUrl: string;
  timestamp: number;
  prompt: string;
}

export interface SavedImage extends GenerationResult {
  id: string;
  originalUrl: string;
  mode: AppMode;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
