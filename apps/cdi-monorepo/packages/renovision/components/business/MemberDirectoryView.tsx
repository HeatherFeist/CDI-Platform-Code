import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface MemberProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    member_since: string;
    business_id: string;
    business_name: string;
    business_address: string;
    business_city: string;
    business_state: string;
    business_zip: string;
    website: string;
    specialties: string[];
    service_area_radius: number;
    logo_url: string;
    average_rating: number;
    review_count: number;
    last_active: string;
}

export default function MemberDirectoryView() {
    const { userProfile } = useAuth();
    const [members, setMembers] = useState<MemberProfile[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<MemberProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        fetchMembers();
    }, []);

    useEffect(() => {
        filterMembers();
    }, [searchQuery, selectedState, selectedSpecialty, members]);

    const fetchMembers = async () => {
        try {
            // Check if user is verified member
            if (!userProfile?.is_verified_member) {
                setLoading(false);
                return;
            }

            // Fetch from member_directory view
            const { data, error } = await supabase
                .from('member_directory')
                .select('*')
                .order('business_name');

            if (error) throw error;

            setMembers(data || []);
            setFilteredMembers(data || []);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterMembers = () => {
        let filtered = [...members];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(member =>
                member.business_name.toLowerCase().includes(query) ||
                member.first_name.toLowerCase().includes(query) ||
                member.last_name.toLowerCase().includes(query) ||
                member.business_city.toLowerCase().includes(query) ||
                member.specialties?.some(s => s.toLowerCase().includes(query))
            );
        }

        // State filter
        if (selectedState) {
            filtered = filtered.filter(member => member.business_state === selectedState);
        }

        // Specialty filter
        if (selectedSpecialty) {
            filtered = filtered.filter(member =>
                member.specialties?.includes(selectedSpecialty)
            );
        }

        setFilteredMembers(filtered);
    };

    const logProfileView = async (viewedMemberId: string) => {
        try {
            await supabase.rpc('log_member_access', {
                p_viewer_id: userProfile?.id,
                p_viewed_id: viewedMemberId,
                p_access_type: 'profile_view'
            });
        } catch (error) {
            console.error('Error logging profile view:', error);
        }
    };

    const handleViewProfile = (member: MemberProfile) => {
        logProfileView(member.id);
        // TODO: Navigate to detailed profile view
        console.log('View profile:', member);
    };

    const getUniqueStates = () => {
        return Array.from(new Set(members.map(m => m.business_state))).sort();
    };

    const getUniqueSpecialties = () => {
        const allSpecialties = members.flatMap(m => m.specialties || []);
        return Array.from(new Set(allSpecialties)).sort();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!userProfile?.is_verified_member) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex">
                        <span className="material-icons text-yellow-600 mr-3 text-3xl">lock</span>
                        <div>
                            <h3 className="text-yellow-800 font-semibold text-lg">Member Verification Required</h3>
                            <p className="text-yellow-700 mt-2">
                                The Member Directory is only accessible to verified Constructive Designs members.
                            </p>
                            <p className="text-yellow-700 mt-2">
                                Complete your business setup and get your @constructivedesignsinc.org email to access the directory.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Member Directory</h1>
                <p className="mt-2 text-gray-600">
                    Connect with {filteredMembers.length} verified contractors in the Constructive Designs network
                </p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 material-icons text-gray-400">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name, business, city, or specialty..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* State Filter */}
                    <div>
                        <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All States</option>
                            {getUniqueStates().map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>

                    {/* Specialty Filter */}
                    <div>
                        <select
                            value={selectedSpecialty}
                            onChange={(e) => setSelectedSpecialty(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Specialties</option>
                            {getUniqueSpecialties().map(specialty => (
                                <option key={specialty} value={specialty}>{specialty}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {filteredMembers.length} of {members.length} members
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <span className="material-icons">grid_view</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <span className="material-icons">view_list</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Members Grid/List */}
            {filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                    <span className="material-icons text-gray-400 text-6xl">person_search</span>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No members found</h3>
                    <p className="mt-2 text-gray-600">Try adjusting your search or filters</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map(member => (
                        <div key={member.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                            {/* Logo/Header */}
                            <div className="h-32 bg-gradient-to-br from-blue-500 to-blue-600 relative">
                                {member.logo_url ? (
                                    <img src={member.logo_url} alt={member.business_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <span className="material-icons text-white text-5xl">business</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 space-y-3">
                                {/* Business Name */}
                                <h3 className="font-semibold text-lg text-gray-900">{member.business_name}</h3>

                                {/* Owner */}
                                <div className="flex items-center text-sm text-gray-600">
                                    <span className="material-icons text-sm mr-1">person</span>
                                    {member.first_name} {member.last_name}
                                </div>

                                {/* Location */}
                                <div className="flex items-center text-sm text-gray-600">
                                    <span className="material-icons text-sm mr-1">location_on</span>
                                    {member.business_city}, {member.business_state}
                                </div>

                                {/* Rating */}
                                {member.review_count > 0 && (
                                    <div className="flex items-center text-sm">
                                        <span className="material-icons text-yellow-500 text-sm mr-1">star</span>
                                        <span className="font-semibold">{member.average_rating.toFixed(1)}</span>
                                        <span className="text-gray-500 ml-1">({member.review_count} reviews)</span>
                                    </div>
                                )}

                                {/* Specialties */}
                                {member.specialties && member.specialties.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {member.specialties.slice(0, 3).map((specialty, idx) => (
                                            <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                {specialty}
                                            </span>
                                        ))}
                                        {member.specialties.length > 3 && (
                                            <span className="text-xs text-gray-500 px-2 py-1">
                                                +{member.specialties.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* View Profile Button */}
                                <button
                                    onClick={() => handleViewProfile(member)}
                                    className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                                >
                                    <span className="material-icons text-sm mr-1">visibility</span>
                                    View Profile
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {filteredMembers.map((member, idx) => (
                        <div key={member.id} className={`p-4 hover:bg-gray-50 ${idx > 0 ? 'border-t' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 flex-1">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                        {member.logo_url ? (
                                            <img src={member.logo_url} alt={member.business_name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="material-icons text-white text-2xl">business</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{member.business_name}</h3>
                                        <p className="text-sm text-gray-600">{member.first_name} {member.last_name}</p>
                                        <p className="text-sm text-gray-500">{member.business_city}, {member.business_state}</p>
                                    </div>
                                    {member.review_count > 0 && (
                                        <div className="text-right">
                                            <div className="flex items-center text-sm">
                                                <span className="material-icons text-yellow-500 text-sm mr-1">star</span>
                                                <span className="font-semibold">{member.average_rating.toFixed(1)}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">{member.review_count} reviews</p>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleViewProfile(member)}
                                    className="ml-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    View Profile
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
