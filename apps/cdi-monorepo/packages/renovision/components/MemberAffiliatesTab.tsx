import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Users,
  TrendingUp,
  UserPlus,
  Award,
  ExternalLink,
  Loader2,
  AlertCircle,
  Mail,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useAuth } from '@/contexts/AuthContext';
import RecruitAffiliateButton from './RecruitAffiliateButton';

interface RecruitedAffiliate {
  affiliate_id: string;
  business_name: string;
  email: string;
  status: string;
  recruited_at: string;
  last_submission: string | null;
  total_submissions: number;
  completed_submissions: number;
  completion_rate: string;
  total_job_value: number;
  override_earned: number;
  pending_override: number;
}

interface OverrideStats {
  total_affiliates_recruited: number;
  active_affiliates: number;
  total_override_earned: string;
  pending_override: number;
  total_submissions_by_network: number;
  total_completed_by_network: number;
  network_completion_rate: string;
  monthly_projection: number;
}

export default function MemberAffiliatesTab() {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState<OverrideStats | null>(null);
  const [affiliates, setAffiliates] = useState<RecruitedAffiliate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && userProfile) {
      loadData();
    }
  }, [user, userProfile]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load recruiting stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_member_affiliate_recruiting_stats', { p_member_id: user!.uid });

      if (statsError) throw statsError;
      setStats(statsData);

      // Load list of recruited affiliates with their performance
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('affiliate_partnerships')
        .select(`
          affiliate_id,
          business_name,
          email,
          status,
          recruited_at,
          total_leads_submitted,
          total_leads_completed
        `)
        .eq('recruited_by_member_id', user!.uid)
        .order('recruited_at', { ascending: false });

      if (affiliatesError) throw affiliatesError;

      // Enrich with override earnings data
      const enrichedAffiliates: RecruitedAffiliate[] = await Promise.all(
        (affiliatesData || []).map(async (aff) => {
          // Get total job value and override earnings
          const { data: commData } = await supabase
            .from('affiliate_commissions')
            .select('job_value, override_amount, status')
            .eq('affiliate_id', aff.affiliate_id);

          const totalJobValue = (commData || []).reduce((sum, c) => sum + c.job_value, 0);
          const overrideEarned = (commData || []).filter(c => c.status === 'paid').reduce((sum, c) => sum + c.override_amount, 0);
          const pendingOverride = (commData || []).filter(c => c.status === 'pending').reduce((sum, c) => sum + c.override_amount, 0);

          // Get last submission date
          const { data: lastSub } = await supabase
            .from('sub_opportunities')
            .select('created_at')
            .eq('is_affiliate_referral', true)
            .eq('affiliate_id', aff.affiliate_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const completionRate = aff.total_leads_submitted > 0
            ? ((aff.total_leads_completed / aff.total_leads_submitted) * 100).toFixed(0)
            : '0';

          return {
            affiliate_id: aff.affiliate_id,
            business_name: aff.business_name,
            email: aff.email,
            status: aff.status,
            recruited_at: aff.recruited_at,
            last_submission: lastSub?.created_at || null,
            total_submissions: aff.total_leads_submitted || 0,
            completed_submissions: aff.total_leads_completed || 0,
            completion_rate: `${completionRate}%`,
            total_job_value: totalJobValue,
            override_earned: overrideEarned,
            pending_override: pendingOverride
          };
        })
      );

      setAffiliates(enrichedAffiliates);

    } catch (err: any) {
      console.error('Error loading affiliate data:', err);
      setError(err.message || 'Failed to load affiliate data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <p className="text-red-600">{error}</p>
        <Button onClick={loadData} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  const totalOverride = parseFloat(stats.total_override_earned.replace('$', '').replace(',', ''));

  return (
    <div className="space-y-6">
      
      {/* Header with CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Affiliate Network</h2>
          <p className="text-gray-600 mt-1">
            Earn 2% override on every lead your recruited affiliates complete
          </p>
        </div>
        <RecruitAffiliateButton />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Override Earned</p>
                <p className="text-3xl font-bold text-green-600">{stats.total_override_earned}</p>
                <p className="text-xs text-gray-500 mt-1">Lifetime earnings</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Override</p>
                <p className="text-3xl font-bold text-orange-600">${stats.pending_override.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting payout</p>
              </div>
              <TrendingUp className="w-10 h-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Affiliates</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.active_affiliates} / {stats.total_affiliates_recruited}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {((stats.active_affiliates / Math.max(stats.total_affiliates_recruited, 1)) * 100).toFixed(0)}% active
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Network Performance</p>
                <p className="text-3xl font-bold text-purple-600">{stats.network_completion_rate}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total_completed_by_network} of {stats.total_submissions_by_network} completed
                </p>
              </div>
              <Award className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projection Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Monthly Passive Income Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-5xl font-bold text-green-600">
                ${stats.monthly_projection.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Based on {stats.active_affiliates} active affiliates submitting ~10 leads/month each
              </p>
            </div>
            <Zap className="w-20 h-20 text-green-400" />
          </div>
          
          <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">🎯 Growth Targets:</p>
            <div className="space-y-1 text-sm text-gray-700">
              <p>• <strong>5 active affiliates</strong> @ 10 leads/month = $2,000/mo override</p>
              <p>• <strong>10 active affiliates</strong> @ 10 leads/month = $4,000/mo override</p>
              <p>• <strong>20 active affiliates</strong> @ 10 leads/month = $8,000/mo override</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affiliate List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Recruited Affiliates ({affiliates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {affiliates.length > 0 ? (
            <div className="space-y-3">
              {affiliates.map((affiliate) => (
                <div
                  key={affiliate.affiliate_id}
                  className="p-5 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {affiliate.business_name}
                        </h3>
                        <Badge className={getStatusColor(affiliate.status)}>
                          {affiliate.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          {affiliate.email}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          Joined {new Date(affiliate.recruited_at).toLocaleDateString()}
                        </div>
                        <div className="text-gray-700">
                          <strong>{affiliate.total_submissions}</strong> leads submitted
                        </div>
                        <div className="text-gray-700">
                          <strong>{affiliate.completed_submissions}</strong> completed ({affiliate.completion_rate})
                        </div>
                        <div className="text-gray-700">
                          Total job value: <strong>${affiliate.total_job_value.toLocaleString()}</strong>
                        </div>
                        <div className="text-gray-700">
                          Last submission:{' '}
                          <strong>
                            {affiliate.last_submission
                              ? new Date(affiliate.last_submission).toLocaleDateString()
                              : 'Never'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-6">
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">Override Earned</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${affiliate.override_earned.toLocaleString()}
                        </p>
                      </div>
                      {affiliate.pending_override > 0 && (
                        <div>
                          <p className="text-xs text-gray-600">Pending</p>
                          <p className="text-lg font-semibold text-orange-600">
                            ${affiliate.pending_override.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserPlus className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Affiliates Recruited Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start recruiting external contractors to earn 2% override on every lead they submit.
                Each affiliate can generate $350-$1,400/mo in passive income for you!
              </p>
              <RecruitAffiliateButton />
            </div>
          )}
        </CardContent>
      </Card>

      {/* How Override Works */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle>💡 How Override Earnings Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">1</div>
            <p>You recruit an external contractor (plumber, electrician, landscaper, etc.)</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">2</div>
            <p>They submit leads they can't take (wrong area, too busy, not their specialty)</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">3</div>
            <p>When the lead completes, they earn <strong>5% commission</strong></p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">4</div>
            <p>You automatically earn <strong>2% override</strong> as the recruiter (passive income!)</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">5</div>
            <p>Platform takes 3% to cover costs (PM time, software, support)</p>
          </div>
          
          <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
            <p className="font-semibold text-gray-900 mb-2">Example:</p>
            <p className="text-gray-700">
              Your recruited affiliate submits a $20,000 kitchen remodel they can't take:<br/>
              • Affiliate earns: <strong className="text-green-600">$1,000</strong> (5%)<br/>
              • You earn: <strong className="text-green-600">$400</strong> (2% override)<br/>
              • Platform: $600 (3%)
            </p>
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <p className="font-semibold text-green-900 mb-2">🚀 Scaling Strategy:</p>
            <p className="text-green-800">
              Recruit 10 affiliates who each submit 10 leads/month = <strong>100 leads/month in your network</strong>.
              At $20k average job value with 70% completion = <strong>$4,000/mo passive override income</strong>!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <div className="text-center text-sm text-gray-600">
        <p>
          Questions about override earnings?{' '}
          <a href="mailto:support@constructivedesignsinc.org" className="text-blue-600 hover:underline">
            Contact Support
          </a>
        </p>
      </div>

    </div>
  );
}
