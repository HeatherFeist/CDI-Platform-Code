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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center space-x-3 mb-3">
            <Store size={40} />
            <h1 className="text-4xl font-bold">Browse Store</h1>
          </div>
          <p className="text-green-100 text-lg">
            Shop fixed-price items from trusted sellers
          </p>
          <div className="mt-6 flex items-center space-x-6 text-green-100">
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
                placeholder="Search items or sellers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Filter size={18} className="text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max $"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
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
              <span className="text-gray-600">Active filters:</span>
              {searchQuery && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                  Search: "{searchQuery}"
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                  {selectedCategory}
                </span>
              )}
              {(priceRange.min || priceRange.max) && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                  ${priceRange.min || '0'} - ${priceRange.max || '∞'}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setPriceRange({ min: '', max: '' });
                }}
                className="text-green-600 hover:text-green-700 font-medium"
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
          <div className="text-center py-16">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Items Found</h3>
            <p className="text-gray-600">
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
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
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
