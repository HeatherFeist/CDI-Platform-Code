import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Send,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/supabase';

interface AffiliateStats {
  business_name: string;
  recruiting_member: string;
  subscription_tier: string;
  monthly_price: number;
  commission_rate: string;
  total_leads_submitted: number;
  total_leads_completed: number;
  completion_rate: string;
  total_earnings: string;
  pending_commissions: number;
  active_leads: number;
  recent_leads: Array<{
    id: string;
    title: string;
    location: string;
    budget: number;
    status: string;
    submitted_at: string;
  }>;
  recent_commissions: Array<{
    id: string;
    job_value: number;
    commission_amount: number;
    status: string;
    earned_at: string;
    paid_at: string | null;
  }>;
}

export default function AffiliateDashboard() {
  const [affiliateId, setAffiliateId] = useState<string>('');
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract affiliate ID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('affiliate_id') || localStorage.getItem('affiliate_id');
    
    if (id) {
      setAffiliateId(id);
      loadStats(id);
    } else {
      setError('No affiliate ID found. Please use the link from your welcome email.');
      setIsLoading(false);
    }
  }, []);

  const loadStats = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: statsError } = await supabase
        .rpc('get_affiliate_dashboard_stats', { p_affiliate_id: id });

      if (statsError) throw statsError;

      if (!data) {
        throw new Error('Affiliate not found');
      }

      setStats(data);
      
      // Save to localStorage for future visits
      localStorage.setItem('affiliate_id', id);

    } catch (err: any) {
      console.error('Error loading stats:', err);
      setError(err.message || 'Failed to load dashboard. Please check your affiliate ID.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending_pm_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'open':
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending_pm_review': 'Under Review',
      'open': 'Available',
      'assigned': 'Assigned',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'rejected': 'Rejected',
      'canceled': 'Canceled'
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md border-red-500">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const totalEarnings = parseFloat(stats.total_earnings.replace('$', '').replace(',', ''));
  const avgLeadValue = stats.total_leads_submitted > 0 
    ? totalEarnings / stats.total_leads_completed 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{stats.business_name}</h1>
            <p className="text-gray-600 mt-1">
              Affiliate Dashboard | Recruited by {stats.recruiting_member}
            </p>
          </div>
          <Button
            onClick={() => window.open(`/affiliate/submit?affiliate_id=${affiliateId}`, '_blank')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit New Lead
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-3xl font-bold text-green-600">{stats.total_earnings}</p>
                  <p className="text-xs text-gray-500 mt-1">Commission rate: {stats.commission_rate}</p>
                </div>
                <DollarSign className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Commissions</p>
                  <p className="text-3xl font-bold text-orange-600">${stats.pending_commissions.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting payout</p>
                </div>
                <Clock className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Leads Submitted</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total_leads_submitted}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.total_leads_completed} completed ({stats.completion_rate})
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Leads</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.active_leads}</p>
                  <p className="text-xs text-gray-500 mt-1">In progress</p>
                </div>
                <CheckCircle className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Avg Commission Per Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">
                ${avgLeadValue > 0 ? avgLeadValue.toFixed(0) : '0'}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Based on {stats.total_leads_completed} completed jobs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">{stats.completion_rate}</p>
              <p className="text-sm text-gray-600 mt-2">
                {stats.total_leads_completed} of {stats.total_leads_submitted} leads closed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Projection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-600">
                ${stats.total_leads_submitted > 0 ? ((totalEarnings / stats.total_leads_submitted) * 10).toFixed(0) : '0'}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Based on 10 leads/month average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Lead Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recent_leads && stats.recent_leads.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{lead.title}</p>
                      <p className="text-sm text-gray-600">{lead.location}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Submitted {new Date(lead.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-gray-900">${lead.budget.toLocaleString()}</p>
                      <Badge className={`${getStatusColor(lead.status)} text-xs mt-1`}>
                        {getStatusLabel(lead.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Send className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No leads submitted yet.</p>
                <Button
                  onClick={() => window.open(`/affiliate/submit?affiliate_id=${affiliateId}`, '_blank')}
                  className="mt-4"
                  variant="outline"
                >
                  Submit Your First Lead
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Commissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Commission History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recent_commissions && stats.recent_commissions.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_commissions.map((commission) => (
                  <div
                    key={commission.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Job Value: ${commission.job_value.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Earned {new Date(commission.earned_at).toLocaleDateString()}
                        {commission.paid_at && ` • Paid ${new Date(commission.paid_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-green-600 text-lg">
                        +${commission.commission_amount.toLocaleString()}
                      </p>
                      <Badge
                        className={
                          commission.status === 'paid'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                        }
                      >
                        {commission.status === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No commissions earned yet.</p>
                <p className="text-sm mt-2">
                  Submit leads and earn 5% commission when they're completed!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works Reminder */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle>🎯 How to Maximize Your Earnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">1</div>
              <p>Got a lead you can't take? <strong>Submit it immediately</strong> (takes 30 seconds)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">2</div>
              <p>Include <strong>client name and contact</strong> in notes for faster PM follow-up</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">3</div>
              <p>Submit <strong>quality leads</strong> (realistic budgets, clear scope) = higher completion rate</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">4</div>
              <p>Aim for <strong>10+ leads/month</strong> = $2,000+ passive income potential</p>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Questions about your commissions? Contact{' '}
            <a href="mailto:affiliates@constructivedesignsinc.org" className="text-blue-600 hover:underline">
              affiliates@constructivedesignsinc.org
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
