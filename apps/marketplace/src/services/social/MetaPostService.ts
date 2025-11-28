// MetaPostService - Handles posting to Facebook Pages and Instagram Business Accounts
// Uses stored OAuth tokens from social_connections table

import { supabase } from '../../lib/supabase';

interface PostContent {
  caption: string;
  imageUrl: string;
  listingId?: string;
}

interface MetaConnection {
  id: string;
  access_token: string;
  token_expires_at: string;
  metadata: {
    facebook_pages?: Array<{
      id: string;
      name: string;
      access_token: string;
    }>;
    instagram_accounts?: Array<{
      id: string;
      username: string;
      page_id: string;
      page_access_token: string;
    }>;
  };
}

interface PostResult {
  success: boolean;
  platform: 'facebook' | 'instagram';
  postId?: string;
  postUrl?: string;
  error?: string;
}

export class MetaPostService {
  private static instance: MetaPostService;

  private constructor() {}

  static getInstance(): MetaPostService {
    if (!this.instance) {
      this.instance = new MetaPostService();
    }
    return this.instance;
  }

  /**
   * Get user's Meta connection
   */
  async getMetaConnection(profileId: string): Promise<MetaConnection | null> {
    const { data, error } = await supabase
      .from('social_connections')
      .select('*')
      .eq('profile_id', profileId)
      .eq('platform', 'meta')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('Failed to get Meta connection:', error);
      return null;
    }

    // Check if token is expired
    const expiresAt = new Date(data.token_expires_at);
    if (expiresAt <= new Date()) {
      console.error('Meta token expired');
      // TODO: Implement token refresh
      return null;
    }

    return data as MetaConnection;
  }

  /**
   * Post to Facebook Page
   */
  async postToFacebook(
    connection: MetaConnection,
    content: PostContent,
    pageIndex: number = 0
  ): Promise<PostResult> {
    try {
      const pages = connection.metadata.facebook_pages || [];
      
      if (pages.length === 0) {
        return {
          success: false,
          platform: 'facebook',
          error: 'No Facebook Pages connected'
        };
      }

      const page = pages[pageIndex];
      if (!page) {
        return {
          success: false,
          platform: 'facebook',
          error: 'Invalid page index'
        };
      }

      // Upload photo to Facebook
      const photoUploadUrl = `https://graph.facebook.com/v18.0/${page.id}/photos`;
      const photoFormData = new URLSearchParams({
        url: content.imageUrl,
        caption: content.caption,
        access_token: page.access_token,
        published: 'true'
      });

      const photoResponse = await fetch(photoUploadUrl, {
        method: 'POST',
        body: photoFormData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!photoResponse.ok) {
        const error = await photoResponse.json();
        throw new Error(error.error?.message || 'Failed to post to Facebook');
      }

      const photoData = await photoResponse.json();
      const postId = photoData.id;
      const postUrl = `https://www.facebook.com/${postId}`;

      // Save post record
      if (content.listingId) {
        await this.savePostRecord({
          listingId: content.listingId,
          socialConnectionId: connection.id,
          platform: 'facebook',
          platformPostId: postId,
          postUrl: postUrl,
          caption: content.caption,
          mediaUrls: [content.imageUrl]
        });
      }

      return {
        success: true,
        platform: 'facebook',
        postId: postId,
        postUrl: postUrl
      };

    } catch (error: any) {
      console.error('Facebook posting error:', error);
      return {
        success: false,
        platform: 'facebook',
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Post to Instagram Business Account
   */
  async postToInstagram(
    connection: MetaConnection,
    content: PostContent,
    accountIndex: number = 0
  ): Promise<PostResult> {
    try {
      const accounts = connection.metadata.instagram_accounts || [];
      
      if (accounts.length === 0) {
        return {
          success: false,
          platform: 'instagram',
          error: 'No Instagram Business Accounts connected'
        };
      }

      const account = accounts[accountIndex];
      if (!account) {
        return {
          success: false,
          platform: 'instagram',
          error: 'Invalid account index'
        };
      }

      // Step 1: Create media container
      const containerUrl = `https://graph.facebook.com/v18.0/${account.id}/media`;
      const containerFormData = new URLSearchParams({
        image_url: content.imageUrl,
        caption: content.caption,
        access_token: account.page_access_token
      });

      const containerResponse = await fetch(containerUrl, {
        method: 'POST',
        body: containerFormData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!containerResponse.ok) {
        const error = await containerResponse.json();
        throw new Error(error.error?.message || 'Failed to create Instagram container');
      }

      const containerData = await containerResponse.json();
      const containerId = containerData.id;

      // Step 2: Publish the container
      const publishUrl = `https://graph.facebook.com/v18.0/${account.id}/media_publish`;
      const publishFormData = new URLSearchParams({
        creation_id: containerId,
        access_token: account.page_access_token
      });

      const publishResponse = await fetch(publishUrl, {
        method: 'POST',
        body: publishFormData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!publishResponse.ok) {
        const error = await publishResponse.json();
        throw new Error(error.error?.message || 'Failed to publish to Instagram');
      }

      const publishData = await publishResponse.json();
      const postId = publishData.id;
      const postUrl = `https://www.instagram.com/p/${postId}`;

      // Save post record
      if (content.listingId) {
        await this.savePostRecord({
          listingId: content.listingId,
          socialConnectionId: connection.id,
          platform: 'instagram',
          platformPostId: postId,
          postUrl: postUrl,
          caption: content.caption,
          mediaUrls: [content.imageUrl]
        });
      }

      return {
        success: true,
        platform: 'instagram',
        postId: postId,
        postUrl: postUrl
      };

    } catch (error: any) {
      console.error('Instagram posting error:', error);
      return {
        success: false,
        platform: 'instagram',
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Post to both Facebook and Instagram
   */
  async postToBoth(
    profileId: string,
    content: PostContent
  ): Promise<{ facebook: PostResult; instagram: PostResult }> {
    const connection = await this.getMetaConnection(profileId);

    if (!connection) {
      const errorResult: PostResult = {
        success: false,
        platform: 'facebook',
        error: 'No active Meta connection found'
      };
      return {
        facebook: errorResult,
        instagram: { ...errorResult, platform: 'instagram' }
      };
    }

    // Post to both platforms in parallel
    const [facebookResult, instagramResult] = await Promise.all([
      this.postToFacebook(connection, content),
      this.postToInstagram(connection, content)
    ]);

    return {
      facebook: facebookResult,
      instagram: instagramResult
    };
  }

  /**
   * Save post record to database
   */
  private async savePostRecord(record: {
    listingId: string;
    socialConnectionId: string;
    platform: string;
    platformPostId: string;
    postUrl: string;
    caption: string;
    mediaUrls: string[];
  }) {
    const { error } = await supabase
      .from('product_social_posts')
      .insert({
        listing_id: record.listingId,
        social_connection_id: record.socialConnectionId,
        platform: record.platform,
        platform_post_id: record.platformPostId,
        post_url: record.postUrl,
        caption: record.caption,
        media_urls: record.mediaUrls,
        status: 'published'
      });

    if (error) {
      console.error('Failed to save post record:', error);
    }
  }

  /**
   * Get posting history for a listing
   */
  async getPostHistory(listingId: string) {
    const { data, error } = await supabase
      .from('product_social_posts')
      .select('*')
      .eq('listing_id', listingId)
      .order('posted_at', { ascending: false });

    if (error) {
      console.error('Failed to get post history:', error);
      return [];
    }

    return data || [];
  }
}

export default MetaPostService;
