import React, { useState } from 'react';
import { Product, ProductGrade, generateProductRecommendations, ProductRecommendation } from '../../services/productScraperService';

interface ProductSelectorProps {
    task: string;
    taskCategory: string;
    quantity: number;
    zipCode: string;
    apiKey: string;
    onProductsSelected: (products: Product[], totalCost: number) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
    task,
    taskCategory,
    quantity,
    zipCode,
    apiKey,
    onProductsSelected
}) => {
    const [grade, setGrade] = useState<ProductGrade>('mid-grade');
    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<ProductRecommendation | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);

    const handleSearchProducts = async () => {
        if (!apiKey) {
            setError('API key required. Please configure in AI Settings.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await generateProductRecommendations(
                task,
                taskCategory,
                quantity,
                grade,
                zipCode,
                apiKey
            );
            setRecommendations(result);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to fetch products. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleProductSelection = (productId: string) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(productId)) {
            newSelected.delete(productId);
        } else {
            newSelected.add(productId);
        }
        setSelectedProducts(newSelected);
    };

    const handleConfirmSelection = () => {
        if (!recommendations) return;

        const allProducts = [
            ...recommendations.recommendedProducts,
            ...recommendations.alternatives
        ];

        const selected = allProducts.filter(p => selectedProducts.has(p.id));
        const totalCost = selected.reduce((sum, p) => sum + p.price * quantity, 0);

        onProductsSelected(selected, totalCost);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Selection</h3>
                <p className="text-sm text-gray-600">
                    Select product grade and search for real-time pricing from Home Depot, Lowe's, and Menards
                </p>
            </div>

            {/* Grade Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Product Grade
                </label>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => setGrade('budget')}
                        className={`
                            p-4 rounded-lg border-2 transition-all
                            ${grade === 'budget'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }
                        `}
                    >
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="material-icons text-green-600">attach_money</span>
                            <span className="font-semibold">Budget</span>
                        </div>
                        <p className="text-xs text-gray-600">
                            Cost-effective, functional products
                        </p>
                    </button>

                    <button
                        onClick={() => setGrade('mid-grade')}
                        className={`
                            p-4 rounded-lg border-2 transition-all
                            ${grade === 'mid-grade'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }
                        `}
                    >
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="material-icons text-blue-600">star_half</span>
                            <span className="font-semibold">Mid-Grade</span>
                        </div>
                        <p className="text-xs text-gray-600">
                            Balance of quality and value
                        </p>
                    </button>

                    <button
                        onClick={() => setGrade('high-end')}
                        className={`
                            p-4 rounded-lg border-2 transition-all
                            ${grade === 'high-end'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }
                        `}
                    >
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="material-icons text-purple-600">stars</span>
                            <span className="font-semibold">High-End</span>
                        </div>
                        <p className="text-xs text-gray-600">
                            Premium quality, luxury finishes
                        </p>
                    </button>
                </div>
            </div>

            {/* Search Button */}
            <button
                onClick={handleSearchProducts}
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
            >
                {loading ? (
                    <>
                        <span className="animate-spin material-icons">refresh</span>
                        <span>Searching Products...</span>
                    </>
                ) : (
                    <>
                        <span className="material-icons">search</span>
                        <span>Search Products at HD, Lowe's & Menards</span>
                    </>
                )}
            </button>

            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <span className="material-icons text-red-600">error</span>
                        <p className="text-red-800">{error}</p>
                    </div>
                </div>
            )}

            {/* Coming Soon Notice */}
            {!loading && !recommendations && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <span className="material-icons text-blue-600">info</span>
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-1">Feature Coming Soon!</h4>
                            <p className="text-sm text-blue-800 mb-2">
                                Real-time product search from Home Depot, Lowe's, and Menards is in development.
                            </p>
                            <ul className="text-sm text-blue-700 space-y-1 ml-4">
                                <li>• AI will analyze your task and recommend specific products</li>
                                <li>• Compare prices across all three retailers instantly</li>
                                <li>• Filter by {grade} grade products automatically</li>
                                <li>• Get direct purchase links to retailer websites</li>
                                <li>• Arrange delivery directly to project site</li>
                            </ul>
                            <p className="text-xs text-blue-600 mt-3">
                                <strong>Implementation Status:</strong> Service framework created, awaiting retailer API keys and partnerships
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Results */}
            {recommendations && (
                <div className="space-y-6">
                    {/* Recommended Products */}
                    <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="material-icons text-green-600">recommend</span>
                            Top Recommendations
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recommendations.recommendedProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    selected={selectedProducts.has(product.id)}
                                    onToggle={() => toggleProductSelection(product.id)}
                                    quantity={quantity}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Alternative Products */}
                    {recommendations.alternatives.length > 0 && (
                        <div>
                            <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="material-icons text-gray-600">compare</span>
                                More Options
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {recommendations.alternatives.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        selected={selectedProducts.has(product.id)}
                                        onToggle={() => toggleProductSelection(product.id)}
                                        quantity={quantity}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {recommendations.notes.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                                <span className="material-icons text-amber-600">lightbulb</span>
                                <div>
                                    <h5 className="font-semibold text-amber-900 mb-1">Important Notes</h5>
                                    <ul className="text-sm text-amber-800 space-y-1">
                                        {recommendations.notes.map((note, i) => (
                                            <li key={i}>• {note}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Confirm Selection */}
                    {selectedProducts.size > 0 && (
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
                                    </p>
                                    <p className="text-lg font-bold text-gray-900">
                                        Estimated: {formatCurrency(
                                            [...recommendations.recommendedProducts, ...recommendations.alternatives]
                                                .filter(p => selectedProducts.has(p.id))
                                                .reduce((sum, p) => sum + p.price * quantity, 0)
                                        )}
                                    </p>
                                </div>
                                <button
                                    onClick={handleConfirmSelection}
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    <span className="material-icons">check_circle</span>
                                    <span>Add to Estimate</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface ProductCardProps {
    product: Product;
    selected: boolean;
    onToggle: () => void;
    quantity: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, selected, onToggle, quantity }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getRetailerLogo = (retailer: string) => {
        const logos = {
            homedepot: '🟠',
            lowes: '🔵',
            menards: '🟡'
        };
        return logos[retailer as keyof typeof logos] || '🏪';
    };

    return (
        <div
            className={`
                border-2 rounded-lg p-4 cursor-pointer transition-all
                ${selected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }
            `}
            onClick={onToggle}
        >
            <div className="flex gap-3">
                {/* Product Image */}
                <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                    {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded" />
                    ) : (
                        <span className="material-icons text-gray-400 text-3xl">inventory_2</span>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h5 className="font-semibold text-sm text-gray-900 line-clamp-2">
                            {product.name}
                        </h5>
                        <span className="text-xl">{getRetailerLogo(product.retailer)}</span>
                    </div>

                    <p className="text-xs text-gray-600 mb-2">{product.brand}</p>

                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <span key={i} className={`material-icons text-xs ${i < product.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                    star
                                </span>
                            ))}
                        </div>
                        <span className="text-xs text-gray-600">
                            ({product.reviewCount})
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(product.price)}
                            </span>
                            {quantity > 1 && (
                                <span className="text-xs text-gray-600 ml-2">
                                    × {quantity} = {formatCurrency(product.price * quantity)}
                                </span>
                            )}
                        </div>

                        <span className={`
                            px-2 py-1 text-xs rounded-full font-semibold
                            ${product.availability === 'in-stock' ? 'bg-green-100 text-green-800' : ''}
                            ${product.availability === 'limited' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${product.availability === 'out-of-stock' ? 'bg-red-100 text-red-800' : ''}
                            ${product.availability === 'online-only' ? 'bg-blue-100 text-blue-800' : ''}
                        `}>
                            {product.availability}
                        </span>
                    </div>
                </div>
            </div>

            {/* Selection Checkbox */}
            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={onToggle}
                        className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Select this product</span>
                </div>

                <a
                    href={product.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    <span>View</span>
                    <span className="material-icons text-xs">open_in_new</span>
                </a>
            </div>
        </div>
    );
};

export default ProductSelector;
