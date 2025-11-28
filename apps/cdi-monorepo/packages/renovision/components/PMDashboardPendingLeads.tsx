import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  UserCheck,
  Trophy,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AffiliateLead {
  id: string;
  title: string;
  location: string;
  timeline: string;
  estimated_duration: string;
  estimated_budget: number;
  description: string;
  status: string;
  created_at: string;
  affiliate_partnership: {
    affiliate_id: string;
    business_name: string;
    contact_name: string;
  };
  recruiting_member: {
    username: string;
    full_name: string;
  };
}

export default function PMDashboardPendingLeads() {
  const { user, userProfile } = useAuth();
  const [leads, setLeads] = useState<AffiliateLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingLeadId, setProcessingLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.role === 'manager' || userProfile?.role === 'admin') {
      loadPendingLeads();
    }
  }, [userProfile]);

  const loadPendingLeads = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: loadError } = await supabase
        .from('sub_opportunities')
        .select(`
          id,
          title,
          location,
          timeline,
          estimated_duration,
          estimated_budget,
          description,
          status,
          created_at,
          affiliate_partnership_id,
          recruiting_member_id
        `)
        .eq('is_affiliate_referral', true)
        .eq('status', 'pending_pm_review')
        .order('created_at', { ascending: false });

      if (loadError) throw loadError;

      // Fetch affiliate and recruiting member details for each lead
      const enrichedLeads = await Promise.all(
        (data || []).map(async (lead) => {
          // Get affiliate partnership details
          const { data: affiliate } = await supabase
            .from('affiliate_partnerships')
            .select('affiliate_id, business_name, contact_name')
            .eq('id', lead.affiliate_partnership_id)
            .single();

          // Get recruiting member details
          const { data: recruiter } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('id', lead.recruiting_member_id)
            .single();

          return {
            ...lead,
            affiliate_partnership: affiliate || { affiliate_id: 'Unknown', business_name: 'Unknown', contact_name: 'Unknown' },
            recruiting_member: recruiter || { username: 'Unknown', full_name: 'Unknown' }
          };
        })
      );

      setLeads(enrichedLeads);

    } catch (err: any) {
      console.error('Error loading leads:', err);
      setError(err.message || 'Failed to load pending leads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveLead = async (leadId: string) => {
    setProcessingLeadId(leadId);
    try {
      const { error: updateError } = await supabase
        .from('sub_opportunities')
        .update({ 
          status: 'open',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) throw updateError;

      // Remove from list
      setLeads(leads.filter(lead => lead.id !== leadId));
      
    } catch (err: any) {
      console.error('Error approving lead:', err);
      alert('Failed to approve lead: ' + err.message);
    } finally {
      setProcessingLeadId(null);
    }
  };

  const handleRejectLead = async (leadId: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    
    setProcessingLeadId(leadId);
    try {
      const { error: updateError } = await supabase
        .from('sub_opportunities')
        .update({ 
          status: 'rejected',
          rejection_reason: reason || 'Rejected by PM',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) throw updateError;

      // Remove from list
      setLeads(leads.filter(lead => lead.id !== leadId));
      
    } catch (err: any) {
      console.error('Error rejecting lead:', err);
      alert('Failed to reject lead: ' + err.message);
    } finally {
      setProcessingLeadId(null);
    }
  };

  const handleAssignToContractor = async (leadId: string) => {
    // This would open a modal to select a contractor
    // For now, we'll just change status to allow manual assignment
    setProcessingLeadId(leadId);
    try {
      const { error: updateError } = await supabase
        .from('sub_opportunities')
        .update({ 
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) throw updateError;

      // Remove from list
      setLeads(leads.filter(lead => lead.id !== leadId));
      
      // TODO: Open contractor selection modal
      alert('Lead approved for assignment. You can now assign it to a specific contractor.');
      
    } catch (err: any) {
      console.error('Error updating lead:', err);
      alert('Failed to update lead: ' + err.message);
    } finally {
      setProcessingLeadId(null);
    }
  };

  const handleCreateCompetition = async (leadId: string) => {
    setProcessingLeadId(leadId);
    try {
      const { error: updateError } = await supabase
        .from('sub_opportunities')
        .update({ 
          status: 'competition',
          competition_type: 'sealed_bid',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) throw updateError;

      // Remove from list
      setLeads(leads.filter(lead => lead.id !== leadId));
      
      alert('Competition created! Members can now submit proposals for this lead.');
      
    } catch (err: any) {
      console.error('Error creating competition:', err);
      alert('Failed to create competition: ' + err.message);
    } finally {
      setProcessingLeadId(null);
    }
  };

  if (userProfile?.role !== 'manager' && userProfile?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>This page is only accessible to Project Managers.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Affiliate Lead Review</h1>
          <p className="text-gray-600 mt-1">
            Review and process leads submitted by affiliate partners
          </p>
        </div>
        <Button
          onClick={loadPendingLeads}
          variant="outline"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : null}
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600">{leads.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ${leads.reduce((sum, lead) => sum + lead.estimated_budget, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Lead Value</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${leads.length > 0 ? Math.round(leads.reduce((sum, lead) => sum + lead.estimated_budget, 0) / leads.length).toLocaleString() : 0}
                </p>
              </div>
              <Trophy className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Affiliates</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(leads.map(lead => lead.affiliate_partnership.affiliate_id)).size}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-6 h-6" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          </CardContent>
        </Card>
      ) : leads.length === 0 ? (
        // Empty State
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">
                No pending affiliate leads to review at the moment.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Leads List
        <div className="space-y-4">
          {leads.map((lead) => {
            const affiliateCommission = lead.estimated_budget * 0.05;
            const overrideCommission = lead.estimated_budget * 0.02;
            const platformNet = lead.estimated_budget * 0.03;

            return (
              <Card key={lead.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{lead.title}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {lead.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {lead.timeline}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {lead.estimated_duration || 'Not specified'}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-4">
                      ${lead.estimated_budget.toLocaleString()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Lead Description */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-600 mt-0.5" />
                      <p className="text-sm font-semibold text-gray-900">Notes:</p>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap pl-6">
                      {lead.description}
                    </p>
                  </div>

                  {/* Affiliate & Recruiting Member Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-600 font-semibold mb-1">Affiliate Partner</p>
                      <p className="text-sm font-medium">{lead.affiliate_partnership.business_name}</p>
                      <p className="text-xs text-gray-600">{lead.affiliate_partnership.contact_name}</p>
                      <p className="text-xs text-gray-500 mt-1">{lead.affiliate_partnership.affiliate_id}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <p className="text-xs text-purple-600 font-semibold mb-1">Recruited By</p>
                      <p className="text-sm font-medium">{lead.recruiting_member.full_name}</p>
                      <p className="text-xs text-gray-600">@{lead.recruiting_member.username}</p>
                    </div>
                  </div>

                  {/* Commission Breakdown */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Commission Structure (if completed):</p>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-600">Affiliate</p>
                        <p className="font-semibold text-green-600">${affiliateCommission.toFixed(0)} (5%)</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Override</p>
                        <p className="font-semibold text-purple-600">${overrideCommission.toFixed(0)} (2%)</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Platform Net</p>
                        <p className="font-semibold text-blue-600">${platformNet.toFixed(0)} (3%)</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApproveLead(lead.id)}
                      disabled={processingLeadId === lead.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processingLeadId === lead.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    
                    <Button
                      onClick={() => handleAssignToContractor(lead.id)}
                      disabled={processingLeadId === lead.id}
                      variant="outline"
                      className="flex-1"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Assign to Contractor
                    </Button>
                    
                    <Button
                      onClick={() => handleCreateCompetition(lead.id)}
                      disabled={processingLeadId === lead.id}
                      variant="outline"
                      className="flex-1"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      Create Competition
                    </Button>
                    
                    <Button
                      onClick={() => handleRejectLead(lead.id)}
                      disabled={processingLeadId === lead.id}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>

                  {/* Submission Date */}
                  <p className="text-xs text-gray-500 text-center pt-2 border-t">
                    Submitted {new Date(lead.created_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
