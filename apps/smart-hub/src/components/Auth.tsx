import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, ArrowRight, Loader, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Auth: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl float"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-3xl float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo and Back Button */}
                <div className="text-center mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors mb-6 font-semibold"
                    >
                        <ArrowRight size={18} className="rotate-180" />
                        <span>Back to Home</span>
                    </button>
                </div>

                {/* Auth Card */}
                <div className="card-glass p-10 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 p-4 rounded-2xl w-fit mx-auto mb-6 shadow-lg glow-indigo">
                            <Building2 className="text-white" size={40} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-50 mb-3">
                            Welcome <span className="gradient-text">Back</span>
                        </h1>
                        <p className="text-slate-400 text-lg">Sign in to access your ecosystem</p>
                    </div>

                    {error && (
                        <div className="mb-8 bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-2xl text-sm font-medium backdrop-blur-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-3">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={22} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl pl-14 pr-4 py-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-sm font-medium"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-3">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={22} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl pl-14 pr-4 py-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-sm font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin" size={22} />
                                    <span className="font-bold">Signing In...</span>
                                </>
                            ) : (
                                <>
                                    <span className="font-bold">Sign In</span>
                                    <ArrowRight size={22} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center space-y-4">
                        <a href="#" className="block text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
                            Forgot your password?
                        </a>
                        <div className="pt-6 border-t border-slate-800/50">
                            <p className="text-slate-500 text-sm mb-4">Don't have an account?</p>
                            <button className="btn-secondary w-full py-4 font-bold flex items-center justify-center gap-2">
                                <Sparkles size={18} />
                                <span>Create Account</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm mb-4">Trusted by nonprofits and communities</p>
                    <div className="flex items-center justify-center gap-6 text-slate-600">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-xs font-semibold">Secure</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            <span className="text-xs font-semibold">Private</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                            <span className="text-xs font-semibold">AI-Powered</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
