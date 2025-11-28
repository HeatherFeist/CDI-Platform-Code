import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { EstimateLineItem, GeneratedEstimate } from '../../services/geminiService';
import { fetchHomewyseCostData, findMatchingHomewyseTask } from '../../services/homewyseService';
import { searchProducts, getProductSuggestionsForProject, ProductComparison } from '../../services/productSearchService';
import { 
    calculateComplexRoomArea, 
    parseRoomDescription, 
    generateMeasurementReport,
    validateMeasurements,
    ProjectMeasurements 
} from '../../services/measurementService';

interface EnhancedCalculatorProps {
    onEstimateGenerated: (estimate: GeneratedEstimate) => void;
    onCancel: () => void;
    onUnsavedChanges?: (hasChanges: boolean) => void;
}

interface CalculatorFormData {
    projectType: string;
    projectDescription: string;
    zipCode: string;
    roomDimensions: {
        length: number;
        width: number;
        height: number;
    };
    manualMeasurements: ProjectMeasurements | null;
    selectedProducts: Record<string, any>;
}

export const EnhancedCalculator: React.FC<EnhancedCalculatorProps> = ({
    onEstimateGenerated,
    onCancel,
    onUnsavedChanges
}) => {
    const { userProfile } = useAuth();
    const [formData, setFormData] = useState<CalculatorFormData>({
        projectType: 'flooring',
        projectDescription: '',
        zipCode: userProfile?.zip_code || '',
        roomDimensions: { length: 0, width: 0, height: 8 },
        manualMeasurements: null,
        selectedProducts: {}
    });
    
    const [currentStep, setCurrentStep] = useState<'measurements' | 'products' | 'review'>('measurements');
    const [measurements, setMeasurements] = useState<ProjectMeasurements | null>(null);
    const [productSuggestions, setProductSuggestions] = useState<ProductComparison[]>([]);
    const [laborCosts, setLaborCosts] = useState<Record<string, number>>({});
    const [materialCosts, setMaterialCosts] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [hasStartedForm, setHasStartedForm] = useState(false);

    // Track changes for navigation safety
    useEffect(() => {
        const hasChanges = hasStartedForm && (
            formData.projectDescription !== '' ||
            formData.roomDimensions.length > 0 ||
            formData.roomDimensions.width > 0 ||
            Object.keys(formData.selectedProducts).length > 0
        );
        onUnsavedChanges?.(hasChanges);
    }, [formData, hasStartedForm, onUnsavedChanges]);
    const [error, setError] = useState<string | null>(null);

    // Project type options
    const projectTypes = [
        { value: 'flooring', label: 'Flooring Installation' },
        { value: 'painting', label: 'Interior Painting' },
        { value: 'bathroom', label: 'Bathroom Remodel' },
        { value: 'kitchen', label: 'Kitchen Remodel' },
        { value: 'drywall', label: 'Drywall Installation/Repair' },
        { value: 'roofing', label: 'Roofing' },
        { value: 'siding', label: 'Siding' },
        { value: 'electrical', label: 'Electrical Work' },
        { value: 'plumbing', label: 'Plumbing' },
        { value: 'hvac', label: 'HVAC' },
        { value: 'custom', label: 'Custom Project' }
    ];

    // Calculate measurements when dimensions change
    useEffect(() => {
        if (formData.roomDimensions.length > 0 && formData.roomDimensions.width > 0) {
            const calculated = calculateComplexRoomArea({
                mainArea: formData.roomDimensions,
                alcoves: [],
                cutouts: []
            });
            setMeasurements(calculated);
        }
    }, [formData.roomDimensions]);

    // Parse description for measurements
    useEffect(() => {
        if (formData.projectDescription) {
            const parsed = parseRoomDescription(formData.projectDescription);
            if (parsed) {
                setFormData(prev => ({
                    ...prev,
                    roomDimensions: {
                        ...parsed,
                        height: parsed.height || 8
                    }
                }));
            }
        }
    }, [formData.projectDescription]);

    const handleMeasurementsNext = async () => {
        if (!measurements) {
            setError('Please enter valid room dimensions');
            return;
        }

        const warnings = validateMeasurements(measurements);
        if (warnings.length > 0) {
            const proceed = confirm(`Measurement warnings:\n${warnings.join('\n')}\n\nContinue anyway?`);
            if (!proceed) return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch labor costs from Homewyse
            const taskKey = findMatchingHomewyseTask(formData.projectType);
            if (taskKey) {
                const costData = await fetchHomewyseCostData(taskKey, formData.zipCode, measurements.floorArea);
                if (costData) {
                    setLaborCosts({
                        [formData.projectType]: costData.laborCost
                    });
                }
            }

            // Get product suggestions
            const suggestions = await getProductSuggestionsForProject(
                formData.projectType,
                measurements.floorArea,
                'mid'
            );
            setProductSuggestions(suggestions);

            setCurrentStep('products');
        } catch (err) {
            console.error('Error fetching cost data:', err);
            setError('Failed to fetch pricing data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleProductSelection = (category: string, priceRange: 'low' | 'mid' | 'high', products: any[]) => {
        if (products.length === 0) return;

        const selectedProduct = products[0]; // Use first product in range
        const quantity = calculateQuantityNeeded(category, measurements?.floorArea || 0);
        const totalCost = selectedProduct.price * quantity;

        setFormData(prev => ({
            ...prev,
            selectedProducts: {
                ...prev.selectedProducts,
                [category]: {
                    product: selectedProduct,
                    quantity,
                    totalCost
                }
            }
        }));

        // Update material costs
        const newMaterialCosts = Object.values({
            ...formData.selectedProducts,
            [category]: { totalCost }
        }).reduce((sum: number, item: any) => sum + (item.totalCost || 0), 0);
        
        setMaterialCosts(newMaterialCosts);
    };

    const calculateQuantityNeeded = (category: string, squareFeet: number): number => {
        switch (category.toLowerCase()) {
            case 'flooring':
            case 'tile':
                return Math.ceil(squareFeet * 1.1); // 10% waste
            case 'paint':
                return Math.ceil(squareFeet / 350); // 350 sq ft per gallon
            case 'primer':
                return Math.ceil(squareFeet / 400); // 400 sq ft per gallon
            default:
                return Math.ceil(squareFeet / 100); // Default calculation
        }
    };

    const generateFinalEstimate = async () => {
        if (!measurements) return;

        setLoading(true);
        try {
            // Ensure measurements exist
            if (!measurements) {
                throw new Error('Measurements are required');
            }

            // Calculate labor total
            const totalLaborCost = Object.values(laborCosts).reduce((sum, cost) => sum + cost, 0);
            
            // Create line items
            const lineItems: EstimateLineItem[] = [];
            
            // Add labor line item with proper unit cost calculation
            // Unit Cost = Total Labor Cost / Area (to get cost per square foot)
            const laborUnitCost = measurements.floorArea > 0 
                ? totalLaborCost / measurements.floorArea 
                : 0;

            lineItems.push({
                name: `${formData.projectType} Labor`,
                description: `Professional labor for ${formData.projectType} project - ${measurements.floorArea} sq ft`,
                taskCategory: 'Labor',
                quantity: measurements.floorArea,
                unitType: 'square_foot',
                unitCost: Number(laborUnitCost.toFixed(2)), // Round to 2 decimals
                laborCost: totalLaborCost,
                materialCost: 0,
                equipmentCost: 0,
                totalCost: totalLaborCost
            });

            // Add material line items with proper calculations
            Object.entries(formData.selectedProducts).forEach(([category, selection]: [string, any]) => {
                const unitCost = Number(selection.product.price);
                const quantity = Number(selection.quantity);
                const totalCost = Number((unitCost * quantity).toFixed(2));

                lineItems.push({
                    name: `${category} Materials`,
                    description: `${selection.product.productName} from ${selection.product.retailer}`,
                    taskCategory: 'Materials',
                    quantity: quantity,
                    unitType: 'each',
                    unitCost: unitCost,
                    laborCost: 0,
                    materialCost: totalCost,
                    equipmentCost: 0,
                    totalCost: totalCost
                });
            });

            // Calculate totals from actual line items to ensure accuracy
            const subtotal = Number(lineItems.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2));
            const taxRate = 0.08; // 8% default tax
            const taxAmount = Number((subtotal * taxRate).toFixed(2));
            const total = Number((subtotal + taxAmount).toFixed(2));

            const estimate: GeneratedEstimate = {
                projectName: `${formData.projectType} Project`,
                projectDescription: formData.projectDescription,
                scope: `Complete ${formData.projectType} installation including labor and materials`,
                lineItems,
                subtotal,
                taxRate,
                taxAmount,
                total,
                estimatedDuration: Math.ceil(measurements.floorArea / 200), // Rough estimate: 200 sq ft per day
                notes: generateMeasurementReport(measurements, formData.projectType),
                measurements: {
                    area: measurements.floorArea,
                    length: measurements.perimeterLength,
                    height: formData.roomDimensions.height,
                    volume: measurements.totalVolume
                }
            };

            onEstimateGenerated(estimate);
        } catch (err) {
            console.error('Error generating estimate:', err);
            setError('Failed to generate estimate. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
                <p className="text-lg font-semibold text-gray-900">
                    {currentStep === 'measurements' ? 'Fetching pricing data...' : 
                     currentStep === 'products' ? 'Searching products...' : 
                     'Generating estimate...'}
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Project Calculator</h2>
                <p className="text-gray-600">
                    Calculate accurate estimates with real square footage, Homewyse pricing, and product comparisons
                </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
                <div className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        currentStep === 'measurements' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                        {currentStep === 'measurements' ? '1' : '✓'}
                    </div>
                    <span className="ml-2 text-sm font-medium">Measurements</span>
                </div>
                
                <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                
                <div className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        currentStep === 'products' ? 'bg-blue-600 text-white' : 
                        currentStep === 'review' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                        {currentStep === 'review' ? '✓' : '2'}
                    </div>
                    <span className="ml-2 text-sm font-medium">Products</span>
                </div>
                
                <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                
                <div className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        currentStep === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                        3
                    </div>
                    <span className="ml-2 text-sm font-medium">Review</span>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Step 1: Measurements */}
            {currentStep === 'measurements' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Project Type *
                            </label>
                            <select
                                value={formData.projectType}
                                onChange={(e) => {
                                    setHasStartedForm(true);
                                    setFormData(prev => ({ ...prev, projectType: e.target.value }));
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                {projectTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                ZIP Code *
                            </label>
                            <input
                                type="text"
                                value={formData.zipCode}
                                onChange={(e) => {
                                    setHasStartedForm(true);
                                    setFormData(prev => ({ ...prev, zipCode: e.target.value }));
                                }}
                                placeholder="e.g., 43201"
                                maxLength={5}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Project Description
                        </label>
                        <textarea
                            value={formData.projectDescription}
                            onChange={(e) => {
                                setHasStartedForm(true);
                                setFormData(prev => ({ ...prev, projectDescription: e.target.value }));
                            }}
                            placeholder="Describe your project. Include dimensions like '10 feet by 12 feet' or '120 square feet'..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Length (feet) *
                            </label>
                            <input
                                type="number"
                                value={formData.roomDimensions.length || ''}
                                onChange={(e) => {
                                    setHasStartedForm(true);
                                    setFormData(prev => ({
                                        ...prev,
                                        roomDimensions: { ...prev.roomDimensions, length: parseFloat(e.target.value) || 0 }
                                    }));
                                }}
                                min="0"
                                step="0.1"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Width (feet) *
                            </label>
                            <input
                                type="number"
                                value={formData.roomDimensions.width || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    roomDimensions: { ...prev.roomDimensions, width: parseFloat(e.target.value) || 0 }
                                }))}
                                min="0"
                                step="0.1"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Height (feet)
                            </label>
                            <input
                                type="number"
                                value={formData.roomDimensions.height || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    roomDimensions: { ...prev.roomDimensions, height: parseFloat(e.target.value) || 8 }
                                }))}
                                min="0"
                                step="0.1"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {measurements && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-2">Calculated Measurements</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-blue-700">Floor Area:</span>
                                    <span className="ml-2 font-medium">{measurements.floorArea} sq ft</span>
                                </div>
                                <div>
                                    <span className="text-blue-700">Wall Area:</span>
                                    <span className="ml-2 font-medium">{measurements.wallArea} sq ft</span>
                                </div>
                                <div>
                                    <span className="text-blue-700">Perimeter:</span>
                                    <span className="ml-2 font-medium">{measurements.perimeterLength} ft</span>
                                </div>
                                <div>
                                    <span className="text-blue-700">Volume:</span>
                                    <span className="ml-2 font-medium">{measurements.totalVolume} cu ft</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleMeasurementsNext}
                            disabled={!measurements || formData.zipCode.length < 5}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Next: Select Products
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Products */}
            {currentStep === 'products' && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Product Recommendations
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Choose products for your project. We've searched Lowes, Home Depot, and Menards for the best options.
                        </p>
                    </div>

                    {productSuggestions.map((suggestion, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-6">
                            <h4 className="font-semibold text-gray-900 mb-4">{suggestion.category}</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Low Range */}
                                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium text-green-900">Budget Option</h5>
                                        <span className="text-lg font-bold text-green-700">
                                            ${suggestion.averagePrices.low.toFixed(2)}
                                        </span>
                                    </div>
                                    {suggestion.low.slice(0, 2).map((product, pIndex) => (
                                        <div key={pIndex} className="mb-2 text-sm">
                                            <div className="font-medium">{product.productName}</div>
                                            <div className="text-green-700">{product.retailer} - ${product.price}</div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => handleProductSelection(suggestion.category, 'low', suggestion.low)}
                                        className="w-full mt-3 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700"
                                    >
                                        Select Budget
                                    </button>
                                </div>

                                {/* Mid Range */}
                                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium text-blue-900">Standard Option</h5>
                                        <span className="text-lg font-bold text-blue-700">
                                            ${suggestion.averagePrices.mid.toFixed(2)}
                                        </span>
                                    </div>
                                    {suggestion.mid.slice(0, 2).map((product, pIndex) => (
                                        <div key={pIndex} className="mb-2 text-sm">
                                            <div className="font-medium">{product.productName}</div>
                                            <div className="text-blue-700">{product.retailer} - ${product.price}</div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => handleProductSelection(suggestion.category, 'mid', suggestion.mid)}
                                        className="w-full mt-3 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                                    >
                                        Select Standard
                                    </button>
                                </div>

                                {/* High Range */}
                                <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium text-purple-900">Premium Option</h5>
                                        <span className="text-lg font-bold text-purple-700">
                                            ${suggestion.averagePrices.high.toFixed(2)}
                                        </span>
                                    </div>
                                    {suggestion.high.slice(0, 2).map((product, pIndex) => (
                                        <div key={pIndex} className="mb-2 text-sm">
                                            <div className="font-medium">{product.productName}</div>
                                            <div className="text-purple-700">{product.retailer} - ${product.price}</div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => handleProductSelection(suggestion.category, 'high', suggestion.high)}
                                        className="w-full mt-3 py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700"
                                    >
                                        Select Premium
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex gap-3">
                        <button
                            onClick={() => setCurrentStep('measurements')}
                            className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setCurrentStep('review')}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                        >
                            Review Estimate
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 'review' && (
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Estimate Summary</h3>
                    
                    {/* Labor Costs */}
                    <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Labor Costs</h4>
                        {Object.entries(laborCosts).map(([task, cost]) => (
                            <div key={task} className="flex justify-between items-center py-2">
                                <span className="text-gray-700">{task} (Homewyse pricing for {formData.zipCode})</span>
                                <span className="font-semibold">${cost.toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center font-semibold">
                                <span>Total Labor:</span>
                                <span>${Object.values(laborCosts).reduce((sum, cost) => sum + cost, 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Material Costs */}
                    <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Material Costs</h4>
                        {Object.entries(formData.selectedProducts).map(([category, selection]: [string, any]) => (
                            <div key={category} className="py-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium">{category}</div>
                                        <div className="text-sm text-gray-600">
                                            {selection.product.productName} ({selection.product.retailer})
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Qty: {selection.quantity} × ${selection.product.price}
                                        </div>
                                    </div>
                                    <span className="font-semibold">${selection.totalCost.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center font-semibold">
                                <span>Total Materials:</span>
                                <span>${materialCosts.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {measurements && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Project Measurements</h4>
                            <div className="text-sm text-gray-700">
                                <div>Floor Area: {measurements.floorArea} sq ft</div>
                                <div>Wall Area: {measurements.wallArea} sq ft</div>
                                <div>Perimeter: {measurements.perimeterLength} ft</div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => setCurrentStep('products')}
                            className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Back
                        </button>
                        <button
                            onClick={generateFinalEstimate}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                        >
                            Generate Final Estimate
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedCalculator;