import { supabase } from '../supabase';

export interface FundingBreakdown {
    equipment?: number;
    inventory?: number;
    licenses?: number;
    marketing?: number;
    workingCapital?: number;
    other?: number;
}

export interface EquipmentItem {
    id: string;
    name: string;
    category: string;
    estimatedCost: number;
    quantity: number;
    vendor?: string;
    priority: 'essential' | 'important' | 'optional';
}

export interface BusinessProject {
    id: string;
    name: string;
    slug: string;
    description: string;
    tagline?: string;
    imageUrl?: string;
    
    // Fundraising
    fundraisingGoal: number;
    currentFunding: number;
    fundingPercentage: number;
    donorCount: number;
    
    // Business Details
    businessPlanUrl?: string;
    ein?: string;
    einVerified: boolean;
    llcRegistrationDate?: string;
    
    // Funding Breakdown
    fundingBreakdown: FundingBreakdown;
    equipmentChecklist: EquipmentItem[];
    
    // Savings Account
    savingsAccountType?: string;
    paypalDonateButtonId?: string;
    
    // Timeline
    fundraisingStartDate?: string;
    fundraisingDeadline?: string;
    daysRemaining?: number;
    
    // Coin Details
    coinName: string;
    coinSymbol: string;
    brandColor: string;
    merchantConfigId: string;
    
    // Status
    status: 'planning' | 'fundraising' | 'funded' | 'auction' | 'sold' | 'active';
    
    createdAt: string;
}

export interface Donation {
    id: string;
    projectId: string;
    donorId: string;
    donorName?: string;
    amount: number;
    coinsIssued: number;
    paymentMethod: string;
    message?: string;
    isAnonymous: boolean;
    createdAt: string;
}

/**
 * Get all active fundraising projects
 */
export async function getActiveFundraisingProjects(): Promise<BusinessProject[]> {
    try {
        const { data, error } = await supabase
            .from('active_fundraising_projects')
            .select('*');

        if (error) throw error;

        return (data || []).map(mapProjectFromView);
    } catch (error) {
        console.error('Error fetching fundraising projects:', error);
        return [];
    }
}

/**
 * Get specific business project details
 */
export async function getBusinessProject(projectId: string): Promise<BusinessProject | null> {
    try {
        const { data: project } = await supabase
            .from('projects')
            .select('*, merchant_config:merchant_coins_config(*)')
            .eq('id', projectId)
            .single();

        if (!project) return null;

        const { data: donations } = await supabase
            .from('crowdfunding_donations')
            .select('*')
            .eq('project_id', projectId);

        const donorCount = donations?.length || 0;
        const currentFunding = project.merchant_config?.current_funding || 0;
        const fundingGoal = project.merchant_config?.fundraising_goal || 0;

        return {
            id: project.id,
            name: project.name,
            slug: project.slug,
            description: project.description,
            tagline: project.tagline,
            imageUrl: project.image_url,
            fundraisingGoal: fundingGoal,
            currentFunding,
            fundingPercentage: fundingGoal > 0 ? (currentFunding / fundingGoal * 100) : 0,
            donorCount,
            businessPlanUrl: project.merchant_config?.business_plan_url,
            ein: project.merchant_config?.ein,
            einVerified: project.merchant_config?.ein_verified || false,
            llcRegistrationDate: project.merchant_config?.llc_registration_date,
            fundingBreakdown: project.merchant_config?.funding_breakdown || {},
            equipmentChecklist: project.merchant_config?.equipment_checklist || [],
            savingsAccountType: project.merchant_config?.savings_account_type,
            paypalDonateButtonId: project.merchant_config?.paypal_donate_button_id,
            fundraisingStartDate: project.merchant_config?.fundraising_start_date,
            fundraisingDeadline: project.merchant_config?.fundraising_deadline,
            daysRemaining: calculateDaysRemaining(project.merchant_config?.fundraising_deadline),
            coinName: project.merchant_config?.coin_name || 'Coins',
            coinSymbol: project.merchant_config?.coin_symbol || '🪙',
            brandColor: project.merchant_config?.brand_color || '#6366f1',
            merchantConfigId: project.merchant_config?.id,
            status: project.merchant_config?.business_status || 'planning',
            createdAt: project.created_at
        };
    } catch (error) {
        console.error('Error fetching business project:', error);
        return null;
    }
}

