import React, { useState } from 'react';
import NaturalLanguageEstimateForm from './NaturalLanguageEstimateForm';
import AIGeneratedEstimateReview from './AIGeneratedEstimateReview';
import { GeneratedEstimate } from '../../services/geminiService';
import { Estimate, EstimateItem } from '../../types/business';
import { supabaseBusinessService } from '../../services/supabaseBusinessService';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../supabase';

interface LineItemAssignment {
    lineItemIndex: number;
    teamMemberId: string;
    teamMemberName: string;
    estimatedHours: number;
    payAmount: number;
    notes?: string;
}

interface AIEstimateCreatorProps {
    customerId: string;
    projectId?: string;
    onComplete: (estimate: Estimate) => void;
    onCancel: () => void;
}

type Step = 'input' | 'review' | 'saving';

export const AIEstimateCreator: React.FC<AIEstimateCreatorProps> = ({
    customerId,
    projectId,
    onComplete,
    onCancel
}) => {
    const { userProfile } = useAuth();
    const businessId = userProfile?.business_id;
    const [step, setStep] = useState<Step>('input');
    const [generatedEstimate, setGeneratedEstimate] = useState<GeneratedEstimate | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleEstimateGenerated = (estimate: GeneratedEstimate) => {
        setGeneratedEstimate(estimate);
        setStep('review');
    };

    const handleAcceptEstimate = async (estimate: GeneratedEstimate, assignments?: LineItemAssignment[]) => {
        if (!businessId) {
            setError('Business ID not found');
            return;
        }

        setStep('saving');
        setError(null);

        try {
            // Generate estimate number
            const estimateNumber = `EST-${Date.now()}`;

            // Build comprehensive terms including team assignments
            let termsText = `Project Duration: ${estimate.estimatedDuration} days\n\nMeasurements:\n` +
                Object.entries(estimate.measurements)
                    .filter(([_, value]) => value)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n');

            // Add team assignments to terms if present
            if (assignments && assignments.length > 0) {
                termsText += '\n\n=== TEAM ASSIGNMENTS ===\n';
                assignments.forEach(assignment => {
                    const lineItem = estimate.lineItems[assignment.lineItemIndex];
                    termsText += `\n${assignment.teamMemberName}:\n`;
                    termsText += `  Task: ${lineItem.name}\n`;
                    termsText += `  Description: ${lineItem.description}\n`;
                    termsText += `  Hours: ${assignment.estimatedHours}\n`;
                    termsText += `  Pay: $${assignment.payAmount.toFixed(2)}\n`;
                    if (assignment.notes) {
                        termsText += `  Notes: ${assignment.notes}\n`;
                    }
                });
            }

            // Convert AI estimate to Supabase estimate format
            const estimateData: Omit<Estimate, 'id' | 'createdAt' | 'updatedAt'> = {
                businessId,
                customerId,
                projectId: projectId || undefined,
                estimateNumber,
                title: estimate.projectName,
                description: estimate.projectDescription + '\n\nScope: ' + estimate.scope,
                items: estimate.lineItems.map(item => ({
                    description: `${item.name} - ${item.description} (${item.taskCategory})`,
                    quantity: item.quantity,
                    unitPrice: item.unitCost,
                    total: item.totalCost
                } as EstimateItem)),
                subtotal: estimate.subtotal,
                taxRate: estimate.taxRate,
                taxAmount: estimate.taxAmount,
                total: estimate.total,
                status: 'draft',
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                notes: estimate.notes,
                terms: termsText
            };

            console.log('Creating estimate:', estimateData);

            const createdEstimate = await supabaseBusinessService.createEstimate(estimateData);
            
            console.log('Estimate created successfully:', createdEstimate);

            // Send team member invitations if assignments exist
            if (assignments && assignments.length > 0 && createdEstimate.id) {
                for (const assignment of assignments) {
                    const lineItem = estimate.lineItems[assignment.lineItemIndex];
                    
                    try {
                        await supabase
                            .from('team_member_invitations')
                            .insert({
                                business_id: businessId,
                                team_member_id: assignment.teamMemberId,
                                estimate_id: createdEstimate.id,
                                project_name: estimate.projectName,
                                tasks: [{
                                    name: lineItem.name,
                                    description: lineItem.description,
                                    category: lineItem.taskCategory,
                                    estimated_hours: assignment.estimatedHours,
                                    pay_amount: assignment.payAmount
                                }],
                                total_pay: assignment.payAmount,
                                estimated_hours: assignment.estimatedHours,
                                status: 'pending'
                            });
                        
                        console.log(`Invitation sent to ${assignment.teamMemberName}`);
                    } catch (inviteError) {
                        console.error(`Failed to send invitation to ${assignment.teamMemberName}:`, inviteError);
                        // Continue with other invitations even if one fails
                    }
                }
            }
            
            onComplete(createdEstimate);
        } catch (err) {
            console.error('Failed to create estimate:', err);
            setError(err instanceof Error ? err.message : 'Failed to create estimate');
            setStep('review');
        }
    };

    const handleEdit = () => {
        setGeneratedEstimate(null);
        setStep('input');
    };

    if (step === 'saving') {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
                <p className="text-lg font-semibold text-gray-900">Creating estimate...</p>
                <p className="text-sm text-gray-600 mt-2">This will just take a moment</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                        <span className="material-icons text-red-600 mr-2">error</span>
                        <div>
                            <p className="font-semibold text-red-900">Error</p>
                            <p className="text-red-800">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {step === 'input' && (
                <NaturalLanguageEstimateForm
                    onEstimateGenerated={handleEstimateGenerated}
                    onCancel={onCancel}
                />
            )}

            {step === 'review' && generatedEstimate && (
                <AIGeneratedEstimateReview
                    estimate={generatedEstimate}
                    onAccept={handleAcceptEstimate}
                    onEdit={handleEdit}
                    onCancel={onCancel}
                />
            )}
        </div>
    );
};

export default AIEstimateCreator;
