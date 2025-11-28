import { aiService as openaiService } from './AIService';
import { googleAIService } from './GoogleAIService';
import { ApiKeyManager } from '../utils/apiKeyManager';

// Utility to get preferred provider from localStorage (set by AISettings)
function getPreferredProvider(): 'openai' | 'gemini' {
  return (localStorage.getItem('preferred_ai_provider') as 'openai' | 'gemini') || 'openai';
}

// Utility to set preferred provider
export function setPreferredProvider(provider: 'openai' | 'gemini') {
  localStorage.setItem('preferred_ai_provider', provider);
}

export class UnifiedAIService {
  // Try the preferred provider, then fallback
  async generateDescription(params: any): Promise<string> {
    const provider = getPreferredProvider();
    if (provider === 'openai' && ApiKeyManager.isOpenAIConfigured()) {
      try {
        return await openaiService.generateDescription(params);
      } catch (e) {
        if (ApiKeyManager.isGeminiConfigured()) {
          return await googleAIService.generateProductListing(params).then(r => r.description);
        }
        throw e;
      }
    } else if (provider === 'gemini' && ApiKeyManager.isGeminiConfigured()) {
      try {
        return await googleAIService.generateProductListing(params).then(r => r.description);
      } catch (e) {
        if (ApiKeyManager.isOpenAIConfigured()) {
          return await openaiService.generateDescription(params);
        }
        throw e;
      }
    } else if (ApiKeyManager.isOpenAIConfigured()) {
      return await openaiService.generateDescription(params);
    } else if (ApiKeyManager.isGeminiConfigured()) {
      return await googleAIService.generateProductListing(params).then(r => r.description);
    } else {
      throw new Error('No AI provider is configured. Please set an API key in AI Settings.');
    }
  }

  async suggestPricing(params: any): Promise<any> {
    const provider = getPreferredProvider();
    if (provider === 'openai' && ApiKeyManager.isOpenAIConfigured()) {
      try {
        return await openaiService.suggestPricing(params);
      } catch (e) {
        if (ApiKeyManager.isGeminiConfigured()) {
          return await googleAIService.suggestOptimalPrice(params);
        }
        throw e;
      }
    } else if (provider === 'gemini' && ApiKeyManager.isGeminiConfigured()) {
      try {
        return await googleAIService.suggestOptimalPrice(params);
      } catch (e) {
        if (ApiKeyManager.isOpenAIConfigured()) {
          return await openaiService.suggestPricing(params);
        }
        throw e;
      }
    } else if (ApiKeyManager.isOpenAIConfigured()) {
      return await openaiService.suggestPricing(params);
    } else if (ApiKeyManager.isGeminiConfigured()) {
      return await googleAIService.suggestOptimalPrice(params);
    } else {
      throw new Error('No AI provider is configured. Please set an API key in AI Settings.');
    }
  }

  // Add more methods as needed, following the same fallback pattern
}

export const unifiedAIService = new UnifiedAIService();
