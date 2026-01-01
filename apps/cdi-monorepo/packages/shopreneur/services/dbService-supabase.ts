import { supabase } from './supabase';
import { Product, ShopSettings, Message, UserProfile } from '../types';

export const dbService = {
  // --- Products ---
  subscribeToProducts: (callback: (products: Product[]) => void) => {
    // Initial fetch
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching products:', error);
          return;
        }
        callback(data || []);
      });

    // Subscribe to realtime changes
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        async () => {
          // Refetch all products when any change occurs
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (!error && data) {
            callback(data);
          }
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },

  saveProduct: async (product: Partial<Product>) => {
    if (product.id) {
      // Update existing product
      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          price: product.price,
          cost_price: product.costPrice,
          category: product.category,
          description: product.description,
          image_url: product.imageUrl,
          additional_images: product.additionalImages,
          video_url: product.videoUrl,
          affiliate_link: product.affiliateLink,
          platform: product.platform,
          asin: product.asin,
          affiliate_tag: product.affiliateTag,
          is_wishlist: product.isWishlist,
          is_received: product.isReceived,
          stock_count: product.stockCount,
        })
        .eq('id', product.id);

      if (error) throw error;
    } else {
      // Insert new product
      const { error } = await supabase.from('products').insert([
        {
          name: product.name,
          price: product.price,
          cost_price: product.costPrice,
          category: product.category,
          description: product.description,
          image_url: product.imageUrl,
          additional_images: product.additionalImages,
          video_url: product.videoUrl,
          affiliate_link: product.affiliateLink,
          platform: product.platform,
          asin: product.asin,
          affiliate_tag: product.affiliateTag,
          is_wishlist: product.isWishlist,
          is_received: product.isReceived,
          stock_count: product.stockCount,
        },
      ]);

      if (error) throw error;
    }
  },

  deleteProduct: async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
  },

  // --- Shop Settings ---
  subscribeToSettings: (callback: (settings: ShopSettings) => void) => {
    // Initial fetch - get first settings row
    supabase
      .from('shop_settings')
      .select('*')
      .limit(1)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching settings:', error);
          return;
        }
        if (data) {
          callback({
            storeName: data.store_name,
            adminEmail: data.admin_email,
            tagline: data.tagline,
            heroHeadline: data.hero_headline,
            heroSubtext: data.hero_subtext,
            primaryColor: data.primary_color,
            secondaryColor: data.secondary_color,
            backgroundColor: data.background_color,
            fontHeading: data.font_heading,
            fontBody: data.font_body,
            amazonAffiliateTag: data.amazon_affiliate_tag,
            amazonStoreId: data.amazon_store_id,
            amazonStorefrontUrl: data.amazon_storefront_url,
            logoUrl: data.logo_url,
            backgroundImageUrl: data.background_image_url,
            customCss: data.custom_css,
            socialHandles: data.social_handles,
          });
        }
      });

    // Subscribe to realtime changes
    const channel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shop_settings' },
        async () => {
          const { data, error } = await supabase
            .from('shop_settings')
            .select('*')
            .limit(1)
            .single();

          if (!error && data) {
            callback({
              storeName: data.store_name,
              adminEmail: data.admin_email,
              tagline: data.tagline,
              heroHeadline: data.hero_headline,
              heroSubtext: data.hero_subtext,
              primaryColor: data.primary_color,
              secondaryColor: data.secondary_color,
              backgroundColor: data.background_color,
              fontHeading: data.font_heading,
              fontBody: data.font_body,
              amazonAffiliateTag: data.amazon_affiliate_tag,
              amazonStoreId: data.amazon_store_id,
              amazonStorefrontUrl: data.amazon_storefront_url,
              logoUrl: data.logo_url,
              backgroundImageUrl: data.background_image_url,
              customCss: data.custom_css,
              socialHandles: data.social_handles,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  updateSettings: async (settings: ShopSettings) => {
    // Get the first settings row ID
    const { data: existingSettings } = await supabase
      .from('shop_settings')
      .select('id')
      .limit(1)
      .single();

    if (!existingSettings) {
      throw new Error('No settings found');
    }

    const { error } = await supabase
      .from('shop_settings')
      .update({
        store_name: settings.storeName,
        admin_email: settings.adminEmail,
        tagline: settings.tagline,
        hero_headline: settings.heroHeadline,
        hero_subtext: settings.heroSubtext,
        primary_color: settings.primaryColor,
        secondary_color: settings.secondaryColor,
        background_color: settings.backgroundColor,
        font_heading: settings.fontHeading,
        font_body: settings.fontBody,
        amazon_affiliate_tag: settings.amazonAffiliateTag,
        amazon_store_id: settings.amazonStoreId,
        amazon_storefront_url: settings.amazonStorefrontUrl,
        logo_url: settings.logoUrl,
        background_image_url: settings.backgroundImageUrl,
        custom_css: settings.customCss,
        social_handles: settings.socialHandles,
      })
      .eq('id', existingSettings.id);

    if (error) throw error;
  },

  // --- Messaging ---
  subscribeToMessages: (callback: (messages: Message[]) => void) => {
    // Initial fetch
    supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }
        if (data) {
          callback(
            data.map((msg) => ({
              id: msg.id,
              senderId: msg.sender_id,
              recipientId: msg.recipient_id,
              text: msg.text,
              timestamp: msg.timestamp,
            }))
          );
        }
      });

    // Subscribe to realtime changes
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async () => {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('timestamp', { ascending: true });

          if (!error && data) {
            callback(
              data.map((msg) => ({
                id: msg.id,
                senderId: msg.sender_id,
                recipientId: msg.recipient_id,
                text: msg.text,
                timestamp: msg.timestamp,
              }))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  sendMessage: async (message: Omit<Message, 'id'>) => {
    const { error } = await supabase.from('messages').insert([
      {
        sender_id: message.senderId,
        recipient_id: message.recipientId,
        text: message.text,
        timestamp: Date.now(),
      },
    ]);

    if (error) throw error;
  },

  deleteMessage: async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  },
};
