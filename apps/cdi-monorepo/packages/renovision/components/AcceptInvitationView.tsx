import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';

interface InvitationDetails {
    id: string;
    business_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    status: string;
    expires_at: string;
    business_name: string;
    inviter_name: string;
}

export default function AcceptInvitationView() {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { user, userProfile, signUp, signIn } = useAuth();
    const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'check' | 'signup' | 'signin'>('check');
    
    // Form state
    const [signupForm, setSignupForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
    });
    const [signinForm, setSigninForm] = useState({
        email: '',
        password: ''
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchInvitation();
    }, [code]);

    useEffect(() => {
        // If user is logged in, check if they can accept
        if (user && invitation && mode === 'check') {
            checkAndAccept();
        }
    }, [user, invitation]);

    const fetchInvitation = async () => {
        if (!code) {
            setError('Invalid invitation code');
            setLoading(false);
            return;
        }

        try {
            const { data, error: fetchError } = await supabase
                .from('team_member_invitations')
                .select(`
                    *,
                    businesses:business_id(business_name),
                    inviter:invited_by(first_name, last_name)
                `)
                .eq('invitation_code', code)
                .eq('status', 'pending')
                .gt('expires_at', new Date().toISOString())
                .single();

            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    setError('This invitation is invalid, expired, or has already been used.');
                } else {
                    throw fetchError;
                }
                setLoading(false);
                return;
            }

            setInvitation({
                ...data,
                business_name: data.businesses?.business_name || 'Unknown Business',
                inviter_name: `${data.inviter?.first_name || ''} ${data.inviter?.last_name || ''}`.trim()
            });

            // Pre-fill signup form
            setSignupForm(prev => ({
                ...prev,
                email: data.email,
                firstName: data.first_name || '',
                lastName: data.last_name || ''
            }));

        } catch (error) {
            console.error('Error fetching invitation:', error);
            setError('Failed to load invitation');
        } finally {
            setLoading(false);
        }
    };

    const checkAndAccept = async () => {
        if (!user || !invitation) return;

        // Check if user's email matches invitation
        const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', user.id)
            .single();

        if (profile?.email === invitation.email) {
            await acceptInvitation(user.id);
        } else {
            setError('This invitation was sent to a different email address. Please sign out and create a new account.');
        }
    };

    const acceptInvitation = async (userId: string) => {
        if (!invitation) return;

        try {
            // Update invitation status
            const { error: updateError } = await supabase
                .from('team_member_invitations')
                .update({
                    status: 'accepted',
                    accepted_by: userId,
                    accepted_at: new Date().toISOString()
                })
                .eq('id', invitation.id);

            if (updateError) throw updateError;

            // Update user profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    business_id: invitation.business_id,
                    role: invitation.role,
                    user_type: 'team_member'
                })
                .eq('id', userId);

            if (profileError) throw profileError;

            // Create permissions based on role
            const { error: permError } = await supabase
                .from('team_member_permissions')
                .insert({
                    profile_id: userId,
                    business_id: invitation.business_id,
                    ...getDefaultPermissions(invitation.role)
                });

            if (permError && permError.code !== '23505') throw permError; // Ignore duplicate

            // Success! Navigate to dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Error accepting invitation:', error);
            setError('Failed to accept invitation. Please try again.');
        }
    };

    const getDefaultPermissions = (role: string) => {
        switch (role) {
            case 'manager':
                return {
                    can_view_estimates: true,
                    can_create_estimates: true,
                    can_edit_estimates: true,
                    can_view_customers: true,
                    can_create_customers: true,
                    can_edit_customers: true,
                    can_view_team: true,
                    can_manage_team: true
                };
            case 'sales':
                return {
                    can_view_estimates: true,
                    can_create_estimates: true,
                    can_edit_estimates: true,
                    can_view_customers: true,
                    can_create_customers: true,
                    can_edit_customers: true,
                    can_view_team: true,
                    can_manage_team: false
                };
            case 'technician':
            default:
                return {
                    can_view_estimates: true,
                    can_view_customers: true,
                    can_view_team: true
                };
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (signupForm.password !== signupForm.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setProcessing(true);
        setError('');

        try {
            const { error: signupError } = await signUp(
                signupForm.email,
                signupForm.password,
                signupForm.firstName,
                signupForm.lastName
            );

            if (signupError) throw signupError;

            // After signup, user should be logged in, trigger acceptance
            // (handled by useEffect watching user state)
        } catch (error: any) {
            console.error('Signup error:', error);
            setError(error.message || 'Failed to create account');
        } finally {
            setProcessing(false);
        }
    };

    const handleSignin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setProcessing(true);
        setError('');

        try {
            await signIn(signinForm.email, signinForm.password);
            // After signin, trigger acceptance (handled by useEffect)
        } catch (error: any) {
            console.error('Signin error:', error);
            setError(error.message || 'Failed to sign in');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error && !invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                        <span className="material-icons text-red-500 text-6xl">error_outline</span>
                        <h2 className="mt-4 text-xl font-bold text-gray-900">Invalid Invitation</h2>
                        <p className="mt-2 text-gray-600">{error}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Go to Homepage
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!invitation) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                {/* Invitation Details */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <span className="material-icons text-blue-600 text-3xl">mail</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">You're Invited!</h1>
                    <p className="mt-2 text-gray-600">
                        <strong>{invitation.inviter_name}</strong> has invited you to join
                    </p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                        {invitation.business_name}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        as a <span className="capitalize font-medium">{invitation.role}</span>
                    </p>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {user ? (
                    /* Already logged in */
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">Click below to accept this invitation</p>
                        <button
                            onClick={() => acceptInvitation(user.id)}
                            disabled={processing}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                        >
                            {processing ? 'Accepting...' : 'Accept Invitation'}
                        </button>
                    </div>
                ) : (
                    /* Not logged in - show signup/signin options */
                    <div className="space-y-4">
                        {mode === 'check' && (
                            <div className="space-y-3">
                                <button
                                    onClick={() => setMode('signup')}
                                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                                >
                                    Create Account & Accept
                                </button>
                                <button
                                    onClick={() => setMode('signin')}
                                    className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                                >
                                    Sign In to Existing Account
                                </button>
                            </div>
                        )}

                        {mode === 'signup' && (
                            <form onSubmit={handleSignup} className="space-y-4">
                                <input
                                    type="email"
                                    required
                                    value={signupForm.email}
                                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                                    placeholder="Email"
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        required
                                        value={signupForm.firstName}
                                        onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })}
                                        placeholder="First Name"
                                        className="px-4 py-2 border rounded-lg"
                                    />
                                    <input
                                        type="text"
                                        required
                                        value={signupForm.lastName}
                                        onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })}
                                        placeholder="Last Name"
                                        className="px-4 py-2 border rounded-lg"
                                    />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={signupForm.password}
                                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                                    placeholder="Password"
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                                <input
                                    type="password"
                                    required
                                    value={signupForm.confirmPassword}
                                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                                    placeholder="Confirm Password"
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                                >
                                    {processing ? 'Creating Account...' : 'Create Account & Accept'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('check')}
                                    className="w-full text-sm text-gray-600 hover:text-gray-900"
                                >
                                    ← Back
                                </button>
                            </form>
                        )}

                        {mode === 'signin' && (
                            <form onSubmit={handleSignin} className="space-y-4">
                                <input
                                    type="email"
                                    required
                                    value={signinForm.email}
                                    onChange={(e) => setSigninForm({ ...signinForm, email: e.target.value })}
                                    placeholder="Email"
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                                <input
                                    type="password"
                                    required
                                    value={signinForm.password}
                                    onChange={(e) => setSigninForm({ ...signinForm, password: e.target.value })}
                                    placeholder="Password"
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                                >
                                    {processing ? 'Signing In...' : 'Sign In & Accept'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('check')}
                                    className="w-full text-sm text-gray-600 hover:text-gray-900"
                                >
                                    ← Back
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
