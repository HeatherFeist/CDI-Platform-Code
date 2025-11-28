import React, { useState, useEffect } from 'react';
import { PurchaseCart, CartItem, generatePurchaseCart, ProductRecommendation } from '../../services/productScraperService';

interface PurchaseCartViewProps {
    estimateId: string;
    projectId: string;
    projectAddress: string;
    recommendations: ProductRecommendation[];
    onComplete: () => void;
}

export const PurchaseCartView: React.FC<PurchaseCartViewProps> = ({
    estimateId,
    projectId,
    projectAddress,
    recommendations,
    onComplete
}) => {
    const [cart, setCart] = useState<PurchaseCart | null>(null);
    const [loading, setLoading] = useState(true);
    const [groupByRetailer, setGroupByRetailer] = useState(true);

    useEffect(() => {
        generateCart();
    }, []);

    const generateCart = async () => {
        setLoading(true);
        try {
            const purchaseCart = await generatePurchaseCart(
                estimateId,
                projectId,
                recommendations,
                projectAddress
            );
            setCart(purchaseCart);
        } catch (error) {
            console.error('Error generating cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getRetailerName = (retailer: string) => {
        const names: Record<string, string> = {
            homedepot: 'Home Depot',
            lowes: "Lowe's",
            menards: 'Menards'
        };
        return names[retailer] || retailer;
    };

    const getRetailerColor = (retailer: string) => {
        const colors: Record<string, string> = {
            homedepot: 'from-orange-500 to-orange-600',
            lowes: 'from-blue-500 to-blue-600',
            menards: 'from-yellow-500 to-yellow-600'
        };
        return colors[retailer] || 'from-gray-500 to-gray-600';
    };

    const groupItemsByRetailer = () => {
        if (!cart) return {};
        
        return cart.items.reduce((groups, item) => {
            const retailer = item.product.retailer;
            if (!groups[retailer]) {
                groups[retailer] = [];
            }
            groups[retailer].push(item);
            return groups;
        }, {} as Record<string, CartItem[]>);
    };

    const getRetailerTotal = (items: CartItem[]) => {
        return items.reduce((sum, item) => sum + item.subtotal, 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Generating purchase cart...</p>
                </div>
            </div>
        );
    }

    if (!cart) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                    <span className="material-icons text-red-600">error</span>
                    <p className="text-red-800">Failed to generate purchase cart</p>
                </div>
            </div>
        );
    }

    const retailerGroups = groupItemsByRetailer();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Purchase Materials</h2>
                        <p className="text-blue-100">
                            Ready to order? Click links below to purchase directly from retailers
                        </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                        <p className="text-sm text-blue-100">Total Estimate</p>
                        <p className="text-2xl font-bold">{formatCurrency(cart.totalCost)}</p>
                    </div>
                </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start gap-3">
                    <span className="material-icons text-blue-600 text-2xl">local_shipping</span>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">Delivery Address</h3>
                        <p className="text-gray-700">{cart.deliveryAddress}</p>
                        <p className="text-sm text-gray-600 mt-2">
                            Estimated delivery: {cart.estimatedDeliveryDate.toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Shopping List</h3>
                <button
                    onClick={() => setGroupByRetailer(!groupByRetailer)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                    <span className="material-icons text-sm">
                        {groupByRetailer ? 'view_list' : 'store'}
                    </span>
                    <span>{groupByRetailer ? 'View All Items' : 'Group by Retailer'}</span>
                </button>
            </div>

            {/* Items by Retailer */}
            {groupByRetailer ? (
                <div className="space-y-6">
                    {Object.entries(retailerGroups).map(([retailer, items]) => (
                        <div key={retailer} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            {/* Retailer Header */}
                            <div className={`bg-gradient-to-r ${getRetailerColor(retailer)} text-white p-4`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-lg font-bold">{getRetailerName(retailer)}</h4>
                                        <p className="text-sm opacity-90">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm opacity-90">Subtotal</p>
                                        <p className="text-xl font-bold">{formatCurrency(getRetailerTotal(items))}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="divide-y divide-gray-200">
                                {items.map((item, index) => (
                                    <CartItemRow key={index} item={item} />
                                ))}
                            </div>

                            {/* Purchase Button */}
                            <div className="p-4 bg-gray-50">
                                <a
                                    href={`https://www.${retailer}.com`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`
                                        w-full px-6 py-3 bg-gradient-to-r ${getRetailerColor(retailer)} 
                                        text-white rounded-lg font-semibold hover:opacity-90 transition-all 
                                        shadow-lg hover:shadow-xl flex items-center justify-center gap-2
                                    `}
                                >
                                    <span className="material-icons">shopping_cart</span>
                                    <span>Shop at {getRetailerName(retailer)}</span>
                                    <span className="material-icons">open_in_new</span>
                                </a>
                                <p className="text-xs text-gray-600 text-center mt-2">
                                    Opens in new tab • Add items to cart manually
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* All Items List */
                <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                    {cart.items.map((item, index) => (
                        <CartItemRow key={index} item={item} showRetailer />
                    ))}
                </div>
            )}

            {/* Important Notes */}
            {cart.notes.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <span className="material-icons text-blue-600">info</span>
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-1">Important Information</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                {cart.notes.map((note, i) => (
                                    <li key={i}>• {note}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={onComplete}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                    <span className="material-icons">check_circle</span>
                    <span>Mark as Ordered</span>
                </button>

                <button
                    onClick={() => window.print()}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                    <span className="material-icons">print</span>
                    <span>Print List</span>
                </button>
            </div>

            {/* Coming Soon Features */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <span className="material-icons text-purple-600">upcoming</span>
                    <div>
                        <h4 className="font-semibold text-purple-900 mb-1">Coming Soon</h4>
                        <ul className="text-sm text-purple-800 space-y-1">
                            <li>• One-click ordering through affiliate partnerships</li>
                            <li>• Bulk order discounts for contractors</li>
                            <li>• Automatic order tracking and delivery notifications</li>
                            <li>• Coordinated delivery scheduling with project timeline</li>
                            <li>• Return and replacement management</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface CartItemRowProps {
    item: CartItem;
    showRetailer?: boolean;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ item, showRetailer = false }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getRetailerName = (retailer: string) => {
        const names: Record<string, string> = {
            homedepot: 'Home Depot',
            lowes: "Lowe's",
            menards: 'Menards'
        };
        return names[retailer] || retailer;
    };

    return (
        <div className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex gap-4">
                {/* Product Image */}
                <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                    {item.product.imageUrl ? (
                        <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover rounded" 
                        />
                    ) : (
                        <span className="material-icons text-gray-400">inventory_2</span>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h5 className="font-semibold text-gray-900">{item.product.name}</h5>
                            <p className="text-sm text-gray-600">{item.product.brand}</p>
                            {showRetailer && (
                                <p className="text-xs text-gray-500 mt-1">
                                    From {getRetailerName(item.product.retailer)}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
                            <p className="text-sm text-gray-600">
                                {formatCurrency(item.product.price)} × {item.quantity}
                            </p>
                        </div>
                    </div>

                    <div className="mt-2 flex items-center gap-4">
                        <span className={`
                            px-2 py-1 text-xs rounded-full font-semibold
                            ${item.deliveryOption === 'ship-to-site' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }
                        `}>
                            {item.deliveryOption === 'ship-to-site' ? '🚚 Ship to Site' : '🏪 Store Pickup'}
                        </span>

                        {item.estimatedDelivery && (
                            <span className="text-xs text-gray-600">
                                Est. {item.estimatedDelivery.toLocaleDateString()}
                            </span>
                        )}

                        <a
                            href={item.purchaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            <span>View Product</span>
                            <span className="material-icons text-xs">open_in_new</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseCartView;
