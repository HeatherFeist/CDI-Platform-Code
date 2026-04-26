import React, { useState, useEffect } from 'react';
import { Store, Search, Filter, Grid, List, Package } from 'lucide-react';
import { supabase, Listing } from '../../lib/supabase';
import ListingCard from '../listings/ListingCard';

export default function BrowseStore() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'popular'>('newest');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });

  useEffect(() => {
    fetchStoreListings();
  }, []);

  useEffect(() => {
    filterAndSortListings();
  }, [listings, searchQuery, sortBy, selectedCategory, priceRange]);

  const fetchStoreListings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          seller:profiles(id, username)
        `)
        .eq('listing_type', 'store')
        .eq('status', 'active')
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setListings(data || []);
    } catch (error) {
      console.error('Error fetching store listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortListings = () => {
    let filtered = [...listings];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (listing) =>
          listing.title.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query) ||
          listing.seller?.username.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((listing) => listing.category?.name === selectedCategory);
    }

    // Apply price range filter
    if (priceRange.min !== '') {
      const minPrice = parseFloat(priceRange.min);
      if (!isNaN(minPrice)) {
        filtered = filtered.filter((listing) => listing.starting_bid >= minPrice);
      }
    }
    if (priceRange.max !== '') {
      const maxPrice = parseFloat(priceRange.max);
      if (!isNaN(maxPrice)) {
        filtered = filtered.filter((listing) => listing.starting_bid <= maxPrice);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.starting_bid - b.starting_bid);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.starting_bid - a.starting_bid);
        break;
      case 'popular':
        filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredListings(filtered);
  };

  const categories = Array.from(new Set(listings.map((l) => l.category?.name).filter((c): c is string => !!c)));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-400"></div>
          <p className="text-slate-400">Loading store items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="market-hero text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center space-x-3 mb-3">
            <Store size={40} />
            <h1 className="text-4xl font-bold">Browse Store</h1>
          </div>
          <p className="text-lg text-slate-300">
            Shop fixed-price items from trusted sellers
          </p>
          <div className="mt-6 flex items-center space-x-6 text-slate-300">
            <div className="flex items-center space-x-2">
              <Package size={20} />
              <span>{listings.length} items available</span>
            </div>
            <div className="flex items-center space-x-2">
              <Store size={20} />
              <span>{new Set(listings.map(l => l.seller_id)).size} sellers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/85 shadow-xl backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 transform text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items or sellers..."
                className="market-input w-full py-2 pl-10 pr-4"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Filter size={18} className="text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="market-input px-3 py-2"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min $"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="market-input w-24 px-3 py-2"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  placeholder="Max $"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="market-input w-24 px-3 py-2"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="market-input px-3 py-2"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-xl bg-slate-900/80 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid'
                      ? 'bg-slate-800 shadow-sm text-indigo-300'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list'
                      ? 'bg-slate-800 shadow-sm text-indigo-300'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchQuery || selectedCategory !== 'all' || priceRange.min || priceRange.max) && (
            <div className="mt-3 flex items-center space-x-2 text-sm">
              <span className="text-slate-400">Active filters:</span>
              {searchQuery && (
                <span className="market-pill">
                  Search: "{searchQuery}"
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="market-pill">
                  {selectedCategory}
                </span>
              )}
              {(priceRange.min || priceRange.max) && (
                <span className="market-pill">
                  ${priceRange.min || '0'} - ${priceRange.max || '∞'}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setPriceRange({ min: '', max: '' });
                }}
                className="font-medium text-indigo-300 hover:text-indigo-200"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredListings.length === 0 ? (
          <div className="market-panel py-16 text-center">
            <Package size={64} className="mx-auto mb-4 text-slate-600" />
            <h3 className="mb-2 text-xl font-semibold text-slate-100">No Items Found</h3>
            <p className="text-slate-400">
              {searchQuery || selectedCategory !== 'all' || priceRange.min || priceRange.max
                ? 'Try adjusting your filters or search query.'
                : 'No store items are currently available.'}
            </p>
            {(searchQuery || selectedCategory !== 'all' || priceRange.min || priceRange.max) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setPriceRange({ min: '', max: '' });
                }}
                className="market-button-primary mt-4 px-6 py-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-slate-400">
              Showing {filteredListings.length} of {listings.length} items
            </div>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }
            >
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
