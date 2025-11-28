import React, { useState } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../supabase';
import BadgeProgress from '../BadgeProgress';

export default function ProfileSettings() {
    const { userProfile, updateUserRole, currentContext, availableContexts } = useAuth();
    const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'technician' | 'sales'>(userProfile?.role || 'admin');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // New profile fields
    const [displayName, setDisplayName] = useState(userProfile?.display_name || '');
    const [bio, setBio] = useState(userProfile?.bio || '');
    const [isAvailableForWork, setIsAvailableForWork] = useState(userProfile?.is_available_for_work || false);
    const [isSeekingHelp, setIsSeekingHelp] = useState(userProfile?.is_seeking_help || false);
    const [hourlyRate, setHourlyRate] = useState(userProfile?.hourly_rate?.toString() || '');
    const [skills, setSkills] = useState<string[]>(userProfile?.skills || []);
    const [newSkill, setNewSkill] = useState('');

    const roles = [
        { value: 'admin', label: 'Admin', description: 'Full access to all features and settings', icon: 'admin_panel_settings' },
        { value: 'manager', label: 'Manager', description: 'Manage projects, team members, and estimates', icon: 'supervisor_account' },
        { value: 'technician', label: 'Technician', description: 'View and complete assigned tasks', icon: 'construction' },
        { value: 'sales', label: 'Sales', description: 'Create estimates and manage customer relationships', icon: 'point_of_sale' },
    ];

    const handleSaveRole = async () => {
        setIsSaving(true);
        setMessage(null);

        try {
            await updateUserRole(selectedRole);
            setMessage({ type: 'success', text: 'Role updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update role' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!userProfile) return;
        
        setIsSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: displayName,
                    bio: bio,
                    is_available_for_work: isAvailableForWork,
                    is_seeking_help: isSeekingHelp,
                    hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
                    skills: skills
                })
                .eq('id', userProfile.id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            // Reload page to refresh profile
            setTimeout(() => window.location.reload(), 1000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setIsSaving(false);
        }
    };

    const addSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const getContextBadgeColor = (context: string) => {
        switch (context) {
            case 'business_owner': return 'bg-blue-100 text-blue-800';
            case 'contractor': return 'bg-purple-100 text-purple-800';
            case 'team_member': return 'bg-green-100 text-green-800';
            case 'subcontractor': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-600 mt-1">Manage your role and access permissions</p>
            </div>

            {/* User Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <p className="text-gray-900">{userProfile?.email}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Username</label>
                        <p className="text-gray-900">@{userProfile?.username}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">User ID</label>
                        <p className="text-sm text-gray-600 font-mono">{userProfile?.id}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Current Context</label>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getContextBadgeColor(currentContext)}`}>
                            {currentContext.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Public Profile Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Public Profile</h2>
                <p className="text-sm text-gray-600 mb-6">
                    This information will be visible in the Community Directory to help others find and connect with you.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell others about your experience and what you do..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (Optional)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">/hr</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Skills & Specialties</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                placeholder="Add a skill (e.g., Plumbing, Electrical, etc.)"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={addSkill}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                >
                                    {skill}
                                    <button
                                        onClick={() => removeSkill(skill)}
                                        className="hover:text-blue-900"
                                    >
                                        <span className="material-icons text-sm">close</span>
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Availability Status</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    checked={isAvailableForWork}
                                    onChange={(e) => setIsAvailableForWork(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <div>
                                    <p className="font-medium text-gray-900">Available for Work</p>
                                    <p className="text-sm text-gray-600">Let others know you're open to new projects</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    checked={isSeekingHelp}
                                    onChange={(e) => setIsSeekingHelp(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                                <div>
                                    <p className="font-medium text-gray-900">Seeking Help</p>
                                    <p className="text-sm text-gray-600">Show that you need team members for projects</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </div>

            {/* Available Contexts */}
            {availableContexts.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Contexts</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        You have access to multiple contexts. Switch between them using the context switcher in the sidebar.
                    </p>
                    <div className="space-y-2">
                        {availableContexts.map((ctx, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">{ctx.label}</p>
                                    <p className="text-sm text-gray-600">{ctx.context.replace('_', ' ')}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getContextBadgeColor(ctx.context)}`}>
                                    {ctx.context === currentContext ? 'Active' : 'Available'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Role Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Primary Role</h2>
                <p className="text-sm text-gray-600 mb-6">
                    Your primary role determines your default permissions. This is different from your context—contexts 
                    are about <strong>what you're working on</strong> (your business vs. someone else's project), 
                    while roles are about <strong>permission levels</strong>.
                </p>

                <div className="space-y-3 mb-6">
                    {roles.map((role) => (
                        <label
                            key={role.value}
                            className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedRole === role.value
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            <input
                                type="radio"
                                name="role"
                                value={role.value}
                                checked={selectedRole === role.value}
                                onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'manager' | 'technician' | 'sales')}
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`material-icons text-sm ${
                                        selectedRole === role.value ? 'text-blue-600' : 'text-gray-600'
                                    }`}>
                                        {role.icon}
                                    </span>
                                    <span className={`font-medium ${
                                        selectedRole === role.value ? 'text-blue-900' : 'text-gray-900'
                                    }`}>
                                        {role.label}
                                    </span>
                                </div>
                                <p className={`text-sm ${
                                    selectedRole === role.value ? 'text-blue-700' : 'text-gray-600'
                                }`}>
                                    {role.description}
                                </p>
                            </div>
                            {selectedRole === role.value && (
                                <span className="material-icons text-blue-600">check_circle</span>
                            )}
                        </label>
                    ))}
                </div>

                {message && (
                    <div className={`mb-4 p-4 rounded-lg ${
                        message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                        <div className="flex items-center gap-2">
                            <span className="material-icons text-sm">
                                {message.type === 'success' ? 'check_circle' : 'error'}
                            </span>
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleSaveRole}
                    disabled={isSaving || selectedRole === userProfile?.role}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    {isSaving ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin material-icons text-sm">refresh</span>
                            Saving...
                        </span>
                    ) : selectedRole === userProfile?.role ? (
                        'Role is up to date'
                    ) : (
                        'Update Role'
                    )}
                </button>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                    <span className="material-icons text-blue-600">info</span>
                    <div>
                        <h3 className="font-medium text-blue-900 mb-1">Understanding Roles vs. Contexts</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• <strong>Role:</strong> Your permission level (admin, manager, technician, sales)</li>
                            <li>• <strong>Context:</strong> What you're currently doing (managing your business or working on someone else's project)</li>
                            <li>• You can be an admin for your own business and a team member on another project</li>
                            <li>• Switch contexts anytime using the context switcher in the sidebar</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Badge Progress Section */}
            {userProfile && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="material-icons-outlined">emoji_events</span>
                        Your Badge Progress
                    </h2>
                    <BadgeProgress userId={userProfile.id} />
                </div>
            )}
        </div>
    );
}
