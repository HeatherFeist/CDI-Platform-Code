import React, { useState, useEffect } from 'react';
import { productSuggestionService, ProductSuggestion, ProductCategory } from '../../services/productSuggestionService';

interface ProductSelectorProps {
    estimateId: string;
    lineItemIndex: number;
    lineItemDescription: string;
    projectType: string;
    quantity?: number;
    unit?: string;
    onProductsSelected: (totalCost: number) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
    estimateId,
    lineItemIndex,
    lineItemDescription,
    projectType,
    quantity,
    unit,
    onProductsSelected
}) => {
    const [loading, setLoading] = useState(false);
    const [productCategory, setProductCategory] = useState<ProductCategory | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<'budget' | 'mid' | 'high'>('mid');
    const [selectedProducts, setSelectedProducts] = useState<Map<string, ProductSuggestion>>(new Map());
    const [showComparison, setShowComparison] = useState(false);
    const [savingProducts, setSavingProducts] = useState(false);

    useEffect(() => {
        loadProductSuggestions();
        loadSavedSelections();
    }, [lineItemDescription]);

    const loadProductSuggestions = async () => {
        setLoading(true);
        try {
            const category = await productSuggestionService.fetchProductSuggestions(
                lineItemDescription,
                projectType,
                quantity,
                unit
            );
            setProductCategory(category);
        } catch (error) {
            console.error('Error loading product suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSavedSelections = async () => {
        try {
            const saved = await productSuggestionService.getProductSelections(estimateId, lineItemIndex);
            if (saved.length > 0) {
                const selections = new Map<string, ProductSuggestion>();
                saved.forEach(item => {
                    selections.set(item.category, {
                        id: item.sku,
                        name: item.product_name,
                        brand: item.brand,
                        description: '',
                        price: item.price_per_unit,
                        unit: item.unit,
                        retailer: item.retailer,
                        sku: item.sku,
                        url: item.product_url,
                        image_url: item.image_url,
                        grade: item.grade,
                        category: item.category,
                        in_stock: true
                    });
                });
                setSelectedProducts(selections);
            }
        } catch (error) {
            console.error('Error loading saved selections:', error);
        }
    };

    const handleProductSelect = (category: string, product: ProductSuggestion) => {
        const newSelections = new Map(selectedProducts);
        newSelections.set(category, product);
        setSelectedProducts(newSelections);
    };

    const handleSaveProducts = async () => {
        if (!productCategory || selectedProducts.size === 0) return;

        setSavingProducts(true);
        try {
            const productsToSave = Array.from(selectedProducts.entries()).map(([category, product]) => ({
                category,
                product,
                quantity: productCategory.quantity
            }));

            const result = await productSuggestionService.saveProductSelections(
                estimateId,
                lineItemIndex,
                productsToSave
            );

            if (result.success) {
                // Calculate total and notify parent
                const calculation = productSuggestionService.calculateMaterialsCost(
                    [productCategory],
                    selectedProducts
                );
                onProductsSelected(calculation.totalCost);
                alert('✅ Products saved successfully!');
            } else {
                alert(`❌ Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error saving products:', error);
            alert('❌ Failed to save products');
        } finally {
            setSavingProducts(false);
        }
    };

    const calculateTotal = () => {
        if (!productCategory) return 0;
        const calculation = productSuggestionService.calculateMaterialsCost(
            [productCategory],
            selectedProducts
        );
        return calculation.totalCost;
    };

    const getProductsByGrade = (grade: 'budget' | 'mid' | 'high'): ProductSuggestion[] => {
        if (!productCategory) return [];
        return productCategory.suggestions[grade] || [];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Finding best products...</span>
            </div>
        );
    }

    if (!productCategory) {
        return (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
                <span className="material-icons text-gray-400 text-4xl">inventory_2</span>
                <p className="text-gray-600 mt-2">No product suggestions available</p>
                <button
                    onClick={loadProductSuggestions}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Fetch Products
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <span className="material-icons text-blue-600">shopping_cart</span>
                        Select Materials
                    </h3>
                    <p className="text-sm text-gray-600">{productCategory.description}</p>
                </div>
                <button
                    onClick={() => setShowComparison(!showComparison)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                    <span className="material-icons text-sm">compare</span>
                    {showComparison ? 'Hide' : 'Show'} Comparison
                </button>
            </div>

            {/* Grade Selector */}
            <div className="flex gap-2 p-2 bg-gray-100 rounded-lg">
                {(['budget', 'mid', 'high'] as const).map(grade => (
                    <button
                        key={grade}
                        onClick={() => setSelectedGrade(grade)}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                            selectedGrade === grade
                                ? 'bg-white shadow-sm text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        {productSuggestionService.getGradeDisplayName(grade)}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className="grid gap-4">
                {getProductsByGrade(selectedGrade).map((product, index) => (
                    <div
                        key={`${product.sku}-${index}`}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            selectedProducts.get(productCategory.category)?.sku === product.sku
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => handleProductSelect(productCategory.category, product)}
                    >
                        <div className="flex gap-4">
                            {/* Product Image */}
                            <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="material-icons text-gray-400">image</span>
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{product.name}</h4>
                                        <p className="text-sm text-gray-600">{product.brand}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            productSuggestionService.getGradeBadgeColor(product.grade)
                                        }`}>
                                            {productSuggestionService.getGradeDisplayName(product.grade)}
                                        </span>
                                        {selectedProducts.get(productCategory.category)?.sku === product.sku && (
                                            <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                                <span className="material-icons text-sm">check_circle</span>
                                                Selected
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-2 flex items-center gap-4">
                                    {/* Retailer Logo */}
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <img
                                            src={productSuggestionService.getRetailerLogo(product.retailer)}
                                            alt={product.retailer}
                                            className="h-4 object-contain"
                                        />
                                        <span className="capitalize">{product.retailer.replace('_', ' ')}</span>
                                    </div>

                                    {/* Rating */}
                                    {product.rating && (
                                        <div className="flex items-center gap-1 text-sm">
                                            <span className="material-icons text-yellow-500 text-sm">star</span>
                                            <span className="font-medium">{product.rating}</span>
                                            {product.review_count && (
                                                <span className="text-gray-500">({product.review_count})</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Stock Status */}
                                    <div className={`text-xs font-medium ${
                                        product.in_stock ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {product.in_stock ? '✓ In Stock' : '✗ Out of Stock'}
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="mt-3 flex items-center justify-between">
                                    <div>
                                        <span className="text-2xl font-bold text-gray-900">
                                            ${product.price.toFixed(2)}
                                        </span>
                                        <span className="text-sm text-gray-600 ml-1">/{product.unit}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-600">
                                            Qty: {productCategory.quantity} {productCategory.unit}
                                        </div>
                                        <div className="text-lg font-semibold text-blue-600">
                                            Total: ${(product.price * productCategory.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* View Details Link */}
                                <a
                                    href={product.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span>View on {product.retailer.replace('_', ' ')}</span>
                                    <span className="material-icons text-sm">open_in_new</span>
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Price Comparison Table */}
            {showComparison && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Price Comparison</h4>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2">Grade</th>
                                <th className="text-right py-2">Home Depot</th>
                                <th className="text-right py-2">Lowe's</th>
                                <th className="text-right py-2">Menards</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(['budget', 'mid', 'high'] as const).map(grade => (
                                <tr key={grade} className="border-b">
                                    <td className="py-2 font-medium capitalize">{grade}</td>
                                    {(['home_depot', 'lowes', 'menards'] as const).map(retailer => {
                                        const product = productCategory.suggestions[grade]?.find(p => p.retailer === retailer);
                                        return (
                                            <td key={retailer} className="text-right py-2">
                                                {product ? `$${(product.price * productCategory.quantity).toFixed(2)}` : '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Total and Save */}
            {selectedProducts.size > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-900">Materials Total:</span>
                        <span className="text-2xl font-bold text-blue-600">
                            ${calculateTotal().toFixed(2)}
                        </span>
                    </div>
                    <button
                        onClick={handleSaveProducts}
                        disabled={savingProducts}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {savingProducts ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Saving Products...
                            </>
                        ) : (
                            <>
                                <span className="material-icons">save</span>
                                Save Product Selection
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductSelector;
