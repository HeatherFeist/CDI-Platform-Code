import React, { useState } from 'react';
import { webProductSearchService, WebProduct, ProductSearchResult } from '../../services/webProductSearchService';

interface SimpleProductSearchProps {
    lineItemDescription: string;
    onProductSelect?: (product: WebProduct) => void;
}

export const SimpleProductSearch: React.FC<SimpleProductSearchProps> = ({
    lineItemDescription,
    onProductSelect
}) => {
    const [searchResult, setSearchResult] = useState<ProductSearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [showLinks, setShowLinks] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const result = await webProductSearchService.searchProducts(lineItemDescription);
            setSearchResult(result);
            setShowLinks(true);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDirectLinks = () => {
        return webProductSearchService.getDirectSearchLinks(lineItemDescription);
    };

    const retailerInfo = {
        home_depot: { name: 'Home Depot', color: '#f96302', icon: '🟠' },
        lowes: { name: "Lowe's", color: '#004990', icon: '🔵' },
        menards: { name: 'Menards', color: '#ffd100', icon: '🟡' }
    };

    if (!showLinks) {
        return (
            <button
                onClick={handleSearch}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                title="Search for products at major retailers"
            >
                <span className="material-icons text-base">search</span>
                {loading ? 'Searching...' : 'Find Products Online'}
            </button>
        );
    }

    const links = getDirectLinks();

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="material-icons text-blue-600">shopping_cart</span>
                    <h4 className="font-semibold text-gray-800">Product Search Links</h4>
                </div>
                <button
                    onClick={() => setShowLinks(false)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Close"
                >
                    <span className="material-icons text-sm">close</span>
                </button>
            </div>

            <p className="text-sm text-gray-600 mb-3">
                Click to browse products at major retailers:
            </p>

            <div className="space-y-2">
                {/* Home Depot Link */}
                <a
                    href={links.home_depot}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-500 hover:shadow-md transition-all group"
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
                         style={{ backgroundColor: '#fff5f0' }}>
                        🟠
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-gray-800 group-hover:text-orange-600">
                            Home Depot
                        </div>
                        <div className="text-xs text-gray-500">
                            Search: "{lineItemDescription}"
                        </div>
                    </div>
                    <span className="material-icons text-gray-400 group-hover:text-orange-600">
                        open_in_new
                    </span>
                </a>

                {/* Lowe's Link */}
                <a
                    href={links.lowes}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group"
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
                         style={{ backgroundColor: '#f0f5ff' }}>
                        🔵
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-gray-800 group-hover:text-blue-600">
                            Lowe's
                        </div>
                        <div className="text-xs text-gray-500">
                            Search: "{lineItemDescription}"
                        </div>
                    </div>
                    <span className="material-icons text-gray-400 group-hover:text-blue-600">
                        open_in_new
                    </span>
                </a>

                {/* Menards Link */}
                <a
                    href={links.menards}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-yellow-500 hover:shadow-md transition-all group"
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
                         style={{ backgroundColor: '#fffbf0' }}>
                        🟡
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-gray-800 group-hover:text-yellow-600">
                            Menards
                        </div>
                        <div className="text-xs text-gray-500">
                            Search: "{lineItemDescription}"
                        </div>
                    </div>
                    <span className="material-icons text-gray-400 group-hover:text-yellow-600">
                        open_in_new
                    </span>
                </a>

                {/* Google Shopping Link */}
                <a
                    href={links.google}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-green-500 hover:shadow-md transition-all group"
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-bold">
                        G
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-gray-800 group-hover:text-green-600">
                            Google Shopping
                        </div>
                        <div className="text-xs text-gray-500">
                            Compare prices across all retailers
                        </div>
                    </div>
                    <span className="material-icons text-gray-400 group-hover:text-green-600">
                        open_in_new
                    </span>
                </a>
            </div>

            <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-gray-500 text-center">
                    💡 Links open in new tabs. Browse products, compare prices, and add to your estimate.
                </p>
            </div>
        </div>
    );
};

export default SimpleProductSearch;
