import { supabase } from '../supabase';

export interface MerchantCoinConfig {
    id: string;
    sellerId?: string;
    projectId?: string;
    coinName: string;
    coinSymbol: string;
    brandColor: string;
    logoUrl?: string;
    businessName?: string;
    businessType: 'marketplace_seller' | 'turnkey_business' | 'crowdfunding';
    businessStatus: 'planning' | 'fundraising' | 'active' | 'suspended';
    earnRate: number;
    redemptionRate: number;
    minRedemption: number;
    maxRedemptionPct: number;
    maxRedemptionPerVisit?: number;
    coinsExpireDays: number;
    fundraisingGoal?: number;
    currentFunding?: number;
    isActive: boolean;
}

export interface CoinBalance {
    id: string;
    holderId: string;
    merchantConfigId: string;
    totalEarned: number;
    totalSpent: number;
    totalExpired: number;
    currentBalance: number;
    currentTier: 'bronze' | 'silver' | 'gold' | 'platinum';
    tierProgress: number;
    lifetimePurchases: number;
    lifetimeSpentUsd: number;
}

export interface CoinTransaction {
    id: string;
    type: 'earned' | 'spent' | 'expired' | 'bonus' | 'refund' | 'donation_reward' | 'crowdfund';
    amount: number;
    description?: string;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: string;
    expiresAt?: string;
}

export interface TierConfig {
    id: string;
    tierName: string;
    tierLevel: number;
    minCoinsEarned: number;
    minPurchases: number;
    minTotalSpent: number;
    earnMultiplier: number;
    redemptionBonusPct: number;
    exclusiveDiscounts: boolean;
    earlyAccess: boolean;
    freeShipping: boolean;
    prioritySupport: boolean;
    benefitsDescription?: string;
    badgeIcon: string;
    badgeColor: string;
}

/**
 * Create or update merchant coin configuration
 */
