/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Gemini AI Pricing Intelligence Service
 * Analyzes product images and data to suggest optimal pricing
 */

interface PricingAnalysis {
  suggestedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  confidence: number; // 0-100
  reasoning: string;
  comparables: Array<{
    title: string;
    price: number;
    similarity: number;
  }>;
  marketInsights: {
    demandLevel: 'low' | 'medium' | 'high';
    seasonality: string;
    competitorCount: number;
  };
}

interface ProductData {
  title?: string;
  description?: string;
  category?: string;
  condition: 'new' | 'like-new' | 'used' | 'poor';
  brand?: string;
  imageUrl?: string;
}

export class GeminiPricingService {
  private apiKey: string;
  private geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyze product and suggest optimal pricing
   */
  async analyzePricing(productData: ProductData): Promise<PricingAnalysis> {
    try {
      // Build the analysis prompt
      const prompt = this.buildPricingPrompt(productData);

      // If we have an image, include it in the analysis
      const parts: any[] = [{ text: prompt }];
      
      if (productData.imageUrl) {
        // Convert image URL to base64 if needed
        const imageData = await this.loadImageAsBase64(productData.imageUrl);
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData
          }
        });
      }

      // Call Gemini API
      const response = await fetch(`${this.geminiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: parts
          }],
          generationConfig: {
            temperature: 0.4, // Lower temperature for more consistent pricing
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

      // Parse the structured response
      return this.parseAnalysisResponse(analysisText);

    } catch (error) {
      console.error('Error analyzing pricing:', error);
      throw error;
    }
  }

  /**
   * Build the pricing analysis prompt
   */
  private buildPricingPrompt(productData: ProductData): string {
    return `You are an expert marketplace pricing analyst. Analyze this product and suggest optimal pricing.

**Product Information:**
- Title: ${productData.title || 'Not provided'}
- Category: ${productData.category || 'General'}
- Condition: ${productData.condition}
- Brand: ${productData.brand || 'Generic/Unknown'}
- Description: ${productData.description || 'Not provided'}

**Your Task:**
Analyze the product data ${productData.imageUrl ? 'and image' : ''} to provide:

1. **Suggested Price**: A single optimal price point in USD
2. **Price Range**: Min and max reasonable prices (min-max spread)
3. **Confidence Level**: 0-100 score on how confident you are
4. **Reasoning**: 2-3 sentence explanation of pricing factors
5. **Market Insights**:
   - Demand level (low/medium/high)
   - Seasonality notes
   - Estimated competitor count

**Response Format (JSON):**
\`\`\`json
{
  "suggestedPrice": 45.00,
  "priceRange": {
    "min": 35.00,
    "max": 55.00
  },
  "confidence": 85,
  "reasoning": "Based on the ${productData.condition} condition and ${productData.category || 'category'}, this price is competitive. Similar items typically sell in this range.",
  "marketInsights": {
    "demandLevel": "medium",
    "seasonality": "Year-round demand",
    "competitorCount": 15
  }
}
\`\`\`

**Pricing Guidelines:**
- New condition: 70-90% of retail
- Like-new: 60-80% of retail
- Used (good): 40-60% of retail
- Used (poor): 20-40% of retail
- Brand name items: +20-30% premium
- Generic items: Base pricing only
- High demand categories: +10-20%

Return ONLY valid JSON. No other text.`;
  }

  /**
   * Parse the Gemini response into structured data
   */
  private parseAnalysisResponse(responseText: string): PricingAnalysis {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                       responseText.match(/```\s*([\s\S]*?)\s*```/);
      
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      const parsed = JSON.parse(jsonText.trim());

      // Validate and return with defaults for any missing fields
      return {
        suggestedPrice: parsed.suggestedPrice || 0,
        priceRange: {
          min: parsed.priceRange?.min || 0,
          max: parsed.priceRange?.max || 0,
        },
        confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
        reasoning: parsed.reasoning || 'Unable to determine specific reasoning',
        comparables: parsed.comparables || [],
        marketInsights: {
          demandLevel: parsed.marketInsights?.demandLevel || 'medium',
          seasonality: parsed.marketInsights?.seasonality || 'Unknown',
          competitorCount: parsed.marketInsights?.competitorCount || 0,
        }
      };
    } catch (error) {
      console.error('Error parsing Gemini pricing response:', error);
      throw new Error('Failed to parse pricing analysis. Please try again.');
    }
  }

  /**
   * Load image and convert to base64
   */
  private async loadImageAsBase64(imageUrl: string): Promise<string> {
    try {
      // If it's already a data URL, extract the base64 part
      if (imageUrl.startsWith('data:')) {
        const base64Data = imageUrl.split(',')[1];
        return base64Data;
      }

      // Otherwise, fetch and convert
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading image:', error);
      // Return empty string if image can't be loaded
      return '';
    }
  }

  /**
   * Quick price estimate without full analysis (faster, less detailed)
   */
  async quickPriceEstimate(productData: ProductData): Promise<{ price: number; range: { min: number; max: number } }> {
    try {
      const prompt = `Analyze this product and suggest a price in USD:
- Title: ${productData.title}
- Category: ${productData.category}
- Condition: ${productData.condition}
- Brand: ${productData.brand || 'Generic'}

Return ONLY a JSON object with this format:
{"price": 45.00, "min": 35.00, "max": 55.00}`;

      const response = await fetch(`${this.geminiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 }
        })
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');

      return {
        price: parsed.price || 0,
        range: {
          min: parsed.min || 0,
          max: parsed.max || 0
        }
      };
    } catch (error) {
      console.error('Quick price estimate error:', error);
      // Return fallback pricing
      return { price: 0, range: { min: 0, max: 0 } };
    }
  }
}
