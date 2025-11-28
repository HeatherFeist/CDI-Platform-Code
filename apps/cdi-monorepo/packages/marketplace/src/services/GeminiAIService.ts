import { ApiKeyManager } from '../utils/apiKeyManager';

/**
 * AI Service using OpenAI for text generation
 * Handles description generation, pricing suggestions, title optimization, etc.
 * Uses user-provided API key from localStorage or falls back to environment variable
 * Model: gpt-3.5-turbo (fast, cost-effective)
 */
export class GeminiAIService {
  private static instance: GeminiAIService;
  private readonly MODEL_NAME = 'gpt-3.5-turbo';
  private apiKey: string;

  private constructor() {
    this.apiKey = ApiKeyManager.getOpenAIKey();
  }

  /**
   * Reinitialize with new API key (call when user updates their key)
   */
  public reinitialize(): void {
    this.apiKey = ApiKeyManager.getOpenAIKey();
  }

  public static getInstance(): GeminiAIService {
    if (!GeminiAIService.instance) {
      GeminiAIService.instance = new GeminiAIService();
    }
    return GeminiAIService.instance;
  }

  /**
   * Generate compelling auction listing description
   */
  async generateDescription(params: {
    title: string;
    category?: string;
    condition?: string;
    features?: string[];
    price?: number;
  }): Promise<string> {
    try {
      // Reinitialize to pick up any new API key
      this.reinitialize();
      
      // Check if API key is available
      console.log('🔑 API Key Status:', this.apiKey ? `Found (${this.apiKey.substring(0, 10)}...)` : 'NOT FOUND');
      
      if (!this.apiKey || this.apiKey === 'your_openai_api_key_here') {
        throw new Error('OpenAI API key not configured. Please add your API key in Settings > AI Settings.');
      }

      const { title, category, condition, features, price } = params;

      const prompt = `You are a professional auction listing writer. Create a compelling, honest, and enthusiastic description for an auction listing.

Item Details:
- Title: ${title}
${category ? `- Category: ${category}` : ''}
${condition ? `- Condition: ${condition}` : ''}
${features && features.length > 0 ? `- Features: ${features.join(', ')}` : ''}
${price ? `- Starting Bid: $${price}` : ''}

Write a 3-4 paragraph description that:
1. Opens with an attention-grabbing statement
2. Highlights key features and benefits
3. Describes the condition honestly
4. Creates urgency to bid
5. Ends with a call-to-action

Keep it friendly, professional, and exciting. No bullet points - use flowing paragraphs.`;

      console.log('🤖 Calling OpenAI API for description generation...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.MODEL_NAME,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API Error:', response.status, errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`OpenAI API Error (${response.status}): ${errorText}`);
        }
        
        throw new Error(errorData.error?.message || `OpenAI API Error (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Description generated successfully');
      return data.choices[0].message.content.trim();
    } catch (error: any) {
      console.error('Error generating description:', error);
      
      // Provide helpful error messages
      if (error.message?.includes('fetch')) {
        throw new Error('Network error: Unable to connect to OpenAI. Check your internet connection.');
      }
      
      if (error.message?.includes('401')) {
        throw new Error('Invalid API key. Please check your OpenAI API key in Settings > AI Settings.');
      }
      
      if (error.message?.includes('429')) {
        throw new Error('API rate limit exceeded. Please wait a moment and try again.');
      }
      
      throw new Error(error.message || 'Failed to generate description. Please try again.');
    }
  }

  /**
   * Suggest optimal pricing based on item details and market data
   */
  async suggestPricing(params: {
    title: string;
    category: string;
    condition: string;
    recentSales?: Array<{ price: number; date: string }>;
  }): Promise<{
    startingBid: number;
    reservePrice: number;
    buyNowPrice: number;
    reasoning: string;
  }> {
    try {
      const { title, category, condition, recentSales } = params;

      const prompt = `As a pricing expert for online auctions, suggest optimal pricing for this item:

Item: ${title}
Category: ${category}
Condition: ${condition}
${recentSales && recentSales.length > 0 ? `Recent Similar Sales: ${JSON.stringify(recentSales)}` : ''}

Provide pricing recommendations as JSON with this exact structure:
{
  "startingBid": (number, should be attractive to start bidding),
  "reservePrice": (number, minimum acceptable price),
  "buyNowPrice": (number, fair "buy it now" price),
  "reasoning": (brief explanation of pricing strategy)
}

Return ONLY the JSON object, no other text.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a pricing expert for online auctions. Return only valid JSON objects.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content || '{}';
      
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(text);
    } catch (error: any) {
      console.error('Error suggesting pricing:', error);
      const errorMessage = error?.message || 'Failed to suggest pricing';
      throw new Error(`AI Error: ${errorMessage}. Please check your API key in Settings.`);
    }
  }

