import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';

export const LoginPage: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<'admin' | 'manager' | 'technician' | 'sales'>('admin');
    const [businessId, setBusinessId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const { signIn, signUp, resetPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isSignUp) {
                await signUp(email, password, {
                    role,
                    business_id: businessId || undefined,
                    first_name: firstName,
                    last_name: lastName,
                });
                // Show success message
                alert('Account created successfully! Please check your email to verify your account before signing in.');
                // Switch to login mode
                setIsSignUp(false);
                setPassword(''); // Clear password for security
            } else {
                await signIn(email, password);
                navigate('/business/dashboard');
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            console.error('Error details:', {
                message: err.message,
                code: err.code,
                details: err.details,
                hint: err.hint,
                status: err.status
            });
            
            // Provide more helpful error messages
            let errorMessage = err.message || 'An error occurred';
            
            if (errorMessage.includes('duplicate key') || errorMessage.includes('already exists')) {
                errorMessage = 'An account with this email already exists. Please sign in instead.';
            } else if (errorMessage.includes('Invalid login')) {
                errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            } else if (errorMessage.includes('Email not confirmed')) {
                errorMessage = 'Please verify your email address before signing in. Check your inbox for the verification email.';
            } else if (errorMessage.includes('businesses')) {
                errorMessage = `Database setup error with businesses table: ${err.message}. Please contact support.`;
            } else if (errorMessage.includes('Failed to create business')) {
                errorMessage = `Could not create business profile: ${err.message}. This may be a permissions issue.`;
            } else if (errorMessage.includes('profiles')) {
                errorMessage = `Database setup error with user profile: ${err.message}. Please contact support.`;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await resetPassword(email);
            alert('Password reset email sent! Check your inbox.');
            setShowForgotPassword(false);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    if (showForgotPassword) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Reset Password</h2>
                    
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="your@email.com"
                        />
                    </div>

                    <button
                        onClick={handleForgotPassword}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 mb-3"
                    >
                        {loading ? 'Sending...' : 'Send Reset Email'}
                    </button>

                    <button
                        onClick={() => setShowForgotPassword(false)}
                        className="w-full text-gray-600 hover:text-gray-800"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                {/* Logo Section */}
                <div className="text-center mb-6">
                    <div className="inline-block p-3 bg-green-100 rounded-full mb-3">
                        <span className="material-icons text-4xl text-green-600">home_repair_service</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Constructive Home Reno</h1>
                    <p className="text-sm text-gray-600 mt-1">Design, Manage & Grow Your Business</p>
                    <p className="text-xs text-green-600 mt-1 font-medium">Part of the Constructive Designs Network</p>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {isSignUp ? 'Create Account' : 'Sign In'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {isSignUp && (
                        <>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-blue-900">
                                    <span className="material-icons text-sm align-middle mr-1">info</span>
                                    Creating a new business account? Your business profile will be automatically set up.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {isSignUp && (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone (Optional)
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as any)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="admin">Business Owner / Admin</option>
                                    <option value="manager">Manager</option>
                                    <option value="technician">Technician</option>
                                    <option value="sales">Sales</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Choose "Admin" if you're starting a new business
                                </p>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 mb-3"
                    >
                        {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>

                    {!isSignUp && (
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="w-full text-sm text-blue-600 hover:text-blue-700 mb-3"
                        >
                            Forgot Password?
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                        }}
                        className="w-full text-gray-600 hover:text-gray-800"
                    >
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </form>
            </div>
        </div>
    );
};