/**
 * Make a donation to a business project
 */
export async function makeDonation(params: {
    projectId: string;
    merchantConfigId: string;
    amount: number;
    paymentMethod: 'paypal' | 'cash_app' | 'stripe';
    paymentReference?: string;
    message?: string;
    isAnonymous?: boolean;
}): Promise<{ success: boolean; donationId?: string; coinsIssued?: number; error?: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Must be logged in to donate' };
        }

        // Create donation record (coins issued 1:1 with donation amount)
        const { data: donation, error: donationError } = await supabase
            .from('crowdfunding_donations')
            .insert({
                project_id: params.projectId,
                merchant_config_id: params.merchantConfigId,
                donor_id: user.id,
                amount: params.amount,
                payment_method: params.paymentMethod,
                payment_reference: params.paymentReference,
                coins_issued: params.amount, // 1:1 ratio
                coins_status: 'pending', // Will be 'issued' when business launches
                donation_status: 'completed',
                message: params.message,
                is_anonymous: params.isAnonymous || false
            })
            .select()
            .single();

        if (donationError) throw donationError;

        // Check if funding goal reached
        await checkFundingGoalReached(params.merchantConfigId);

        return {
            success: true,
            donationId: donation.id,
            coinsIssued: params.amount
        };
    } catch (error: any) {
        console.error('Error making donation:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get donation history for a project
 */
export async function getProjectDonations(projectId: string, includeAnonymous = true): Promise<Donation[]> {
    try {
        let query = supabase
            .from('crowdfunding_donations')
            .select(`
                *,
                donor:profiles!crowdfunding_donations_donor_id_fkey(full_name)
            `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (!includeAnonymous) {
            query = query.eq('is_anonymous', false);
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []).map(d => ({
            id: d.id,
            projectId: d.project_id,
            donorId: d.donor_id,
            donorName: d.is_anonymous ? 'Anonymous' : (d.donor?.full_name || 'Anonymous'),
            amount: parseFloat(d.amount),
            coinsIssued: parseFloat(d.coins_issued),
            paymentMethod: d.payment_method,
            message: d.message,
            isAnonymous: d.is_anonymous,
            createdAt: d.created_at
        }));
    } catch (error) {
        console.error('Error fetching donations:', error);
        return [];
    }
}

/**
 * Get user's donation history (their investment portfolio)
 */
export async function getUserInvestmentPortfolio(userId: string): Promise<Array<{
    donation: Donation;
    project: BusinessProject;
    coinsBalance: number;
    usdValue: number;
}>> {
    try {
        const { data, error } = await supabase
            .from('crowdfunding_donations')
            .select(`
                *,
                project:projects(*),
                merchant_config:merchant_coins_config(*)
            `)
            .eq('donor_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(item => {
            const coinsIssued = parseFloat(item.coins_issued);
            const redemptionRate = parseFloat(item.merchant_config?.redemption_rate || 0.01);
            
            return {
                donation: {
                    id: item.id,
                    projectId: item.project_id,
                    donorId: item.donor_id,
                    amount: parseFloat(item.amount),
                    coinsIssued,
                    paymentMethod: item.payment_method,
                    message: item.message,
                    isAnonymous: item.is_anonymous,
                    createdAt: item.created_at
                },
                project: {
                    id: item.project?.id,
                    name: item.project?.name,
                    slug: item.project?.slug,
                    description: item.project?.description,
                    imageUrl: item.project?.image_url,
                    fundraisingGoal: parseFloat(item.merchant_config?.fundraising_goal || 0),
                    currentFunding: parseFloat(item.merchant_config?.current_funding || 0),
                    fundingPercentage: 0,
                    donorCount: 0,
                    coinName: item.merchant_config?.coin_name || 'Coins',
                    coinSymbol: item.merchant_config?.coin_symbol || '🪙',
                    brandColor: item.merchant_config?.brand_color || '#6366f1',
                    merchantConfigId: item.merchant_config?.id,
                    status: item.merchant_config?.business_status,
                    createdAt: item.created_at,
                    fundingBreakdown: {},
                    equipmentChecklist: [],
                    einVerified: false
                },
                coinsBalance: coinsIssued, // Pre-launch: all coins pending
                usdValue: coinsIssued * redemptionRate
            };
        });
    } catch (error) {
        console.error('Error fetching investment portfolio:', error);
        return [];
    }
}

/**
 * Check if funding goal reached and trigger auction
 */
async function checkFundingGoalReached(merchantConfigId: string): Promise<void> {
    try {
        const { data: config } = await supabase
            .from('merchant_coins_config')
            .select('*')
            .eq('id', merchantConfigId)
            .single();

        if (!config) return;

        const currentFunding = parseFloat(config.current_funding || 0);
        const fundraisingGoal = parseFloat(config.fundraising_goal || 0);

        // Check if goal reached
        if (currentFunding >= fundraisingGoal && config.auction_trigger_enabled) {
            // Update status to 'funded'
            await supabase
                .from('merchant_coins_config')
                .update({ business_status: 'funded' })
                .eq('id', merchantConfigId);

            // Create auction (if not already exists)
            const { data: existingAuction } = await supabase
                .from('business_auctions')
                .select('id')
                .eq('merchant_config_id', merchantConfigId)
                .single();

            if (!existingAuction) {
                const auctionStart = new Date();
                const auctionEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

                await supabase
                    .from('business_auctions')
                    .insert({
                        project_id: config.project_id,
                        merchant_config_id: merchantConfigId,
                        starting_bid: fundraisingGoal,
                        current_bid: fundraisingGoal,
                        auction_start: auctionStart.toISOString(),
                        auction_end: auctionEnd.toISOString(),
                        status: 'active'
                    });

                console.log('🎉 Funding goal reached! Auction created.');
            }
        }
    } catch (error) {
        console.error('Error checking funding goal:', error);
    }
}

/**
 * Calculate days remaining until deadline
 */
function calculateDaysRemaining(deadline?: string): number | undefined {
    if (!deadline) return undefined;
    
    const now = new Date();
    const end = new Date(deadline);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
}

/**
 * Map project data from view
 */
function mapProjectFromView(data: any): BusinessProject {
    return {
        id: data.id,
        name: data.project_name,
        slug: data.project_slug,
        description: data.project_description,
        imageUrl: data.project_image,
        fundraisingGoal: parseFloat(data.fundraising_goal || 0),
        currentFunding: parseFloat(data.current_funding || 0),
        fundingPercentage: parseFloat(data.funding_percentage || 0),
        donorCount: data.donor_count || 0,
        businessPlanUrl: data.business_plan_url,
        ein: data.ein,
        einVerified: data.ein_verified || false,
        llcRegistrationDate: data.llc_registration_date,
        fundingBreakdown: data.funding_breakdown || {},
        equipmentChecklist: data.equipment_checklist || [],
        savingsAccountType: data.savings_account_type,
        paypalDonateButtonId: data.paypal_donate_button_id,
        fundraisingStartDate: data.fundraising_start_date,
        fundraisingDeadline: data.fundraising_deadline,
        daysRemaining: calculateDaysRemaining(data.fundraising_deadline),
        coinName: data.coin_name,
        coinSymbol: data.coin_symbol,
        brandColor: data.brand_color,
        merchantConfigId: data.id,
        status: data.business_status,
        createdAt: data.created_at
    };
}
