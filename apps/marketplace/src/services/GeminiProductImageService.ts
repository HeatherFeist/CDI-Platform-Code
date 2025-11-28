/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Product Image Enhancement Service
 * Recycled from CDI Gemini Image Editor for marketplace integration
 */

export type ImageEnhancementType = 'staging' | 'background-removal' | 'lifestyle' | 'professional';

export interface EnhancedImageResult {
  imageUrl: string;
  type: ImageEnhancementType;
  provider: 'gemini' | 'stability';
}

export class GeminiProductImageService {
  private apiKey: string;
  private stabilityApiKey?: string;
  private geminiImageEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';
  private stabilityEndpoint = 'https://api.stability.ai/v2beta/stable-image/generate/sd3';

  constructor(apiKey: string, stabilityApiKey?: string) {
    this.apiKey = apiKey;
    this.stabilityApiKey = stabilityApiKey;
  }

  /**
   * Generate lifestyle staging photo from product image
   */
  async generateLifestyleImage(
    productImageFile: File,
    scenario: string = 'modern living room'
  ): Promise<EnhancedImageResult> {
    try {
      const imageData = await this.fileToBase64(productImageFile);
      
      const prompt = `
You are a professional product photographer. Take the product shown in the first image and place it in a beautiful ${scenario}.

**Requirements:**
- The product must be the focal point
- Natural lighting and realistic shadows
- Professional composition
- The scene should showcase the product's use case
- Maintain the product's exact appearance, colors, and details
- Photorealistic result only

Do not add text or watermarks. Return only the final image.`;

      const response = await fetch(`${this.geminiImageEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: productImageFile.type,
                  data: imageData
                }
              },
              { text: prompt }
            ]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 32,
            topP: 1,
            responseModalities: ['IMAGE']
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

      if (!imagePart?.inlineData) {
        throw new Error('No image returned from Gemini');
      }

      const { mimeType, data: base64Data } = imagePart.inlineData;
      const imageUrl = `data:${mimeType};base64,${base64Data}`;

      return {
        imageUrl,
        type: 'lifestyle',
        provider: 'gemini'
      };
    } catch (error) {
      console.error('Error generating lifestyle image:', error);
      throw error;
    }
  }

  /**
   * Remove background from product image for clean listing photos
   */
  async removeBackground(productImageFile: File): Promise<EnhancedImageResult> {
    try {
      const imageData = await this.fileToBase64(productImageFile);
      
      const prompt = `
You are an expert photo editor. Remove the background from this product image.

**Requirements:**
- Keep only the product itself
- Replace background with pure white (#FFFFFF)
- Maintain all product details, colors, and textures
- Clean, crisp edges around the product
- No artifacts or remnants of old background
- Professional product photography quality

Return only the final image with white background.`;

      const response = await fetch(`${this.geminiImageEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: productImageFile.type,
                  data: imageData
                }
              },
              { text: prompt }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            responseModalities: ['IMAGE']
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

      if (!imagePart?.inlineData) {
        throw new Error('No image returned from Gemini');
      }

      const { mimeType, data: base64Data } = imagePart.inlineData;
      const imageUrl = `data:${mimeType};base64,${base64Data}`;

      return {
        imageUrl,
        type: 'background-removal',
        provider: 'gemini'
      };
    } catch (error) {
      console.error('Error removing background:', error);
      throw error;
    }
  }

  /**
   * Generate professional product staging with Stability AI (if available)
   */
  async generateProfessionalStaging(
    productImageFile: File,
    prompt: string = 'professional product photography, studio lighting, white background'
  ): Promise<EnhancedImageResult> {
    if (!this.stabilityApiKey) {
      throw new Error('Stability AI API key required for this feature');
    }

    try {
      const formData = new FormData();
      formData.append('image', productImageFile);
      formData.append('prompt', `${prompt}, high quality product photo, professional composition`);
      formData.append('mode', 'image-to-image');
      formData.append('strength', '0.5'); // Moderate transformation
      formData.append('output_format', 'jpeg');

      const response = await fetch(this.stabilityEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.stabilityApiKey}`,
          'Accept': 'image/*'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Stability API error: ${response.status}`);
      }

      const blob = await response.blob();
      const imageUrl = await this.blobToDataUrl(blob);

      return {
        imageUrl,
        type: 'professional',
        provider: 'stability'
      };
    } catch (error) {
      console.error('Error with Stability AI:', error);
      throw error;
    }
  }

  /**
   * Enhance product image quality (brightness, contrast, sharpness)
   */
  async enhanceImageQuality(productImageFile: File): Promise<EnhancedImageResult> {
    try {
      const imageData = await this.fileToBase64(productImageFile);
      
      const prompt = `
You are a photo enhancement expert. Improve this product image:

**Enhancements:**
- Optimize brightness and contrast
- Enhance colors to be vibrant but natural
- Sharpen details and textures
- Remove any blur or noise
- Improve overall clarity
- Maintain realistic appearance
- Do NOT change the product itself
- Do NOT add filters or effects

Return the enhanced version of the exact same image.`;

      const response = await fetch(`${this.geminiImageEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: productImageFile.type,
                  data: imageData
                }
              },
              { text: prompt }
            ]
          }],
          generationConfig: {
            temperature: 0.3,
            responseModalities: ['IMAGE']
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

      if (!imagePart?.inlineData) {
        throw new Error('No image returned from Gemini');
      }

      const { mimeType, data: base64Data } = imagePart.inlineData;
      const imageUrl = `data:${mimeType};base64,${base64Data}`;

      return {
        imageUrl,
        type: 'staging',
        provider: 'gemini'
      };
    } catch (error) {
      console.error('Error enhancing image:', error);
      throw error;
    }
  }

  /**
   * Helper: Convert File to base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Helper: Convert Blob to data URL
   */
  private async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Batch generate multiple image variations
   */
  async generateVariations(
    productImageFile: File,
    types: ImageEnhancementType[]
  ): Promise<EnhancedImageResult[]> {
    const results: EnhancedImageResult[] = [];

    for (const type of types) {
      try {
        let result: EnhancedImageResult;

        switch (type) {
          case 'lifestyle':
            result = await this.generateLifestyleImage(productImageFile);
            break;
          case 'background-removal':
            result = await this.removeBackground(productImageFile);
            break;
          case 'professional':
            result = await this.generateProfessionalStaging(productImageFile);
            break;
          case 'staging':
            result = await this.enhanceImageQuality(productImageFile);
            break;
          default:
            continue;
        }

        results.push(result);
      } catch (error) {
        console.error(`Error generating ${type}:`, error);
        // Continue with other types even if one fails
      }
    }

    return results;
  }
}
