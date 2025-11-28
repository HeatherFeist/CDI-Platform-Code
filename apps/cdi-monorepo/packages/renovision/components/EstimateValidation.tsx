import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import AIJobCostingAssistant from './AIJobCostingAssistant';

interface ValidationResult {
    validation_status: 'passed' | 'warnings' | 'critical_issues';
    quality_score: number;
    team_count: number;
    critical_issues: string[];
    warnings: string[];
    has_all_tasks_assigned: boolean;
    has_all_pay_defined: boolean;
    has_materials_estimated: boolean;
    has_timeline_defined: boolean;
    can_submit: boolean;
    estimate_details: {
        total_amount: number;
        labor_cost: number;
        materials_cost: number;
        team_members: number;
        milestones: number;
    };
}

interface EstimateValidationProps {
    estimateId: string;
    onValidationComplete: (canSubmit: boolean) => void;
    onClose: () => void;
}

const EstimateValidation: React.FC<EstimateValidationProps> = ({
    estimateId,
    onValidationComplete,
    onClose
}) => {
    const [validating, setValidating] = useState(true);
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [aiReport, setAiReport] = useState<string>('');
    const [showJobCosting, setShowJobCosting] = useState(false);
    const [acknowledging, setAcknowledging] = useState(false);

    useEffect(() => {
        runValidation();
    }, [estimateId]);

    const runValidation = async () => {
        setValidating(true);
        try {
            // Run completeness validation
            const { data: validationData, error: validationError } = await supabase
                .rpc('validate_estimate_completeness', {
                    estimate_id_param: estimateId
                });

            if (validationError) throw validationError;

            setValidation(validationData);

            // Get AI report
            const { data: reportData, error: reportError } = await supabase
                .rpc('generate_ai_validation_report', {
                    estimate_id_param: estimateId
                });

            if (reportError) throw reportError;

            setAiReport(reportData);
        } catch (error) {
            console.error('Error running validation:', error);
            alert('Failed to validate estimate. Please try again.');
        } finally {
            setValidating(false);
        }
    };

    const handleAcknowledge = async (proceedAnyway: boolean = false) => {
        if (!validation) return;

        setAcknowledging(true);
        try {
            if (proceedAnyway || validation.can_submit) {
                // Log acknowledgment
                const { error } = await supabase
                    .from('estimate_validations')
                    .insert({
                        estimate_id: estimateId,
                        validation_status: validation.validation_status,
                        overall_score: validation.quality_score,
                        has_all_tasks_assigned: validation.has_all_tasks_assigned,
                        has_all_pay_defined: validation.has_all_pay_defined,
                        has_materials_estimated: validation.has_materials_estimated,
                        has_timeline_defined: validation.has_timeline_defined,
                        ai_suggestions: aiReport,
                        contractor_acknowledged: true,
                        contractor_notes: proceedAnyway ? 'Proceeded despite warnings' : null
                    });

                if (error) throw error;

                onValidationComplete(true);
            } else {
                alert('Please fix critical issues before submitting to client.');
            }
        } catch (error) {
            console.error('Error acknowledging validation:', error);
            alert('Failed to save validation. Please try again.');
        } finally {
            setAcknowledging(false);
        }
    };

    const getStatusColor = () => {
        if (!validation) return 'gray';
        switch (validation.validation_status) {
            case 'passed':
                return 'green';
            case 'warnings':
                return 'yellow';
            case 'critical_issues':
                return 'red';
            default:
                return 'gray';
        }
    };

    const getStatusIcon = () => {
        if (!validation) return 'pending';
        switch (validation.validation_status) {
            case 'passed':
                return 'check_circle';
            case 'warnings':
                return 'warning';
            case 'critical_issues':
                return 'error';
            default:
                return 'pending';
        }
    };

    const getQualityColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (validating) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
                    <span className="inline-block animate-spin material-icons text-6xl text-blue-600 mb-4">refresh</span>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Validating Estimate...</h3>
                    <p className="text-gray-600">AI is checking your estimate for completeness and accuracy</p>
                </div>
            </div>
        );
    }

    if (!validation) {
        return null;
    }

    const statusColor = getStatusColor();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full my-8">
                {/* Header */}
                <div className={`p-6 border-b bg-${statusColor}-50`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className={`material-icons-outlined text-5xl text-${statusColor}-600`}>
                                {getStatusIcon()}
                            </span>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">AI Estimate Validation</h2>
                                <p className="text-sm text-gray-600">Quality check before sending to client</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white rounded-full transition-colors"
                        >
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                </div>

                {/* Quality Score */}
                <div className="p-6 border-b bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Quality Score</h3>
                            <p className="text-sm text-gray-600">Based on completeness and accuracy</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-5xl font-bold ${getQualityColor(validation.quality_score)}`}>
                                {validation.quality_score}
                            </p>
                            <p className="text-sm text-gray-500">out of 100</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${
                                validation.quality_score >= 90
                                    ? 'bg-green-600'
                                    : validation.quality_score >= 70
                                    ? 'bg-yellow-600'
                                    : 'bg-red-600'
                            }`}
                            style={{ width: `${validation.quality_score}%` }}
                        />
                    </div>
                </div>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Critical Issues */}
                    {validation.critical_issues.length > 0 && (
                        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <span className="material-icons-outlined text-3xl text-red-600">error</span>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-red-900 mb-2">🚨 Critical Issues</h3>
                                    <p className="text-sm text-red-700 mb-3">
                                        These must be fixed before submitting to client:
                                    </p>
                                    <ul className="space-y-2">
                                        {validation.critical_issues.map((issue, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="material-icons text-red-600 text-sm mt-0.5">close</span>
                                                <span className="text-sm text-red-800">{issue}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Warnings */}
                    {validation.warnings.length > 0 && (
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <span className="material-icons-outlined text-3xl text-yellow-600">warning</span>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-yellow-900 mb-2">⚠️ Warnings</h3>
                                    <p className="text-sm text-yellow-700 mb-3">
                                        Consider addressing these items:
                                    </p>
                                    <ul className="space-y-2">
                                        {validation.warnings.map((warning, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="material-icons text-yellow-600 text-sm mt-0.5">info</span>
                                                <span className="text-sm text-yellow-800">{warning}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* All Passed */}
                    {validation.validation_status === 'passed' && (
                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <span className="material-icons-outlined text-3xl text-green-600">check_circle</span>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-green-900 mb-2">✅ Ready to Submit!</h3>
                                    <p className="text-sm text-green-700">
                                        Your estimate looks great! All team members are assigned, tasks are defined, and compensation is clear. This is a professional, complete estimate ready for client review.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Checklist */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Completeness Checklist</h3>
                        <div className="space-y-2">
                            <ChecklistItem
                                label="All tasks assigned to team members"
                                checked={validation.has_all_tasks_assigned}
                            />
                            <ChecklistItem
                                label="All compensation defined"
                                checked={validation.has_all_pay_defined}
                            />
                            <ChecklistItem
                                label="Materials estimated"
                                checked={validation.has_materials_estimated}
                            />
                            <ChecklistItem
                                label="Timeline and milestones defined"
                                checked={validation.has_timeline_defined}
                            />
                        </div>
                    </div>

                    {/* Estimate Summary */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Estimate Summary</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Total Amount</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    ${validation.estimate_details.total_amount?.toFixed(2) || '0.00'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Team Members</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {validation.estimate_details.team_members}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Labor Cost</p>
                                <p className="text-lg font-semibold text-gray-700">
                                    ${validation.estimate_details.labor_cost?.toFixed(2) || '0.00'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Materials Cost</p>
                                <p className="text-lg font-semibold text-gray-700">
                                    ${validation.estimate_details.materials_cost?.toFixed(2) || '0.00'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* AI Report */}
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="material-icons text-blue-600">auto_awesome</span>
                            AI Analysis Report
                        </h3>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded">
                            {aiReport}
                        </pre>
                    </div>

                    {/* Optional: Job Costing Assistant */}
                    {validation.warnings.length > 0 && (
                        <button
                            onClick={() => setShowJobCosting(!showJobCosting)}
                            className="w-full text-left bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="material-icons text-3xl">calculate</span>
                                    <div>
                                        <h4 className="font-bold">Verify Pricing with AI Job Costing</h4>
                                        <p className="text-sm text-blue-100">
                                            Check if your pricing is on-target for your market
                                        </p>
                                    </div>
                                </div>
                                <span className="material-icons">
                                    {showJobCosting ? 'expand_less' : 'expand_more'}
                                </span>
                            </div>
                        </button>
                    )}

                    {showJobCosting && (
                        <AIJobCostingAssistant />
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-white transition-colors font-medium"
                    >
                        Go Back & Fix Issues
                    </button>
                    {validation.can_submit && (
                        <button
                            onClick={() => handleAcknowledge(validation.validation_status === 'warnings')}
                            disabled={acknowledging}
                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-gray-300"
                        >
                            {acknowledging ? (
                                <>
                                    <span className="inline-block animate-spin material-icons">refresh</span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons">send</span>
                                    {validation.validation_status === 'passed' ? 'Submit to Client' : 'Submit Anyway'}
                                </>
                            )}
                        </button>
                    )}
                    {!validation.can_submit && (
                        <div className="flex-1 px-4 py-3 bg-gray-300 text-gray-600 rounded-lg text-center font-medium cursor-not-allowed">
                            <span className="material-icons text-sm align-middle mr-1">lock</span>
                            Cannot Submit with Critical Issues
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper Component
const ChecklistItem: React.FC<{ label: string; checked: boolean }> = ({ label, checked }) => (
    <div className="flex items-center gap-2">
        <span className={`material-icons text-lg ${checked ? 'text-green-600' : 'text-gray-400'}`}>
            {checked ? 'check_circle' : 'radio_button_unchecked'}
        </span>
        <span className={`text-sm ${checked ? 'text-gray-900' : 'text-gray-500'}`}>
            {label}
        </span>
    </div>
);

export default EstimateValidation;