export async function configureMerchantCoins(config: Partial<MerchantCoinConfig>): Promise<{
    success: boolean;
    data?: MerchantCoinConfig;
    error?: string;
}> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const configData = {
            seller_id: config.sellerId || user.id,
            project_id: config.projectId || null,
            coin_name: config.coinName || 'Coins',
            coin_symbol: config.coinSymbol || '🪙',
            brand_color: config.brandColor || '#6366f1',
            logo_url: config.logoUrl,
            business_name: config.businessName,
            business_type: config.businessType || 'marketplace_seller',
            business_status: config.businessStatus || 'active',
            earn_rate: config.earnRate || 1.0,
            redemption_rate: config.redemptionRate || 0.01,
            min_redemption: config.minRedemption || 100,
            max_redemption_pct: config.maxRedemptionPct || 50.0,
            max_redemption_per_visit: config.maxRedemptionPerVisit,
            coins_expire_days: config.coinsExpireDays || 365,
            fundraising_goal: config.fundraisingGoal,
            current_funding: config.currentFunding || 0,
            is_active: config.isActive !== undefined ? config.isActive : true
        };

        const { data, error } = await supabase
            .from('merchant_coins_config')
            .upsert(configData)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data: mapConfigFromDb(data) };
    } catch (error: any) {
        console.error('Error configuring merchant coins:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get merchant coin configuration
 */
export async function getMerchantCoinConfig(merchantId: string): Promise<MerchantCoinConfig | null> {
    try {
        const { data, error } = await supabase
            .from('merchant_coins_config')
            .select('*')
            .eq('seller_id', merchantId)
            .single();

        if (error) {
            console.error('Error fetching config:', error);
            return null;
        }

        return data ? mapConfigFromDb(data) : null;
    } catch (error) {
        console.error('Error getting merchant coin config:', error);
        return null;
    }
}

/**
 * Get user's coin balance for a specific merchant
 */
export async function getUserCoinBalance(userId: string, merchantConfigId: string): Promise<CoinBalance | null> {
    try {
        const { data, error } = await supabase
            .from('merchant_coins_balances')
            .select('*')
            .eq('holder_id', userId)
            .eq('merchant_config_id', merchantConfigId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching balance:', error);
            return null;
        }

        return data ? mapBalanceFromDb(data) : null;
    } catch (error) {
        console.error('Error getting coin balance:', error);
        return null;
    }
}

/**
 * Get all coin balances for a user (their portfolio)
 */
export async function getUserCoinPortfolio(userId: string): Promise<Array<CoinBalance & { config: MerchantCoinConfig }>> {
    try {
        const { data, error } = await supabase
            .from('merchant_coins_balances')
            .select(`
                *,
                config:merchant_coins_config!merchant_coins_balances_merchant_config_id_fkey(*)
            `)
            .eq('holder_id', userId)
            .gt('current_balance', 0)
            .order('current_balance', { ascending: false });

        if (error) throw error;

        return (data || []).map(item => ({
            ...mapBalanceFromDb(item),
            config: mapConfigFromDb(item.config)
        }));
    } catch (error) {
        console.error('Error getting coin portfolio:', error);
        return [];
    }
}

/**
 * Award coins to a user (after purchase or donation)
 */
export async function awardCoins(params: {
    userId: string;
    merchantConfigId: string;
    amount: number;
    type: 'earned' | 'bonus' | 'donation_reward' | 'crowdfund';
    description?: string;
    orderId?: string;
    donationId?: string;
    expiresInDays?: number;
}): Promise<{ success: boolean; error?: string }> {
    try {
        // Get or create balance record
        let balance = await getUserCoinBalance(params.userId, params.merchantConfigId);
        
        if (!balance) {
            const { data: newBalance, error } = await supabase
                .from('merchant_coins_balances')
                .insert({
                    holder_id: params.userId,
                    merchant_config_id: params.merchantConfigId,
                    total_earned: 0,
                    current_balance: 0
                })
                .select()
                .single();

            if (error) throw error;
            balance = mapBalanceFromDb(newBalance);
        }

        const balanceBefore = balance.currentBalance;
        const balanceAfter = balanceBefore + params.amount;

        // Calculate expiration
        const expiresAt = params.expiresInDays 
            ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

        // Create transaction record
        const { error: txError } = await supabase
            .from('merchant_coins_transactions')
            .insert({
                balance_id: balance.id,
                holder_id: params.userId,
                merchant_config_id: params.merchantConfigId,
                type: params.type,
                amount: params.amount,
                order_id: params.orderId,
                donation_id: params.donationId,
                description: params.description,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                expires_at: expiresAt,
                status: 'completed'
            });

        if (txError) throw txError;

        // Update balance
        const { error: updateError } = await supabase
            .from('merchant_coins_balances')
            .update({
                total_earned: balance.totalEarned + params.amount,
                current_balance: balanceAfter,
                last_earned_at: new Date().toISOString()
            })
            .eq('id', balance.id);

        if (updateError) throw updateError;

        // Check for tier progression
        await checkTierProgression(params.userId, params.merchantConfigId);

        return { success: true };
    } catch (error: any) {
        console.error('Error awarding coins:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Redeem coins (spend them)
 */
export async function redeemCoins(params: {
    userId: string;
    merchantConfigId: string;
    amount: number;
    orderId?: string;
    description?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const balance = await getUserCoinBalance(params.userId, params.merchantConfigId);
        
        if (!balance) {
            return { success: false, error: 'No coin balance found' };
        }

        if (balance.currentBalance < params.amount) {
            return { success: false, error: 'Insufficient coin balance' };
        }

        const balanceBefore = balance.currentBalance;
        const balanceAfter = balanceBefore - params.amount;

        // Create transaction record
        const { error: txError } = await supabase
            .from('merchant_coins_transactions')
            .insert({
                balance_id: balance.id,
                holder_id: params.userId,
                merchant_config_id: params.merchantConfigId,
                type: 'spent',
                amount: -params.amount, // Negative for spending
                order_id: params.orderId,
                description: params.description || 'Redeemed at checkout',
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                status: 'completed'
            });

        if (txError) throw txError;

        // Update balance
        const { error: updateError } = await supabase
            .from('merchant_coins_balances')
            .update({
                total_spent: balance.totalSpent + params.amount,
                current_balance: balanceAfter,
                last_spent_at: new Date().toISOString()
            })
            .eq('id', balance.id);

        if (updateError) throw updateError;

        return { success: true };
    } catch (error: any) {
        console.error('Error redeeming coins:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get transaction history for a user and merchant
 */
export async function getCoinTransactions(userId: string, merchantConfigId: string): Promise<CoinTransaction[]> {
    try {
        const { data, error } = await supabase
            .from('merchant_coins_transactions')
            .select('*')
            .eq('holder_id', userId)
            .eq('merchant_config_id', merchantConfigId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return (data || []).map(tx => ({
            id: tx.id,
            type: tx.type,
            amount: Math.abs(tx.amount),
            description: tx.description,
            balanceBefore: tx.balance_before,
            balanceAfter: tx.balance_after,
            createdAt: tx.created_at,
            expiresAt: tx.expires_at
        }));
    } catch (error) {
        console.error('Error getting transactions:', error);
        return [];
    }
}

/**
 * Check and update tier progression
 */
async function checkTierProgression(userId: string, merchantConfigId: string): Promise<void> {
    try {
        const balance = await getUserCoinBalance(userId, merchantConfigId);
        if (!balance) return;

        // Get tier configurations
        const { data: tiers } = await supabase
            .from('merchant_coins_tiers')
            .select('*')
            .eq('merchant_config_id', merchantConfigId)
            .order('tier_level', { ascending: true });

        if (!tiers || tiers.length === 0) return;

        // Determine current tier based on achievements
        let newTier = 'bronze';
        for (const tier of tiers) {
            const meetsRequirements = 
                balance.totalEarned >= tier.min_coins_earned &&
                balance.lifetimePurchases >= tier.min_purchases &&
                balance.lifetimeSpentUsd >= tier.min_total_spent;

            if (meetsRequirements) {
                newTier = tier.tier_name.toLowerCase();
            }
        }

        // Update tier if changed
        if (newTier !== balance.currentTier) {
            await supabase
                .from('merchant_coins_balances')
                .update({ current_tier: newTier })
                .eq('id', balance.id);
        }
    } catch (error) {
        console.error('Error checking tier progression:', error);
    }
}

/**
 * Get tier configurations for a merchant
 */
export async function getMerchantTiers(merchantConfigId: string): Promise<TierConfig[]> {
    try {
        const { data, error } = await supabase
            .from('merchant_coins_tiers')
            .select('*')
            .eq('merchant_config_id', merchantConfigId)
            .order('tier_level', { ascending: true });

        if (error) throw error;

        return (data || []).map(tier => ({
            id: tier.id,
            tierName: tier.tier_name,
            tierLevel: tier.tier_level,
            minCoinsEarned: tier.min_coins_earned,
            minPurchases: tier.min_purchases,
            minTotalSpent: tier.min_total_spent,
            earnMultiplier: parseFloat(tier.earn_multiplier),
            redemptionBonusPct: parseFloat(tier.redemption_bonus_pct),
            exclusiveDiscounts: tier.exclusive_discounts,
            earlyAccess: tier.early_access,
            freeShipping: tier.free_shipping,
            prioritySupport: tier.priority_support,
            benefitsDescription: tier.benefits_description,
            badgeIcon: tier.badge_icon,
            badgeColor: tier.badge_color
        }));
    } catch (error) {
        console.error('Error getting merchant tiers:', error);
        return [];
    }
}

// Helper mapping functions
function mapConfigFromDb(data: any): MerchantCoinConfig {
    return {
        id: data.id,
        sellerId: data.seller_id,
        projectId: data.project_id,
        coinName: data.coin_name,
        coinSymbol: data.coin_symbol,
        brandColor: data.brand_color,
        logoUrl: data.logo_url,
        businessName: data.business_name,
        businessType: data.business_type,
        businessStatus: data.business_status,
        earnRate: parseFloat(data.earn_rate),
        redemptionRate: parseFloat(data.redemption_rate),
        minRedemption: data.min_redemption,
        maxRedemptionPct: parseFloat(data.max_redemption_pct),
        maxRedemptionPerVisit: data.max_redemption_per_visit ? parseFloat(data.max_redemption_per_visit) : undefined,
        coinsExpireDays: data.coins_expire_days,
        fundraisingGoal: data.fundraising_goal ? parseFloat(data.fundraising_goal) : undefined,
        currentFunding: data.current_funding ? parseFloat(data.current_funding) : undefined,
        isActive: data.is_active
    };
}

function mapBalanceFromDb(data: any): CoinBalance {
    return {
        id: data.id,
        holderId: data.holder_id,
        merchantConfigId: data.merchant_config_id,
        totalEarned: parseFloat(data.total_earned),
        totalSpent: parseFloat(data.total_spent),
        totalExpired: parseFloat(data.total_expired),
        currentBalance: parseFloat(data.current_balance),
        currentTier: data.current_tier,
        tierProgress: data.tier_progress,
        lifetimePurchases: data.lifetime_purchases,
        lifetimeSpentUsd: parseFloat(data.lifetime_spent_usd)
    };
}
