import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ConversationContext {
  userId?: string;
  currentListing?: any;
  userProfile?: any;
  recentActivity?: any;
}

/**
 * BidBot - Conversational AI Assistant for Constructive Designs Marketplace
 */
export class BidBotService {
  private static instance: BidBotService;
  private openai: OpenAI;
  private conversationHistory: Map<string, ChatMessage[]> = new Map();

  private constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  public static getInstance(): BidBotService {
    if (!BidBotService.instance) {
      BidBotService.instance = new BidBotService();
    }
    return BidBotService.instance;
  }

  /**
   * Send a message to BidBot and get a response
   */
  async chat(
    message: string,
    context: ConversationContext = {},
    conversationId: string = 'default'
  ): Promise<string> {
    try {
      // Get or create conversation history
      let history = this.conversationHistory.get(conversationId) || [];

      // Add user message to history
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      history.push(userMessage);

      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(context);

      // Prepare messages for OpenAI
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...history.slice(-10).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ];

      // Get response from OpenAI
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 500
      });

      const assistantMessage = response.choices[0].message.content || 'I apologize, but I could not generate a response.';

      // Add assistant message to history
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date()
      };
      history.push(assistantMsg);

      // Save updated history
      this.conversationHistory.set(conversationId, history);

      return assistantMessage;
    } catch (error) {
      console.error('BidBot error:', error);
      throw new Error('Failed to get response from BidBot. Please try again.');
    }
  }

  /**
   * Build system prompt based on context
   */
  private buildSystemPrompt(context: ConversationContext): string {
    let prompt = `You are BidBot, a helpful AI assistant for Constructive Designs Marketplace, a nonprofit community auction and trading platform in Dayton, OH.

Your role:
- Help users make smart bidding decisions
- Provide auction strategy advice
- Answer questions about items, prices, and market trends
- Assist with creating listings
- Help negotiate trades
- Provide delivery and shipping guidance

Tone: Friendly, professional, enthusiastic about auctions and deals
Style: Conversational, concise, actionable advice
Always: Be honest, practical, and user-focused

Platform info:
- Local marketplace for Dayton, OH area
- Delivery options: Pickup, Local Delivery, Shipping, or Meet & Deliver
- 10% platform fee on sales
- Stripe payment processing
- Real-time bidding
- Trading system available`;

    if (context.currentListing) {
      prompt += `\n\nCurrent listing context:
- Title: ${context.currentListing.title}
- Current bid: $${context.currentListing.current_bid}
- Starting bid: $${context.currentListing.starting_bid}
- Buy now: ${context.currentListing.buy_now_price ? '$' + context.currentListing.buy_now_price : 'Not available'}
- Time left: ${this.getTimeRemaining(context.currentListing.end_time)}
- Condition: ${context.currentListing.condition}`;
    }

    if (context.userProfile) {
      prompt += `\n\nUser info:
- Username: ${context.userProfile.username}
- Rating: ${context.userProfile.rating}/5 (${context.userProfile.total_reviews} reviews)
- Member since: ${new Date(context.userProfile.created_at).toLocaleDateString()}`;
    }

    return prompt;
  }

  /**
   * Get quick suggestions for common questions
   */
  getQuickSuggestions(context: ConversationContext = {}): string[] {
    const suggestions = [
      "Should I bid on this item?",
      "What's a fair price for this?",
      "Help me write a listing",
      "Where should we meet for the exchange?",
      "How do I avoid scams?",
      "What's trending in Dayton?"
    ];

    if (context.currentListing) {
      return [
        "Should I bid on this?",
        "What's my max bid strategy?",
        "When should I place my bid?",
        "Is this a good deal?",
        "Tell me about the seller"
      ];
    }

    return suggestions;
  }

  /**
   * Analyze listing and provide bidding advice
   */
  async analyzeListing(listingId: string): Promise<string> {
    try {
      // Fetch listing details
      const { data: listing, error } = await supabase
        .from('listings')
        .select(`
          *,
          seller:profiles!listings_seller_id_fkey(username, rating, total_reviews),
          bids:bids(count)
        `)
        .eq('id', listingId)
        .single();

      if (error) throw error;

      const prompt = `Analyze this auction listing and provide strategic bidding advice:

Item: ${listing.title}
Current bid: $${listing.current_bid}
Starting bid: $${listing.starting_bid}
Buy now: ${listing.buy_now_price ? '$' + listing.buy_now_price : 'Not available'}
Condition: ${listing.condition}
Time remaining: ${this.getTimeRemaining(listing.end_time)}
Number of bids: ${listing.bids?.[0]?.count || 0}
Seller rating: ${listing.seller.rating}/5 (${listing.seller.total_reviews} reviews)

Provide:
1. Is this a good deal?
2. Recommended max bid
3. Best timing strategy (bid now vs wait)
4. Any red flags or concerns
5. Overall recommendation (bid, skip, or watch)`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert auction strategist. Provide practical, actionable bidding advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 400
      });

      return response.choices[0].message.content || 'Unable to analyze listing.';
    } catch (error) {
      console.error('Error analyzing listing:', error);
      throw new Error('Failed to analyze listing.');
    }
  }

  /**
   * Generate trade offer message
   */
  async generateTradeOffer(params: {
    yourItem: string;
    theirItem: string;
    yourValue: number;
    theirValue: number;
    additionalCash?: number;
  }): Promise<string> {
    const { yourItem, theirItem, yourValue, theirValue, additionalCash } = params;

    const prompt = `Write a friendly, professional trade offer message:

I'm offering: ${yourItem} (valued at $${yourValue})
For their: ${theirItem} (valued at $${theirValue})
${additionalCash ? `Plus $${additionalCash} cash` : ''}

Make it:
- Friendly and respectful
- Clearly state the trade terms
- Mention meeting at a safe location (police station, mall, etc.)
- Include a call-to-action
- Professional but conversational

Keep it under 150 words.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 200
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Get market insights for a category
   */
  async getMarketInsights(category: string): Promise<string> {
    try {
      // Fetch recent sales data
      const { data: recentSales } = await supabase
        .from('listings')
        .select('title, current_bid, created_at, end_time')
        .eq('status', 'completed')
        .ilike('title', `%${category}%`)
        .order('end_time', { ascending: false })
        .limit(10);

      const prompt = `Provide market insights for "${category}" items on a local auction platform:

Recent sales data: ${JSON.stringify(recentSales)}

Provide:
1. Current demand (hot, warm, or cool)
2. Average price range
3. Best time to list (day/time)
4. Tips for sellers
5. Tips for buyers

Keep it concise and actionable.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300
      });

      return response.choices[0].message.content || 'No insights available.';
    } catch (error) {
      console.error('Error getting market insights:', error);
      throw new Error('Failed to get market insights.');
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(conversationId: string = 'default'): void {
    this.conversationHistory.delete(conversationId);
  }

  /**
   * Get conversation history
   */
  getHistory(conversationId: string = 'default'): ChatMessage[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Check if BidBot is configured
   */
  isConfigured(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY;
  }

  /**
   * Helper: Calculate time remaining
   */
  private getTimeRemaining(endTime: string): string {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff < 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
}

export const bidBot = BidBotService.getInstance();
