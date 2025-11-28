// Vertex AI Service (Currently Disabled - Using Google AI Studio instead)
// This file contains the enterprise Vertex AI integration
// Currently using GoogleAIService.ts for simpler API key approach

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

export class VertexAIService {
  constructor() {
    console.warn('VertexAIService disabled - using GoogleAIService instead');
  }

  async generateProductListing(): Promise<ProductSuggestion> {
    throw new Error('VertexAI disabled - use GoogleAIService instead');
  }

  async getChatResponse(): Promise<ChatResponse> {
    throw new Error('VertexAI disabled - use GoogleAIService instead');
  }

  async suggestOptimalPrice(): Promise<any> {
    throw new Error('VertexAI disabled - use GoogleAIService instead');
  }

  async analyzeProductImage(): Promise<ImageAnalysis> {
    throw new Error('VertexAI disabled - use GoogleAIService instead');
  }

  async getUsageStats(): Promise<any> {
    throw new Error('VertexAI disabled - use GoogleAIService instead');
  }

  async generateSEOContent(): Promise<any> {
    throw new Error('VertexAI disabled - use GoogleAIService instead');
  }

  async batchAnalyzeImages(): Promise<any> {
    throw new Error('VertexAI disabled - use GoogleAIService instead');
  }
}

// Export disabled instance
export const vertexAIService = new VertexAIService();