import { ApiKeyManager } from '../utils/apiKeyManager';
import { AIUsageTracker } from './AIUsageTracker';

export interface ImageEditResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * OpenAI DALL-E Image Generation and Editing Service
 * Supports:
 * - Image editing with prompts (e.g., "put this shirt on a model")
 * - Image generation from text
 * - Background replacement
 */
export class OpenAIImageEditor {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ApiKeyManager.getOpenAIKey();
  }

  /**
   * Edit an existing image with AI
   * Examples:
   * - "Put this t-shirt on a female model"
   * - "Show this painting on a neutral beige wall"
   * - "Display this product in a modern living room"
   * 
   * Note: DALL-E requires a transparent area (mask) to edit. For full image edits,
   * we'll use variations which create similar images with modifications.
   */
  async editProductImage(
    imageFile: File,
    prompt: string,
    userId?: string
  ): Promise<ImageEditResult> {
    const startTime = Date.now();
    
    try {
      // DALL-E 2 supports image variations and edits
      // For "put on model" type requests, we'll use variations with a descriptive prompt
      
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('prompt', prompt);
      formData.append('n', '1'); // Generate 1 image
      formData.append('size', '1024x1024'); // Standard size

      console.log('🎨 Generating edited image with DALL-E...');
      console.log('Prompt:', prompt);

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.data && data.data[0]?.url) {
        console.log('✅ Image edited successfully!');
        
        // Log successful usage
        if (userId) {
          await AIUsageTracker.logImageEditing(
            userId,
            'dall-e-2',
            prompt,
            true,
            undefined,
            { duration_ms: Date.now() - startTime }
          );
        }
        
        return {
          success: true,
          imageUrl: data.data[0].url
        };
      }

      throw new Error('No image URL in response');
    } catch (error: any) {
      console.error('❌ Image edit error:', error);
      
      // Log failed usage
      if (userId) {
        await AIUsageTracker.logImageEditing(
          userId,
          'dall-e-2',
          prompt,
          false,
          error.message,
          { duration_ms: Date.now() - startTime }
        );
      }
      
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Generate a completely new image from text
   * Example: "A professional photo of a vintage leather jacket on a white background"
   */
  async generateImage(prompt: string, size: '256x256' | '512x512' | '1024x1024' = '1024x1024'): Promise<ImageGenerationResult> {
    try {
      console.log('🎨 Generating new image with DALL-E 3...');
      console.log('Prompt:', prompt);

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: size === '256x256' || size === '512x512' ? '1024x1024' : size, // DALL-E 3 only supports 1024x1024, 1792x1024, 1024x1792
          quality: 'standard' // or 'hd' for higher quality (costs more)
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.data && data.data[0]?.url) {
        console.log('✅ Image generated successfully!');
        return {
          success: true,
          imageUrl: data.data[0].url
        };
      }

      throw new Error('No image URL in response');
    } catch (error: any) {
      console.error('❌ Image generation error:', error);
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Create variations of an existing image
   * Good for: Getting different angles, lighting, or compositions
   */
  async createImageVariations(
    imageFile: File,
    numberOfVariations: number = 1
  ): Promise<ImageGenerationResult> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('n', numberOfVariations.toString());
      formData.append('size', '1024x1024');

      console.log('🎨 Creating image variations with DALL-E...');

      const response = await fetch('https://api.openai.com/v1/images/variations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.data && data.data[0]?.url) {
        console.log('✅ Variations created successfully!');
        return {
          success: true,
          imageUrl: data.data[0].url // Return first variation
        };
      }

      throw new Error('No image URL in response');
    } catch (error: any) {
      console.error('❌ Variation creation error:', error);
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Generate a professional product photo with specific styling
   * This combines your product image with AI-generated backgrounds/models
   */
  async generateProductPhoto(
    productImage: File,
    style: 'model' | 'lifestyle' | 'studio' | 'wall' | 'flatlay',
    gender?: 'male' | 'female' | 'neutral',
    userId?: string,
    additionalDetails?: string
  ): Promise<ImageEditResult> {
    const stylePrompts = {
      model: `professional model photoshoot wearing/using this product, perfect lighting, high-end fashion photography`,
      lifestyle: `lifestyle photo showing this product in a real home setting, natural lighting, cozy and authentic`,
      studio: `clean white studio background, professional product photography, perfect lighting, ecommerce ready`,
      wall: `this artwork displayed on a neutral colored wall in a modern interior, gallery-style presentation`,
      flatlay: `beautiful flat-lay composition with this product as centerpiece, styled with complementary items`
    };

    let prompt = stylePrompts[style];

    // Add gender specification for model shots
    if (style === 'model' && gender) {
      prompt = `attractive ${gender} ` + prompt;
    }

    // Add any additional details
    if (additionalDetails) {
      prompt += `, ${additionalDetails}`;
    }

    prompt += '. Professional, high-quality, marketplace-ready photo.';

    return this.editProductImage(productImage, prompt, userId);
  }

  /**
   * Format error messages to be user-friendly
   */
  private formatError(error: any): string {
    const message = error.message || 'Unknown error';

    if (message.includes('Invalid API key') || message.includes('401')) {
      return 'Invalid OpenAI API key. Please check your API key in Settings.';
    } else if (message.includes('quota') || message.includes('429')) {
      return 'You\'ve exceeded your OpenAI quota. Check your usage at platform.openai.com';
    } else if (message.includes('content_policy') || message.includes('safety')) {
      return 'Image was rejected by safety filters. Try a different image or prompt.';
    } else if (message.includes('billing')) {
      return 'Billing issue with your OpenAI account. Add credits at platform.openai.com/account/billing';
    } else if (message.includes('PNG')) {
      return 'Image must be a PNG file with transparency for editing. For JPEG images, try the "Generate Variations" feature instead.';
    }

    return message;
  }

  /**
   * Download an image from URL
   */
  async downloadImage(imageUrl: string, filename: string = 'edited-product'): Promise<void> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  /**
   * Convert a remote image URL to a File object (for editing)
   */
  async urlToFile(imageUrl: string, filename: string = 'image.png'): Promise<File> {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  }
}

// Singleton instance
export const openAIImageEditor = new OpenAIImageEditor();
