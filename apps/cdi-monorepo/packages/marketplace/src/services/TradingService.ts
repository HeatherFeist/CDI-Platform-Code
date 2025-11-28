import { supabase } from '../lib/supabase';
import { 
  TradeProposal, 
  TradeMessage, 
  TradeMatch, 
  TradeWishlist,
  CreateTradeProposal,
  TradeProposalFilters,
  TradeBalance,
  TradeStatus,
  TradeMessageType
} from '../types/trading';

export class TradingService {
  private static instance: TradingService;

  static getInstance(): TradingService {
    if (!TradingService.instance) {
      TradingService.instance = new TradingService();
    }
    return TradingService.instance;
  }

  // Create a new trade proposal
  async createTradeProposal(proposal: CreateTradeProposal): Promise<TradeProposal | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Create the trade proposal
      const { data: tradeData, error: tradeError } = await supabase
        .from('trade_proposals')
        .insert([{
          proposer_id: user.user.id,
          recipient_id: proposal.recipient_id,
          message: proposal.message,
          proposed_cash_amount: proposal.proposed_cash_amount || 0,
          status: 'pending'
        }])
        .select()
        .single();

      if (tradeError) throw tradeError;

      // Add offered items (proposer's items)
      if (proposal.offered_listing_ids.length > 0) {
        const offeredItems = proposal.offered_listing_ids.map(listingId => ({
          trade_proposal_id: tradeData.id,
          listing_id: listingId,
          offered_by: user.user.id,
          item_condition_notes: proposal.item_notes?.[listingId],
          estimated_value: proposal.estimated_values?.[listingId]
        }));

        const { error: offeredItemsError } = await supabase
          .from('trade_items')
          .insert(offeredItems);

        if (offeredItemsError) throw offeredItemsError;
      }

      // Add desired items (recipient's items)
      if (proposal.desired_listing_ids.length > 0) {
        const desiredItems = proposal.desired_listing_ids.map(listingId => ({
          trade_proposal_id: tradeData.id,
          listing_id: listingId,
          offered_by: proposal.recipient_id,
          estimated_value: proposal.estimated_values?.[listingId]
        }));

        const { error: desiredItemsError } = await supabase
          .from('trade_items')
          .insert(desiredItems);

        if (desiredItemsError) throw desiredItemsError;
      }

      // Send initial message if provided
      if (proposal.message) {
        await this.sendTradeMessage(tradeData.id, proposal.message, 'message');
      }

