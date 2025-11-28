import { supabase } from '../lib/supabase';
import { 
  FacebookProfile, 
  FacebookLoginResponse, 
  FacebookShareData, 
  FacebookMarketplacePost,
  FacebookPagePost,
  FacebookIntegrationSettings,
  FacebookShareResult,
  FacebookAPIError,
  FACEBOOK_MARKETPLACE_CATEGORIES,
  FacebookMarketplaceCategory
} from '../types/facebook';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export class FacebookService {
  private static instance: FacebookService;
  private isInitialized = false;
  private appId: string;

  private constructor() {
    this.appId = import.meta.env.VITE_FACEBOOK_APP_ID || '';
  }

  static getInstance(): FacebookService {
    if (!FacebookService.instance) {
      FacebookService.instance = new FacebookService();
    }
    return FacebookService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || !this.appId) {
      return;
    }

    return new Promise((resolve) => {
      // Load Facebook SDK
      window.fbAsyncInit = () => {
        window.FB.init({
          appId: this.appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        
        this.isInitialized = true;
        resolve();
      };

      // Load the SDK asynchronously
      if (!document.getElementById('facebook-jssdk')) {
        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        document.head.appendChild(script);
      }
    });
  }

  async login(): Promise<FacebookLoginResponse> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      window.FB.login((response: FacebookLoginResponse) => {
        if (response.status === 'connected') {
          resolve(response);
        } else {
          reject(new Error('Facebook login failed'));
        }
      }, {
        scope: 'public_profile,email,pages_manage_posts,user_posts',
        return_scopes: true
      });
    });
  }

  async logout(): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve) => {
      window.FB.logout(() => {
        resolve();
      });
    });
  }

  async getProfile(accessToken: string): Promise<FacebookProfile> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      window.FB.api('/me', { 
        fields: 'id,name,email,picture,first_name,last_name',
        access_token: accessToken 
      }, (response: FacebookProfile | FacebookAPIError) => {
        if ('error' in response) {
          reject(new Error(response.error.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  async getUserPages(accessToken: string): Promise<any[]> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      window.FB.api('/me/accounts', { 
        access_token: accessToken 
      }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.data || []);
        }
      });
    });
  }

  async getUserGroups(accessToken: string): Promise<any[]> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      window.FB.api('/me/groups', { 
        access_token: accessToken 
      }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.data || []);
        }
      });
    });
  }

  async shareToTimeline(
    shareData: FacebookShareData, 
    accessToken: string
  ): Promise<FacebookShareResult> {
    await this.initialize();
    
    const postData: FacebookPagePost = {
      message: this.formatTimelineMessage(shareData),
      link: shareData.link,
      picture: shareData.image_url,
      name: shareData.title,
      description: shareData.description
    };

    return new Promise((resolve) => {
      window.FB.api('/me/feed', 'POST', {
        ...postData,
        access_token: accessToken
      }, (response: any) => {
        if (response.error) {
          resolve({
            success: false,
            error: response.error.message,
            platform: 'timeline'
          });
        } else {
          resolve({
            success: true,
            post_id: response.id,
            platform: 'timeline'
          });
        }
      });
    });
  }

  async shareToMarketplace(
    shareData: FacebookShareData,
    marketplaceData: FacebookMarketplacePost,
    accessToken: string
  ): Promise<FacebookShareResult> {
    // Note: Facebook Marketplace posting via API requires special permissions
    // and is typically limited to business accounts
    console.warn('Facebook Marketplace API posting requires special permissions');
    
    return {
      success: false,
      error: 'Marketplace posting requires business verification',
      platform: 'marketplace'
    };
  }

  async shareToGroup(
    shareData: FacebookShareData,
    groupId: string,
    accessToken: string
  ): Promise<FacebookShareResult> {
    await this.initialize();
    
    const postData = {
      message: this.formatGroupMessage(shareData),
      link: shareData.link,
      access_token: accessToken
    };

    return new Promise((resolve) => {
      window.FB.api(`/${groupId}/feed`, 'POST', postData, (response: any) => {
        if (response.error) {
          resolve({
            success: false,
            error: response.error.message,
            platform: 'group'
          });
        } else {
          resolve({
            success: true,
            post_id: response.id,
            platform: 'group'
          });
        }
      });
    });
  }

  async shareToPage(
    shareData: FacebookShareData,
    pageId: string,
    pageAccessToken: string
  ): Promise<FacebookShareResult> {
    await this.initialize();
    
    const postData: FacebookPagePost = {
      message: this.formatPageMessage(shareData),
      link: shareData.link,
      picture: shareData.image_url,
      name: shareData.title,
      description: shareData.description
    };

    return new Promise((resolve) => {
      window.FB.api(`/${pageId}/feed`, 'POST', {
        ...postData,
        access_token: pageAccessToken
      }, (response: any) => {
        if (response.error) {
          resolve({
            success: false,
            error: response.error.message,
            platform: 'page'
          });
        } else {
          resolve({
            success: true,
            post_id: response.id,
            platform: 'page'
          });
        }
      });
    });
  }

  private formatTimelineMessage(shareData: FacebookShareData): string {
    switch (shareData.type) {
      case 'auction':
        return `🏆 Check out this ${shareData.title}! ${shareData.description} ${shareData.price ? `Starting at $${shareData.price}` : ''} ${shareData.ends_at ? `Ends ${new Date(shareData.ends_at).toLocaleDateString()}` : ''} #auction #deals`;
      
      case 'trade':
        return `🔄 Looking to trade my ${shareData.title}! ${shareData.description} ${shareData.location ? `Located in ${shareData.location}` : ''} #trade #exchange`;
      
      case 'achievement':
        return `🎉 ${shareData.title}! ${shareData.description} #achievement #milestone`;
      
      default:
        return `${shareData.title} - ${shareData.description}`;
    }
  }

  private formatGroupMessage(shareData: FacebookShareData): string {
    switch (shareData.type) {
      case 'auction':
        return `${shareData.title}\n\n${shareData.description}\n\n${shareData.price ? `Starting bid: $${shareData.price}` : ''}${shareData.ends_at ? `\nEnds: ${new Date(shareData.ends_at).toLocaleDateString()}` : ''}\n\nCheck it out here:`;
      
      case 'trade':
        return `Trade: ${shareData.title}\n\n${shareData.description}\n\n${shareData.location ? `Location: ${shareData.location}` : ''}\n\nInterested?`;
      
      default:
        return `${shareData.title}\n\n${shareData.description}`;
    }
  }

  private formatPageMessage(shareData: FacebookShareData): string {
    return this.formatTimelineMessage(shareData);
  }

  // Database operations for Facebook integration settings
  async saveFacebookIntegration(
    userId: string, 
    facebookData: Partial<FacebookIntegrationSettings>
  ): Promise<void> {
    const { error } = await supabase
      .from('facebook_integrations')
      .upsert({
        user_id: userId,
        ...facebookData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      throw new Error(`Failed to save Facebook integration: ${error.message}`);
    }
  }

  async getFacebookIntegration(userId: string): Promise<FacebookIntegrationSettings | null> {
    const { data, error } = await supabase
      .from('facebook_integrations')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get Facebook integration: ${error.message}`);
    }

    return data || null;
  }

  async removeFacebookIntegration(userId: string): Promise<void> {
    const { error } = await supabase
      .from('facebook_integrations')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to remove Facebook integration: ${error.message}`);
    }
  }

  async logFacebookShare(
    userId: string,
    shareData: FacebookShareData,
    results: FacebookShareResult[]
  ): Promise<void> {
    const shareRecords = results.map(result => ({
      user_id: userId,
      content_type: shareData.type,
      content_title: shareData.title,
      platform: result.platform,
      post_id: result.post_id,
      success: result.success,
      error_message: result.error,
      shared_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('facebook_shares')
      .insert(shareRecords);

    if (error) {
      console.error('Failed to log Facebook shares:', error);
    }
  }

  // Auto-sharing functionality
  async autoShareAuction(auctionId: string, userId: string): Promise<void> {
    const integration = await this.getFacebookIntegration(userId);
    if (!integration?.connected || !integration.sharing_preferences.auto_share_auctions) {
      return;
    }

    // Get auction details
    const { data: auction, error } = await supabase
      .from('items')
      .select(`
        *,
        images:item_images(*),
        location:cities(name, state)
      `)
      .eq('id', auctionId)
      .single();

    if (error || !auction) {
      console.error('Failed to get auction for auto-sharing:', error);
      return;
    }

    const shareData: FacebookShareData = {
      type: 'auction',
      title: auction.title,
      description: auction.description,
      image_url: auction.images?.[0]?.image_url,
      link: `${window.location.origin}/auction/${auctionId}`,
      price: auction.starting_bid,
      location: auction.location ? `${auction.location.name}, ${auction.location.state}` : undefined,
      ends_at: auction.end_time
    };

    const results: FacebookShareResult[] = [];

    // Share to timeline if enabled
    if (integration.sharing_preferences.share_to_timeline && integration.access_token) {
      const result = await this.shareToTimeline(shareData, integration.access_token);
      results.push(result);
    }

    // Share to selected groups
    if (integration.sharing_preferences.share_to_groups && integration.groups) {
      for (const groupId of integration.sharing_preferences.selected_groups) {
        if (integration.access_token) {
          const result = await this.shareToGroup(shareData, groupId, integration.access_token);
          results.push(result);
        }
      }
    }

    // Log the sharing results
    await this.logFacebookShare(userId, shareData, results);
  }

  async autoShareTrade(tradeId: string, userId: string): Promise<void> {
    const integration = await this.getFacebookIntegration(userId);
    if (!integration?.connected || !integration.sharing_preferences.auto_share_trades) {
      return;
    }

    // Get trade details
    const { data: trade, error } = await supabase
      .from('trade_proposals')
      .select(`
        *,
        offered_items:trade_items!trade_proposals_offered_items(*),
        requested_items:trade_items!trade_proposals_requested_items(*),
        location:cities(name, state)
      `)
      .eq('id', tradeId)
      .single();

    if (error || !trade) {
      console.error('Failed to get trade for auto-sharing:', error);
      return;
    }

    const shareData: FacebookShareData = {
      type: 'trade',
      title: `Trade: ${trade.offered_items?.map((item: any) => item.title).join(', ')}`,
      description: trade.message || 'Interested in trading!',
      link: `${window.location.origin}/trade/${tradeId}`,
      location: trade.location ? `${trade.location.name}, ${trade.location.state}` : undefined
    };

    const results: FacebookShareResult[] = [];

    // Share to timeline if enabled
    if (integration.sharing_preferences.share_to_timeline && integration.access_token) {
      const result = await this.shareToTimeline(shareData, integration.access_token);
      results.push(result);
    }

    // Log the sharing results
    await this.logFacebookShare(userId, shareData, results);
  }

  // Utility function to get marketplace category
  getMarketplaceCategory(itemCategory: string): string {
    const categoryMap: Record<string, FacebookMarketplaceCategory> = {
      'electronics': 'ELECTRONICS',
      'collectibles': 'COLLECTIBLES',
      'antiques': 'ANTIQUES',
      'furniture': 'FURNITURE',
      'clothing': 'CLOTHING',
      'jewelry': 'JEWELRY',
      'art': 'ART',
      'books': 'BOOKS',
      'sports': 'SPORTS',
      'toys': 'TOYS'
    };

    const category = categoryMap[itemCategory.toLowerCase()] || 'OTHER';
    return FACEBOOK_MARKETPLACE_CATEGORIES[category];
  }
}