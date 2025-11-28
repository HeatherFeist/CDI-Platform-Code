import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface TaskCostTemplate {
    id: string;
    task_name: string;
    task_category: string;
    description: string;
    unit_type: string;
    base_labor_cost: number;
    base_material_cost: number;
    hours_per_unit: number;
    difficulty_level: number;
    typical_crew_size?: number;
}

interface MarketRateResult {
    suggested_total: number;
    labor_cost: number;
    material_cost: number;
    equipment_cost: number;
    total_with_waste: number;
    explanation: string;
}

interface AIJobCostingProps {
    taskDescription?: string;
    userEstimate?: number;
    quantity?: number;
    zipCode?: string;
    onCostSuggestion?: (suggestion: MarketRateResult, variance: number) => void;
}

const AIJobCostingAssistant: React.FC<AIJobCostingProps> = ({
    taskDescription = '',
    userEstimate = 0,
    quantity = 1,
    zipCode = '45401', // Default to Dayton
    onCostSuggestion
}) => {
    const [selectedTask, setSelectedTask] = useState<string>('');
    const [taskTemplates, setTaskTemplates] = useState<TaskCostTemplate[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<MarketRateResult | null>(null);
    const [variance, setVariance] = useState<number>(0);
    const [localZipCode, setLocalZipCode] = useState(zipCode);
    const [localQuantity, setLocalQuantity] = useState(quantity);
    const [localUserEstimate, setLocalUserEstimate] = useState(userEstimate);
    const [showAssistant, setShowAssistant] = useState(false);

    useEffect(() => {
        fetchCategories();
        fetchTaskTemplates();
    }, []);

    useEffect(() => {
        if (selectedTask && localQuantity > 0 && localZipCode) {
            analyzeCustomCost();
        }
    }, [selectedTask, localQuantity, localZipCode]);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('task_cost_templates')
                .select('task_category')
                .eq('is_active', true);

            if (error) throw error;

            const uniqueCategories = Array.from(new Set(data?.map(t => t.task_category) || [])) as string[];
            setCategories(uniqueCategories.sort());
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchTaskTemplates = async (category?: string) => {
        try {
            let query = supabase
                .from('task_cost_templates')
                .select('*')
                .eq('is_active', true);

            if (category) {
                query = query.eq('task_category', category);
            }

            const { data, error } = await query.order('task_name');

            if (error) throw error;
            setTaskTemplates(data || []);
        } catch (error) {
            console.error('Error fetching task templates:', error);
        }
    };

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setSelectedTask('');
        setAnalysis(null);
        fetchTaskTemplates(category);
    };

    const analyzeCustomCost = async () => {
        if (!selectedTask || localQuantity <= 0) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .rpc('calculate_market_rate', {
                    task_template_id_param: selectedTask,
                    quantity_param: localQuantity,
                    zip_code_param: localZipCode
                });

            if (error) throw error;

            const result = data[0] as MarketRateResult;
            setAnalysis(result);

            // Calculate variance percentage
            if (localUserEstimate > 0) {
                const varianceCalc = ((localUserEstimate - result.suggested_total) / result.suggested_total) * 100;
                setVariance(varianceCalc);

                if (onCostSuggestion) {
                    onCostSuggestion(result, varianceCalc);
                }
            }
        } catch (error) {
            console.error('Error analyzing cost:', error);
        } finally {
            setLoading(false);
        }
    };

    const getVarianceStatus = () => {
        const absVariance = Math.abs(variance);
        if (absVariance < 10) {
            return {
                color: 'text-green-700 bg-green-50 border-green-300',
                icon: 'check_circle',
                label: 'On Target',
                message: 'Your estimate is within market range! 🎯'
            };
        } else if (variance > 0) {
            return {
                color: 'text-orange-700 bg-orange-50 border-orange-300',
                icon: 'trending_up',
                label: `${absVariance.toFixed(1)}% Higher`,
                message: `Your estimate is ${absVariance.toFixed(1)}% above market rate. ⚠️ You may struggle to win bids at this price.`
            };
        } else {
            return {
                color: 'text-red-700 bg-red-50 border-red-300',
                icon: 'trending_down',
                label: `${absVariance.toFixed(1)}% Lower`,
                message: `Your estimate is ${absVariance.toFixed(1)}% below market rate. ⚠️ You may be underpricing and losing profit.`
            };
        }
    };

    const selectedTemplate = taskTemplates.find(t => t.id === selectedTask);

    return (
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
            {/* Header */}
            <button
                onClick={() => setShowAssistant(!showAssistant)}
                className="w-full flex items-center justify-between text-left"
            >
                <div className="flex items-center gap-2">
                    <span className="material-icons-outlined text-blue-600 text-2xl">calculate</span>
                    <div>
                        <h3 className="font-bold text-blue-900">AI Job Costing Assistant</h3>
                        <p className="text-sm text-blue-700">Get instant market-rate pricing for your zip code</p>
                    </div>
                </div>
                <span className="material-icons text-blue-600">
                    {showAssistant ? 'expand_less' : 'expand_more'}
                </span>
            </button>

            {showAssistant && (
                <div className="mt-4 space-y-4">
                    {/* Zip Code Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Zip Code
                        </label>
                        <input
                            type="text"
                            value={localZipCode}
                            onChange={(e) => setLocalZipCode(e.target.value)}
                            placeholder="e.g., 45401"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            maxLength={5}
                        />
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Task Category
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a category...</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Task Selection */}
                    {selectedCategory && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Specific Task
                            </label>
                            <select
                                value={selectedTask}
                                onChange={(e) => setSelectedTask(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select a task...</option>
                                {taskTemplates.map(task => (
                                    <option key={task.id} value={task.id}>
                                        {task.task_name} - {task.unit_type.replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                            {selectedTemplate && (
                                <p className="text-xs text-gray-600 mt-1">
                                    {selectedTemplate.description}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Quantity Input */}
                    {selectedTask && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity ({selectedTemplate?.unit_type.replace('_', ' ')})
                            </label>
                            <input
                                type="number"
                                value={localQuantity}
                                onChange={(e) => setLocalQuantity(parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    {/* Your Estimate Input (optional) */}
                    {selectedTask && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your Estimate (optional)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={localUserEstimate}
                                    onChange={(e) => setLocalUserEstimate(parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="0.01"
                                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your estimated cost"
                                />
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-4">
                            <span className="inline-block animate-spin material-icons text-blue-600">refresh</span>
                            <p className="text-sm text-gray-600 mt-2">Analyzing market rates...</p>
                        </div>
                    )}

                    {/* Analysis Results */}
                    {analysis && !loading && (
                        <div className="space-y-4 border-t-2 border-blue-200 pt-4">
                            {/* Market Rate Suggestion */}
                            <div className="bg-white rounded-lg p-4 border-2 border-blue-300 shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">Market Rate for {localZipCode}</h4>
                                        <p className="text-3xl font-bold text-blue-600">
                                            ${analysis.total_with_waste.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {localQuantity} {selectedTemplate?.unit_type.replace('_', ' ')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-semibold text-gray-700">
                                            ${(analysis.total_with_waste / localQuantity).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500">per unit</p>
                                    </div>
                                </div>

                                {/* Cost Breakdown */}
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div className="bg-blue-50 p-2 rounded">
                                        <p className="text-xs text-gray-600">Labor</p>
                                        <p className="font-semibold text-gray-900">${analysis.labor_cost.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-blue-50 p-2 rounded">
                                        <p className="text-xs text-gray-600">Materials</p>
                                        <p className="font-semibold text-gray-900">${analysis.material_cost.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-blue-50 p-2 rounded">
                                        <p className="text-xs text-gray-600">Equipment</p>
                                        <p className="font-semibold text-gray-900">${analysis.equipment_cost.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* AI Explanation */}
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-start gap-2">
                                    <span className="material-icons text-blue-600 text-lg mt-0.5">info</span>
                                    <p className="text-sm text-gray-700">{analysis.explanation}</p>
                                </div>
                            </div>

                            {/* Variance Analysis (if user provided estimate) */}
                            {localUserEstimate > 0 && (
                                <div className={`rounded-lg p-4 border-2 ${getVarianceStatus().color}`}>
                                    <div className="flex items-start gap-3">
                                        <span className="material-icons-outlined text-2xl">{getVarianceStatus().icon}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold">{getVarianceStatus().label}</h4>
                                                <span className="text-lg font-bold">${localUserEstimate.toFixed(2)}</span>
                                            </div>
                                            <p className="text-sm mb-3">{getVarianceStatus().message}</p>

                                            {/* Recommendation */}
                                            {Math.abs(variance) >= 10 && (
                                                <div className="bg-white bg-opacity-50 rounded p-2 text-sm">
                                                    <p className="font-semibold mb-1">💡 Recommendation:</p>
                                                    {variance > 0 ? (
                                                        <p>Consider reducing your estimate to ${analysis.total_with_waste.toFixed(2)} to stay competitive, or justify the premium with superior materials/expertise.</p>
                                                    ) : (
                                                        <p>Increase your estimate to avoid undervaluing your work! Market rate is ${analysis.total_with_waste.toFixed(2)}. Don't leave money on the table.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Additional Context */}
                            {selectedTemplate && (
                                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                    <p className="font-semibold text-gray-800 mb-2">Task Details:</p>
                                    <ul className="space-y-1 text-gray-700">
                                        <li>• Difficulty Level: {selectedTemplate.difficulty_level}/5</li>
                                        <li>• Typical Crew Size: {selectedTemplate.typical_crew_size} person(s)</li>
                                        <li>• Hours per Unit: {selectedTemplate.hours_per_unit}</li>
                                        <li>• Total Labor Hours: {(selectedTemplate.hours_per_unit * localQuantity).toFixed(1)} hrs</li>
                                    </ul>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        if (onCostSuggestion && analysis) {
                                            onCostSuggestion(analysis, variance);
                                        }
                                    }}
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons text-sm">check</span>
                                    Use Market Rate
                                </button>
                                <button
                                    onClick={() => {
                                        setAnalysis(null);
                                        setSelectedTask('');
                                        setSelectedCategory('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}

                    {/* No Results State */}
                    {!analysis && !loading && selectedTask && localQuantity > 0 && (
                        <button
                            onClick={analyzeCustomCost}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-icons">calculate</span>
                            Analyze Cost
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AIJobCostingAssistant;
