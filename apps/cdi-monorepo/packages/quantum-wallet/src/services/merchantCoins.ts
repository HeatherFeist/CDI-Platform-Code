import { supabase } from '../supabase';

export interface MerchantCoin {
    id: string;
    merchantName: string;
    symbol: string;
    balance: number;
    valueUsd: number;
    status: 'active' | 'locked' | 'pending';
    logoUrl?: string;
    unlockDate?: string;
    redemptionRule?: string;
    projectId: string;
}

export interface CrowdfundingProject {
    id: string;
    name: string;
    slug: string;
    tagline: string;
    description: string;
    fundingGoal: number;
    fundsRaised: number;
    cashtag?: string;
    paypalUrl?: string;
    imageUrl?: string;
    status: string;
    redemptionPolicy?: string;
}

/**
 * Fetch all merchant coins for the current user
 */
export async function getUserMerchantCoins(userId: string): Promise<MerchantCoin[]> {
    const { data, error } = await supabase
        .from('merchant_coins')
        .select(`
      id,
      amount,
      status,
      created_at,
      unlocked_at,
      project:projects (
        id,
        name,
        slug,
        tagline,
        image_url,
        redemption_policy
      )
    `)
        .eq('holder_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching merchant coins:', error);
        return [];
    }

    // Transform the data to match our interface
    return (data || []).map((coin: any) => ({
        id: coin.id,
        merchantName: coin.project?.name || 'Unknown Business',
        symbol: generateSymbol(coin.project?.name),
        balance: coin.amount,
        valueUsd: coin.amount, // 1:1 ratio
        status: coin.status,
        logoUrl: coin.project?.image_url || '🏪',
        unlockDate: coin.unlocked_at ? new Date(coin.unlocked_at).toLocaleDateString() : undefined,
        redemptionRule: coin.project?.redemption_policy,
        projectId: coin.project?.id
    }));
}

/**
 * Fetch all active crowdfunding projects
 */
export async function getActiveCrowdfundingProjects(): Promise<CrowdfundingProject[]> {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'funding')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching crowdfunding projects:', error);
        return [];
    }

    return (data || []).map((project: any) => ({
        id: project.id,
        name: project.name,
        slug: project.slug,
        tagline: project.tagline || '',
        description: project.description || '',
        fundingGoal: parseFloat(project.funding_goal),
        fundsRaised: parseFloat(project.funds_raised || 0),
        cashtag: project.payment_cashtag,
        paypalUrl: project.payment_paypal_url,
        imageUrl: project.image_url,
        status: project.status,
        redemptionPolicy: project.redemption_policy
    }));
}

/**
 * Record a donation (manual entry for now, until we have webhooks)
 */
export async function recordDonation(
    projectId: string,
    userId: string,
    amount: number,
    paymentMethod: 'cash_app' | 'paypal'
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('donations')
        .insert({
            project_id: projectId,
            user_id: userId,
            amount: amount,
            payment_method: paymentMethod,
            status: 'completed', // Manual entry assumes it's completed
            currency: 'USD'
        });

    if (error) {
        console.error('Error recording donation:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Get donation history for a user
 */
export async function getUserDonations(userId: string) {
    const { data, error } = await supabase
        .from('donations')
        .select(`
      id,
      amount,
      payment_method,
      status,
      created_at,
      coins_issued,
      project:projects (
        name,
        slug
      )
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching donations:', error);
        return [];
    }

    return data || [];
}

/**
 * Helper function to generate a symbol from business name
 */
function generateSymbol(name?: string): string {
    if (!name) return 'COIN';

    // Take first letter of each word, max 4 letters
    const words = name.split(' ');
    const symbol = words
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 4);

    return symbol;
}

/**
 * Get total value of all user's coins
 */
export async function getUserCoinsTotalValue(userId: string): Promise<number> {
    const { data, error } = await supabase
        .from('merchant_coins')
        .select('amount')
        .eq('holder_id', userId);

    if (error) {
        console.error('Error calculating total value:', error);
        return 0;
    }

    return (data || []).reduce((sum, coin) => sum + parseFloat(coin.amount), 0);
}
