import React, { useState, useEffect } from 'react';
import { useBusinessContext } from '../contexts/SupabaseBusinessContext';
import { TeamMember } from '../types/business';
import { supabaseBusinessService } from '../services/supabaseBusinessService';

export const TeamView: React.FC = () => {
    const context = useBusinessContext();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

    useEffect(() => {
        loadTeamMembers();
    }, []);

    const loadTeamMembers = async () => {
        if (!context?.businessId) return;
        setIsLoading(true);
        try {
            const data = await supabaseBusinessService.getTeamMembers(context.businessId);
            setTeamMembers(data);
        } catch (error) {
            console.error('Error loading team members:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMember = () => {
        setSelectedMember(null);
        setShowModal(true);
    };

    const handleEditMember = (member: TeamMember) => {
        setSelectedMember(member);
        setShowModal(true);
    };

    const handleDeleteMember = async (memberId: string) => {
        if (confirm('Are you sure you want to remove this team member?')) {
            try {
                await supabaseBusinessService.deleteTeamMember(memberId);
                loadTeamMembers();
            } catch (error) {
                console.error('Error deleting team member:', error);
                alert('Failed to delete team member');
            }
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800';
            case 'manager': return 'bg-blue-100 text-blue-800';
            case 'technician': return 'bg-green-100 text-green-800';
            case 'sales': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading team members...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                <button
                    onClick={handleAddMember}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    + Add Team Member
                </button>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-500 mb-1">Total Members</div>
                    <div className="text-2xl font-bold text-gray-900">{teamMembers.length}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-500 mb-1">Admins</div>
                    <div className="text-2xl font-bold text-purple-600">
                        {teamMembers.filter(m => m.role === 'admin').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-500 mb-1">Technicians</div>
                    <div className="text-2xl font-bold text-green-600">
                        {teamMembers.filter(m => m.role === 'technician').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-500 mb-1">Active Projects</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {teamMembers.reduce((sum, m) => sum + (m.skills?.length || 0), 0)}
                    </div>
                </div>
            </div>

            {teamMembers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500 mb-4">No team members yet</p>
                    <button
                        onClick={handleAddMember}
                        className="text-blue-600 hover:text-blue-700"
                    >
                        Add your first team member
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamMembers.map((member) => (
                        <div key={member.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {member.firstName} {member.lastName}
                                    </h3>
                                    <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                                        {member.role}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditMember(member)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMember(member.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {member.email}
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {member.phone}
                                </div>
                            </div>

                            {member.skills && member.skills.length > 0 && (
                                <div className="mt-4">
                                    <div className="text-xs font-medium text-gray-500 mb-2">Skills</div>
                                    <div className="flex flex-wrap gap-1">
                                        {member.skills.map((skill, index) => (
                                            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="text-xs text-gray-500">
                                    Skills: <span className="font-semibold text-gray-900">{member.skills?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <TeamMemberModal
                    member={selectedMember}
                    businessId={context?.businessId || ''}
                    onClose={() => {
                        setShowModal(false);
                        loadTeamMembers();
                    }}
                />
            )}
        </div>
    );
};

interface TeamMemberModalProps {
    member: TeamMember | null;
    businessId: string;
    onClose: () => void;
}

const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ member, businessId, onClose }) => {
    const [formData, setFormData] = useState({
        firstName: member?.firstName || '',
        lastName: member?.lastName || '',
        email: member?.email || '',
        phone: member?.phone || '',
        role: member?.role || 'technician',
        businessId: businessId || '',
        skills: member?.skills || [] as string[],
        isActive: member?.isActive ?? true,
    });

    const [newSpecialty, setNewSpecialty] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (member) {
                await supabaseBusinessService.updateTeamMember(member.id, formData);
            } else {
                await supabaseBusinessService.createTeamMember(formData);
            }
            onClose();
        } catch (error) {
            console.error('Error saving team member:', error);
            alert('Failed to save team member');
        }
    };

    const addSpecialty = () => {
        if (newSpecialty.trim()) {
            setFormData({
                ...formData,
                skills: [...formData.skills, newSpecialty.trim()]
            });
            setNewSpecialty('');
        }
    };

    const removeSpecialty = (index: number) => {
        setFormData({
            ...formData,
            skills: formData.skills.filter((_, i) => i !== index)
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">
                        {member ? 'Edit Team Member' : 'New Team Member'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="technician">Technician</option>
                                <option value="sales">Sales</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Specialties
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newSpecialty}
                                    onChange={(e) => setNewSpecialty(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                                    placeholder="Add a specialty"
                                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={addSpecialty}
                                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.skills.map((skill, index) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                        {skill}
                                        <button
                                            type="button"
                                            onClick={() => removeSpecialty(index)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {member ? 'Update' : 'Create'} Member
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
