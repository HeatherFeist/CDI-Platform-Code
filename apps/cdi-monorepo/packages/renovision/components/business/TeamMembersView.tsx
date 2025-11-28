import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import GoogleWorkspaceService from '../../services/googleWorkspaceService';

interface TeamMember {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    role: string;
    specialties: string[];
    hourly_rate: number | null;
    is_active: boolean;
    invite_status: 'pending' | 'accepted' | 'declined';
    invited_at: string;
    accepted_at: string | null;
    notes: string | null;
}

export default function TeamMembersView() {
    const { userProfile } = useAuth();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'employee' | 'subcontractor' | 'helper'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');

    // Form state
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'helper',
        specialties: [] as string[],
        hourly_rate: '',
        notes: ''
    });

    const [newSpecialty, setNewSpecialty] = useState('');

    useEffect(() => {
        fetchTeamMembers();
    }, [userProfile]);

    const fetchTeamMembers = async () => {
        if (!userProfile?.business_id) return;

        try {
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .eq('business_id', userProfile.business_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTeamMembers(data || []);
        } catch (error) {
            console.error('Error fetching team members:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateOrgEmail = (firstName: string, lastName: string): string => {
        const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
        const lastInitial = lastName.charAt(0).toLowerCase();
        return `${cleanFirstName}.${lastInitial}@constructivedesignsinc.org`;
    };

    const handleEditMember = (member: TeamMember) => {
        // You can implement edit functionality here or navigate to an edit page
        alert(`Edit feature for ${member.first_name} ${member.last_name} - Coming soon!`);
    };

    const handleDeleteMember = async (member: TeamMember) => {
        const confirmMessage = `⚠️ Delete Team Member?\n\n` +
            `Name: ${member.first_name} ${member.last_name}\n` +
            `Email: ${member.email}\n` +
            `Role: ${member.role}\n\n` +
            `This will:\n` +
            `• Remove them from all projects\n` +
            `• Remove their task assignments\n` +
            `• Delete their Google Workspace account (if exists)\n\n` +
            `This action CANNOT be undone!`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            console.log('Deleting team member:', member.id);

            // Delete the team member (cascading deletes will handle related records)
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', member.id);

            if (error) {
                console.error('Delete error:', error);
                throw error;
            }

            console.log('Team member deleted successfully');
            fetchTeamMembers();
            alert(`✅ ${member.first_name} ${member.last_name} has been removed from the team.`);
        } catch (error: any) {
            console.error('Error deleting team member:', error);
            alert(`❌ Failed to remove team member: ${error.message || 'Please try again.'}`);
        }
    };

    const findDuplicateMembers = (): TeamMember[][] => {
        const duplicates: { [key: string]: TeamMember[] } = {};
        
        teamMembers.forEach(member => {
            const key = `${member.first_name.toLowerCase()}_${member.last_name.toLowerCase()}_${member.email.toLowerCase()}`;
            if (!duplicates[key]) {
                duplicates[key] = [];
            }
            duplicates[key].push(member);
        });

        return Object.values(duplicates).filter(group => group.length > 1);
    };

    const handleRemoveDuplicates = async () => {
        const duplicateGroups = findDuplicateMembers();
        
        if (duplicateGroups.length === 0) {
            alert('✅ No duplicate team members found!');
            return;
        }

        const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + (group.length - 1), 0);
        
        let message = `Found ${duplicateGroups.length} duplicate group(s):\n\n`;
        duplicateGroups.forEach((group, index) => {
            const member = group[0];
            message += `${index + 1}. ${member.first_name} ${member.last_name} (${group.length} copies)\n`;
        });
        message += `\n⚠️ This will delete ${totalDuplicates} duplicate record(s), keeping only 1 copy of each.\n\n`;
        message += `Continue?`;

        if (!confirm(message)) {
            return;
        }

        try {
            let deletedCount = 0;

            for (const group of duplicateGroups) {
                // Keep the first one, delete the rest
                const toDelete = group.slice(1);
                
                for (const duplicate of toDelete) {
                    const { error } = await supabase
                        .from('team_members')
                        .delete()
                        .eq('id', duplicate.id);

                    if (error) {
                        console.error('Error deleting duplicate:', error);
                    } else {
                        deletedCount++;
                    }
                }
            }

            fetchTeamMembers();
            alert(`✅ Successfully removed ${deletedCount} duplicate team member(s)!`);
        } catch (error: any) {
            console.error('Error removing duplicates:', error);
            alert(`❌ Error removing duplicates: ${error.message}`);
        }
    };

    const handleAddTeamMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile?.business_id) {
            alert('Business profile not found. Please complete your business setup first.');
            return;
        }

        try {
            // Generate org email first
            const orgEmail = GoogleWorkspaceService.generateOrgEmail(
                formData.first_name,
                formData.last_name
            );

            // Build insert object, including org_email
            const insertData: any = {
                business_id: userProfile.business_id,
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone || null,
                role: formData.role,
                specialties: formData.specialties,
                hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
                org_email: orgEmail, // Add organization email
            };

            // Only add notes if it has a value (column might not exist in older databases)
            if (formData.notes) {
                insertData.notes = formData.notes;
            }

            // 1. First, create the team member record
            const { data: newMember, error } = await supabase
                .from('team_members')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('✅ Team member created in database:', newMember);

            // 2. Try to create Google Workspace account (non-blocking)
            try {
                console.log('🚀 Creating Google Workspace account...');
                
                // Initiate onboarding workflow
                const workflowId = await GoogleWorkspaceService.initiateOnboarding(
                    newMember.id,
                    userProfile.business_id
                );

                console.log('📝 Onboarding workflow initiated:', workflowId);

                // Create the Google Workspace account
                const workspaceResult = await GoogleWorkspaceService.createWorkspaceAccount({
                    teamMemberId: newMember.id,
                    firstName: formData.first_name,
                    lastName: formData.last_name,
                    orgEmail: orgEmail,
                    personalEmail: formData.email,
                    role: formData.role,
                });

                console.log('✅ Google Workspace account created:', workspaceResult);

                // Complete onboarding step
                await GoogleWorkspaceService.completeOnboardingStep(
                    workflowId,
                    'create_account',
                    'send_welcome_email',
                    { google_user_id: workspaceResult.userId }
                );

                // Show success with credentials
                alert(
                    `✅ Team Member Added Successfully!\n\n` +
                    `Name: ${formData.first_name} ${formData.last_name}\n` +
                    `Organization Email: ${orgEmail}\n` +
                    `Temporary Password: ${workspaceResult.tempPassword}\n\n` +
                    `⚠️ IMPORTANT:\n` +
                    `• Send these credentials to the team member securely\n` +
                    `• They must change password on first login\n` +
                    `• Access to Google Calendar, Drive, and email is now active\n\n` +
                    `(In production, this will be sent automatically via email)`
                );

            } catch (workspaceError: any) {
                console.error('⚠️ Google Workspace setup failed:', workspaceError);
                
                // Team member is created, but Workspace account failed
                // This is okay - they can still work, just without Google integration
                alert(
                    `✅ Team member added to database\n\n` +
                    `⚠️ Google Workspace Account Creation Pending\n\n` +
                    `Organization Email: ${orgEmail}\n` +
                    `Status: Manual setup required\n\n` +
                    `Error: ${workspaceError.message}\n\n` +
                    `Note: Team member can still be assigned to projects. ` +
                    `Google Workspace integration can be set up later.`
                );
            }

            // Reset form and refresh list
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                role: 'helper',
                specialties: [],
                hourly_rate: '',
                notes: ''
            });
            setShowAddModal(false);
            fetchTeamMembers();

        } catch (error: any) {
            console.error('Error adding team member:', error);
            let errorMessage = 'Failed to add team member. ';
            
            if (error.code === 'PGRST301') {
                errorMessage += 'Permission denied. Please check your account permissions.';
            } else if (error.message?.includes('notes')) {
                errorMessage += 'Database schema mismatch. Please run the migration: supabase-migrations/add-team-members-notes-column.sql';
            } else if (error.message?.includes('org_email')) {
                errorMessage += 'Database schema missing org_email column. Please run: SQL Files/add-google-workspace-integration.sql';
            } else if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += 'Please try again or contact support.';
            }
            
            alert(errorMessage);
        }
    };

    const handleToggleActive = async (memberId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('team_members')
                .update({ is_active: !currentStatus })
                .eq('id', memberId);

            if (error) throw error;
            fetchTeamMembers();
        } catch (error) {
            console.error('Error updating team member:', error);
        }
    };

    const addSpecialty = () => {
        if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
            setFormData({
                ...formData,
                specialties: [...formData.specialties, newSpecialty.trim()]
            });
            setNewSpecialty('');
        }
    };

    const removeSpecialty = (specialty: string) => {
        setFormData({
            ...formData,
            specialties: formData.specialties.filter(s => s !== specialty)
        });
    };

    const filteredMembers = teamMembers.filter(member => {
        const roleMatch = filter === 'all' || member.role === filter;
        const statusMatch = statusFilter === 'all' || member.invite_status === statusFilter;
        return roleMatch && statusMatch;
    });

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'employee': return 'bg-blue-100 text-blue-800';
            case 'subcontractor': return 'bg-purple-100 text-purple-800';
            case 'helper': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'accepted': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'declined': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Team Members</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage employees, subcontractors, and helpers for your projects
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleRemoveDuplicates}
                        className="flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                        title="Find and remove duplicate team members"
                    >
                        <span className="material-icons text-sm mr-1">content_copy</span>
                        <span className="hidden md:inline">Remove Duplicates</span>
                        <span className="md:hidden">Duplicates</span>
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <span className="material-icons text-sm mr-2">add</span>
                        Add Member
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Team</p>
                            <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
                        </div>
                        <span className="material-icons text-3xl text-blue-600">group</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Employees</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {teamMembers.filter(m => m.role === 'employee').length}
                            </p>
                        </div>
                        <span className="material-icons text-3xl text-blue-600">badge</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Subcontractors</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {teamMembers.filter(m => m.role === 'subcontractor').length}
                            </p>
                        </div>
                        <span className="material-icons text-3xl text-purple-600">handyman</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending Invites</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {teamMembers.filter(m => m.invite_status === 'pending').length}
                            </p>
                        </div>
                        <span className="material-icons text-3xl text-yellow-600">pending</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border">
                <div className="flex flex-col md:flex-row md:flex-wrap gap-4">
                    <div className="flex-1 min-w-full md:min-w-0">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mb-2">
                            {['all', 'employee', 'subcontractor', 'helper'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                                        filter === f
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 min-w-full md:min-w-0">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mb-2">
                            {['all', 'pending', 'accepted'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s as any)}
                                    className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                                        statusFilter === s
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Members List */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Specialties
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <span className="material-icons text-4xl mb-2 opacity-50">group_off</span>
                                        <p>No team members found</p>
                                        <p className="text-sm mt-1">Add your first team member to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="material-icons text-blue-600">person</span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {member.first_name} {member.last_name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{member.email}</div>
                                            {member.phone && (
                                                <div className="text-sm text-gray-500">{member.phone}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {member.specialties.slice(0, 3).map((specialty, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                                    >
                                                        {specialty}
                                                    </span>
                                                ))}
                                                {member.specialties.length > 3 && (
                                                    <span className="px-2 py-1 text-xs text-gray-500">
                                                        +{member.specialties.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {member.hourly_rate ? `$${member.hourly_rate}/hr` : 'ΓÇö'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(member.invite_status)}`}>
                                                {member.invite_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleEditMember(member)}
                                                    className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1"
                                                    title="Edit member"
                                                >
                                                    <span className="material-icons text-base">edit</span>
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMember(member)}
                                                    className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded flex items-center gap-1"
                                                    title="Delete member"
                                                >
                                                    <span className="material-icons text-base">delete</span>
                                                    <span>Delete</span>
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(member.id, member.is_active)}
                                                    className={`px-3 py-1.5 text-sm text-white rounded flex items-center gap-1 ${
                                                        member.is_active ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'
                                                    }`}
                                                    title={member.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    <span className="material-icons text-base">
                                                        {member.is_active ? 'block' : 'check_circle'}
                                                    </span>
                                                    <span>{member.is_active ? 'Deactivate' : 'Activate'}</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                    {filteredMembers.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500">
                            <span className="material-icons text-4xl mb-2 opacity-50">group_off</span>
                            <p>No team members found</p>
                            <p className="text-sm mt-1">Add your first team member to get started</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredMembers.map((member) => (
                                <div key={member.id} className="p-4 hover:bg-gray-50">
                                    {/* Member Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="material-icons text-blue-600">person</span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {member.first_name} {member.last_name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {generateOrgEmail(member.first_name, member.last_name)}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                                            {member.role}
                                        </span>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="space-y-2 mb-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="material-icons text-gray-400 text-sm">email</span>
                                            <span className="text-gray-700">{member.email}</span>
                                        </div>
                                        {member.phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="material-icons text-gray-400 text-sm">phone</span>
                                                <span className="text-gray-700">{member.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Specialties */}
                                    {member.specialties.length > 0 && (
                                        <div className="mb-3">
                                            <div className="flex flex-wrap gap-1">
                                                {member.specialties.slice(0, 3).map((specialty, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                                    >
                                                        {specialty}
                                                    </span>
                                                ))}
                                                {member.specialties.length > 3 && (
                                                    <span className="px-2 py-1 text-xs text-gray-500">
                                                        +{member.specialties.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Bottom Info & Actions */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-3">
                                            {member.hourly_rate && (
                                                <span className="text-sm font-medium text-gray-900">
                                                    ${member.hourly_rate}/hr
                                                </span>
                                            )}
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(member.invite_status)}`}>
                                                {member.invite_status}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditMember(member)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <span className="material-icons text-sm">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMember(member)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <span className="material-icons text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Team Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 md:p-6">
                            <div className="flex justify-between items-center mb-4 md:mb-6">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Add Team Member</h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleAddTeamMember} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Last Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Role *
                                        </label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="helper">Helper</option>
                                            <option value="employee">Employee</option>
                                            <option value="subcontractor">Subcontractor</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Hourly Rate (optional)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.hourly_rate}
                                                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Specialties
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={newSpecialty}
                                            onChange={(e) => setNewSpecialty(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Plumbing, Electrical, Painting"
                                        />
                                        <button
                                            type="button"
                                            onClick={addSpecialty}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.specialties.map((specialty, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
                                            >
                                                {specialty}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSpecialty(specialty)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <span className="material-icons text-sm">close</span>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Any additional information about this team member..."
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Add Team Member
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
