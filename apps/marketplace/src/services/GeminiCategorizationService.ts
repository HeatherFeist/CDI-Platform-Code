/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Product Categorization & Auto-Fill Service
 * Uses Gemini Vision to analyze products and auto-fill listing details
 */

export interface ProductAnalysis {
  category: string;
  subcategory?: string;
  title: string;
  description: string;
  brand?: string;
  model?: string;
  condition: 'new' | 'like-new' | 'used' | 'poor';
  color?: string;
  material?: string;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    unit: 'inches' | 'cm';
  };
  features: string[];
  suggestedTags: string[];
  confidence: number; // 0-100
}

export class GeminiCategorizationService {
  private apiKey: string;
  private geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyze product image and extract all relevant information
   */
  async analyzeProduct(imageFile: File, userInput?: Partial<ProductAnalysis>): Promise<ProductAnalysis> {
    try {
      const imageData = await this.fileToBase64(imageFile);
      const prompt = this.buildAnalysisPrompt(userInput);

      const response = await fetch(`${this.geminiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: imageFile.type,
                  data: imageData
                }
              },
              { text: prompt }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!analysisText) {
        throw new Error('No analysis returned from Gemini');
      }

      return this.parseAnalysis(analysisText);

    } catch (error) {
      console.error('Error analyzing product:', error);
      throw error;
    }
  }

  /**
   * Build the product analysis prompt
   */
  private buildAnalysisPrompt(userInput?: Partial<ProductAnalysis>): string {
    const userContext = userInput ? `
**User has provided:**
${userInput.title ? `- Title: ${userInput.title}` : ''}
${userInput.category ? `- Category: ${userInput.category}` : ''}
${userInput.brand ? `- Brand: ${userInput.brand}` : ''}
${userInput.condition ? `- Condition: ${userInput.condition}` : ''}

Use this information to enhance your analysis, but verify against the image.
` : '';

    return `You are an expert product analyst for an online marketplace. Analyze this product image in detail.

${userContext}

**Your Task:**
Provide comprehensive product information for creating a marketplace listing.

**Analysis Required:**

1. **Category & Subcategory**: Identify the primary category (e.g., "Tools", "Furniture", "Electronics", "Clothing") and specific subcategory (e.g., "Power Tools → Drills")

2. **Title**: Create a concise, SEO-friendly product title (40-60 characters) that includes:
   - Brand name (if visible)
   - Product type
   - Key distinguishing features
   - Color (if relevant)

3. **Description**: Write a detailed 3-4 sentence description covering:
   - What the product is
   - Its condition and any visible wear
   - Key features or specifications
   - Intended use case

4. **Brand & Model**: Extract exact brand name and model number if visible on the product

5. **Condition Assessment**: Evaluate condition based on visual inspection:
   - "new": Appears unused, pristine, possibly in original packaging
   - "like-new": Excellent condition, minimal/no signs of use
   - "used": Shows normal wear, fully functional
   - "poor": Significant wear, damage, or missing parts

6. **Physical Attributes**:
   - Primary color(s)
   - Material composition (wood, metal, plastic, fabric, etc.)
   - Estimated dimensions if discernible

7. **Features**: List 3-5 notable features, capabilities, or selling points

8. **Tags**: Suggest 5-8 searchable keywords/tags

9. **Confidence**: Rate your confidence in this analysis (0-100)

**Response Format (JSON):**
\`\`\`json
{
  "category": "Tools",
  "subcategory": "Power Tools → Cordless Drills",
  "title": "DeWalt 20V MAX Cordless Drill/Driver Kit - Yellow",
  "description": "Professional-grade cordless drill/driver with 20V MAX lithium-ion battery. Shows light wear from regular use but fully functional with no damage. Includes battery, charger, and carrying case. Perfect for DIY projects or professional use.",
  "brand": "DeWalt",
  "model": "DCD771C2",
  "condition": "used",
  "color": "Yellow/Black",
  "material": "Plastic/Metal",
  "dimensions": {
    "width": 7.5,
    "height": 9,
    "depth": 3,
    "unit": "inches"
  },
  "features": [
    "20V MAX lithium-ion battery",
    "2-speed transmission (0-450 & 0-1,500 RPM)",
    "1/2-inch single sleeve ratcheting chuck",
    "Compact and lightweight design",
    "LED work light"
  ],
  "suggestedTags": [
    "dewalt",
    "cordless drill",
    "power tools",
    "20v max",
    "drill driver",
    "diy tools",
    "construction",
    "home improvement"
  ],
  "confidence": 92
}
\`\`\`

**Important:**
- Be accurate and honest about condition
- If you can't see certain details, omit them (don't guess)
- Focus on what's actually visible in the image
- Use marketplace-friendly language
- Return ONLY valid JSON, no other text`;
  }

  /**
   * Parse the Gemini response into structured data
   */
  private parseAnalysis(responseText: string): ProductAnalysis {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                       responseText.match(/```\s*([\s\S]*?)\s*```/);
      
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      const parsed = JSON.parse(jsonText.trim());

      // Validate and return with defaults
      return {
        category: parsed.category || 'General',
        subcategory: parsed.subcategory,
        title: parsed.title || 'Untitled Product',
        description: parsed.description || '',
        brand: parsed.brand,
        model: parsed.model,
        condition: this.validateCondition(parsed.condition),
        color: parsed.color,
        material: parsed.material,
        dimensions: parsed.dimensions,
        features: Array.isArray(parsed.features) ? parsed.features : [],
        suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : [],
        confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
      };
    } catch (error) {
      console.error('Error parsing product analysis:', error);
      throw new Error('Failed to parse product analysis. Please try again.');
    }
  }

  /**
   * Validate condition value
   */
  private validateCondition(condition: string): 'new' | 'like-new' | 'used' | 'poor' {
    const validConditions = ['new', 'like-new', 'used', 'poor'];
    const normalized = condition?.toLowerCase().replace(/[_\s-]/g, '');
    
    if (normalized === 'likenew') return 'like-new';
    if (validConditions.includes(normalized)) return normalized as any;
    
    return 'used'; // Default to used if uncertain
  }

  /**
   * Quick category detection (faster, less detailed)
   */
  async quickCategoryDetection(imageFile: File): Promise<{ category: string; subcategory?: string }> {
    try {
      const imageData = await this.fileToBase64(imageFile);
      
      const prompt = `Analyze this product image and return ONLY the category and subcategory.

Valid categories: Tools, Furniture, Electronics, Clothing, Home & Garden, Sports & Outdoors, Toys & Games, Automotive, Books & Media, Art & Collectibles, Materials, Appliances, Other

Response format (JSON):
{"category": "Tools", "subcategory": "Power Tools"}

Return ONLY JSON, no other text.`;

      const response = await fetch(`${this.geminiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: imageFile.type, data: imageData } },
              { text: prompt }
            ]
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 100 }
        })
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

      return {
        category: parsed.category || 'General',
        subcategory: parsed.subcategory
      };
    } catch (error) {
      console.error('Quick category detection error:', error);
      return { category: 'General' };
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
}
