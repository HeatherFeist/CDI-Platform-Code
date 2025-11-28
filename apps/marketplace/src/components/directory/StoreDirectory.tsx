import React, { useState, useEffect } from 'react';
import { Search, Store, MapPin, Star, Users, Award, Filter, Grid, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface MemberStore {
  id: string;
  store_name: string;
  store_slug: string;
  tier: string;
  featured?: boolean;
  user_id: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url?: string;
    bio?: string;
    city?: string;
    state?: string;
  };
  stats?: {
    total_listings: number;
    total_sales: number;
    rating: number;
    reviews_count: number;
  };
}

const tierInfo = {
  'free': {
    name: 'Community Member',
    color: 'bg-blue-100 text-blue-700',
    icon: '🌱'
  },
  'partner': {
    name: 'Partner Level',
    color: 'bg-green-100 text-green-700',
    icon: '🤝'
  },
  'professional': {
    name: 'Professional',
    color: 'bg-purple-100 text-purple-700',
    icon: '⭐'
  },
  'enterprise': {
    name: 'Enterprise',
    color: 'bg-gold-100 text-gold-700',
    icon: '👑'
  }
};

export default function StoreDirectory() {
  const [stores, setStores] = useState<MemberStore[]>([]);
  const [filteredStores, setFilteredStores] = useState<MemberStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'sales' | 'alphabetical'>('newest');

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    filterAndSortStores();
  }, [stores, searchQuery, selectedTier, sortBy]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('member_stores')
        .select(`
          *,
          profiles(
            username,
            avatar_url,
            bio,
            city,
            state
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      console.log('Store Directory Query Result:', { data, error });

      if (error) throw error;

      // Fetch store stats for each store
      const storesWithStats = await Promise.all(
        (data || []).map(async (store) => {
          const { data: listings } = await supabase
            .from('listings')
            .select('id, status')
            .eq('seller_id', store.user_id);

          const totalListings = listings?.length || 0;
          const totalSales = listings?.filter(l => l.status === 'sold').length || 0;

          return {
            ...store,
            stats: {
              total_listings: totalListings,
              total_sales: totalSales,
              rating: 4.5, // TODO: Calculate from actual reviews
              reviews_count: Math.floor(Math.random() * 50) + 1 // TODO: Get from reviews table
            }
          };
        })
      );

      console.log('Stores with stats:', storesWithStats);
      setStores(storesWithStats);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortStores = () => {
    let filtered = [...stores];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(store =>
        store.store_name?.toLowerCase().includes(query) ||
        store.profiles?.username?.toLowerCase().includes(query) ||
        store.profiles?.bio?.toLowerCase().includes(query) ||
        store.profiles?.city?.toLowerCase().includes(query)
      );
    }

    // Apply tier filter
    if (selectedTier !== 'all') {
      filtered = filtered.filter(store => store.tier === selectedTier);
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.stats?.rating || 0) - (a.stats?.rating || 0));
        break;
      case 'sales':
        filtered.sort((a, b) => (b.stats?.total_sales || 0) - (a.stats?.total_sales || 0));
        break;
      case 'alphabetical':
        filtered.sort((a, b) => (a.store_name || '').localeCompare(b.store_name || ''));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredStores(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading member stores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative min-h-[400px] bg-gradient-to-r from-blue-600/90 to-purple-600/90 text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80")'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/85 to-purple-600/85" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center min-h-[400px]">
          <div className="text-center w-full">
            <Store className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" />
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg">Member Store Directory</h1>
            <p className="text-2xl text-blue-100 max-w-3xl mx-auto drop-shadow-md">
              Discover amazing stores from our nonprofit community members
            </p>
            <div className="mt-8 flex items-center justify-center space-x-6 text-blue-100">
              <div className="flex items-center space-x-2">
                <Store size={20} />
                <span>{stores.length} Member Stores</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users size={20} />
                <span>Trusted Community</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award size={20} />
                <span>Mission-Driven</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stores, members, or locations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Tier Filter */}
              <div className="flex items-center space-x-2">
                <Filter size={18} className="text-gray-500" />
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Tiers</option>
                  <option value="free">Community Members</option>
                  <option value="partner">Partner Level</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="rating">Highest Rated</option>
                <option value="sales">Most Sales</option>
                <option value="alphabetical">A-Z</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredStores.length === 0 ? (
          <div className="text-center py-16">
            <Store size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Stores Found</h3>
            <p className="text-gray-600">
              {searchQuery || selectedTier !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'No member stores are currently available.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredStores.length} of {stores.length} stores
            </div>
            
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
              {filteredStores.map((store) => (
                <StoreCard key={store.id} store={store} viewMode={viewMode} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StoreCard({ store, viewMode }: { store: MemberStore; viewMode: 'grid' | 'list' }) {
  const tierConfig = tierInfo[store.tier as keyof typeof tierInfo] || tierInfo.free;
  
  if (viewMode === 'list') {
    return (
      <Link to={`/store/${store.store_slug || store.profiles?.username}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {store.store_name?.[0] || store.profiles?.username?.[0] || 'S'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                    {store.store_name || `${store.profiles?.username}'s Store`}
                  </h3>
                  <p className="text-gray-600 text-sm">@{store.profiles?.username}</p>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierConfig.color}`}>
                    {tierConfig.icon} {tierConfig.name}
                  </span>
                  {store.featured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      ⭐ Featured
                    </span>
                  )}
                </div>
              </div>
              
              {store.profiles?.bio && (
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">{store.profiles.bio}</p>
              )}
              
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                {store.profiles?.city && (
                  <span className="flex items-center space-x-1">
                    <MapPin size={14} />
                    <span>{store.profiles.city}, {store.profiles.state}</span>
                  </span>
                )}
                <span className="flex items-center space-x-1">
                  <Star size={14} className="text-yellow-500" />
                  <span>{store.stats?.rating?.toFixed(1)} ({store.stats?.reviews_count})</span>
                </span>
                <span>{store.stats?.total_listings} listings</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/store/${store.store_slug || store.profiles?.username}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {store.store_name?.[0] || store.profiles?.username?.[0] || 'S'}
            </div>
            
            <div className="flex flex-col space-y-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierConfig.color}`}>
                {tierConfig.icon} {tierConfig.name}
              </span>
              {store.featured && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  ⭐ Featured
                </span>
              )}
            </div>
          </div>
          
          <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
            {store.store_name || `${store.profiles?.username}'s Store`}
          </h3>
          <p className="text-gray-600 text-sm mb-3">@{store.profiles?.username}</p>
          
          {store.profiles?.bio && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{store.profiles.bio}</p>
          )}
          
          <div className="space-y-2 text-sm text-gray-500">
            {store.profiles?.city && (
              <div className="flex items-center space-x-1">
                <MapPin size={14} />
                <span>{store.profiles.city}, {store.profiles.state}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Star size={14} className="text-yellow-500" />
              <span>{store.stats?.rating?.toFixed(1)} ({store.stats?.reviews_count} reviews)</span>
            </div>
            <div className="flex justify-between">
              <span>{store.stats?.total_listings} listings</span>
              <span>{store.stats?.total_sales} sales</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}