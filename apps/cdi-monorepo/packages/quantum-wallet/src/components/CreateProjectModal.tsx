import React, { useState } from 'react';
import { supabase } from '../supabase';
import { X } from 'lucide-react';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        tagline: '',
        description: '',
        fundingGoal: '',
        cashtag: '',
        paypalUrl: '',
        redemptionPolicy: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Create slug from name
            const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            const { error } = await supabase
                .from('projects')
                .insert({
                    name: form.name,
                    slug,
                    tagline: form.tagline,
                    description: form.description,
                    funding_goal: parseFloat(form.fundingGoal),
                    funds_raised: 0,
                    payment_cashtag: form.cashtag || null,
                    payment_paypal_url: form.paypalUrl || null,
                    redemption_policy: form.redemptionPolicy,
                    status: 'draft',
                    user_id: user.id
                });

            if (error) throw error;

            // Reset form
            setForm({
                name: '',
                tagline: '',
                description: '',
                fundingGoal: '',
                cashtag: '',
                paypalUrl: '',
                redemptionPolicy: ''
            });

            onSuccess();
            onClose();
            alert('Project created successfully!');
        } catch (error: any) {
            console.error('Error creating project:', error);
            alert(error.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-2xl max-w-2xl w-full p-8 border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Create Merchant Coin Project</h2>
                        <p className="text-sm text-slate-400 mt-1">Launch a crowdfunding campaign that issues merchant coins</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Project Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Project Name *
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                            placeholder="e.g., Dayton Micro-Farms"
                        />
                    </div>

                    {/* Tagline */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Tagline *
                        </label>
                        <input
                            type="text"
                            value={form.tagline}
                            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                            placeholder="e.g., Superfoods in the City"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description *
                        </label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            required
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                            placeholder="Describe your business idea..."
                        />
                    </div>

                    {/* Funding Goal */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Funding Goal (USD) *
                        </label>
                        <input
                            type="number"
                            value={form.fundingGoal}
                            onChange={(e) => setForm({ ...form, fundingGoal: e.target.value })}
                            required
                            min="1"
                            step="0.01"
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                            placeholder="2000.00"
                        />
                    </div>

                    {/* Payment Methods */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Cash App Tag
                            </label>
                            <input
                                type="text"
                                value={form.cashtag}
                                onChange={(e) => setForm({ ...form, cashtag: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                                placeholder="$YourCashTag"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                PayPal URL
                            </label>
                            <input
                                type="url"
                                value={form.paypalUrl}
                                onChange={(e) => setForm({ ...form, paypalUrl: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                                placeholder="https://paypal.me/..."
                            />
                        </div>
                    </div>

                    {/* Redemption Policy */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Redemption Policy *
                        </label>
                        <textarea
                            value={form.redemptionPolicy}
                            onChange={(e) => setForm({ ...form, redemptionPolicy: e.target.value })}
                            required
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                            placeholder="e.g., 1 coin = $1 off, max 50% of total purchase"
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-indigo-900/20 border border-indigo-800 rounded-lg p-4">
                        <p className="text-sm text-indigo-200">
                            <strong>How it works:</strong> When people donate to your project, they automatically receive merchant coins equal to their donation amount. These coins can be redeemed at your business according to your redemption policy.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
