import React, { useState, useEffect } from 'react';
import AIProductSuggestionService from '../services/aiProductSuggestionService';

interface ProductSuggestion {
    productName: string;
    brand: string;
    model?: string;
    url: string;
    price?: number;
    imageUrl?: string;
    description: string;
    rating?: number;
    reviewCount?: number;
    contractorPreferred: boolean;
    aiReasoning: string;
}

interface AIProductSuggestionsProps {
    lineItemDescription: string;
    lineItemIndex: number;
    estimateId?: string;
    onProductSelected?: (product: ProductSuggestion) => void;
}

export default function AIProductSuggestions({
    lineItemDescription,
    lineItemIndex,
    estimateId,
    onProductSelected
}: AIProductSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [showCustomPrompt, setShowCustomPrompt] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

    const fetchSuggestions = async (prompt?: string) => {
        if (!lineItemDescription.trim() && !prompt) return;

        setLoading(true);
        try {
            const result = await AIProductSuggestionService.getProductSuggestions(
                lineItemDescription,
                undefined,
                prompt
            );

            setSuggestions(result.suggestions);
            setShowSuggestions(true);

            if (result.fromCache) {
                console.log('📦 Loaded from cache');
            } else {
                console.log('🆕 Fresh AI suggestions');
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            alert('Failed to fetch product suggestions. Please check your Gemini API key.');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptProduct = async (product: ProductSuggestion, index: number) => {
        setSelectedProduct(index);
        
        if (estimateId) {
            try {
                await AIProductSuggestionService.saveProductSuggestion(
                    estimateId,
                    lineItemIndex,
                    lineItemDescription,
                    product,
                    customPrompt || lineItemDescription,
                    index + 1
                );
                await AIProductSuggestionService.acceptProduct(estimateId);
            } catch (error) {
                console.error('Error saving product selection:', error);
            }
        }

        if (onProductSelected) {
            onProductSelected(product);
        }

        setTimeout(() => {
            alert(`✅ Selected: ${product.productName}`);
        }, 100);
    };

    const handleRequestAlternative = async () => {
        if (estimateId) {
            try {
                await AIProductSuggestionService.rejectAndRequestAlternative(
                    estimateId,
                    'User requested different options'
                );
            } catch (error) {
                console.error('Error requesting alternative:', error);
            }
        }

        // Fetch new suggestions
        await fetchSuggestions(customPrompt || lineItemDescription);
    };

    const handleCustomSearch = async () => {
        if (!customPrompt.trim()) {
            alert('Please enter a search query');
            return;
        }
        await fetchSuggestions(customPrompt);
        setShowCustomPrompt(false);
    };

    return (
        <div className="mt-2 space-y-3">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => fetchSuggestions()}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                        loading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    <span className="material-icons text-sm">shopping_bag</span>
                    {loading ? 'Finding Products...' : 'Get Product Suggestions'}
                </button>

                {showSuggestions && (
                    <>
                        <button
                            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-purple-700"
                        >
                            <span className="material-icons text-sm">search</span>
                            Search Specific Product
                        </button>

                        <button
                            onClick={handleRequestAlternative}
                            disabled={loading}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-orange-700"
                        >
                            <span className="material-icons text-sm">refresh</span>
                            Show Different Options
                        </button>
                    </>
                )}
            </div>

            {/* Custom Search Prompt */}
            {showCustomPrompt && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <label className="block text-sm font-medium text-purple-900 mb-2">
                        Describe the specific product you're looking for:
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g., Behr Premium Plus Ultra interior paint, eggshell white"
                            className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleCustomSearch()}
                        />
                        <button
                            onClick={handleCustomSearch}
                            disabled={loading}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
                        >
                            Search
                        </button>
                    </div>
                    <p className="text-xs text-purple-700 mt-2">
                        💡 Be specific about brand, model, color, or features you want
                    </p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">AI is finding the best contractor-grade products...</span>
                </div>
            )}

            {/* Product Suggestions */}
            {showSuggestions && suggestions.length > 0 && !loading && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">
                            🏆 Top {suggestions.length} Contractor-Grade Products
                        </h4>
                        <span className="text-xs text-gray-500">Ranked by popularity</span>
                    </div>

                    {suggestions.map((product, index) => (
                        <div
                            key={index}
                            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                                selectedProduct === index
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 bg-white'
                            }`}
                        >
                            <div className="flex gap-4">
                                {/* Product Image */}
                                {product.imageUrl && (
                                    <div className="flex-shrink-0">
                                        <img
                                            src={product.imageUrl}
                                            alt={product.productName}
                                            className="w-24 h-24 object-cover rounded"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Product Details */}
                                <div className="flex-1 min-w-0">
                                    {/* Rank Badge */}
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                            index === 1 ? 'bg-gray-300 text-gray-900' :
                                            'bg-orange-300 text-orange-900'
                                        }`}>
                                            #{index + 1} {index === 0 && '👑'}
                                        </span>
                                        {product.contractorPreferred && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                                ⭐ Contractor Preferred
                                            </span>
                                        )}
                                    </div>

                                    {/* Product Name & Brand */}
                                    <h5 className="font-semibold text-gray-900 text-sm mb-1">
                                        {product.brand} - {product.productName}
                                    </h5>
                                    {product.model && (
                                        <p className="text-xs text-gray-600 mb-1">Model: {product.model}</p>
                                    )}

                                    {/* Rating & Reviews */}
                                    {product.rating && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex items-center">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <span
                                                        key={star}
                                                        className={`material-icons text-sm ${
                                                            star <= (product.rating || 0)
                                                                ? 'text-yellow-500'
                                                                : 'text-gray-300'
                                                        }`}
                                                    >
                                                        star
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-600">
                                                {product.rating} ({product.reviewCount?.toLocaleString()} reviews)
                                            </span>
                                        </div>
                                    )}

                                    {/* Description */}
                                    <p className="text-sm text-gray-700 mb-2">{product.description}</p>

                                    {/* AI Reasoning */}
                                    <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
                                        <p className="text-xs text-blue-900">
                                            <span className="font-semibold">🤖 Why contractors choose this:</span> {product.aiReasoning}
                                        </p>
                                    </div>

                                    {/* Price & Actions */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            {product.price && (
                                                <p className="text-lg font-bold text-green-600">
                                                    ${product.price.toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={product.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-gray-800"
                                            >
                                                <span className="material-icons text-sm">open_in_new</span>
                                                View Product
                                            </a>
                                            <button
                                                onClick={() => handleAcceptProduct(product, index)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                                                    selectedProduct === index
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                                }`}
                                            >
                                                <span className="material-icons text-sm">
                                                    {selectedProduct === index ? 'check_circle' : 'add_shopping_cart'}
                                                </span>
                                                {selectedProduct === index ? 'Selected' : 'Use This Product'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Not satisfied message */}
                    <div className="text-center py-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-2">
                            Not finding what you need?
                        </p>
                        <button
                            onClick={() => setShowCustomPrompt(true)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Try a more specific search →
                        </button>
                    </div>
                </div>
            )}

            {/* No Results */}
            {showSuggestions && suggestions.length === 0 && !loading && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <span className="material-icons text-4xl text-gray-400 mb-2">search_off</span>
                    <p className="text-gray-600">No products found. Try a different search.</p>
                </div>
            )}
        </div>
    );
}
