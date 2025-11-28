import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface TeamInvitation {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    status: string;
    invitation_code: string;
    created_at: string;
    expires_at: string;
}

export default function TeamInvitationsView() {
    const { userProfile } = useAuth();
    const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: 'technician'
    });
    const [sending, setSending] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        fetchInvitations();
    }, [userProfile]);

    const fetchInvitations = async () => {
        if (!userProfile?.business_id) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('team_member_invitations')
                .select('*')
                .eq('business_id', userProfile.business_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInvitations(data || []);
        } catch (error) {
            console.error('Error fetching invitations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvitation = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!userProfile?.business_id) {
            setErrorMessage('Business profile required');
            return;
        }

        setSending(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            // Generate invitation code
            const { data: codeData, error: codeError } = await supabase
                .rpc('generate_invitation_code');

            if (codeError) throw codeError;

            const invitationCode = codeData;

            // Create invitation
            const { error: inviteError } = await supabase
                .from('team_member_invitations')
                .insert({
                    business_id: userProfile.business_id,
                    invited_by: userProfile.id,
                    invitation_code: invitationCode,
                    email: inviteForm.email,
                    first_name: inviteForm.firstName,
                    last_name: inviteForm.lastName,
                    role: inviteForm.role,
                    status: 'pending',
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                });

            if (inviteError) {
                if (inviteError.code === '23505') {
                    throw new Error('An invitation has already been sent to this email address');
                }
                throw inviteError;
            }

            setSuccessMessage(`Invitation sent! Share this code: ${invitationCode}`);
            
            // Reset form
            setInviteForm({
                email: '',
                firstName: '',
                lastName: '',
                role: 'technician'
            });

            fetchInvitations();

            setTimeout(() => {
                setShowInviteModal(false);
                setSuccessMessage('');
            }, 3000);

        } catch (error: any) {
            console.error('Error sending invitation:', error);
            setErrorMessage(error.message || 'Failed to send invitation');
        } finally {
            setSending(false);
        }
    };

    const handleRevokeInvitation = async (invitationId: string) => {
        if (!confirm('Revoke this invitation?')) return;

        try {
            const { error } = await supabase
                .from('team_member_invitations')
                .update({ status: 'revoked' })
                .eq('id', invitationId);

            if (error) throw error;

            setSuccessMessage('Invitation revoked');
            fetchInvitations();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error revoking invitation:', error);
            setErrorMessage('Failed to revoke invitation');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Team Invitations</h2>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                    <span className="material-icons mr-2 text-sm">person_add</span>
                    Invite Member
                </button>
            </div>

            {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-700">{successMessage}</p>
                </div>
            )}

            {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{errorMessage}</p>
                </div>
            )}

            <div className="bg-white rounded-lg shadow">
                {invitations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>No invitations sent yet</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {invitations.map(invitation => (
                            <div key={invitation.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">{invitation.first_name} {invitation.last_name}</h3>
                                        <p className="text-sm text-gray-600">{invitation.email}</p>
                                        <p className="text-xs text-gray-500">Code: {invitation.invitation_code}</p>
                                        <p className="text-xs text-gray-400">Status: {invitation.status}</p>
                                    </div>
                                    {invitation.status === 'pending' && (
                                        <button
                                            onClick={() => handleRevokeInvitation(invitation.id)}
                                            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                                        >
                                            Revoke
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showInviteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Invite Team Member</h3>
                        <form onSubmit={handleSendInvitation} className="space-y-4">
                            <input
                                type="email"
                                required
                                placeholder="Email"
                                value={inviteForm.email}
                                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            <input
                                type="text"
                                placeholder="First Name"
                                value={inviteForm.firstName}
                                onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            <input
                                type="text"
                                placeholder="Last Name"
                                value={inviteForm.lastName}
                                onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            <select
                                value={inviteForm.role}
                                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="technician">Technician</option>
                                <option value="sales">Sales</option>
                                <option value="manager">Manager</option>
                            </select>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
                                >
                                    {sending ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
