import { GoogleGenAI } from '@google/genai';

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  imageData?: string; // base64
  mimeType?: string;
  error?: string;
}

export interface ImageGenerationOptions {
  prompt: string;
  referenceImage?: File; // Optional: Include product photo for context
}

export class GeminiImageGenerator {
  private ai: GoogleGenAI;
  private readonly MODEL_NAME = 'gemini-1.5-pro'; // Use stable model instead of experimental
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Generate an image from a text prompt
   * Example: "Show this t-shirt on a female model in a casual outdoor setting"
   */
  async generateProductImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      const config = {
        responseModalities: ['IMAGE', 'TEXT'],
      };

      // Build the prompt parts
      const parts: any[] = [
        {
          text: options.prompt,
        },
      ];

      // If a reference image is provided, include it
      if (options.referenceImage) {
        const imageData = await this.fileToBase64(options.referenceImage);
        parts.push({
          inlineData: {
            mimeType: options.referenceImage.type,
            data: imageData,
          },
        });
      }

      const contents = [
        {
          role: 'user',
          parts: parts,
        },
      ];

      console.log('Generating image with Gemini 2.5 Flash Image...');
      
      const response = await this.ai.models.generateContentStream({
        model: this.MODEL_NAME,
        config,
        contents,
      });

      // Collect the generated image
      let generatedImageData: string | undefined;
      let generatedMimeType: string | undefined;
      let textResponse = '';

      for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0]?.content?.parts) {
          continue;
        }

        // Check for inline image data
        const inlineData = chunk.candidates[0].content.parts[0]?.inlineData;
        if (inlineData?.data) {
          generatedImageData = inlineData.data;
          generatedMimeType = inlineData.mimeType || 'image/png';
          console.log('Received generated image:', generatedMimeType);
        }

        // Also collect any text response
        if (chunk.text) {
          textResponse += chunk.text;
        }
      }

      if (generatedImageData && generatedMimeType) {
        // Convert base64 to blob URL for display
        const imageUrl = `data:${generatedMimeType};base64,${generatedImageData}`;
        
        return {
          success: true,
          imageUrl: imageUrl,
          imageData: generatedImageData,
          mimeType: generatedMimeType,
        };
      } else {
        return {
          success: false,
          error: textResponse || 'No image was generated. The model may have declined the request.',
        };
      }

    } catch (error: any) {
      console.error('Image generation error:', error);
      
      // Provide helpful error messages
      let errorMessage = 'Failed to generate image. ';
      
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        errorMessage += 'The image generation model is not available with your API key. This feature requires special access to Gemini\'s image generation capabilities, which may not be available in all regions yet.';
      } else if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        errorMessage += 'You\'ve reached your API quota limit. Wait a few minutes and try again, or check your usage at https://aistudio.google.com';
      } else if (error.message?.includes('permission') || error.message?.includes('403')) {
        errorMessage += 'Your API key does not have permission to use image generation. This is an experimental feature that may require waitlist access.';
      } else if (error.message?.includes('safety')) {
        errorMessage += 'The request was blocked by safety filters. Try a different prompt or image.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate a professional product photo with specific styling
   */
  async generateProductPhoto(
    productImage: File,
    style: 'model' | 'lifestyle' | 'studio' | 'flat-lay',
    additionalDetails?: string
  ): Promise<ImageGenerationResult> {
    const stylePrompts = {
      model: 'Show this product being worn/used by an attractive model in a professional photoshoot setting with perfect lighting',
      lifestyle: 'Show this product in a real-life lifestyle setting with natural lighting and authentic atmosphere',
      studio: 'Show this product in a clean, professional studio setting with white background and professional lighting',
      'flat-lay': 'Show this product in a beautiful flat-lay composition with complementary props and styling',
    };

    const prompt = `${stylePrompts[style]}. ${additionalDetails || ''} Make it look professional, high-quality, and appealing for an online marketplace.`;

    return this.generateProductImage({
      prompt: prompt,
      referenceImage: productImage,
    });
  }

  /**
   * Convert File to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]; // Remove data URL prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Download generated image as a file
   */
  downloadImage(imageData: string, mimeType: string, filename: string = 'generated-image') {
    const extension = mimeType.split('/')[1] || 'png';
    const blob = this.base64ToBlob(imageData, mimeType);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Convert base64 to Blob for downloading
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}
