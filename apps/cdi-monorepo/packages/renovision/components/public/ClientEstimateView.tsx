import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';

interface EstimateData {
    id: string;
    estimate_number: string;
    title: string;
    description: string;
    total_amount: number;
    status: string;
    business: {
        name: string;
        description: string;
    };
    customer: {
        first_name: string;
        last_name: string;
        email: string;
    };
    project: {
        id: string;
        name: string;
        description: string;
        location: any;
    };
    team_members: Array<{
        id: string;
        team_member: {
            first_name: string;
            last_name: string;
            role: string;
            specialties: string[];
        };
        tasks: string[];
        pay_amount: number;
        pay_type: string;
        estimated_hours?: number;
        milestones: Array<{
            name: string;
            description: string;
            amount: number;
            due_date: string;
        }>;
        status: string;
    }>;
    photos: Array<{
        id: string;
        photo_type: string;
        original_url: string;
        edited_url: string | null;
        ai_prompt: string | null;
        caption: string | null;
        is_primary: boolean;
    }>;
}

interface ClientEstimateViewProps {
    estimateId: string;
    accessToken?: string; // For public access without login
}

export default function ClientEstimateView({ estimateId, accessToken }: ClientEstimateViewProps) {
    const navigate = useNavigate();
    const [estimate, setEstimate] = useState<EstimateData | null>(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [showFullBreakdown, setShowFullBreakdown] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    useEffect(() => {
        fetchEstimate();
    }, [estimateId]);

    const fetchEstimate = async () => {
        try {
            const { data, error } = await supabase
                .from('estimates')
                .select(`
                    *,
                    business:businesses(*),
                    customer:customers(*),
                    project:projects(*),
                    team_members:project_team_members(
                        *,
                        team_member:team_members(*)
                    ),
                    photos:project_photos(*)
                `)
                .eq('id', estimateId)
                .single();

            if (error) throw error;
            setEstimate(data as any);
        } catch (error) {
            console.error('Error fetching estimate:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!estimate) return;

        if (!confirm('Are you sure you want to approve this estimate? This will move forward with scheduling the project.')) {
            return;
        }

        setApproving(true);
        try {
            // Update estimate status
            const { error: estimateError } = await supabase
                .from('estimates')
                .update({ status: 'approved' })
                .eq('id', estimateId);

            if (estimateError) throw estimateError;

            // Update project status
            const { error: projectError } = await supabase
                .from('projects')
                .update({ status: 'estimated' })
                .eq('id', estimate.project.id);

            if (projectError) throw projectError;

            // Create milestones from team member assignments
            const milestones = estimate.team_members.flatMap(tm => 
                tm.milestones.map(m => ({
                    project_id: estimate.project.id,
                    name: m.name,
                    description: m.description,
                    amount: m.amount,
                    due_date: m.due_date,
                    assigned_to: [tm.id]
                }))
            );

            if (milestones.length > 0) {
                const { error: milestonesError } = await supabase
                    .from('project_milestones')
                    .insert(milestones);

                if (milestonesError) throw milestonesError;
            }

            alert('Estimate approved! Redirecting to schedule your project...');
            
            // Redirect to scheduling
            navigate(`/schedule-project/${estimate.project.id}`);
        } catch (error) {
            console.error('Error approving estimate:', error);
            alert('Failed to approve estimate. Please try again.');
        } finally {
            setApproving(false);
        }
    };

    const calculateBreakdown = () => {
        if (!estimate) return { labor: 0, materials: 0, equipment: 0, permits: 0, contingency: 0 };
        
        const labor = estimate.team_members.reduce((sum, tm) => {
            if (tm.pay_type === 'milestone') {
                return sum + tm.milestones.reduce((mSum, m) => mSum + m.amount, 0);
            }
            return sum + tm.pay_amount;
        }, 0);

        // For demo purposes, estimate other costs as percentages of total
        const materials = estimate.total_amount * 0.35;
        const equipment = estimate.total_amount * 0.08;
        const permits = estimate.total_amount * 0.05;
        const contingency = estimate.total_amount * 0.10;

        return { labor, materials, equipment, permits, contingency };
    };

    const getPrimaryPhoto = () => {
        return estimate?.photos.find(p => p.is_primary) || estimate?.photos[0];
    };

    const getBeforePhotos = () => {
        return estimate?.photos.filter(p => p.photo_type === 'before') || [];
    };

    const getAfterPhotos = () => {
        return estimate?.photos.filter(p => p.photo_type === 'after' || p.photo_type === 'ai_generated') || [];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!estimate) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <span className="material-icons text-6xl text-gray-400 mb-4">error_outline</span>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Estimate Not Found</h2>
                    <p className="text-gray-600">The estimate you're looking for doesn't exist or has been removed.</p>
                </div>
            </div>
        );
    }

    const breakdown = calculateBreakdown();
    const acceptedTeamMembers = estimate.team_members.filter(tm => tm.status === 'accepted');
    const primaryPhoto = getPrimaryPhoto();
    const beforePhotos = getBeforePhotos();
    const afterPhotos = getAfterPhotos();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{estimate.title}</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Estimate #{estimate.estimate_number} • Prepared by {estimate.business.name}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="material-icons text-green-600 text-3xl">verified</span>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Transparent Estimate</p>
                                <p className="text-xs text-gray-600">Full visibility of costs & team</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
                {/* Status Banner */}
                {estimate.status === 'draft' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-start">
                            <span className="material-icons text-blue-600 mr-3 mt-1">info</span>
                            <div>
                                <h3 className="text-lg font-semibold text-blue-900 mb-2">Review Your Estimate</h3>
                                <p className="text-blue-800 mb-4">
                                    This estimate shows you exactly who will work on your project, what they'll do, 
                                    and a complete breakdown of all costs. Take your time to review everything.
                                </p>
                                <button
                                    onClick={handleApprove}
                                    disabled={approving || acceptedTeamMembers.length === 0}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                                >
                                    {approving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Approving...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons text-sm mr-2">check_circle</span>
                                            Approve & Schedule Project
                                        </>
                                    )}
                                </button>
                                {acceptedTeamMembers.length === 0 && (
                                    <p className="text-sm text-blue-700 mt-2">
                                        Waiting for all team members to accept their assignments...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Before & After Photos */}
                {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Visualization</h2>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Before */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                    <span className="material-icons text-blue-600 mr-2">photo_camera</span>
                                    Before
                                </h3>
                                {beforePhotos.length > 0 ? (
                                    <div className="space-y-3">
                                        <img
                                            src={beforePhotos[0].original_url}
                                            alt="Before"
                                            className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => setSelectedPhoto(beforePhotos[0].original_url)}
                                        />
                                        {beforePhotos.length > 1 && (
                                            <div className="grid grid-cols-4 gap-2">
                                                {beforePhotos.slice(1, 5).map((photo, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={photo.original_url}
                                                        alt={`Before ${idx + 2}`}
                                                        className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-90"
                                                        onClick={() => setSelectedPhoto(photo.original_url)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <span className="text-gray-400">No before photos</span>
                                    </div>
                                )}
                            </div>

                            {/* After */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                    <span className="material-icons text-green-600 mr-2">auto_awesome</span>
                                    Expected Result
                                </h3>
                                {afterPhotos.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <img
                                                src={afterPhotos[0].edited_url || afterPhotos[0].original_url}
                                                alt="After"
                                                className="w-full h-64 object-cover rounded-lg border-2 border-green-400 cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => setSelectedPhoto(afterPhotos[0].edited_url || afterPhotos[0].original_url)}
                                            />
                                            {afterPhotos[0].photo_type === 'ai_generated' && (
                                                <span className="absolute top-2 right-2 px-2 py-1 bg-purple-600 text-white text-xs rounded flex items-center">
                                                    <span className="material-icons text-xs mr-1">auto_awesome</span>
                                                    AI Generated
                                                </span>
                                            )}
                                        </div>
                                        {afterPhotos[0].ai_prompt && (
                                            <p className="text-sm text-gray-600 italic">
                                                "{afterPhotos[0].ai_prompt}"
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <span className="text-gray-400">Visualization coming soon</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Project Details */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Details</h2>
                    <div className="prose max-w-none">
                        <p className="text-gray-700">{estimate.description}</p>
                    </div>
                </div>

                {/* Your Team - Full Transparency */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Your Project Team</h2>
                        <div className="flex items-center gap-2 text-green-600">
                            <span className="material-icons">verified</span>
                            <span className="text-sm font-medium">100% Transparent</span>
                        </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start">
                            <span className="material-icons text-green-600 mr-2">info</span>
                            <div className="text-sm text-green-900">
                                <p className="font-medium mb-1">Full Visibility Promise</p>
                                <p className="text-green-800">
                                    We believe in complete transparency. Below, you can see exactly who will work on your project, 
                                    what they'll do, and what they'll be paid. Everyone has agreed to these terms upfront.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {acceptedTeamMembers.map((member, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="material-icons text-white">person</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {member.team_member.first_name} {member.team_member.last_name}
                                                </h3>
                                                <p className="text-sm text-gray-600">{member.team_member.role}</p>
                                                {member.team_member.specialties.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {member.team_member.specialties.map((specialty, sidx) => (
                                                            <span key={sidx} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                                                {specialty}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                Confirmed
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Responsibilities:</h4>
                                                <ul className="space-y-1">
                                                    {member.tasks.map((task, tidx) => (
                                                        <li key={tidx} className="flex items-start text-sm text-gray-600">
                                                            <span className="material-icons text-xs text-green-600 mr-2 mt-0.5">check_circle</span>
                                                            {task}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="flex items-center gap-6 text-sm pt-3 border-t">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-icons text-sm text-gray-400">payments</span>
                                                    <span className="font-semibold text-gray-900">
                                                        ${member.pay_type === 'milestone' 
                                                            ? member.milestones.reduce((sum, m) => sum + m.amount, 0).toLocaleString()
                                                            : member.pay_amount.toLocaleString()
                                                        }
                                                    </span>
                                                    <span className="text-gray-600">
                                                        ({member.pay_type === 'hourly' ? 'Hourly' : member.pay_type === 'milestone' ? 'Milestone-based' : 'Fixed'})
                                                    </span>
                                                </div>
                                                {member.estimated_hours && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-icons text-sm text-gray-400">schedule</span>
                                                        <span className="text-gray-600">{member.estimated_hours} hours estimated</span>
                                                    </div>
                                                )}
                                            </div>

                                            {member.milestones.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Milestones:</h4>
                                                    <div className="space-y-2">
                                                        {member.milestones.map((milestone, midx) => (
                                                            <div key={midx} className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded">
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{milestone.name}</p>
                                                                    <p className="text-xs text-gray-600">{milestone.description}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-semibold text-gray-900">${milestone.amount.toLocaleString()}</p>
                                                                    <p className="text-xs text-gray-600">{new Date(milestone.due_date).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Cost Breakdown</h2>
                        <button
                            onClick={() => setShowFullBreakdown(!showFullBreakdown)}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                            <span className="material-icons text-sm mr-1">
                                {showFullBreakdown ? 'visibility_off' : 'visibility'}
                            </span>
                            {showFullBreakdown ? 'Hide Details' : 'Show Details'}
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-lg">
                            <span className="text-gray-600">Labor (Your Team)</span>
                            <span className="font-semibold text-gray-900">${breakdown.labor.toLocaleString()}</span>
                        </div>
                        
                        {showFullBreakdown && (
                            <>
                                <div className="flex justify-between items-center pl-4 text-sm text-gray-600">
                                    <span>• Materials</span>
                                    <span>${breakdown.materials.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pl-4 text-sm text-gray-600">
                                    <span>• Equipment & Tools</span>
                                    <span>${breakdown.equipment.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pl-4 text-sm text-gray-600">
                                    <span>• Permits & Fees</span>
                                    <span>${breakdown.permits.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pl-4 text-sm text-gray-600">
                                    <span>• Contingency Buffer (10%)</span>
                                    <span>${breakdown.contingency.toLocaleString()}</span>
                                </div>
                            </>
                        )}
                        
                        <div className="border-t-2 pt-4 flex justify-between items-center">
                            <span className="text-2xl font-bold text-gray-900">Total Investment</span>
                            <span className="text-3xl font-bold text-blue-600">${estimate.total_amount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <span className="material-icons text-blue-600 mr-2">savings</span>
                            <div className="text-sm text-blue-900">
                                <p className="font-medium mb-1">Supporting Community Programs</p>
                                <p className="text-blue-800">
                                    5% of platform fees support Constructive Designs Inc.'s nonprofit programs, 
                                    including workforce training and community renovation projects. You're helping 
                                    build stronger communities with your project!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
                    <h2 className="text-2xl font-bold mb-4">Ready to Move Forward?</h2>
                    <div className="space-y-3 mb-6">
                        <div className="flex items-start">
                            <span className="material-icons mr-3 mt-1">check_circle</span>
                            <div>
                                <p className="font-medium">Review Complete</p>
                                <p className="text-blue-100 text-sm">You now have full visibility of your project</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <span className="material-icons mr-3 mt-1">people</span>
                            <div>
                                <p className="font-medium">Team Confirmed</p>
                                <p className="text-blue-100 text-sm">All {acceptedTeamMembers.length} team members have accepted</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <span className="material-icons mr-3 mt-1">event</span>
                            <div>
                                <p className="font-medium">Next: Schedule Your Project</p>
                                <p className="text-blue-100 text-sm">Choose your preferred start date from available options</p>
                            </div>
                        </div>
                    </div>
                    
                    {estimate.status === 'draft' && (
                        <button
                            onClick={handleApprove}
                            disabled={approving || acceptedTeamMembers.length === 0}
                            className="w-full px-6 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 flex items-center justify-center font-semibold text-lg"
                        >
                            {approving ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons mr-2">check_circle</span>
                                    Approve Estimate & Continue to Scheduling
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 py-6">
                    <p className="font-medium">Powered by Constructive Home Reno</p>
                    <p className="mt-1 text-xs">Part of the Constructive Designs Inc. nonprofit network</p>
                    <p className="mt-4">Questions? Contact {estimate.business.name}</p>
                </div>
            </div>

            {/* Photo Modal */}
            {selectedPhoto && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <img 
                        src={selectedPhoto} 
                        alt="Full size" 
                        className="max-w-full max-h-full object-contain"
                    />
                    <button
                        onClick={() => setSelectedPhoto(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300"
                    >
                        <span className="material-icons text-4xl">close</span>
                    </button>
                </div>
            )}
        </div>
    );
}
