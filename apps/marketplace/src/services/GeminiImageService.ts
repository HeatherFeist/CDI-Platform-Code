import { GoogleGenerativeAI } from '@google/generative-ai';
import { ApiKeyManager } from '../utils/apiKeyManager';

/**
 * Image Enhancement Service using Google Gemini
 * Provides advanced image analysis and coaching for product photos
 * Uses user-provided API key from localStorage or falls back to environment variable
 * Model: gemini-1.5-flash (multimodal - handles images and text)
 */
export class GeminiImageService {
  private static instance: GeminiImageService;
  private genAI: GoogleGenerativeAI;
  private readonly MODEL_NAME = 'gemini-1.5-pro'; // Stable model name for v1beta API - supports vision

  private constructor() {
    this.genAI = new GoogleGenerativeAI(ApiKeyManager.getGeminiKey());
  }

  /**
   * Reinitialize with new API key (call when user updates their key)
   */
  public reinitialize(): void {
    this.genAI = new GoogleGenerativeAI(ApiKeyManager.getGeminiKey());
  }

  public static getInstance(): GeminiImageService {
    if (!GeminiImageService.instance) {
      GeminiImageService.instance = new GeminiImageService();
    }
    return GeminiImageService.instance;
  }

  /**
   * Analyze image quality and provide improvement suggestions
   */
  async analyzeImageQuality(imageFile: File): Promise<{
    overallScore: number; // 0-100
    issues: string[];
    suggestions: string[];
    canImprove: boolean;
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.MODEL_NAME });

      // Convert file to base64
      const imageData = await this.fileToGenerativePart(imageFile);

      const prompt = `Analyze this product photo for auction/marketplace listing quality.

Evaluate these aspects:
1. Lighting (too dark, too bright, shadows)
2. Focus and sharpness
3. Background (cluttered, distracting)
4. Framing and composition
5. Color accuracy
6. Resolution and clarity

Provide response in this EXACT JSON format:
{
  "overallScore": 75,
  "issues": ["list", "of", "problems"],
  "suggestions": ["specific", "improvements"],
  "canImprove": true
}

Return ONLY valid JSON, no other text. Score must be 0-100.`;

      const result = await model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();
      
      console.log('Image analysis response:', text); // Debug log
      
      // Try to extract JSON from response (handle markdown code blocks)
      let jsonText = text;
      
      if (text.includes('```json')) {
        const match = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (match) jsonText = match[1];
      } else if (text.includes('```')) {
        const match = text.match(/```\s*(\{[\s\S]*?\})\s*```/);
        if (match) jsonText = match[1];
      } else {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) jsonText = match[0];
      }
      
      try {
        const parsed = JSON.parse(jsonText);
        if (typeof parsed.overallScore === 'number' && Array.isArray(parsed.issues) && Array.isArray(parsed.suggestions)) {
          return parsed;
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Attempted to parse:', jsonText);
      }

      // Fallback response
      return {
        overallScore: 70,
        issues: ['Could not analyze image fully'],
        suggestions: ['Ensure good lighting', 'Use plain background', 'Take photo at higher resolution'],
        canImprove: true
      };
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      console.error('Error details:', error.message);
      throw new Error(`Failed to analyze image quality: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get AI suggestions for better photo angles
   */
  async suggestPhotoAngles(imageFile: File, itemType: string): Promise<string[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.MODEL_NAME });
      const imageData = await this.fileToGenerativePart(imageFile);

      const prompt = `You're a professional product photographer. This is a ${itemType} for an auction listing.

Current photo analysis:
- What angle is this shot from?
- What important details are missing?

Suggest 3-4 additional photo angles that would help sell this item better.
Format as array: ["angle 1", "angle 2", "angle 3"]`;

      const result = await model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();
      
      // Extract array
      const arrayMatch = text.match(/\[[\s\S]*?\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }

      return [
        'Close-up of details/features',
        'Full item from different angle',
        'Size comparison with common object'
      ];
    } catch (error) {
      console.error('Error suggesting angles:', error);
      return [];
    }
  }

  /**
   * Detect if item is properly framed
   */
  async checkFraming(imageFile: File): Promise<{
    isProperlyFramed: boolean;
    itemCoverage: number; // percentage 0-100
    tooClose: boolean;
    tooFar: boolean;
    suggestions: string[];
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.MODEL_NAME });
      const imageData = await this.fileToGenerativePart(imageFile);

      const prompt = `Analyze the framing of this product photo:

1. What % of the image does the main item occupy?
2. Is the item too close (cropped) or too far (too much empty space)?
3. Is it centered properly?

Respond as JSON:
{
  "isProperlyFramed": true/false,
  "itemCoverage": 0-100,
  "tooClose": true/false,
  "tooFar": true/false,
  "suggestions": ["framing tips"]
}`;

      const result = await model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Could not parse framing analysis');
    } catch (error) {
      console.error('Error checking framing:', error);
      throw new Error('Failed to analyze framing');
    }
  }

  /**
   * Generate background removal instructions
   * Note: Actual removal would need external API or canvas manipulation
   */
  async analyzeBackground(imageFile: File): Promise<{
    backgroundType: string;
    isClean: boolean;
    distractions: string[];
    shouldRemove: boolean;
    removalInstructions: string;
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.MODEL_NAME });
      const imageData = await this.fileToGenerativePart(imageFile);

      const prompt = `Analyze the background of this product photo:

1. What's in the background? (wall, floor, clutter, outdoor, etc.)
2. Is it clean and professional?
3. Are there distractions?
4. Would this photo benefit from background removal?

Respond as JSON:
{
  "backgroundType": "description",
  "isClean": true/false,
  "distractions": ["list of distracting elements"],
  "shouldRemove": true/false,
  "removalInstructions": "how to improve"
}`;

      const result = await model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Could not parse background analysis');
    } catch (error) {
      console.error('Error analyzing background:', error);
      throw new Error('Failed to analyze background');
    }
  }

  /**
   * Comprehensive photo coaching
   */
  async getPhotoCoaching(imageFile: File, itemType: string): Promise<{
    currentGrade: string; // A, B, C, D, F
    strengths: string[];
    weaknesses: string[];
    quickFixes: string[];
    detailedGuide: string;
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.MODEL_NAME });
      const imageData = await this.fileToGenerativePart(imageFile);

      const prompt = `As a professional product photography coach, analyze this ${itemType} photo for marketplace listing quality.

Provide your analysis in this EXACT JSON format:
{
  "currentGrade": "A-F letter grade",
  "strengths": ["list", "of", "strengths"],
  "weaknesses": ["list", "of", "weaknesses"],
  "quickFixes": ["3-5 simple improvements"],
  "detailedGuide": "Step-by-step improvement plan"
}

Grade the photo from A (excellent) to F (poor).
Return ONLY valid JSON, no other text.`;

      const result = await model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini response:', text); // Debug log
      
      // Try to extract JSON from response (handle markdown code blocks)
      let jsonText = text;
      
      // Remove markdown code blocks if present
      if (text.includes('```json')) {
        const match = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (match) jsonText = match[1];
      } else if (text.includes('```')) {
        const match = text.match(/```\s*(\{[\s\S]*?\})\s*```/);
        if (match) jsonText = match[1];
      } else {
        // Try to extract JSON object
        const match = text.match(/\{[\s\S]*\}/);
        if (match) jsonText = match[0];
      }
      
      try {
        const parsed = JSON.parse(jsonText);
        // Validate response structure
        if (parsed.currentGrade && parsed.strengths && parsed.weaknesses && parsed.quickFixes && parsed.detailedGuide) {
          return parsed;
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Attempted to parse:', jsonText);
      }

      // Fallback response
      return {
        currentGrade: 'C',
        strengths: ['Item is visible', 'Image is clear'],
        weaknesses: ['Could improve lighting', 'Background could be cleaner'],
        quickFixes: ['Retake in natural light near window', 'Use plain white/neutral background', 'Fill frame with product', 'Take photo at eye level', 'Ensure good focus'],
        detailedGuide: 'For best results: 1) Place item on white surface near window during daytime. 2) Avoid direct sunlight - use indirect/diffused light. 3) Take multiple shots from different angles. 4) Fill the frame with your product. 5) Keep camera steady or use timer to avoid blur.'
      };
    } catch (error: any) {
      console.error('Error getting coaching:', error);
      console.error('Error details:', error.message, error.stack);
      throw new Error(`Failed to get photo coaching: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Compare before/after images
   */
  async compareImages(originalFile: File, enhancedFile: File): Promise<{
    improvements: string[];
    score: { before: number; after: number };
    recommendation: string;
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.MODEL_NAME });
      const original = await this.fileToGenerativePart(originalFile);
      const enhanced = await this.fileToGenerativePart(enhancedFile);

      const prompt = `Compare these two product photos (original vs enhanced):

1. What improvements were made?
2. Rate each photo 0-100
3. Which should be used for listing?

Respond as JSON:
{
  "improvements": ["list of changes"],
  "score": {"before": 0-100, "after": 0-100},
  "recommendation": "use original" or "use enhanced"
}`;

      const result = await model.generateContent([prompt, original, enhanced]);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Could not parse comparison');
    } catch (error) {
      console.error('Error comparing images:', error);
      throw new Error('Failed to compare images');
    }
  }

  /**
   * Auto-enhance image with Canvas API
   */
  async autoEnhance(imageFile: File): Promise<{
    enhancedImage: Blob;
    changes: string[];
    beforeScore: number;
    afterScore: number;
  }> {
    try {
      // Create canvas for image manipulation
      const img = await this.loadImage(imageFile);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const changes: string[] = [];

      // Auto-enhance brightness/contrast
      const { adjusted, brightnessDiff } = this.adjustBrightnessContrast(data);
      if (brightnessDiff !== 0) {
        changes.push(`Adjusted brightness by ${brightnessDiff > 0 ? '+' : ''}${brightnessDiff}%`);
      }

      // Apply sharpening
      this.applySharpen(imageData);
      changes.push('Applied smart sharpening');

      // Put enhanced data back
      ctx.putImageData(imageData, 0, 0);

      // Convert to blob
      const enhancedBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
      });

      return {
        enhancedImage: enhancedBlob,
        changes,
        beforeScore: 70, // Mock scores - would need actual analysis
        afterScore: 85
      };
    } catch (error) {
      console.error('Error auto-enhancing:', error);
      throw new Error('Failed to enhance image');
    }
  }

  /**
   * Helper: Convert file to Gemini format
   */
  private async fileToGenerativePart(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64,
            mimeType: file.type
          }
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Helper: Load image from file
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Helper: Adjust brightness and contrast
   */
  private adjustBrightnessContrast(data: Uint8ClampedArray): { adjusted: boolean; brightnessDiff: number } {
    // Calculate average brightness
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const avgBrightness = sum / (data.length / 4);

    // Target brightness: 128 (middle gray)
    const target = 128;
    const diff = target - avgBrightness;

    // Only adjust if difference is significant
    if (Math.abs(diff) < 10) {
      return { adjusted: false, brightnessDiff: 0 };
    }

    // Apply brightness adjustment
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + diff));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + diff));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + diff));
    }

    return { adjusted: true, brightnessDiff: Math.round((diff / 255) * 100) };
  }

  /**
   * Helper: Apply sharpening filter
   */
  private applySharpen(imageData: ImageData): void {
    // Simple unsharp mask
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];

    const { width, height, data } = imageData;
    const copy = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pos = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += copy[pos] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          const pos = (y * width + x) * 4 + c;
          data[pos] = Math.max(0, Math.min(255, sum));
        }
      }
    }
  }

  /**
   * Get custom edit guidance from AI based on user's request
   */
  async getCustomEditGuidance(imageFile: File, userRequest: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.MODEL_NAME });
      const imageData = await this.fileToGenerativePart(imageFile);

      const prompt = `You are a professional photo editor and AI assistant for an auction/marketplace platform helping with product photography.

USER REQUEST: "${userRequest}"

YOUR TASK:
1. Analyze the product image
2. Understand what the user wants to accomplish
3. Provide helpful, practical guidance

IMPORTANT CAPABILITIES TO MENTION:
- I CAN do basic enhancements: brightness, contrast, sharpening, color correction
- I CANNOT do advanced AI edits like: putting clothes on models, changing backgrounds completely, adding objects, virtual staging
- For advanced requests, recommend appropriate tools or services

RESPONSE FORMAT:
📸 What I See: [brief description of the image]

🎯 Your Request: [restate their goal]

💡 My Assessment: [is this achievable? what's needed?]

✅ Here's How: [step-by-step guidance]
- If basic edit: Explain what I can do via Auto-Enhance
- If advanced: Recommend specific tools/services (like remove.bg, Canva, Photoshop, DALL-E, etc.)
- If product staging: Suggest professional photography services or free mockup generators

🔄 Alternative Ideas: [other ways to achieve their goal]

⚡ Quick Win: [fastest/easiest solution]

Be conversational, friendly, and encouraging. If they want something complex (like "put shirt on model"), acknowledge it's a great idea and guide them to AI tools like DALL-E, Midjourney mockup services, or affordable product photography services that can do this.`;

      const result = await model.generateContent([prompt, imageData]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Custom request error:', error);
      throw new Error('Failed to process custom request. Please try again.');
    }
  }

  /**
   * Analyze uploaded image for listing details (item recognition, categorization, pricing)
   */
  async analyzeImageForListing(imageFile: File): Promise<{
    itemType: string;
    suggestedTitle: string;
    suggestedCategory: string;
    condition: string;
    keyFeatures: string[];
    estimatedValue: { min: number; max: number };
  }> {
    try {
      const imagePart = await this.fileToGenerativePart(imageFile);

      const prompt = `Analyze this image for an auction/store listing. Provide detailed information:

1. Identify the item type/category (e.g., "iPhone 13 Pro", "Nike Running Shoes", "Vintage Leather Jacket")
2. Suggest a catchy, descriptive listing title that would attract buyers
3. Best category for this item (e.g., Electronics, Fashion, Home & Garden, Sports, etc.)
4. Estimate the condition based on what you see (new, like new, excellent, good, fair, poor)
5. List key features visible in the image (color, brand, model, special features)
6. Estimate market value range in USD

Return your analysis as JSON with this EXACT structure:
{
  "itemType": "detailed item description",
  "suggestedTitle": "Compelling listing title",
  "suggestedCategory": "Best matching category",
  "condition": "condition rating",
  "keyFeatures": ["feature1", "feature2", "feature3"],
  "estimatedValue": { "min": 50, "max": 150 }
}

Return ONLY the JSON, no other text.`;

      const model = this.genAI.getGenerativeModel({ model: this.MODEL_NAME });
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return JSON.parse(text);
    } catch (error) {
      console.error('Error analyzing image for listing:', error);
      throw new Error('Failed to analyze image. Please try again.');
    }
  }

  /**
   * Check if Gemini is configured
   */
  isConfigured(): boolean {
    return ApiKeyManager.isGeminiConfigured();
  }

  /**
   * Get the source of the current API key
   */
  getKeySource(): 'user' | 'environment' | 'none' {
    return ApiKeyManager.getKeySource();
  }
}

export const geminiImageService = GeminiImageService.getInstance();
