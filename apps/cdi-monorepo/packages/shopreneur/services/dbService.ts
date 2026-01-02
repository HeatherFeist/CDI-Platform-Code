
import { supabase } from "./supabaseClient";
import { Product, ShopSettings, Message, UserProfile } from "../types";

const mapProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  price: Number(p.price),
  costPrice: p.cost_price ? Number(p.cost_price) : 0,
  category: p.category,
  description: p.description,
  imageUrl: p.image_url,
  additionalImages: p.additional_images || [],
  videoUrl: p.video_url,
  videoReviewCompleted: p.video_review_completed || false,
  affiliateLink: p.affiliate_link,
  platform: p.platform,
  isWishlist: p.is_wishlist,
  isReceived: p.is_received,
  stockCount: p.stock_count || 0,
  isMarketplaceSynced: p.is_marketplace_synced || false,
  asin: p.asin,
  marketplaceId: p.marketplace_id
});

const mapProfile = (p: any): UserProfile => ({
  id: p.id,
  name: p.name,
  handle: p.handle,
  bio: p.bio,
  avatarUrl: p.avatar_url,
  role: p.role,
  password: p.password
});

export const dbService = {
  // --- Profiles ---
  getProfiles: async (): Promise<UserProfile[]> => {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return (data || []).map(mapProfile);
    } catch (e) {
      console.warn("DB profiles table access error, checking local storage.");
      const local = localStorage.getItem('local_profiles');
      return local ? JSON.parse(local) : [];
    }
  },

  subscribeToProfiles: (callback: (profiles: UserProfile[]) => void) => {
    supabase.from('profiles').select('*').then(({ data, error }) => {
      if (error) {
        const local = localStorage.getItem('local_profiles');
        callback(local ? JSON.parse(local) : []);
      } else {
        callback(data ? data.map(mapProfile) : []);
      }
    });

    return supabase.channel('profiles-realtime')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'profiles' }, async () => {
        const { data } = await supabase.from('profiles').select('*');
        if (data) {
          const mapped = data.map(mapProfile);
          localStorage.setItem('local_profiles', JSON.stringify(mapped));
          callback(mapped);
        }
      })
      .subscribe();
  },

  upsertProfile: async (profile: Partial<UserProfile>): Promise<UserProfile> => {
    const payload = {
      id: profile.id,
      name: profile.name,
      handle: profile.handle,
      bio: profile.bio,
      avatar_url: profile.avatarUrl,
      role: profile.role,
      password: profile.password
    };
    
    try {
      const { data, error } = await supabase.from('profiles').upsert(payload).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No data returned from upsert");
      
      const mapped = mapProfile(data[0]);
      // Sync local storage
      const local = localStorage.getItem('local_profiles');
      const profiles = local ? JSON.parse(local) : [];
      const updated = profiles.filter((p: any) => p.id !== mapped.id);
      updated.push(mapped);
      localStorage.setItem('local_profiles', JSON.stringify(updated));
      
      return mapped;
    } catch (error: any) {
      const errorDetail = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      console.error(`Upsert failed, likely missing profiles table: ${errorDetail}`);
      
      // Fallback to local state so the app doesn't break
      const mapped = {
        id: profile.id || Date.now().toString(),
        name: profile.name || '',
        handle: profile.handle || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
        role: profile.role || 'Owner',
        password: profile.password || ''
      } as UserProfile;
      
      const local = localStorage.getItem('local_profiles');
      const profiles = local ? JSON.parse(local) : [];
      const updated = profiles.filter((p: any) => p.id !== mapped.id);
      updated.push(mapped);
      localStorage.setItem('local_profiles', JSON.stringify(updated));
      
      return mapped;
    }
  },

  // --- Products ---
  subscribeToProducts: (callback: (products: Product[]) => void) => {
    supabase.from('products').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) callback(data.map(mapProduct)); });

    return supabase.channel('products-realtime')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'products' }, async () => {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (data) callback(data.map(mapProduct));
      }).subscribe();
  },

  saveProduct: async (product: Partial<Product>) => {
    const dbPayload: any = {
      name: product.name,
      price: product.price,
      cost_price: product.costPrice,
      category: product.category,
      description: product.description,
      image_url: product.imageUrl,
      additional_images: product.additionalImages,
      video_url: product.videoUrl,
      video_review_completed: product.videoReviewCompleted,
      affiliate_link: product.affiliateLink,
      platform: product.platform,
      is_wishlist: product.isWishlist,
      is_received: product.isReceived,
      stock_count: product.stockCount,
      is_marketplace_synced: product.isMarketplaceSynced,
      asin: product.asin,
      marketplace_id: product.marketplaceId,
      updated_at: new Date()
    };
    const { error } = product.id 
      ? await supabase.from('products').update(dbPayload).eq('id', product.id)
      : await supabase.from('products').insert([dbPayload]);
    if (error) console.error("Product Save Error:", error);
  },

  deleteProduct: async (productId: string) => {
    await supabase.from('products').delete().eq('id', productId);
  },

  // --- Settings ---
  subscribeToSettings: (callback: (settings: ShopSettings) => void) => {
    supabase.from('shop_settings').select('*').eq('id', 'global_settings').single()
      .then(({ data }) => { if (data) callback({
        storeName: data.store_name,
        tagline: data.tagline,
        logoUrl: data.logo_url,
        heroHeadline: data.hero_headline,
        heroSubtext: data.hero_subtext,
        primaryColor: data.primary_color,
        secondaryColor: data.secondary_color,
        backgroundColor: data.background_color,
        fontHeading: data.font_heading,
        fontBody: data.font_body,
        amazonAffiliateTag: data.amazon_affiliate_tag,
        ebayAffiliateId: data.ebay_affiliate_id,
        sheinAffiliateId: data.shein_affiliate_id
      }); });

    return supabase.channel('settings-realtime')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'shop_settings' }, async () => {
        const { data } = await supabase.from('shop_settings').select('*').eq('id', 'global_settings').single();
        if (data) callback({
          storeName: data.store_name,
          tagline: data.tagline,
          logoUrl: data.logo_url,
          heroHeadline: data.hero_headline,
          heroSubtext: data.hero_subtext,
          primaryColor: data.primary_color,
          secondaryColor: data.secondary_color,
          backgroundColor: data.background_color,
          fontHeading: data.font_heading,
          fontBody: data.font_body,
          amazonAffiliateTag: data.amazon_affiliate_tag,
          ebayAffiliateId: data.ebay_affiliate_id,
          sheinAffiliateId: data.shein_affiliate_id
        });
      }).subscribe();
  },

  updateSettings: async (settings: ShopSettings) => {
    await supabase.from('shop_settings').upsert({
      id: 'global_settings',
      store_name: settings.storeName,
      tagline: settings.tagline,
      logo_url: settings.logoUrl,
      hero_headline: settings.heroHeadline,
      hero_subtext: settings.heroSubtext,
      primary_color: settings.primaryColor,
      secondary_color: settings.secondaryColor,
      background_color: settings.backgroundColor,
      font_heading: settings.fontHeading,
      font_body: settings.fontBody,
      amazon_affiliate_tag: settings.amazonAffiliateTag,
      ebay_affiliate_id: settings.ebayAffiliateId,
      shein_affiliate_id: settings.sheinAffiliateId,
      updated_at: new Date()
    });
  },

  // --- Messages ---
  subscribeToMessages: (callback: (messages: Message[]) => void) => {
    supabase.from('messages').select('*').order('timestamp', { ascending: true })
      .then(({ data }) => { if (data) callback(data.map((m: any) => ({
        id: m.id,
        senderId: m.sender_id,
        recipientId: m.recipient_id,
        text: m.text,
        timestamp: m.timestamp
      }))); });

    return supabase.channel('messages-realtime')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'messages' }, async () => {
        const { data } = await supabase.from('messages').select('*').order('timestamp', { ascending: true });
        if (data) callback(data.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          recipientId: m.recipient_id,
          text: m.text,
          timestamp: m.timestamp
        })));
      }).subscribe();
  },

  sendMessage: async (message: Omit<Message, 'id'>) => {
    await supabase.from('messages').insert([{
      sender_id: message.senderId,
      recipient_id: message.recipientId,
      text: message.text,
      timestamp: message.timestamp
    }]);
  },

  deleteMessage: async (messageId: string) => {
    await supabase.from('messages').delete().eq('id', messageId);
  }
};
