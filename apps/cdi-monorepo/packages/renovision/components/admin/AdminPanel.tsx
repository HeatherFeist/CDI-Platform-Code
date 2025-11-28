import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface Profile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'manager' | 'technician' | 'sales';
    business_id: string;
    username?: string;
    created_at: string;
    badge_tier?: string;
    rating?: number;
    total_projects?: number;
}

export default function AdminPanel() {
    const { userProfile, isAdmin } = useAuth();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProfiles(data || []);
        } catch (error: any) {
            console.error('Error fetching profiles:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (profileId: string, newRole: 'admin' | 'manager' | 'technician' | 'sales') => {
        setUpdating(profileId);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', profileId);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Role updated successfully!' });
            await fetchProfiles();
        } catch (error: any) {
            console.error('Error updating role:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUpdating(null);
        }
    };

    const deleteProfile = async (profileId: string) => {
        if (!confirm('Are you sure you want to delete this profile? This will also delete the associated auth user and cannot be undone!')) {
            return;
        }

        setDeleting(profileId);
        setMessage(null);

        try {
            // First, delete from auth.users (this will cascade to profiles due to FK constraint)
            const { error: authError } = await supabase.auth.admin.deleteUser(profileId);

            if (authError) throw authError;

            setMessage({ type: 'success', text: 'Profile deleted successfully!' });
            await fetchProfiles();
        } catch (error: any) {
            console.error('Error deleting profile:', error);
            setMessage({ type: 'error', text: `Error: ${error.message}. Note: You need admin access to delete users.` });
        } finally {
            setDeleting(null);
        }
    };

    const filteredProfiles = profiles.filter(profile => {
        const matchesSearch = 
            profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            profile.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            profile.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            profile.username?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = selectedRole === 'all' || profile.role === selectedRole;

        return matchesSearch && matchesRole;
    });

    if (!isAdmin()) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="material-icons text-red-600 text-3xl">lock</span>
                        <h2 className="text-xl font-bold text-red-900">Access Denied</h2>
                    </div>
                    <p className="text-red-700">You must be an admin to access this panel.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-gray-500">Loading admin panel...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-icons text-blue-600 text-4xl">admin_panel_settings</span>
                    Admin Panel
                </h1>
                <p className="text-gray-600 mt-2">Manage user profiles, roles, and permissions</p>
            </div>

            {/* Alert Messages */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg ${
                    message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                    <div className="flex items-center gap-2">
                        <span className={`material-icons ${
                            message.type === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {message.type === 'success' ? 'check_circle' : 'error'}
                        </span>
                        <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                            {message.text}
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Users
                        </label>
                        <div className="relative">
                            <span className="material-icons absolute left-3 top-2.5 text-gray-400">search</span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name, email, or username..."
                                className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Role Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Role
                        </label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="technician">Technician</option>
                            <option value="sales">Sales</option>
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                    <span>Total Users: <strong>{profiles.length}</strong></span>
                    <span>Filtered: <strong>{filteredProfiles.length}</strong></span>
                </div>
            </div>

            {/* Profiles Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Badge
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProfiles.map((profile) => (
                                <tr key={profile.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold">
                                                    {profile.first_name[0]}{profile.last_name[0]}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {profile.first_name} {profile.last_name}
                                                </div>
                                                {profile.username && (
                                                    <div className="text-sm text-gray-500">
                                                        @{profile.username}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{profile.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={profile.role}
                                            onChange={(e) => updateUserRole(profile.id, e.target.value as any)}
                                            disabled={updating === profile.id || profile.id === userProfile?.id}
                                            className={`text-sm px-3 py-1 rounded-full border ${
                                                profile.role === 'admin' ? 'bg-red-50 border-red-200 text-red-700' :
                                                profile.role === 'manager' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                                profile.role === 'technician' ? 'bg-green-50 border-green-200 text-green-700' :
                                                'bg-purple-50 border-purple-200 text-purple-700'
                                            } ${updating === profile.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="manager">Manager</option>
                                            <option value="technician">Technician</option>
                                            <option value="sales">Sales</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm">
                                            {profile.badge_tier && (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    profile.badge_tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                                                    profile.badge_tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                                                    profile.badge_tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {profile.badge_tier?.toUpperCase()}
                                                </span>
                                            )}
                                            {profile.rating && (
                                                <span className="ml-2 text-gray-600">
                                                    ⭐ {profile.rating.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(profile.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => deleteProfile(profile.id)}
                                            disabled={deleting === profile.id || profile.id === userProfile?.id}
                                            className={`text-red-600 hover:text-red-900 flex items-center gap-1 ml-auto ${
                                                (deleting === profile.id || profile.id === userProfile?.id) ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        >
                                            <span className="material-icons text-sm">delete</span>
                                            {deleting === profile.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                        {profile.id === userProfile?.id && (
                                            <span className="text-xs text-gray-500 block mt-1">(Your account)</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredProfiles.length === 0 && (
                    <div className="text-center py-12">
                        <span className="material-icons text-gray-400 text-6xl mb-4">search_off</span>
                        <p className="text-gray-500">No profiles found matching your search</p>
                    </div>
                )}
            </div>

            {/* Warning Notice */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <span className="material-icons text-yellow-600 text-xl">warning</span>
                    <div>
                        <h3 className="font-semibold text-yellow-900 mb-1">Important Notes:</h3>
                        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                            <li>Deleting a profile will also remove the user from authentication</li>
                            <li>You cannot delete your own account while logged in</li>
                            <li>User deletion requires admin privileges in Supabase</li>
                            <li>Role changes take effect immediately</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
