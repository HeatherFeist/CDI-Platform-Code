import { supabase } from '../lib/supabase';

export interface AIUsageRecord {
  user_id: string;
  feature_type: 'text_generation' | 'image_generation' | 'image_editing';
  model_used: string;
  prompt?: string;
  tokens_used?: number;
  cost_estimate?: number;
  success: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface UsageLimit {
  current_usage: number;
  tier_limit: number;
  tier_name: string;
  can_use: boolean;
}

export interface MonthlyUsage {
  month: string;
  feature_type: string;
  usage_count: number;
  total_cost: number;
  total_tokens: number;
}

/**
 * Service for tracking AI feature usage
 * Handles logging, limit checking, and usage analytics
 */
export class AIUsageTracker {
  /**
   * Log an AI feature usage
   */
  static async logUsage(usage: AIUsageRecord): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_usage')
        .insert([usage]);

      if (error) {
        console.error('Error logging AI usage:', error);
        // Don't throw - usage tracking shouldn't break the feature
      }
    } catch (error) {
      console.error('Failed to log AI usage:', error);
    }
  }

  /**
   * Check if user can use a specific AI feature
   * Returns usage statistics and whether they're within limits
   */
  static async checkLimit(
    userId: string,
    featureType: 'text_generation' | 'image_generation' | 'image_editing'
  ): Promise<UsageLimit> {
    try {
      const { data, error } = await supabase
        .rpc('check_ai_usage_limit', {
          p_user_id: userId,
          p_feature_type: featureType
        });

      if (error) throw error;

      return data[0] || {
        current_usage: 0,
        tier_limit: 0,
        tier_name: 'free',
        can_use: false
      };
    } catch (error) {
      console.error('Error checking AI usage limit:', error);
      // Fail open - allow usage if check fails
      return {
        current_usage: 0,
        tier_limit: -1,
        tier_name: 'unknown',
        can_use: true
      };
    }
  }

  /**
   * Get monthly usage statistics for a user
   */
  static async getMonthlyUsage(
    userId: string,
    featureType?: 'text_generation' | 'image_generation' | 'image_editing'
  ): Promise<MonthlyUsage[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_monthly_ai_usage', {
          p_user_id: userId,
          p_feature_type: featureType || null
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting monthly usage:', error);
      return [];
    }
  }

  /**
   * Helper to calculate cost estimate for text generation
   */
  static estimateTextCost(tokens: number, model: string = 'gpt-3.5-turbo'): number {
    // Pricing per 1K tokens (as of 2024)
    const pricing: Record<string, number> = {
      'gpt-3.5-turbo': 0.002,  // $0.002 per 1K tokens
      'gpt-4': 0.03,           // $0.03 per 1K tokens
      'gpt-4-turbo': 0.01      // $0.01 per 1K tokens
    };

    const pricePerToken = (pricing[model] || pricing['gpt-3.5-turbo']) / 1000;
    return tokens * pricePerToken;
  }

  /**
   * Helper to calculate cost estimate for image generation
   */
  static estimateImageCost(
    model: 'dall-e-2' | 'dall-e-3' = 'dall-e-2',
    size: '256x256' | '512x512' | '1024x1024' = '1024x1024',
    quality: 'standard' | 'hd' = 'standard'
  ): number {
    // DALL-E 2 pricing
    if (model === 'dall-e-2') {
      const pricing: Record<string, number> = {
        '256x256': 0.016,
        '512x512': 0.018,
        '1024x1024': 0.020
      };
      return pricing[size] || 0.020;
    }

    // DALL-E 3 pricing
    if (model === 'dall-e-3') {
      if (quality === 'hd') {
        return size === '1024x1024' ? 0.080 : 0.120;
      }
      return size === '1024x1024' ? 0.040 : 0.080;
    }

    return 0.020; // Default
  }

  /**
   * Log text generation usage
   */
  static async logTextGeneration(
    userId: string,
    model: string,
    prompt: string,
    tokensUsed: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await this.logUsage({
      user_id: userId,
      feature_type: 'text_generation',
      model_used: model,
      prompt: prompt.substring(0, 500), // Truncate long prompts
      tokens_used: tokensUsed,
      cost_estimate: this.estimateTextCost(tokensUsed, model),
      success,
      error_message: errorMessage
    });
  }

  /**
   * Log image generation usage
   */
  static async logImageGeneration(
    userId: string,
    model: 'dall-e-2' | 'dall-e-3',
    prompt: string,
    size: '256x256' | '512x512' | '1024x1024',
    success: boolean,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logUsage({
      user_id: userId,
      feature_type: 'image_generation',
      model_used: model,
      prompt: prompt.substring(0, 500),
      cost_estimate: this.estimateImageCost(model, size),
      success,
      error_message: errorMessage,
      metadata: {
        size,
        ...metadata
      }
    });
  }

  /**
   * Log image editing usage
   */
  static async logImageEditing(
    userId: string,
    model: 'dall-e-2',
    prompt: string,
    success: boolean,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logUsage({
      user_id: userId,
      feature_type: 'image_editing',
      model_used: model,
      prompt: prompt.substring(0, 500),
      cost_estimate: 0.020, // DALL-E 2 edit cost
      success,
      error_message: errorMessage,
      metadata
    });
  }

  /**
   * Get user's current month statistics
   */
  static async getCurrentMonthStats(userId: string): Promise<{
    textUsage: number;
    imageUsage: number;
    totalCost: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('ai_usage')
        .select('feature_type, cost_estimate')
        .eq('user_id', userId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .eq('success', true);

      if (error) throw error;

      const stats = {
        textUsage: 0,
        imageUsage: 0,
        totalCost: 0
      };

      data?.forEach(record => {
        if (record.feature_type === 'text_generation') {
          stats.textUsage++;
        } else {
          stats.imageUsage++;
        }
        stats.totalCost += parseFloat(record.cost_estimate || '0');
      });

      return stats;
    } catch (error) {
      console.error('Error getting current month stats:', error);
      return { textUsage: 0, imageUsage: 0, totalCost: 0 };
    }
  }
}
