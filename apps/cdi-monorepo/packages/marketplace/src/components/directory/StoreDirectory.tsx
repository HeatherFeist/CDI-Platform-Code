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
    color: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-100',
    icon: '🌱'
  },
  'partner': {
    name: 'Partner Level',
    color: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100',
    icon: '🤝'
  },
  'professional': {
    name: 'Professional',
    color: 'border-violet-400/30 bg-violet-500/15 text-violet-100',
    icon: '⭐'
  },
  'enterprise': {
    name: 'Enterprise',
    color: 'border-amber-400/30 bg-amber-500/15 text-amber-100',
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
      <div className="market-shell flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-400"></div>
          <p className="text-slate-300">Loading member stores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="market-shell min-h-screen">
      {/* Hero Section */}
      <div className="market-hero relative min-h-[400px] overflow-hidden text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80")'
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.2),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(49,46,129,0.88),rgba(8,47,73,0.92))]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center min-h-[400px]">
          <div className="text-center w-full">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/15 bg-white/10 backdrop-blur-xl">
              <Store className="h-12 w-12 drop-shadow-lg" />
            </div>
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg">Member Store Directory</h1>
            <p className="mx-auto max-w-3xl text-2xl text-slate-200 drop-shadow-md">
              Discover amazing stores from our nonprofit community members
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-slate-200">
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
      <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stores, members, or locations..."
                className="market-input w-full pl-10 pr-4"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Tier Filter */}
              <div className="flex items-center space-x-2">
                <Filter size={18} className="text-slate-400" />
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="market-input px-3 py-2"
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
                className="market-input px-3 py-2"
              >
                <option value="newest">Newest First</option>
                <option value="rating">Highest Rated</option>
                <option value="sales">Most Sales</option>
                <option value="alphabetical">A-Z</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-2xl border border-white/10 bg-slate-900/80 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-xl p-2 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-cyan-500/15 text-cyan-200'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-xl p-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-cyan-500/15 text-cyan-200'
                      : 'text-slate-400 hover:text-white'
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
          <div className="market-panel py-16 text-center">
            <Store size={64} className="mx-auto mb-4 text-slate-500" />
            <h3 className="mb-2 text-xl font-semibold text-white">No Stores Found</h3>
            <p className="text-slate-300">
              {searchQuery || selectedTier !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'No member stores are currently available.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-slate-400">
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
        <div className="market-panel-hover rounded-3xl p-6">
          <div className="flex items-start space-x-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 text-xl font-bold text-white shadow-[0_16px_32px_-20px_rgba(34,211,238,0.8)]">
              {store.store_name?.[0] || store.profiles?.username?.[0] || 'S'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="truncate text-lg font-semibold text-white">
                    {store.store_name || `${store.profiles?.username}'s Store`}
                  </h3>
                  <p className="text-sm text-slate-400">@{store.profiles?.username}</p>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <span className={`rounded-full border px-2 py-1 text-xs font-medium ${tierConfig.color}`}>
                    {tierConfig.icon} {tierConfig.name}
                  </span>
                  {store.featured && (
                    <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-100">
                      ⭐ Featured
                    </span>
                  )}
                </div>
              </div>
              
              {store.profiles?.bio && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-300">{store.profiles.bio}</p>
              )}
              
              <div className="mt-3 flex items-center space-x-4 text-sm text-slate-400">
                {store.profiles?.city && (
                  <span className="flex items-center space-x-1">
                    <MapPin size={14} />
                    <span>{store.profiles.city}, {store.profiles.state}</span>
                  </span>
                )}
                <span className="flex items-center space-x-1">
                  <Star size={14} className="text-amber-300" />
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
      <div className="market-panel-hover overflow-hidden rounded-3xl">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 font-bold text-white shadow-[0_16px_32px_-20px_rgba(34,211,238,0.8)]">
              {store.store_name?.[0] || store.profiles?.username?.[0] || 'S'}
            </div>
            
            <div className="flex flex-col space-y-1">
              <span className={`rounded-full border px-2 py-1 text-xs font-medium ${tierConfig.color}`}>
                {tierConfig.icon} {tierConfig.name}
              </span>
              {store.featured && (
                <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-100">
                  ⭐ Featured
                </span>
              )}
            </div>
          </div>
          
          <h3 className="mb-1 truncate text-lg font-semibold text-white">
            {store.store_name || `${store.profiles?.username}'s Store`}
          </h3>
          <p className="mb-3 text-sm text-slate-400">@{store.profiles?.username}</p>
          
          {store.profiles?.bio && (
            <p className="mb-4 line-clamp-3 text-sm text-slate-300">{store.profiles.bio}</p>
          )}
          
          <div className="space-y-2 text-sm text-slate-400">
            {store.profiles?.city && (
              <div className="flex items-center space-x-1">
                <MapPin size={14} />
                <span>{store.profiles.city}, {store.profiles.state}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Star size={14} className="text-amber-300" />
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