      return await this.getTradeProposal(tradeData.id);
    } catch (error) {
      console.error('Error creating trade proposal:', error);
      throw error;
    }
  }

  // Get a single trade proposal with all details
  async getTradeProposal(tradeId: string): Promise<TradeProposal | null> {
    try {
      const { data, error } = await supabase
        .from('trade_proposals')
        .select(`
          *,
          proposer:profiles!trade_proposals_proposer_id_fkey(id, username, avatar_url, rating),
          recipient:profiles!trade_proposals_recipient_id_fkey(id, username, avatar_url, rating),
          trade_items(
            *,
            listing:listings(
              *,
              seller:profiles!listings_seller_id_fkey(id, username),
              category:categories(id, name, icon)
            )
          ),
          trade_messages(
            *,
            sender:profiles!trade_messages_sender_id_fkey(id, username, avatar_url)
          )
        `)
        .eq('id', tradeId)
        .single();

      if (error) throw error;

      // Calculate trade balance
      const balance = await this.calculateTradeBalance(tradeId);
      
      return { ...data, trade_balance: balance };
    } catch (error) {
      console.error('Error fetching trade proposal:', error);
      return null;
    }
  }

  // Get user's sent trade proposals
  async getUserSentProposals(userId: string): Promise<TradeProposal[]> {
    const { data, error } = await supabase
      .from('trade_proposals')
      .select('*')
      .eq('proposer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get user's received trade proposals
  async getUserReceivedProposals(userId: string): Promise<TradeProposal[]> {
    const { data, error } = await supabase
      .from('trade_proposals')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Update proposal status
  async updateProposalStatus(proposalId: string, status: TradeStatus): Promise<void> {
    const { error } = await supabase
      .from('trade_proposals')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    if (error) throw error;
  }

  // Get user's trade proposals with filters
  async getUserTradeProposals(
    userId: string, 
    filters: TradeProposalFilters = {}
  ): Promise<TradeProposal[]> {
    try {
      let query = supabase
        .from('trade_proposals')
        .select(`
          *,
          proposer:profiles!trade_proposals_proposer_id_fkey(id, username, avatar_url, rating),
          recipient:profiles!trade_proposals_recipient_id_fkey(id, username, avatar_url, rating),
          trade_items(
            *,
            listing:listings(
              *,
              category:categories(id, name, icon)
            )
          )
        `);

      // Apply user filter
      if (filters.user_type === 'proposer') {
        query = query.eq('proposer_id', userId);
      } else if (filters.user_type === 'recipient') {
        query = query.eq('recipient_id', userId);
      } else {
        query = query.or(`proposer_id.eq.${userId},recipient_id.eq.${userId}`);
      }

      // Apply status filter
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      // Apply date range filter
      if (filters.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate balances for each trade
      const tradesWithBalance = await Promise.all(
        data.map(async (trade) => {
          const balance = await this.calculateTradeBalance(trade.id);
          return { ...trade, trade_balance: balance };
        })
      );

      return tradesWithBalance;
    } catch (error) {
      console.error('Error fetching user trade proposals:', error);
      return [];
    }
  }

  // Send a message in a trade
  async sendTradeMessage(
    tradeId: string, 
    message: string, 
    messageType: TradeMessageType = 'message',
    cashAdjustment: number = 0
  ): Promise<TradeMessage | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('trade_messages')
        .insert([{
          trade_proposal_id: tradeId,
          sender_id: user.user.id,
          message,
          message_type: messageType,
          proposed_cash_adjustment: cashAdjustment
        }])
        .select(`
          *,
          sender:profiles!trade_messages_sender_id_fkey(id, username, avatar_url)
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error sending trade message:', error);
      return null;
    }
  }

  // Accept a trade proposal
  async acceptTradeProposal(tradeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trade_proposals')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) throw error;

      // Send acceptance message
      await this.sendTradeMessage(tradeId, 'Trade proposal accepted!', 'acceptance');

      return true;
    } catch (error) {
      console.error('Error accepting trade proposal:', error);
      return false;
    }
  }

  // Decline a trade proposal
  async declineTradeProposal(tradeId: string, reason?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trade_proposals')
        .update({ 
          status: 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) throw error;

      // Send decline message
      const message = reason ? `Trade declined: ${reason}` : 'Trade proposal declined.';
      await this.sendTradeMessage(tradeId, message, 'decline');

      return true;
    } catch (error) {
      console.error('Error declining trade proposal:', error);
      return false;
    }
  }

  // Cancel a trade proposal
  async cancelTradeProposal(tradeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trade_proposals')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error cancelling trade proposal:', error);
      return false;
    }
  }

  // Mark trade as completed
  async completeTradeProposal(tradeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trade_proposals')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) throw error;

      // Update listing statuses to 'sold' for traded items
      const { data: tradeItems } = await supabase
        .from('trade_items')
        .select('listing_id')
        .eq('trade_proposal_id', tradeId);

      if (tradeItems) {
        const listingIds = tradeItems.map(item => item.listing_id);
        await supabase
          .from('listings')
          .update({ status: 'sold' })
          .in('id', listingIds);
      }

      return true;
    } catch (error) {
      console.error('Error completing trade proposal:', error);
      return false;
    }
  }

  // Calculate trade balance
  async calculateTradeBalance(tradeId: string): Promise<TradeBalance> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_trade_balance', { trade_id: tradeId });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error calculating trade balance:', error);
      return {
        proposer_value: 0,
        recipient_value: 0,
        cash_component: 0,
        proposer_total: 0,
        recipient_total: 0,
        balance_difference: 0,
        is_balanced: false
      };
    }
  }

  // Find potential trade matches for a listing
  async findTradeMatches(listingId: string): Promise<TradeMatch[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('find_trade_matches', { 
          user_id: user.user.id, 
          listing_id: listingId 
        });

      if (error) throw error;

      // Get full details for matches
      const matches = await Promise.all(
        data.map(async (match: any) => {
          const { data: userListing } = await supabase
            .from('listings')
            .select('*, category:categories(id, name, icon)')
            .eq('id', listingId)
            .single();

          const { data: otherListing } = await supabase
            .from('listings')
            .select('*, category:categories(id, name, icon), seller:profiles(id, username, avatar_url, rating)')
            .eq('id', match.potential_listing_id)
            .single();

          return {
            id: `${listingId}-${match.potential_listing_id}`,
            user1_id: user.user.id,
            user2_id: match.potential_user_id,
            user1_listing_id: listingId,
            user2_listing_id: match.potential_listing_id,
            compatibility_score: match.compatibility_score,
            match_reasons: match.match_reasons.filter((r: string) => r !== null),
            is_viewed_by_user1: false,
            is_viewed_by_user2: false,
            created_at: new Date().toISOString(),
            user1_listing: userListing,
            user2_listing: otherListing,
            user2: otherListing?.seller
          };
        })
      );

      return matches;
    } catch (error) {
      console.error('Error finding trade matches:', error);
      return [];
    }
  }

  // Add item to trade wishlist
  async addToWishlist(
    categoryId: string | null,
    description: string,
    maxValue?: number
  ): Promise<TradeWishlist | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('trade_wishlists')
        .insert([{
          user_id: user.user.id,
          category_id: categoryId,
          desired_item_description: description,
          max_value: maxValue
        }])
        .select(`
          *,
          category:categories(id, name, icon)
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return null;
    }
  }

  // Get user's trade wishlist
  async getWishlist(userId: string): Promise<TradeWishlist[]> {
    try {
      const { data, error } = await supabase
        .from('trade_wishlists')
        .select(`
          *,
          category:categories(id, name, icon)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  }

  // Mark trade messages as read
  async markMessagesAsRead(tradeId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trade_messages')
        .update({ is_read: true })
        .eq('trade_proposal_id', tradeId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  // Get unread message count for user
  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      // Get trade proposal IDs for the user first
      const { data: tradeIds, error: tradeError } = await supabase
        .from('trade_proposals')
        .select('id')
        .or(`proposer_id.eq.${userId},recipient_id.eq.${userId}`);

      if (tradeError) throw tradeError;
      
      const tradeIdList = tradeIds?.map(t => t.id) || [];
      
      const { count, error } = await supabase
        .from('trade_messages')
        .select('*', { count: 'exact', head: true })
        .neq('sender_id', userId)
        .eq('is_read', false)
        .in('trade_proposal_id', tradeIdList);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }
}