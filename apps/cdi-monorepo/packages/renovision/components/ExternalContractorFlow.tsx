// ExternalContractorFlow.tsx
// Dashboard component for creating and managing external contractor requests
// Import this into your contractor dashboard

import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function ExternalContractorFlow({ contractorId }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    jobDescription: '',
    estimatedScope: ''
  });

  // Load pending requests
  useEffect(() => {
    loadPendingRequests();
  }, [contractorId]);

  async function loadPendingRequests() {
    const { data, error } = await supabase
      .rpc('get_pending_external_requests', { p_contractor_id: contractorId });
    
    if (!error && data) {
      setPendingRequests(data || []);
    }
  }

  async function handleCreateRequest(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .rpc('create_external_contractor_request', {
          p_contractor_id: contractorId,
          p_external_contractor_name: formData.name,
          p_external_contractor_contact: formData.contact,
          p_job_description: formData.jobDescription || null,
          p_estimated_scope: formData.estimatedScope || null
        });

      if (error) throw error;

      // Show share options
      const result = JSON.parse(data);
      await showShareModal(result);

      // Reset form
      setFormData({ name: '', contact: '', jobDescription: '', estimatedScope: '' });
      setShowCreateForm(false);
      loadPendingRequests();

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create request. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function showShareModal(result) {
    const { form_link, sms_message } = result;

    // Copy SMS message to clipboard
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(sms_message);
    }

    // Show modal with options
    alert(`✅ Request created!\n\n📋 SMS message copied to clipboard!\n\nText it to ${formData.name} or share the link:\n${form_link}`);
  }

  async function copyFormLink(link) {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(link);
      alert('✅ Link copied! Send this to the contractor.');
    }
  }

  async function sendViaSMS(requestId) {
    // TODO: Integrate with Twilio
    alert('SMS integration coming soon! For now, copy the link and text it manually.');
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>External Contractors</h2>
          <p style={styles.subtitle}>
            Send job requests to contractors outside the network
          </p>
        </div>
        <button
          style={styles.createButton}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '✕ Cancel' : '+ New Request'}
        </button>
      </div>

      {/* Create Request Form */}
      {showCreateForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Send Job Request</h3>
          <form onSubmit={handleCreateRequest}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Contractor Name <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                style={styles.input}
                placeholder="Nick Johnson"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Phone or Email <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                style={styles.input}
                placeholder="+1-303-555-1234 or nick@example.com"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Job Description <span style={styles.optional}>(optional)</span>
              </label>
              <input
                type="text"
                style={styles.input}
                placeholder="Kitchen repaint + gutter install"
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Estimated Scope <span style={styles.optional}>(optional)</span>
              </label>
              <input
                type="text"
                style={styles.input}
                placeholder="3-4 day job, I'll provide materials"
                value={formData.estimatedScope}
                onChange={(e) => setFormData({ ...formData, estimatedScope: e.target.value })}
              />
            </div>

            <button
              type="submit"
              style={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Creating...' : '✅ Create & Get Link'}
            </button>
          </form>
        </div>
      )}

      {/* Pending Requests */}
      <div style={styles.requestsList}>
        <h3 style={styles.sectionTitle}>Pending Requests ({pendingRequests.length})</h3>
        
        {pendingRequests.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No pending requests</p>
            <p style={styles.emptyHint}>
              Click "+ New Request" to send a job form to an external contractor
            </p>
          </div>
        ) : (
          <div style={styles.cards}>
            {pendingRequests.map((request) => (
              <div key={request.request_id} style={styles.requestCard}>
                <div style={styles.requestHeader}>
                  <div>
                    <h4 style={styles.requestName}>{request.external_contractor_name}</h4>
                    <p style={styles.requestContact}>{request.external_contractor_contact}</p>
                  </div>
                  <div style={styles.statusBadge(request.opened)}>
                    {request.opened ? '👁️ Opened' : '📤 Sent'}
                  </div>
                </div>

                {request.job_description && (
                  <p style={styles.requestDescription}>{request.job_description}</p>
                )}

                <div style={styles.requestMeta}>
                  <span style={styles.metaItem}>
                    📅 Sent {Math.floor(request.days_ago)} days ago
                  </span>
                  {request.opened && (
                    <span style={styles.metaItem}>
                      👁️ Opened {new Date(request.opened_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div style={styles.requestActions}>
                  <button
                    style={styles.actionButton}
                    onClick={() => copyFormLink(request.form_link)}
                  >
                    📋 Copy Link
                  </button>
                  <button
                    style={styles.actionButton}
                    onClick={() => sendViaSMS(request.request_id)}
                  >
                    📱 Send SMS
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 5px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  createButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease'
  },
  formCard: {
    background: 'white',
    borderRadius: '15px',
    padding: '25px',
    marginBottom: '30px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  },
  formTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#1a1a1a'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  required: {
    color: '#f00'
  },
  optional: {
    color: '#999',
    fontWeight: '400'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e1e8ed',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'border-color 0.2s ease'
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease'
  },
  requestsList: {
    marginTop: '30px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#1a1a1a'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: '#f7f9fc',
    borderRadius: '15px'
  },
  emptyText: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '10px'
  },
  emptyHint: {
    fontSize: '14px',
    color: '#999'
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  requestCard: {
    background: 'white',
    borderRadius: '15px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  requestHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px'
  },
  requestName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 5px 0'
  },
  requestContact: {
    fontSize: '13px',
    color: '#666',
    margin: 0
  },
  statusBadge: (opened) => ({
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    background: opened ? '#d4edda' : '#fff3cd',
    color: opened ? '#155724' : '#856404'
  }),
  requestDescription: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '15px',
    lineHeight: '1.5'
  },
  requestMeta: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
    flexWrap: 'wrap'
  },
  metaItem: {
    fontSize: '12px',
    color: '#999'
  },
  requestActions: {
    display: 'flex',
    gap: '10px'
  },
  actionButton: {
    flex: 1,
    padding: '10px',
    background: '#f7f9fc',
    border: '2px solid #e1e8ed',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

export default ExternalContractorFlow;
