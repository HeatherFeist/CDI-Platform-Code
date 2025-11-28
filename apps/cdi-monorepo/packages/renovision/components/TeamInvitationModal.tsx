import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import BadgeDisplay from './BadgeDisplay';

interface TeamMember {
    id: string;
    profile_id: string;
    first_name: string;
    last_name: string;
    display_name: string;
    avatar_url?: string;
    skills: string[];
    hourly_rate?: number;
    rating?: number;
    completed_projects?: number;
    badge_tier?: string;
    badge_level?: number;
    badge_icon?: string;
    badge_color?: string;
    is_available_for_work: boolean;
}

interface PortfolioPhoto {
    id: string;
    photo_url: string;
    title: string;
    is_featured: boolean;
}

interface TeamInvitationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (member: TeamMember, taskDetails: InvitationDetails) => void;
    projectTitle: string;
    existingInvites?: string[]; // Already invited profile IDs
}

interface InvitationDetails {
    tasks: string;
    pay_type: 'fixed' | 'hourly' | 'milestone';
    pay_amount: number;
    hourly_rate?: number;
    estimated_hours?: number;
    milestone_description?: string;
    start_date?: string;
    notes?: string;
}

const TeamInvitationModal: React.FC<TeamInvitationModalProps> = ({
    isOpen,
    onClose,
    onInvite,
    projectTitle,
    existingInvites = []
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [memberPortfolio, setMemberPortfolio] = useState<PortfolioPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteDetails, setInviteDetails] = useState<InvitationDetails>({
        tasks: '',
        pay_type: 'hourly',
        pay_amount: 0,
        estimated_hours: 0,
        notes: ''
    });

    const availableSkills = [
        'Carpentry', 'Plumbing', 'Electrical', 'HVAC', 'Roofing', 
        'Painting', 'Drywall', 'Flooring', 'Tiling', 'Landscaping',
        'Masonry', 'Framing', 'Finish Work', 'Kitchen', 'Bathroom'
    ];

    useEffect(() => {
        if (isOpen) {
            fetchAvailableMembers();
        }
    }, [isOpen]);

    useEffect(() => {
        filterMembers();
    }, [searchQuery, selectedSkills, members]);

    const fetchAvailableMembers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('is_available_for_work', true)
                .eq('public_profile', true)
                .not('id', 'in', `(${existingInvites.join(',')})`)
                .order('rating', { ascending: false });

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

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(m => 
                m.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by skills
        if (selectedSkills.length > 0) {
            filtered = filtered.filter(m => 
                m.skills?.some(skill => selectedSkills.includes(skill))
            );
        }

        setFilteredMembers(filtered);
    };

    const toggleSkillFilter = (skill: string) => {
        setSelectedSkills(prev => 
            prev.includes(skill) 
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    const handleSelectMember = async (member: TeamMember) => {
        setSelectedMember(member);
        setShowInviteForm(true);
        
        // Pre-fill hourly rate if available
        if (member.hourly_rate) {
            setInviteDetails(prev => ({
                ...prev,
                hourly_rate: member.hourly_rate,
                pay_amount: member.hourly_rate || 0
            }));
        }

        // Fetch member's portfolio
        try {
            const { data, error } = await supabase
                .from('profile_portfolio')
                .select('id, photo_url, title, is_featured')
                .eq('profile_id', member.profile_id)
                .order('is_featured', { ascending: false })
                .order('display_order')
                .limit(6);

            if (error) throw error;
            setMemberPortfolio(data || []);
        } catch (error) {
            console.error('Error fetching portfolio:', error);
        }
    };

    const calculateTotalPay = () => {
        if (inviteDetails.pay_type === 'hourly' && inviteDetails.hourly_rate && inviteDetails.estimated_hours) {
            return inviteDetails.hourly_rate * inviteDetails.estimated_hours;
        }
        return inviteDetails.pay_amount;
    };

    const handleSendInvite = () => {
        if (!selectedMember) return;

        const totalPay = calculateTotalPay();
        onInvite(selectedMember, {
            ...inviteDetails,
            pay_amount: totalPay
        });

        // Reset
        setSelectedMember(null);
        setShowInviteForm(false);
        setInviteDetails({
            tasks: '',
            pay_type: 'hourly',
            pay_amount: 0,
            estimated_hours: 0,
            notes: ''
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Invite Team Member</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Project: <span className="font-semibold">{projectTitle}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {!showInviteForm ? (
                        <div className="p-6 space-y-6">
                            {/* Search and Filters */}
                            <div className="space-y-4">
                                {/* Search Bar */}
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400">
                                        search
                                    </span>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name..."
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Skill Filters */}
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Filter by Skills:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {availableSkills.map(skill => (
                                            <button
                                                key={skill}
                                                onClick={() => toggleSkillFilter(skill)}
                                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                                    selectedSkills.includes(skill)
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {skill}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Members Grid */}
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <span className="inline-block animate-spin material-icons text-4xl text-blue-600">refresh</span>
                                </div>
                            ) : filteredMembers.length === 0 ? (
                                <div className="text-center py-12">
                                    <span className="material-icons-outlined text-6xl text-gray-400 mb-4">person_search</span>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Members Found</h3>
                                    <p className="text-gray-600">Try adjusting your search or filters</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredMembers.map(member => (
                                        <div
                                            key={member.id}
                                            className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                                            onClick={() => handleSelectMember(member)}
                                        >
                                            {/* Header */}
                                            <div className="flex items-start gap-3 mb-3">
                                                {/* Avatar */}
                                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {member.avatar_url ? (
                                                        <img src={member.avatar_url} alt={member.display_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="material-icons text-3xl text-blue-600">person</span>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-gray-900 truncate">
                                                            {member.display_name || `${member.first_name} ${member.last_name}`}
                                                        </h3>
                                                        {member.badge_tier && (
                                                            <BadgeDisplay
                                                                tierName={member.badge_tier}
                                                                tierLevel={member.badge_level || 1}
                                                                badgeIcon={member.badge_icon || '🥉'}
                                                                badgeColor={member.badge_color || '#CD7F32'}
                                                                size="small"
                                                            />
                                                        )}
                                                    </div>
                                                    
                                                    {/* Rating */}
                                                    {member.rating && (
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <span className="material-icons text-yellow-500 text-sm">star</span>
                                                            <span className="font-semibold">{member.rating.toFixed(1)}</span>
                                                            <span className="text-gray-500">({member.completed_projects || 0} projects)</span>
                                                        </div>
                                                    )}

                                                    {/* Hourly Rate */}
                                                    {member.hourly_rate && (
                                                        <p className="text-lg font-bold text-green-600">
                                                            ${member.hourly_rate}/hr
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Skills */}
                                            {member.skills && member.skills.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {member.skills.slice(0, 3).map(skill => (
                                                        <span
                                                            key={skill}
                                                            className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {member.skills.length > 3 && (
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                            +{member.skills.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Action */}
                                            <button
                                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <span className="material-icons text-sm">person_add</span>
                                                Send Invitation
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Selected Member Info */}
                            {selectedMember && (
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                            {selectedMember.avatar_url ? (
                                                <img src={selectedMember.avatar_url} alt={selectedMember.display_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-icons text-4xl text-blue-600">person</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {selectedMember.display_name || `${selectedMember.first_name} ${selectedMember.last_name}`}
                                                </h3>
                                                {selectedMember.badge_tier && (
                                                    <BadgeDisplay
                                                        tierName={selectedMember.badge_tier}
                                                        tierLevel={selectedMember.badge_level || 1}
                                                        badgeIcon={selectedMember.badge_icon || '🥉'}
                                                        badgeColor={selectedMember.badge_color || '#CD7F32'}
                                                        size="medium"
                                                    />
                                                )}
                                            </div>
                                            {selectedMember.rating && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="material-icons text-yellow-500 text-sm">star</span>
                                                    <span className="font-semibold">{selectedMember.rating.toFixed(1)}</span>
                                                    <span className="text-gray-600">• {selectedMember.completed_projects || 0} completed projects</span>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedMember(null);
                                                setShowInviteForm(false);
                                            }}
                                            className="p-2 hover:bg-blue-200 rounded-full transition-colors"
                                        >
                                            <span className="material-icons">close</span>
                                        </button>
                                    </div>

                                    {/* Portfolio Preview */}
                                    {memberPortfolio.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Portfolio Samples:</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {memberPortfolio.slice(0, 3).map(photo => (
                                                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                                                        <img src={photo.photo_url} alt={photo.title} className="w-full h-full object-cover" />
                                                        {photo.is_featured && (
                                                            <span className="absolute top-1 right-1 material-icons text-yellow-500 text-sm">star</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Invitation Form */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-900">Invitation Details</h3>

                                {/* Tasks Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tasks & Responsibilities <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={inviteDetails.tasks}
                                        onChange={(e) => setInviteDetails({ ...inviteDetails, tasks: e.target.value })}
                                        placeholder="Describe what this team member will be doing (e.g., Install hardwood flooring in living room and hallway, approx 600 sq ft)"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Pay Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Compensation Type <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setInviteDetails({ ...inviteDetails, pay_type: 'hourly' })}
                                            className={`p-3 border-2 rounded-lg font-medium transition-colors ${
                                                inviteDetails.pay_type === 'hourly'
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        >
                                            💰 Hourly
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setInviteDetails({ ...inviteDetails, pay_type: 'fixed' })}
                                            className={`p-3 border-2 rounded-lg font-medium transition-colors ${
                                                inviteDetails.pay_type === 'fixed'
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        >
                                            📋 Fixed Price
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setInviteDetails({ ...inviteDetails, pay_type: 'milestone' })}
                                            className={`p-3 border-2 rounded-lg font-medium transition-colors ${
                                                inviteDetails.pay_type === 'milestone'
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        >
                                            🎯 Milestone
                                        </button>
                                    </div>
                                </div>

                                {/* Compensation Details */}
                                {inviteDetails.pay_type === 'hourly' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Hourly Rate <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                <input
                                                    type="number"
                                                    value={inviteDetails.hourly_rate || ''}
                                                    onChange={(e) => setInviteDetails({ ...inviteDetails, hourly_rate: parseFloat(e.target.value) || 0 })}
                                                    min="0"
                                                    step="0.50"
                                                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">/hr</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Estimated Hours
                                            </label>
                                            <input
                                                type="number"
                                                value={inviteDetails.estimated_hours || ''}
                                                onChange={(e) => setInviteDetails({ ...inviteDetails, estimated_hours: parseFloat(e.target.value) || 0 })}
                                                min="0"
                                                step="0.5"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                {inviteDetails.pay_type === 'fixed' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Fixed Amount <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                            <input
                                                type="number"
                                                value={inviteDetails.pay_amount || ''}
                                                onChange={(e) => setInviteDetails({ ...inviteDetails, pay_amount: parseFloat(e.target.value) || 0 })}
                                                min="0"
                                                step="10"
                                                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {inviteDetails.pay_type === 'milestone' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Milestone Amount <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                <input
                                                    type="number"
                                                    value={inviteDetails.pay_amount || ''}
                                                    onChange={(e) => setInviteDetails({ ...inviteDetails, pay_amount: parseFloat(e.target.value) || 0 })}
                                                    min="0"
                                                    step="10"
                                                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Milestone Description
                                            </label>
                                            <input
                                                type="text"
                                                value={inviteDetails.milestone_description || ''}
                                                onChange={(e) => setInviteDetails({ ...inviteDetails, milestone_description: e.target.value })}
                                                placeholder="e.g., Upon completion of flooring installation"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Total Pay Display */}
                                {inviteDetails.pay_type === 'hourly' && inviteDetails.hourly_rate && inviteDetails.estimated_hours && (
                                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                                        <p className="text-sm text-gray-700 mb-1">Estimated Total Compensation:</p>
                                        <p className="text-3xl font-bold text-green-700">
                                            ${calculateTotalPay().toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            {inviteDetails.hourly_rate} × {inviteDetails.estimated_hours} hours
                                        </p>
                                    </div>
                                )}

                                {/* Expected Start Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Expected Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={inviteDetails.start_date || ''}
                                        onChange={(e) => setInviteDetails({ ...inviteDetails, start_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Additional Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Notes
                                    </label>
                                    <textarea
                                        value={inviteDetails.notes || ''}
                                        onChange={(e) => setInviteDetails({ ...inviteDetails, notes: e.target.value })}
                                        placeholder="Any additional information or requirements..."
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {showInviteForm && (
                    <div className="p-6 border-t flex gap-3">
                        <button
                            onClick={() => {
                                setSelectedMember(null);
                                setShowInviteForm(false);
                            }}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Back to Search
                        </button>
                        <button
                            onClick={handleSendInvite}
                            disabled={!inviteDetails.tasks || inviteDetails.pay_amount <= 0}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                        >
                            <span className="material-icons">send</span>
                            Send Invitation
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamInvitationModal;