  /**
   * Improve/enhance an existing description
   */
  async improveDescription(currentDescription: string): Promise<string> {
    try {
      const prompt = `Improve this auction description. Make it more engaging and likely to drive bids while keeping the same information:\n\n${currentDescription}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that improves auction descriptions.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error: any) {
      console.error('Error improving description:', error);
      const errorMessage = error?.message || 'Failed to improve description';
      throw new Error(`AI Error: ${errorMessage}. Please check your API key in Settings.`);
    }
  }

  /**
   * Generate SEO-friendly title suggestions
   */
  async suggestTitles(itemDescription: string): Promise<string[]> {
    try {
      const prompt = `Suggest 5 different auction listing titles for: ${itemDescription}

Make them catchy, specific, and include key search terms. Return as a JSON array: ["title1", "title2", "title3", "title4", "title5"]

Return ONLY the JSON array, no other text.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that generates auction listing titles. Return only valid JSON arrays.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content || '[]';
      
      // Extract JSON array from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(text);
    } catch (error: any) {
      console.error('Error suggesting titles:', error);
      return [];
    }
  }

  /**
   * Analyze item details and provide category suggestions
   */
  async suggestCategory(title: string, description?: string): Promise<string[]> {
    try {
      const prompt = `Based on this item, suggest the 3 most appropriate categories:

Title: ${title}
${description ? `Description: ${description}` : ''}

Common categories: Electronics, Fashion, Home & Garden, Sports, Toys, Books, Collectibles, Automotive, Art, Jewelry

Return as JSON array: ["category1", "category2", "category3"]

Return ONLY the JSON array, no other text.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that categorizes items. Return only valid JSON arrays.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 100
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content || '[]';
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(text);
    } catch (error: any) {
      console.error('Error suggesting categories:', error);
      return [];
    }
  }

  /**
   * Generate listing tags/keywords for better searchability
   */
  async generateTags(title: string, description: string, category: string): Promise<string[]> {
    try {
      const prompt = `Generate 10 relevant search tags/keywords for this listing:

Title: ${title}
Description: ${description}
Category: ${category}

Tags should be single words or short phrases that buyers might search for. Return as JSON array: ["tag1", "tag2", ...]

Return ONLY the JSON array, no other text.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that generates search tags. Return only valid JSON arrays.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.6,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content || '[]';
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return JSON.parse(text);
    } catch (error: any) {
      console.error('Error generating tags:', error);
      return [];
    }
  }

  /**
   * Check if OpenAI API key is configured
   */
  isConfigured(): boolean {
    return ApiKeyManager.isOpenAIConfigured();
  }

  /**
   * Get configuration status message
   */
  getConfigurationMessage(): string {
    if (ApiKeyManager.isOpenAIConfigured()) {
      return 'AI features powered by your OpenAI API key!';
    }
    return 'Add your OpenAI API key in Settings to enable AI features.';
  }

  /**
   * Get the source of the current API key
   */
  getKeySource(): 'user' | 'environment' | 'none' {
    if (ApiKeyManager.getUserOpenAIKey()) return 'user';
    if (import.meta.env.VITE_OPENAI_API_KEY) return 'environment';
    return 'none';
  }
}

export const geminiAIService = GeminiAIService.getInstance();
