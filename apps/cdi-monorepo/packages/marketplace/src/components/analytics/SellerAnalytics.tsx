import { useState, useEffect } from 'react';
import { FiTrendingUp, FiDollarSign, FiPackage, FiUsers, FiBarChart2, FiPieChart, FiClock, FiStar } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface SalesStats {
  total_revenue: number;
  total_sales: number;
  average_sale_price: number;
  total_listings: number;
  active_listings: number;
  sold_listings: number;
  conversion_rate: number;
  total_views: number;
}

interface TopCategory {
  category_name: string;
  total_sales: number;
  revenue: number;
  avg_price: number;
}

interface RevenueByMonth {
  month: string;
  revenue: number;
  sales: number;
}

interface TrendingItem {
  title: string;
  category: string;
  price: number;
  sold_at: string;
  delivery_type: string;
}

export function SellerAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year' | 'all'>('month');
  
  const [stats, setStats] = useState<SalesStats>({
    total_revenue: 0,
    total_sales: 0,
    average_sale_price: 0,
    total_listings: 0,
    active_listings: 0,
    sold_listings: 0,
    conversion_rate: 0,
    total_views: 0
  });
  
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([]);
  const [recentSales, setRecentSales] = useState<TrendingItem[]>([]);
  const [bestSellers, setBestSellers] = useState<TrendingItem[]>([]);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, timeframe]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return monthAgo.toISOString();
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return yearAgo.toISOString();
      default:
        return null;
    }
  };

  const loadAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const dateFilter = getDateFilter();
      
      // Get all listings
      let listingsQuery = supabase
        .from('listings')
        .select('*, categories(name), bids(*), transactions(*)')
        .eq('seller_id', user.id);
      
      if (dateFilter) {
        listingsQuery = listingsQuery.gte('created_at', dateFilter);
      }
      
      const { data: listings, error } = await listingsQuery;
      
      if (error) throw error;

      // Calculate stats
      const soldListings = listings?.filter(l => l.status === 'sold') || [];
      const totalRevenue = soldListings.reduce((sum, l) => {
        const transaction = l.transactions?.[0];
        return sum + (transaction?.total_amount || l.current_bid || l.buy_now_price || 0);
      }, 0);
      
      const totalViews = listings?.reduce((sum, l) => sum + (l.view_count || 0), 0) || 0;
      
      const calculatedStats: SalesStats = {
        total_revenue: totalRevenue,
        total_sales: soldListings.length,
        average_sale_price: soldListings.length > 0 ? totalRevenue / soldListings.length : 0,
        total_listings: listings?.length || 0,
        active_listings: listings?.filter(l => l.status === 'active').length || 0,
        sold_listings: soldListings.length,
        conversion_rate: listings && listings.length > 0 
          ? (soldListings.length / listings.length) * 100 
          : 0,
        total_views: totalViews
      };
      
      setStats(calculatedStats);

      // Top categories
      const categoryMap = new Map<string, { sales: number; revenue: number; prices: number[] }>();
      soldListings.forEach(listing => {
        const categoryName = listing.categories?.name || 'Uncategorized';
        const price = listing.transactions?.[0]?.total_amount || listing.current_bid || listing.buy_now_price || 0;
        
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, { sales: 0, revenue: 0, prices: [] });
        }
        
        const cat = categoryMap.get(categoryName)!;
        cat.sales++;
        cat.revenue += price;
        cat.prices.push(price);
      });
      
      const categories: TopCategory[] = Array.from(categoryMap.entries())
        .map(([name, data]) => ({
          category_name: name,
          total_sales: data.sales,
          revenue: data.revenue,
          avg_price: data.revenue / data.sales
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      setTopCategories(categories);

      // Recent sales
      const recent = soldListings
        .sort((a, b) => new Date(b.sold_at || b.updated_at).getTime() - new Date(a.sold_at || a.updated_at).getTime())
        .slice(0, 5)
        .map(l => ({
          title: l.title,
          category: l.categories?.name || 'Uncategorized',
          price: l.transactions?.[0]?.total_amount || l.current_bid || l.buy_now_price || 0,
          sold_at: l.sold_at || l.updated_at,
          delivery_type: l.delivery_options?.[0] || 'self_pickup'
        }));
      
      setRecentSales(recent);

      // Best sellers (highest price)
      const best = soldListings
        .sort((a, b) => {
          const priceA = a.transactions?.[0]?.total_amount || a.current_bid || a.buy_now_price || 0;
          const priceB = b.transactions?.[0]?.total_amount || b.current_bid || b.buy_now_price || 0;
          return priceB - priceA;
        })
        .slice(0, 5)
        .map(l => ({
          title: l.title,
          category: l.categories?.name || 'Uncategorized',
          price: l.transactions?.[0]?.total_amount || l.current_bid || l.buy_now_price || 0,
          sold_at: l.sold_at || l.updated_at,
          delivery_type: l.delivery_options?.[0] || 'self_pickup'
        }));
      
      setBestSellers(best);

      // Revenue by month (last 6 months)
      const monthlyRevenue: Map<string, { revenue: number; sales: number }> = new Map();
      soldListings.forEach(listing => {
        const date = new Date(listing.sold_at || listing.updated_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const price = listing.transactions?.[0]?.total_amount || listing.current_bid || listing.buy_now_price || 0;
        
        if (!monthlyRevenue.has(monthKey)) {
          monthlyRevenue.set(monthKey, { revenue: 0, sales: 0 });
        }
        
        const month = monthlyRevenue.get(monthKey)!;
        month.revenue += price;
        month.sales++;
      });
      
      const revenue = Array.from(monthlyRevenue.entries())
        .map(([month, data]) => ({
          month,
          revenue: data.revenue,
          sales: data.sales
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6);
      
      setRevenueByMonth(revenue);
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seller Analytics</h1>
          <p className="text-gray-600">Track your performance and grow your business</p>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {(['week', 'month', 'year', 'all'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeframe === tf
                  ? 'bg-gradient-to-br from-purple-600 to-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tf === 'week' ? 'Last 7 Days' : tf === 'month' ? 'Last 30 Days' : tf === 'year' ? 'Last Year' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${stats.total_revenue.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            From {stats.total_sales} sales
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiPackage className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.total_sales}
              </div>
              <div className="text-sm text-gray-600">Items Sold</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {stats.active_listings} active listings
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${stats.average_sale_price.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Avg Sale Price</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Per item sold
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiBarChart2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.conversion_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {stats.total_views} total views
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiPieChart className="w-5 h-5 text-purple-600" />
            Top Performing Categories
          </h2>
          
          {topCategories.length > 0 ? (
            <div className="space-y-3">
              {topCategories.map((cat, idx) => (
                <div key={cat.category_name} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">{cat.category_name}</span>
                      <span className="text-green-600 font-semibold">${cat.revenue.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>{cat.total_sales} sales</span>
                      <span>•</span>
                      <span>Avg: ${cat.avg_price.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded-full"
                        style={{ width: `${(cat.revenue / topCategories[0].revenue) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiPieChart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No sales data yet</p>
            </div>
          )}
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiTrendingUp className="w-5 h-5 text-purple-600" />
            Revenue Trend
          </h2>
          
          {revenueByMonth.length > 0 ? (
            <div className="space-y-3">
              {revenueByMonth.map(month => (
                <div key={month.month} className="flex items-center gap-3">
                  <div className="w-16 text-sm text-gray-600 font-medium">
                    {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700">{month.sales} sales</span>
                      <span className="font-semibold text-green-600">${month.revenue.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full"
                        style={{ 
                          width: `${Math.max(10, (month.revenue / Math.max(...revenueByMonth.map(m => m.revenue))) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiTrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No revenue data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales & Best Sellers */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiClock className="w-5 h-5 text-purple-600" />
            Recent Sales
          </h2>
          
          {recentSales.length > 0 ? (
            <div className="space-y-3">
              {recentSales.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{item.title}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{new Date(item.sold_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">${item.price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiPackage className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No recent sales</p>
            </div>
          )}
        </div>

        {/* Best Sellers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiStar className="w-5 h-5 text-purple-600" />
            Best Sellers (Highest Value)
          </h2>
          
          {bestSellers.length > 0 ? (
            <div className="space-y-3">
              {bestSellers.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div className="font-medium text-gray-900">{item.title}</div>
                    </div>
                    <div className="text-xs text-gray-600 ml-8">{item.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-600 text-lg">${item.price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiStar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No sales data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiTrendingUp className="w-5 h-5 text-purple-600" />
          Insights & Recommendations
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          {topCategories.length > 0 && (
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-gray-900 mb-2">🎯 Focus on Your Winners</div>
              <div className="text-sm text-gray-600">
                Your <span className="font-semibold text-purple-600">{topCategories[0].category_name}</span> category 
                generated <span className="font-semibold text-green-600">${topCategories[0].revenue.toFixed(2)}</span>. 
                Consider stocking more items in this category!
              </div>
            </div>
          )}
          
          {stats.conversion_rate < 30 && stats.total_listings > 0 && (
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-gray-900 mb-2">📸 Improve Your Listings</div>
              <div className="text-sm text-gray-600">
                Your conversion rate is {stats.conversion_rate.toFixed(1)}%. Try adding better photos, 
                detailed descriptions, and competitive pricing to boost sales!
              </div>
            </div>
          )}
          
          {stats.average_sale_price > 0 && (
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm font-medium text-gray-900 mb-2">💰 Price Sweet Spot</div>
              <div className="text-sm text-gray-600">
                Your average sale price is <span className="font-semibold text-purple-600">${stats.average_sale_price.toFixed(2)}</span>. 
                Items priced within 20% of this tend to sell faster!
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900 mb-2">🚚 Delivery Options Matter</div>
            <div className="text-sm text-gray-600">
              Listings with multiple delivery options sell 40% faster. Offer same-day delivery to beat the competition!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
