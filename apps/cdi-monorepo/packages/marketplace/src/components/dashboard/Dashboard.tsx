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
      <div className="market-shell flex min-h-screen items-center justify-center">
        <div className="market-panel px-6 py-5 text-slate-300">Please sign in to view your dashboard</div>
      </div>
    );
  }

  return (
    <div className="market-shell min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-white">My Dashboard</h1>
          <p className="text-slate-400">Manage your auctions and track your activity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="market-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Active Listings</span>
              <Package className="text-indigo-300" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{stats.activeListings}</p>
          </div>

          <div className="market-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Total Views</span>
              <Eye className="text-indigo-300" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalViews}</p>
          </div>

          <div className="market-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Active Bids</span>
              <TrendingUp className="text-emerald-300" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">{stats.activeBids}</p>
          </div>

          <div className="market-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Total Earnings</span>
              <DollarSign className="text-amber-300" size={20} />
            </div>
            <p className="text-3xl font-bold text-white">${stats.totalEarnings.toFixed(2)}</p>
          </div>
        </div>

        <div className="market-panel overflow-hidden">
          <div className="border-b border-slate-800">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('selling')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'selling'
                    ? 'border-indigo-400 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Auctions
              </button>
              <button
                onClick={() => setActiveTab('store')}
                className={`py-4 border-b-2 font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === 'store'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Store size={18} />
                <span>Store</span>
              </button>
              <button
                onClick={() => setActiveTab('bidding')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'bidding'
                    ? 'border-indigo-400 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Bidding
              </button>
              <button
                onClick={() => setActiveTab('sold')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'sold'
                    ? 'border-violet-400 text-violet-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Sold
              </button>
              <button
                onClick={() => setActiveTab('won')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'won'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Won
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-400"></div>
                <p className="mt-4 text-slate-300">Loading...</p>
              </div>
            ) : (activeTab === 'selling' || activeTab === 'sold' || activeTab === 'store') && listings.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto mb-4 text-slate-500" />
                <p className="text-lg text-slate-300">
                  {activeTab === 'store' ? 'No store items found' : 'No listings found'}
                </p>
                {(activeTab === 'selling' || activeTab === 'store') && (
                  <button
                    onClick={() => navigate('/listings/create')}
                    className={`mt-4 rounded-2xl px-6 py-2 font-medium transition-colors ${
                      activeTab === 'store'
                        ? 'bg-emerald-500/90 text-white hover:bg-emerald-400'
                        : 'market-button-primary'
                    }`}
                  >
                    {activeTab === 'store' ? 'Create Your First Store Item' : 'Create Your First Listing'}
                  </button>
                )}
              </div>
            ) : (activeTab === 'bidding' || activeTab === 'won') && bids.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp size={48} className="mx-auto mb-4 text-slate-500" />
                <p className="text-lg text-slate-300">No bids found</p>
                <button
                  onClick={() => navigate('/')}
                  className="market-button-primary mt-4 px-6 py-2"
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
                        className={`rounded-3xl border p-4 transition-colors backdrop-blur-sm ${
                          isStore
                            ? 'border-emerald-400/20 bg-slate-950/70 hover:border-emerald-400/45 hover:bg-slate-900/80'
                            : 'border-white/10 bg-slate-950/70 hover:border-cyan-400/35 hover:bg-slate-900/80'
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
                                  <h3 className="font-semibold text-white">{listing.title}</h3>
                                  {isStore && (
                                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-200">
                                      STORE
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-slate-400">
                                  {listing.category && (
                                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-slate-300">
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
                                        ? 'text-emerald-300'
                                        : 'text-rose-300'
                                    }`}>
                                      <Package size={14} className="mr-1" />
                                      {listing.stock_quantity || 0} in stock
                                    </span>
                                  ) : timeLeft ? (
                                    <span className="flex items-center text-emerald-300">
                                      <Clock size={14} className="mr-1" />
                                      Active
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">Ended</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-slate-400">
                                  {isStore ? 'Price' : 'Current Bid'}
                                </p>
                                <p className={`text-xl font-bold ${
                                  isStore ? 'text-emerald-300' : 'text-cyan-300'
                                }`}>
                                  ${isStore 
                                    ? listing.starting_bid.toFixed(2)
                                    : (listing.current_bid > 0 ? listing.current_bid.toFixed(2) : listing.starting_bid.toFixed(2))
                                  }
                                </p>
                                {isStore && listing.compare_at_price && listing.compare_at_price > listing.starting_bid && (
                                  <p className="text-xs text-slate-500 line-through">
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
                                    ? 'text-emerald-300 hover:text-emerald-200'
                                    : 'text-cyan-300 hover:text-cyan-200'
                                }`}
                              >
                                View Details
                              </button>
                              {(activeTab === 'selling' || activeTab === 'store') && isActive && (
                                <button
                                  onClick={() => handleEditListing(listing.id)}
                                  className="flex items-center text-sm font-medium text-emerald-300 hover:text-emerald-200"
                                >
                                  <Edit size={14} className="mr-1" />
                                  Edit
                                </button>
                              )}
                              {(activeTab === 'selling' || activeTab === 'store') && (
                                <button
                                  onClick={() => handleDeleteListing(listing.id)}
                                  className="flex items-center text-sm font-medium text-rose-300 hover:text-rose-200"
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
                        className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 transition-colors backdrop-blur-sm hover:border-cyan-400/35 hover:bg-slate-900/80"
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
                                <h3 className="mb-1 font-semibold text-white">{bid.listing.title}</h3>
                                <div className="flex items-center space-x-4 text-sm text-slate-400">
                                  <span>Your bid: ${bid.amount.toFixed(2)}</span>
                                  {bid.is_winning && (
                                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-1 font-medium text-emerald-200">
                                      Winning
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-slate-400">Current Bid</p>
                                <p className="text-xl font-bold text-cyan-300">
                                  ${bid.listing.current_bid.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => navigate(`/listings/${bid.listing_id}`)}
                              className="mt-3 text-sm font-medium text-cyan-300 hover:text-cyan-200"
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
