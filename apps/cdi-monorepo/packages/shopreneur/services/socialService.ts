/**
 * Social Media Service
 * Handles Facebook and Instagram OAuth and posting
 */

export interface SocialConnection {
  platform: 'facebook' | 'instagram';
  isConnected: boolean;
  accessToken?: string;
  userId?: string;
  userName?: string;
  profileUrl?: string;
  pageId?: string; // For Facebook Pages
  igBusinessAccountId?: string; // For Instagram Business
  connectedAt?: string;
  expiresAt?: string;
}

export const socialService = {
  /**
   * Initiate Facebook OAuth flow
   */
  connectFacebook(): void {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    window.location.href = `${apiUrl}/auth/facebook`;
  },

  /**
   * Initiate Instagram OAuth flow
   */
  connectInstagram(): void {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    window.location.href = `${apiUrl}/auth/instagram`;
  },

  /**
   * Get user's social connections from database
   */
  async getConnections(userId: string): Promise<SocialConnection[]> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/social/connections/${userId}`
      );
      
      if (!response.ok) {
        return [];
      }
      
      return response.json();
    } catch (error) {
      console.error('Failed to get connections:', error);
      return [];
    }
  },

  /**
   * Disconnect a social account
   */
  async disconnect(userId: string, platform: 'facebook' | 'instagram'): Promise<void> {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/social/disconnect`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, platform })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to disconnect account');
    }
  },

  /**
   * Post to Facebook
   */
  async postToFacebook(params: {
    userId: string;
    message: string;
    imageUrl?: string;
    link?: string;
  }): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/social/facebook/post`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }

      const data = await response.json();
      return {
        success: true,
        postId: data.postId,
        postUrl: data.postUrl
      };
    } catch (error: any) {
      console.error('Facebook post error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Post to Instagram
   */
  async postToInstagram(params: {
    userId: string;
    caption: string;
    imageUrl: string;
  }): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/social/instagram/post`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }

      const data = await response.json();
      return {
        success: true,
        postId: data.postId,
        postUrl: data.postUrl
      };
    } catch (error: any) {
      console.error('Instagram post error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Upload media to temporary storage for social posting
   */
  async uploadMedia(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/upload/media`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload media');
    }

    const data = await response.json();
    return data.url;
  },

  /**
   * Get Facebook Page insights
   */
  async getFacebookInsights(userId: string, pageId: string): Promise<any> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/social/facebook/insights/${pageId}?userId=${userId}`
      );

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Failed to get Facebook insights:', error);
      return null;
    }
  },

  /**
   * Get Instagram insights
   */
  async getInstagramInsights(userId: string, igAccountId: string): Promise<any> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/social/instagram/insights/${igAccountId}?userId=${userId}`
      );

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Failed to get Instagram insights:', error);
      return null;
    }
  },

  /**
   * Check if access token is expired
   */
  isTokenExpired(expiresAt?: string): boolean {
    if (!expiresAt) return true;
    return new Date(expiresAt) < new Date();
  },

  /**
   * Refresh access token
   */
  async refreshToken(userId: string, platform: 'facebook' | 'instagram'): Promise<boolean> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/social/refresh-token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, platform })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  },

  /**
   * Handle OAuth callback (called from redirect)
   */
  async handleOAuthCallback(platform: 'facebook' | 'instagram'): Promise<{
    success: boolean;
    message: string;
  }> {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success) {
      return {
        success: true,
        message: `Successfully connected to ${platform}!`
      };
    }

    if (error) {
      return {
        success: false,
        message: `Failed to connect to ${platform}: ${error}`
      };
    }

    return {
      success: false,
      message: 'Unknown error occurred'
    };
  }
};
