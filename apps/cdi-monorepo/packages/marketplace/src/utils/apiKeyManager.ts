/**
 * API Key Manager
 * Handles storage and retrieval of user-provided API keys
 * Falls back to environment variables if no user key is set
 */

export interface ApiKeys {
  gemini?: string;
  openai?: string;
}

const STORAGE_KEY = 'trader_bid_api_keys';

export class ApiKeyManager {
  /**
   * Get OpenAI API key (user-provided or env variable)
   */
  static getOpenAIKey(): string {
    const userKey = this.getUserOpenAIKey();
    return userKey || import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  /**
   * Get user-provided OpenAI key from localStorage
   */
  static getUserOpenAIKey(): string | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const keys: ApiKeys = JSON.parse(stored);
        return keys.openai || null;
      }
    } catch (error) {
      console.error('Error reading API keys from storage:', error);
    }
    return null;
  }

  /**
   * Save user's OpenAI API key
   */
  static setOpenAIKey(key: string): void {
    try {
      const keys: ApiKeys = this.getAllKeys();
      keys.openai = key;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    } catch (error) {
      console.error('Error saving API key:', error);
      throw new Error('Failed to save API key');
    }
  }

  /**
   * Remove user's OpenAI API key
   */
  static removeOpenAIKey(): void {
    try {
      const keys: ApiKeys = this.getAllKeys();
      delete keys.openai;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    } catch (error) {
      console.error('Error removing API key:', error);
    }
  }

  /**
   * Get Gemini API key (user-provided or env variable)
   */
  static getGeminiKey(): string {
    const userKey = this.getUserGeminiKey();
    return userKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  /**
   * Get user-provided Gemini key from localStorage
   */
  static getUserGeminiKey(): string | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const keys: ApiKeys = JSON.parse(stored);
        return keys.gemini || null;
      }
    } catch (error) {
      console.error('Error reading API keys from storage:', error);
    }
    return null;
  }

  /**
   * Save user's Gemini API key
   */
  static setGeminiKey(key: string): void {
    try {
      const keys: ApiKeys = this.getAllKeys();
      keys.gemini = key;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
      // Also store with simple key name for backward compatibility
      localStorage.setItem('gemini_api_key', key);
    } catch (error) {
      console.error('Error saving API key:', error);
      throw new Error('Failed to save API key');
    }
  }

  /**
   * Remove user's Gemini API key
   */
  static removeGeminiKey(): void {
    try {
      const keys: ApiKeys = this.getAllKeys();
      delete keys.gemini;
      if (Object.keys(keys).length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
      }
      // Also remove simple key
      localStorage.removeItem('gemini_api_key');
    } catch (error) {
      console.error('Error removing API key:', error);
    }
  }

  /**
   * Get all stored API keys
   */
  static getAllKeys(): ApiKeys {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading API keys:', error);
      return {};
    }
  }

  /**
   * Check if user has provided a Gemini key
   */
  static hasUserGeminiKey(): boolean {
    return !!this.getUserGeminiKey();
  }

  /**
   * Check if Gemini is configured (either user key or env)
   */
  static isGeminiConfigured(): boolean {
    return !!this.getGeminiKey();
  }

  /**
   * Check if OpenAI is configured (either user key or env)
   */
  static isOpenAIConfigured(): boolean {
    return !!this.getOpenAIKey();
  }

  /**
   * Check if any AI service is configured
   */
  static isAnyAIConfigured(): boolean {
    return this.isOpenAIConfigured() || this.isGeminiConfigured();
  }

  /**
   * Validate API key format (basic check)
   */
  static validateGeminiKey(key: string): boolean {
    // Basic validation - Gemini keys typically start with certain patterns
    if (!key || key.length < 20) {
      return false;
    }
    // Remove whitespace
    key = key.trim();
    return key.length >= 20;
  }

  /**
   * Test API key by making a simple request
   */
  static async testGeminiKey(key: string): Promise<{ success: boolean; error?: string }> {
    // Try multiple models in order of preference
    const modelsToTry = [
      'gemini-pro',           // Basic, widely available
      'gemini-1.5-pro',       // Stable, newer
      'gemini-1.5-flash',     // Alternative stable model
      'models/gemini-pro',    // With prefix
      'models/gemini-1.5-pro' // With prefix
    ];
    
    let lastError = '';
    
    for (const modelName of modelsToTry) {
      try {
        // Try with the standard generative AI package
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(key);
        
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Simple test prompt
        const result = await model.generateContent('Say "API test successful" if you can read this.');
        const response = await result.response;
        const text = response.text();
        
        if (text && text.toLowerCase().includes('successful')) {
          console.log(`✅ API key works with model: ${modelName}`);
          return { success: true };
        } else {
          console.log(`⚠️ Model ${modelName}: Response received but test phrase not found`);
        }
      } catch (error: any) {
        console.log(`❌ Model ${modelName} failed:`, error.message);
        lastError = error.message;
        
        // Don't try other models if this is clearly an API key issue
        if (error.message?.includes('API_KEY_INVALID') || 
            error.message?.includes('API key not valid') ||
            error.message?.includes('PERMISSION_DENIED') ||
            error.message?.includes('403')) {
          break;
        }
        
        // Continue trying other models for 404 errors (model not found)
        continue;
      }
    }
    
    // All models failed - provide helpful error message
    let errorMessage = lastError || 'All model tests failed';
    
    if (lastError?.includes('API_KEY_INVALID') || lastError?.includes('API key not valid')) {
      errorMessage = 'Invalid API key. Please verify you copied it correctly from Google AI Studio (https://aistudio.google.com/apikey).';
    } else if (lastError?.includes('models/gemini') || lastError?.includes('not found') || lastError?.includes('404')) {
      errorMessage = 'This API key does not have access to any Gemini models. Possible causes:\n\n• Geographic restriction: Gemini may not be available in your region\n• Wrong API source: Make sure you created the key in Google AI Studio (not Google Cloud Console)\n• Billing required: Enable billing in Google Cloud Console\n• Account restrictions: Try creating a key with a different Google account';
    } else if (lastError?.includes('quota') || lastError?.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = 'API quota exceeded. You may have reached your free tier limit. Wait a few minutes and try again, or check your usage limits.';
    } else if (lastError?.includes('permission') || lastError?.includes('403') || lastError?.includes('PERMISSION_DENIED')) {
      errorMessage = 'Permission denied. Your API key may not have access to Gemini. Solutions to try:\n\n1. Create a new key at https://aistudio.google.com/apikey\n2. Enable billing in Google Cloud Console\n3. Use a VPN if Gemini is not available in your region\n4. Wait 24 hours after creating the key';
    } else if (lastError?.includes('LOCATION') || lastError?.includes('region')) {
      errorMessage = 'Geographic restriction: Gemini API may not be available in your region. Try using a VPN to connect from US, UK, Canada, or EU.';
    } else if (lastError?.includes('billing') || lastError?.includes('BILLING')) {
      errorMessage = 'Billing not enabled. Even for free usage, you may need to enable billing in Google Cloud Console. Go to console.cloud.google.com and enable billing.';
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }

  /**
   * Test OpenAI API key
   */
  static async testOpenAIKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🧪 Testing OpenAI API key...');
      
      // Validate API key format first
      if (!apiKey || !apiKey.trim().startsWith('sk-')) {
        return {
          success: false,
          error: 'Invalid API key format. OpenAI keys should start with "sk-"'
        };
      }

      // Use a simpler, cheaper endpoint for testing (models list)
      const testUrl = 'https://api.openai.com/v1/models';
      
      console.log('🌐 Attempting to connect to OpenAI API...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {
          console.log('Could not parse error response');
        }
        
        const errorMessage = errorData.error?.message || `API request failed: ${response.statusText}`;
        
        console.log('❌ OpenAI API test failed:', errorMessage);
        
        if (response.status === 401) {
          return {
            success: false,
            error: 'Invalid API key. Please check that you copied it correctly from platform.openai.com/api-keys. Make sure to copy the entire key including "sk-".'
          };
        } else if (response.status === 429) {
          return {
            success: false,
            error: 'Rate limit exceeded or quota exhausted. Check your OpenAI account usage and billing at platform.openai.com/usage.'
          };
        } else if (response.status === 403) {
          return {
            success: false,
            error: 'Permission denied. Your API key may not have the required permissions. Try creating a new key.'
          };
        } else if (response.status >= 500) {
          return {
            success: false,
            error: 'OpenAI service temporarily unavailable. Please try again in a few moments.'
          };
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      const data = await response.json();
      
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        console.log('✅ OpenAI API key works!', `Found ${data.data.length} models available`);
        return { success: true };
      }
      
      return {
        success: false,
        error: 'Unexpected response from API. Please try again.'
      };
    } catch (error: any) {
      console.error('❌ Error testing OpenAI key:', error);
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Connection timed out. Please check your internet connection and try again.'
        };
      }
      
      if (error.message?.includes('fetch')) {
        return {
          success: false,
          error: 'Network error: Unable to reach OpenAI servers. Please check your internet connection and firewall settings.'
        };
      }
      
      if (error.message?.includes('CORS')) {
        return {
          success: false,
          error: 'Browser security error. Try disabling browser extensions or using a different browser.'
        };
      }
      
      return {
        success: false,
        error: `Connection failed: ${error.message}. Please check your internet connection and try again.`
      };
    }
  }

  /**
   * Get key source (where the current key comes from)
   */
  static getKeySource(): 'user' | 'environment' | 'none' {
    if (this.hasUserGeminiKey()) {
      return 'user';
    } else if (import.meta.env.VITE_GEMINI_API_KEY) {
      return 'environment';
    }
    return 'none';
  }

  /**
   * Clear all stored API keys
   */
  static clearAllKeys(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing API keys:', error);
    }
  }
}
