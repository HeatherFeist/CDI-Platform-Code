import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import BadgeDisplay from '../BadgeDisplay';

interface UserWithStats {
    id: string;
    username: string;
    display_name: string;
    bio?: string;
    avatar_url?: string;
    is_available_for_work: boolean;
    is_seeking_help: boolean;
    skills?: string[];
    hourly_rate?: number;
    rating: number;
    total_projects: number;
    completed_projects: number;
    role: string;
    badge_tier?: string;
    badge_level?: number;
    badge_icon?: string;
    badge_color?: string;
    stats: {
        total_earnings: number;
        projects_as_contractor: number;
        projects_as_team_member: number;
        on_time_completion_rate: number;
        last_active: string;
    };
}

type SortBy = 'rating' | 'projects' | 'earnings' | 'recent';
type FilterBy = 'all' | 'available' | 'seeking_help';

export default function CommunityDirectory() {
    const { userProfile } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserWithStats[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<SortBy>('rating');
    const [filterBy, setFilterBy] = useState<FilterBy>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCommunityUsers();
    }, []);

    useEffect(() => {
        applyFiltersAndSort();
    }, [users, sortBy, filterBy, searchQuery]);

    const fetchCommunityUsers = async () => {
        try {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    user_stats(*),
                    user_badges!inner(
                        tier_name,
                        tier_level,
                        badge_tiers(
                            badge_icon,
                            badge_color
                        )
                    )
                `)
                .eq('public_profile', true)
                .eq('user_badges.is_current', true)
                .order('rating', { ascending: false });

            if (error) throw error;

            const usersData: UserWithStats[] = profiles.map((p: any) => ({
                id: p.id,
                username: p.username,
                display_name: p.display_name || `${p.first_name} ${p.last_name}`,
                bio: p.bio,
                avatar_url: p.avatar_url,
                is_available_for_work: p.is_available_for_work,
                is_seeking_help: p.is_seeking_help,
                skills: p.skills || [],
                hourly_rate: p.hourly_rate,
                rating: p.rating || 0,
                total_projects: p.total_projects || 0,
                completed_projects: p.completed_projects || 0,
                role: p.role,
                badge_tier: p.user_badges?.[0]?.tier_name,
                badge_level: p.user_badges?.[0]?.tier_level,
                badge_icon: p.user_badges?.[0]?.badge_tiers?.badge_icon,
                badge_color: p.user_badges?.[0]?.badge_tiers?.badge_color,
                stats: p.user_stats?.[0] || {
                    total_earnings: 0,
                    projects_as_contractor: 0,
                    projects_as_team_member: 0,
                    on_time_completion_rate: 100,
                    last_active: p.updated_at
                }
            }));

            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFiltersAndSort = () => {
        let filtered = [...users];

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(u => 
                u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Apply availability filter
        if (filterBy === 'available') {
            filtered = filtered.filter(u => u.is_available_for_work);
        } else if (filterBy === 'seeking_help') {
            filtered = filtered.filter(u => u.is_seeking_help);
        }

        // Apply sorting
        switch (sortBy) {
            case 'rating':
                filtered.sort((a, b) => b.rating - a.rating);
                break;
            case 'projects':
                filtered.sort((a, b) => b.completed_projects - a.completed_projects);
                break;
            case 'earnings':
                filtered.sort((a, b) => b.stats.total_earnings - a.stats.total_earnings);
                break;
            case 'recent':
                filtered.sort((a, b) => 
                    new Date(b.stats.last_active).getTime() - new Date(a.stats.last_active).getTime()
                );
                break;
        }

        setFilteredUsers(filtered);
    };

    const handleMessageUser = (userId: string) => {
        navigate(`/messages/${userId}`);
    };

    const getAvailabilityBadge = (user: UserWithStats) => {
        if (user.is_available_for_work && user.is_seeking_help) {
            return { text: 'Open to Both', color: 'bg-purple-100 text-purple-800' };
        } else if (user.is_available_for_work) {
            return { text: 'Available for Work', color: 'bg-green-100 text-green-800' };
        } else if (user.is_seeking_help) {
            return { text: 'Seeking Help', color: 'bg-blue-100 text-blue-800' };
        }
        return { text: 'Busy', color: 'bg-gray-100 text-gray-800' };
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`material-icons text-sm ${
                            star <= rating ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                    >
                        star
                    </span>
                ))}
                <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading community...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Directory</h1>
                <p className="text-gray-600">
                    Connect with contractors, team members, and helpers in the Constructive network
                </p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name, username, or skills..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filter */}
                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value as FilterBy)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Users</option>
                        <option value="available">Available for Work</option>
                        <option value="seeking_help">Seeking Help</option>
                    </select>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="rating">Highest Rated</option>
                        <option value="projects">Most Projects</option>
                        <option value="earnings">Top Earners</option>
                        <option value="recent">Recently Active</option>
                    </select>
                </div>
            </div>

            {/* User Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => {
                    const badge = getAvailabilityBadge(user);
                    const isCurrentUser = user.id === userProfile?.id;

                    return (
                        <div
                            key={user.id}
                            className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${
                                isCurrentUser ? 'ring-2 ring-blue-500' : ''
                            }`}
                        >
                            {/* Avatar and Name */}
                            <div className="flex items-start gap-4 mb-4">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                                    {user.display_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900">{user.display_name}</h3>
                                        {user.badge_tier && (
                                            <BadgeDisplay
                                                tierName={user.badge_tier}
                                                tierLevel={user.badge_level || 1}
                                                badgeIcon={user.badge_icon || '🥉'}
                                                badgeColor={user.badge_color || '#CD7F32'}
                                                size="small"
                                                showLabel={false}
                                            />
                                        )}
                                        {isCurrentUser && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">@{user.username}</p>
                                    {renderStars(user.rating)}
                                </div>
                            </div>

                            {/* Bio */}
                            {user.bio && (
                                <p className="text-sm text-gray-700 mb-4 line-clamp-2">{user.bio}</p>
                            )}

                            {/* Status and Role */}
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${badge.color}`}>
                                    {badge.text}
                                </span>
                                <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-800">
                                    {user.role}
                                </span>
                            </div>

                            {/* Skills */}
                            {user.skills && user.skills.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex flex-wrap gap-2">
                                        {user.skills.slice(0, 3).map((skill, idx) => (
                                            <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                {skill}
                                            </span>
                                        ))}
                                        {user.skills.length > 3 && (
                                            <span className="text-xs text-gray-500">+{user.skills.length - 3} more</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{user.completed_projects}</p>
                                    <p className="text-xs text-gray-600">Projects</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{user.stats.on_time_completion_rate}%</p>
                                    <p className="text-xs text-gray-600">On-Time</p>
                                </div>
                            </div>

                            {/* Hourly Rate */}
                            {user.hourly_rate && (
                                <div className="text-center mb-4 p-2 bg-green-50 rounded">
                                    <p className="text-sm text-green-800">
                                        <span className="font-bold">${user.hourly_rate}/hr</span>
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            {!isCurrentUser && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleMessageUser(user.id)}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-icons text-sm">message</span>
                                        Message
                                    </button>
                                    <button
                                        onClick={() => navigate(`/profile/${user.username}`)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="material-icons text-sm">visibility</span>
                                    </button>
                                </div>
                            )}
                            {isCurrentUser && (
                                <button
                                    onClick={() => navigate('/settings/profile')}
                                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                    <span className="material-icons text-gray-400 text-6xl mb-4">search_off</span>
                    <p className="text-gray-600">No users found matching your criteria</p>
                </div>
            )}
        </div>
    );
}
