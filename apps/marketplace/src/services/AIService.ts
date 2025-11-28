import OpenAI from 'openai';

// AI Service for Trader Bid
export class AIService {
  private static instance: AIService;
  private openai: OpenAI;

  private constructor() {
    // Initialize OpenAI with API key from environment
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // For demo purposes - in production, use a backend API
    });
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
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

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert auction listing writer who creates compelling descriptions that drive bids while remaining honest and accurate.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error generating description:', error);
      throw new Error('Failed to generate description. Please try again.');
    }
  }

  /**
   * Analyze uploaded image and suggest item details
   */
  async analyzeImage(imageUrl: string): Promise<{
    itemType: string;
    suggestedTitle: string;
    suggestedCategory: string;
    condition: string;
    keyFeatures: string[];
    estimatedValue: { min: number; max: number };
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image for an auction listing. Provide:
1. Item type/category
2. Suggested listing title (catchy and descriptive)
3. Best category for this item
4. Estimated condition (new, like new, excellent, good, fair, poor)
5. Key features visible in the image
6. Estimated market value range

Format your response as JSON with these exact keys:
{
  "itemType": "...",
  "suggestedTitle": "...",
  "suggestedCategory": "...",
  "condition": "...",
  "keyFeatures": ["...", "..."],
  "estimatedValue": { "min": 0, "max": 0 }
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const content = response.choices[0].message.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze image. Please try again.');
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

Provide pricing recommendations as JSON:
{
  "startingBid": (number, should be attractive to start bidding),
  "reservePrice": (number, minimum acceptable price),
  "buyNowPrice": (number, fair "buy it now" price),
  "reasoning": (brief explanation of pricing strategy)
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in auction pricing strategy. Your goal is to maximize seller profit while attracting bidders.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 300
      });

      const content = response.choices[0].message.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Error suggesting pricing:', error);
      throw new Error('Failed to suggest pricing. Please try again.');
    }
  }

  /**
   * Improve/enhance an existing description
   */
  async improveDescription(currentDescription: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert editor who improves auction listings. Make them more compelling while keeping the same information.'
          },
          {
            role: 'user',
            content: `Improve this auction description. Make it more engaging and likely to drive bids:\n\n${currentDescription}`
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      });

      return response.choices[0].message.content || currentDescription;
    } catch (error) {
      console.error('Error improving description:', error);
      throw new Error('Failed to improve description. Please try again.');
    }
  }

  /**
   * Generate SEO-friendly title suggestions
   */
  async suggestTitles(itemDescription: string): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert. Create catchy, searchable auction titles.'
          },
          {
            role: 'user',
            content: `Suggest 5 different auction listing titles for: ${itemDescription}\n\nMake them catchy, specific, and include key search terms. Return as JSON array: ["title1", "title2", ...]`
          }
        ],
        temperature: 0.9,
        max_tokens: 200
      });

      const content = response.choices[0].message.content || '[]';
      return JSON.parse(content);
    } catch (error) {
      console.error('Error suggesting titles:', error);
      return [];
    }
  }

  /**
   * Check if OpenAI API key is configured
   */
  isConfigured(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY;
  }
}

export const aiService = AIService.getInstance();
