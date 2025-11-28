// Simple Google AI Studio integration for testing
// This uses the direct API key approach (simpler than Vertex AI)

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY not found in environment variables');
}

export interface ProductSuggestion {
  title: string;
  description: string;
  suggestedPrice: number;
  category: string;
  tags: string[];
  seoKeywords: string[];
}

export interface ImageAnalysis {
  description: string;
  detectedItems: string[];
  estimatedValue: number;
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
  suggestedCategories: string[];
  marketingPoints: string[];
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  actionItems?: string[];
}

class GoogleAIService {
  private apiKey: string;
  private baseUrl = 'https://aiplatform.googleapis.com/v1/publishers/google/models';

  constructor() {
    this.apiKey = API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Google AI API key not configured');
    }
  }

  private async callGeminiAPI(prompt: string, modelName = 'gemini-2.5-flash-lite'): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${modelName}:streamGenerateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.8,
              maxOutputTokens: 1024,
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      // Handle streaming response (array of chunks)
      if (Array.isArray(data)) {
        let fullText = '';
        
        for (const chunk of data) {
          if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content) {
            const parts = chunk.candidates[0].content.parts;
            if (parts && parts[0] && parts[0].text) {
              fullText += parts[0].text;
            }
          }
        }
        
        if (fullText) {
          return fullText.trim();
        }
      }
      
      // Handle single response format (fallback)
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const parts = data.candidates[0].content.parts;
        if (parts && parts[0] && parts[0].text) {
          return parts[0].text.trim();
        }
      }

      throw new Error('No valid response content received from API');
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get AI response: ${errorMessage}`);
    }
  }

  async generateProductListing(basicInfo: {
    title?: string;
    category?: string;
    condition?: string;
    description?: string;
    price?: number;
  }): Promise<ProductSuggestion> {
    const prompt = `
You are an expert marketplace listing assistant for a nonprofit marketplace platform. 
Generate a compelling product listing based on this information:

Title: ${basicInfo.title || 'Not provided'}
Category: ${basicInfo.category || 'Not provided'}
Condition: ${basicInfo.condition || 'Not provided'}
Description: ${basicInfo.description || 'Not provided'}
Current Price: ${basicInfo.price || 'Not provided'}

Please provide a JSON response with:
1. An optimized title (max 80 characters)
2. A detailed, SEO-friendly description (200-400 words)
3. A suggested competitive price
4. The most appropriate category
5. Relevant tags for searchability
6. SEO keywords

Format your response as valid JSON:
{
  "title": "optimized title",
  "description": "detailed description with benefits and features",
  "suggestedPrice": 99.99,
  "category": "best_category",
  "tags": ["tag1", "tag2", "tag3"],
  "seoKeywords": ["keyword1", "keyword2", "keyword3"]
}

Focus on highlighting the social impact of shopping from nonprofit members.
`;

    try {
      const response = await this.callGeminiAPI(prompt);
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const jsonString = jsonMatch[0];
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error generating product listing:', error);
      // Return a fallback response
      return {
        title: basicInfo.title || 'Product Title',
        description: basicInfo.description || 'Product description...',
        suggestedPrice: basicInfo.price || 0,
        category: basicInfo.category || 'Other',
        tags: ['marketplace', 'nonprofit'],
        seoKeywords: ['buy', 'support', 'nonprofit']
      };
    }
  }

  async getChatResponse(
    userMessage: string,
    context?: {
      userType: 'buyer' | 'seller' | 'admin';
      currentPage?: string;
      userHistory?: string[];
    }
  ): Promise<ChatResponse> {
    const prompt = `
You are a helpful AI assistant for Constructive Designs Inc., a nonprofit marketplace platform.
Our mission is to create economic opportunities for nonprofit organizations and their members.

User type: ${context?.userType || 'general'}
Current page: ${context?.currentPage || 'unknown'}
Previous conversation: ${context?.userHistory?.join('\n') || 'None'}

You should:
- Help users navigate the platform
- Provide guidance on listing items
- Assist with marketplace policies
- Suggest ways to maximize sales
- Promote the social impact of shopping here
- Be encouraging and supportive

User message: "${userMessage}"

Provide a helpful response and optionally include suggestions or action items.
Format as JSON:
{
  "message": "your helpful response",
  "suggestions": ["suggestion1", "suggestion2"],
  "actionItems": ["action1", "action2"]
}
`;

    try {
      const response = await this.callGeminiAPI(prompt);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Fallback to plain text response
        return {
          message: response,
          suggestions: [],
          actionItems: []
        };
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error getting chat response:', error);
      return {
        message: "I'm here to help! I can assist with creating listings, optimizing prices, and explaining how your purchases support nonprofits. What would you like to know?",
        suggestions: [
          "How can I create a better product listing?",
          "What pricing should I use?",
          "How does shopping here help nonprofits?"
        ]
      };
    }
  }

  async suggestOptimalPrice(item: {
    title: string;
    category: string;
    condition: string;
    description: string;
    currentPrice?: number;
  }): Promise<{
    suggestedPrice: number;
    priceRange: { min: number; max: number };
    reasoning: string;
    competitiveFactors: string[];
  }> {
    const prompt = `
As a pricing expert for a nonprofit marketplace, analyze this item and suggest optimal pricing:

Title: ${item.title}
Category: ${item.category}
Condition: ${item.condition}
Description: ${item.description}
Current Price: ${item.currentPrice || 'Not set'}

Consider:
- Market demand for similar items
- Condition impact on pricing
- Nonprofit marketplace context (buyers support a cause)
- Competitive pricing strategies
- Seasonal factors

Provide pricing recommendations as JSON:
{
  "suggestedPrice": 99.99,
  "priceRange": {"min": 80.00, "max": 120.00},
  "reasoning": "explanation of pricing strategy",
  "competitiveFactors": ["factor1", "factor2", "factor3"]
}
`;

    try {
      const response = await this.callGeminiAPI(prompt);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error suggesting price:', error);
      // Fallback pricing logic
      const basePrice = item.currentPrice || 50;
      return {
        suggestedPrice: basePrice * 1.1,
        priceRange: { min: basePrice * 0.9, max: basePrice * 1.3 },
        reasoning: "Based on similar items and nonprofit marketplace premiums",
        competitiveFactors: ["Condition", "Market demand", "Social impact value"]
      };
    }
  }

  // Placeholder for image analysis (would need vision model)
  async analyzeProductImage(
    imageBase64: string,
    additionalContext?: string
  ): Promise<ImageAnalysis> {
    // For now, return a mock response since image analysis requires special setup
    return {
      description: "Image analysis is coming soon! Upload successful.",
      detectedItems: ["Product detected"],
      estimatedValue: 50,
      condition: "Good" as const,
      suggestedCategories: ["General"],
      marketingPoints: ["Great condition", "Support a nonprofit cause"]
    };
  }

  async getUsageStats(): Promise<{
    requestsThisMonth: number;
    estimatedCost: number;
    remainingCredits?: number;
  }> {
    // Mock data for now
    return {
      requestsThisMonth: 0,
      estimatedCost: 0,
      remainingCredits: 1000
    };
  }
}

// Export singleton instance
export const googleAIService = new GoogleAIService();