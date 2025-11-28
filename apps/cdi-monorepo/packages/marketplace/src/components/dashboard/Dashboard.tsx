import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, DollarSign, Clock, Eye, Trash2, Edit, Store } from 'lucide-react';
import { supabase, Listing, Bid } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'selling' | 'store' | 'bidding' | 'sold' | 'won'>('selling');
  const [listings, setListings] = useState<Listing[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeListings: 0,
    totalViews: 0,
    activeBids: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (activeTab === 'selling' || activeTab === 'sold' || activeTab === 'store') {
        const query = supabase
          .from('listings')
          .select(`
            *,
            category:categories(id, name, icon)
          `)
          .eq('seller_id', user.id);

        if (activeTab === 'selling') {
          query.eq('status', 'active').eq('listing_type', 'auction');
        } else if (activeTab === 'store') {
          query.eq('status', 'active').eq('listing_type', 'store');
        } else {
          query.in('status', ['sold', 'completed']);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        setListings(data || []);
      } else if (activeTab === 'bidding' || activeTab === 'won') {
        const query = supabase
          .from('bids')
          .select(`
            *,
            listing:listings(
              *,
              seller:profiles!listings_seller_id_fkey(id, username, rating),
              category:categories(id, name, icon)
            )
          `)
          .eq('bidder_id', user.id);

        if (activeTab === 'bidding') {
          query.eq('is_winning', true);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        if (activeTab === 'won') {
          const wonBids = (data || []).filter(
            bid => bid.listing?.status === 'sold' && bid.listing?.winner_id === user.id
          );
          setBids(wonBids);
        } else {
          setBids(data || []);
        }
      }

      await fetchStats();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data: listingsData } = await supabase
        .from('listings')
        .select('view_count, status')
        .eq('seller_id', user.id);

      const { data: bidsData } = await supabase
        .from('bids')
        .select('id, is_winning')
        .eq('bidder_id', user.id);

      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('seller_id', user.id)
        .eq('payment_status', 'completed');

      const activeListings = listingsData?.filter(l => l.status === 'active').length || 0;
      const totalViews = listingsData?.reduce((sum, l) => sum + (l.view_count || 0), 0) || 0;
      const activeBids = bidsData?.filter(b => b.is_winning).length || 0;
      const totalEarnings = transactionsData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      setStats({ activeListings, totalViews, activeBids, totalEarnings });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete listing');
    }
  };

  const canEditListing = async (listingId: string): Promise<boolean> => {
    try {
      const { count } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('listing_id', listingId);

      return count === 0;
    } catch (error) {
      console.error('Error checking bids:', error);
      return false;
    }
  };

  const handleEditListing = async (listingId: string) => {
    const canEdit = await canEditListing(listingId);
    if (!canEdit) {
      alert('Cannot edit a listing that has received bids.');
      return;
    }
    navigate(`/listings/${listingId}/edit`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your dashboard</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Manage your auctions and track your activity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Active Listings</span>
              <Package className="text-purple-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeListings}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Views</span>
              <Eye className="text-purple-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalViews}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Active Bids</span>
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeBids}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Earnings</span>
              <DollarSign className="text-yellow-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">${stats.totalEarnings.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('selling')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'selling'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Auctions
              </button>
              <button
                onClick={() => setActiveTab('store')}
                className={`py-4 border-b-2 font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === 'store'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Store size={18} />
                <span>Store</span>
              </button>
              <button
                onClick={() => setActiveTab('bidding')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'bidding'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Bidding
              </button>
              <button
                onClick={() => setActiveTab('sold')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'sold'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Sold
              </button>
              <button
                onClick={() => setActiveTab('won')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'won'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Won
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : (activeTab === 'selling' || activeTab === 'sold' || activeTab === 'store') && listings.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">
                  {activeTab === 'store' ? 'No store items found' : 'No listings found'}
                </p>
                {(activeTab === 'selling' || activeTab === 'store') && (
                  <button
                    onClick={() => navigate('/listings/create')}
                    className={`mt-4 px-6 py-2 rounded-lg transition-colors shadow-md ${
                      activeTab === 'store'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gradient-primary text-white hover:bg-gradient-primary-hover'
                    }`}
                  >
                    {activeTab === 'store' ? 'Create Your First Store Item' : 'Create Your First Listing'}
                  </button>
                )}
              </div>
            ) : (activeTab === 'bidding' || activeTab === 'won') && bids.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">No bids found</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 bg-gradient-primary text-white px-6 py-2 rounded-lg hover:bg-gradient-primary-hover transition-colors shadow-md"
                >
                  Browse Auctions
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {(activeTab === 'selling' || activeTab === 'sold' || activeTab === 'store') &&
                  listings.map((listing) => {
                    const isStore = listing.listing_type === 'store';
                    const timeLeft = listing.end_time ? new Date(listing.end_time) > new Date() : true;
                    const isActive = listing.status === 'active';
                    
                    return (
                      <div
                        key={listing.id}
                        className={`border border-gray-200 rounded-lg p-4 transition-colors ${
                          isStore ? 'hover:border-green-300' : 'hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <img
                            src={listing.images?.[0] || 'https://images.pexels.com/photos/3345882/pexels-photo-3345882.jpeg?auto=compress&cs=tinysrgb&w=200'}
                            alt={listing.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                                  {isStore && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                      STORE
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  {listing.category && (
                                    <span className="bg-gray-100 px-2 py-1 rounded">
                                      {listing.category.name}
                                    </span>
                                  )}
                                  <span className="flex items-center">
                                    <Eye size={14} className="mr-1" />
                                    {listing.view_count} views
                                  </span>
                                  {isStore ? (
                                    <span className={`flex items-center ${
                                      listing.stock_quantity && listing.stock_quantity > 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }`}>
                                      <Package size={14} className="mr-1" />
                                      {listing.stock_quantity || 0} in stock
                                    </span>
                                  ) : timeLeft ? (
                                    <span className="flex items-center text-green-600">
                                      <Clock size={14} className="mr-1" />
                                      Active
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">Ended</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">
                                  {isStore ? 'Price' : 'Current Bid'}
                                </p>
                                <p className={`text-xl font-bold ${
                                  isStore ? 'text-green-600' : 'text-blue-600'
                                }`}>
                                  ${isStore 
                                    ? listing.starting_bid.toFixed(2)
                                    : (listing.current_bid > 0 ? listing.current_bid.toFixed(2) : listing.starting_bid.toFixed(2))
                                  }
                                </p>
                                {isStore && listing.compare_at_price && listing.compare_at_price > listing.starting_bid && (
                                  <p className="text-xs text-gray-400 line-through">
                                    ${listing.compare_at_price.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-3">
                              <button
                                onClick={() => navigate(`/listings/${listing.id}`)}
                                className={`text-sm font-medium ${
                                  isStore
                                    ? 'text-green-600 hover:text-green-700'
                                    : 'text-blue-600 hover:text-blue-700'
                                }`}
                              >
                                View Details
                              </button>
                              {(activeTab === 'selling' || activeTab === 'store') && isActive && (
                                <button
                                  onClick={() => handleEditListing(listing.id)}
                                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                                >
                                  <Edit size={14} className="mr-1" />
                                  Edit
                                </button>
                              )}
                              {(activeTab === 'selling' || activeTab === 'store') && (
                                <button
                                  onClick={() => handleDeleteListing(listing.id)}
                                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                                >
                                  <Trash2 size={14} className="mr-1" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {(activeTab === 'bidding' || activeTab === 'won') &&
                  bids.map((bid) => {
                    if (!bid.listing) return null;
                    return (
                      <div
                        key={bid.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start space-x-4">
                          <img
                            src={bid.listing.images?.[0] || 'https://images.pexels.com/photos/3345882/pexels-photo-3345882.jpeg?auto=compress&cs=tinysrgb&w=200'}
                            alt={bid.listing.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">{bid.listing.title}</h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>Your bid: ${bid.amount.toFixed(2)}</span>
                                  {bid.is_winning && (
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                                      Winning
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">Current Bid</p>
                                <p className="text-xl font-bold text-blue-600">
                                  ${bid.listing.current_bid.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => navigate(`/listings/${bid.listing_id}`)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-3"
                            >
                              View Auction
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
