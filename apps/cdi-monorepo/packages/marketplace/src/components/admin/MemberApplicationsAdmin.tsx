import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { memberIntegrationService } from '../../services/MemberIntegrationService';

interface MemberApplication {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  store_name: string;
  store_description: string;
  business_type: string;
  tier_requested: string;
  referral_code?: string;
  mentor_username?: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  google_form_response_id?: string;
}

const MemberApplicationsAdmin: React.FC = () => {
  const [applications, setApplications] = useState<MemberApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<MemberApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('member_applications')
        .select('*')
        .order('applied_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveApplication = async (applicationId: string) => {
    setProcessing(applicationId);
    try {
      await memberIntegrationService.manuallyApproveApplication(applicationId);
      await fetchApplications();
      setSelectedApplication(null);
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Failed to approve application. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const rejectApplication = async (applicationId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }

    setProcessing(applicationId);
    try {
      const { error } = await supabase
        .from('member_applications')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          approved_at: new Date().toISOString(),
          approved_by: 'admin' // You might want to get the actual admin user
        })
        .eq('id', applicationId);

      if (error) throw error;

      await fetchApplications();
      setSelectedApplication(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const syncWithGoogleForms = async () => {
    setLoading(true);
    try {
      await memberIntegrationService.syncAllPendingApplications();
      await fetchApplications();
      alert('Successfully synced with Google Forms!');
    } catch (error) {
      console.error('Error syncing with Google Forms:', error);
      alert('Failed to sync with Google Forms. Please check the logs.');
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app =>
    app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.store_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/15 text-amber-300';
      case 'approved': return 'bg-emerald-500/15 text-emerald-300';
      case 'rejected': return 'bg-red-500/15 text-red-300';
      default: return 'bg-slate-800 text-slate-300';
    }
  };

  const getTierBadgeClass = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'free': return 'bg-cyan-500/15 text-cyan-300';
      case 'partner': return 'bg-indigo-500/15 text-indigo-300';
      case 'professional': return 'bg-violet-500/15 text-violet-300';
      case 'enterprise': return 'bg-orange-500/15 text-orange-300';
      default: return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Member Applications</h1>
          <p className="mt-2 text-slate-400">
            Manage nonprofit member applications and integrations
          </p>
        </div>

        {/* Controls */}
        <div className="market-panel mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="market-input w-full px-4 py-2"
                />
              </div>

              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="market-input px-4 py-2"
              >
                <option value="all">All Applications</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={syncWithGoogleForms}
                disabled={loading}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-white transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {loading ? 'Syncing...' : 'Sync Google Forms'}
              </button>
              <button
                onClick={fetchApplications}
                disabled={loading}
                className="market-button-primary px-4 py-2 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="market-panel overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-400"></div>
              <p className="mt-2 text-slate-400">Loading applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-400">No applications found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-950/45">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Store
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Applied
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-transparent">
                  {filteredApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-slate-900/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {application.first_name} {application.last_name}
                          </div>
                          <div className="text-sm text-slate-400">{application.email}</div>
                          <div className="text-sm text-slate-500">{application.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {application.store_name}
                          </div>
                          <div className="text-sm text-slate-500">{application.business_type}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierBadgeClass(application.tier_requested)}`}>
                          {application.tier_requested}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(application.status)}`}>
                          {application.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(application.applied_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setSelectedApplication(application)}
                          className="text-indigo-300 hover:text-indigo-200"
                        >
                          View
                        </button>
                        {application.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveApplication(application.id)}
                              disabled={processing === application.id}
                              className="text-emerald-300 hover:text-emerald-200 disabled:opacity-50"
                            >
                              {processing === application.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedApplication(application);
                                setRejectionReason('');
                              }}
                              className="text-red-400 hover:text-red-300"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Application Detail Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-slate-950/70 backdrop-blur-sm">
            <div className="relative top-20 mx-auto w-11/12 rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl md:w-3/4 lg:w-1/2">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">
                    Application Details
                  </h3>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-slate-500 hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400">Name</label>
                      <p className="mt-1 text-sm text-slate-100">
                        {selectedApplication.first_name} {selectedApplication.last_name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400">Email</label>
                      <p className="mt-1 text-sm text-slate-100">{selectedApplication.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400">Phone</label>
                      <p className="mt-1 text-sm text-slate-100">{selectedApplication.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400">Tier Requested</label>
                      <p className="mt-1 text-sm text-slate-100">{selectedApplication.tier_requested}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400">Address</label>
                    <p className="mt-1 text-sm text-slate-100">
                      {selectedApplication.address}, {selectedApplication.city}, {selectedApplication.state} {selectedApplication.zip_code}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400">Store Name</label>
                    <p className="mt-1 text-sm text-slate-100">{selectedApplication.store_name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400">Store Description</label>
                    <p className="mt-1 text-sm text-slate-100">{selectedApplication.store_description}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400">Business Type</label>
                    <p className="mt-1 text-sm text-slate-100">{selectedApplication.business_type}</p>
                  </div>

                  {selectedApplication.referral_code && (
                    <div>
                      <label className="block text-sm font-medium text-slate-400">Referral Code</label>
                      <p className="mt-1 text-sm text-slate-100">{selectedApplication.referral_code}</p>
                    </div>
                  )}

                  {selectedApplication.mentor_username && (
                    <div>
                      <label className="block text-sm font-medium text-slate-400">Mentor Username</label>
                      <p className="mt-1 text-sm text-slate-100">{selectedApplication.mentor_username}</p>
                    </div>
                  )}

                  {selectedApplication.status === 'rejected' && selectedApplication.rejection_reason && (
                    <div>
                      <label className="block text-sm font-medium text-slate-400">Rejection Reason</label>
                      <p className="mt-1 text-sm text-red-300">{selectedApplication.rejection_reason}</p>
                    </div>
                  )}

                  {selectedApplication.status === 'pending' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-400">Rejection Reason (Optional)</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a reason for rejection..."
                        className="market-input mt-1 block w-full rounded-md px-3 py-2 sm:text-sm"
                        rows={3}
                      />
                    </div>
                  )}
                </div>

                {selectedApplication.status === 'pending' && (
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => rejectApplication(selectedApplication.id)}
                      disabled={processing === selectedApplication.id}
                      className="rounded-md bg-red-500 px-4 py-2 text-white transition hover:bg-red-400 disabled:opacity-50"
                    >
                      {processing === selectedApplication.id ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => approveApplication(selectedApplication.id)}
                      disabled={processing === selectedApplication.id}
                      className="rounded-md bg-emerald-500 px-4 py-2 text-white transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {processing === selectedApplication.id ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberApplicationsAdmin;