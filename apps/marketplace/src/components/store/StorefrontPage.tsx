import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Store, Package, Star, Grid, List, Search, Filter, Plus } from 'lucide-react';
import { supabase, Listing } from '../../lib/supabase';
import ListingCard from '../listings/ListingCard';
import { useAuth } from '../../contexts/AuthContext';

interface SellerProfile {
  id: string;
  username: string;
  rating: number;
  total_reviews: number;
  profile_photo_url?: string;
  created_at: string;
}

export default function StorefrontPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [storeName, setStoreName] = useState<string>('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'popular'>('newest');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (username) {
      fetchSellerAndListings();
    }
  }, [username]);

  useEffect(() => {
    filterAndSortListings();
  }, [listings, searchQuery, sortBy, selectedCategory]);

  const fetchSellerAndListings = async () => {
    try {
      setLoading(true);

      // Fetch seller profile - try both username and store_slug
      let sellerData = null;
      let sellerError = null;

      // First try to find by username
      const usernameResult = await supabase
        .from('profiles')
        .select('id, username, rating, total_reviews, profile_photo_url, created_at, store_slug')
        .eq('username', username)
        .maybeSingle();

      if (usernameResult.data) {
        sellerData = usernameResult.data;
      } else {
        // If not found, try by store_slug
        const slugResult = await supabase
          .from('profiles')
          .select('id, username, rating, total_reviews, profile_photo_url, created_at, store_slug')
          .eq('store_slug', username)
          .maybeSingle();
        
        sellerData = slugResult.data;
        sellerError = slugResult.error;
      }

      console.log('Storefront lookup for:', username, 'Found:', sellerData);

      if (sellerError) throw sellerError;
      if (!sellerData) {
        console.error('Store not found for:', username);
        navigate('/');
        return;
      }

      setSeller(sellerData);

      // Fetch store name from member_stores table
      const { data: storeData } = await supabase
        .from('member_stores')
        .select('store_name')
        .eq('user_id', sellerData.id)
        .maybeSingle();

      setStoreName(storeData?.store_name || `${sellerData.username}'s Store`);

      // Fetch seller's store listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', sellerData.id)
        .eq('listing_type', 'store')
        .eq('status', 'active')
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false });

      console.log('Store listings query result:', { listingsData, listingsError, seller_id: sellerData.id });

      if (listingsError) throw listingsError;

      setListings(listingsData || []);
    } catch (error) {
      console.error('Error fetching storefront:', error);
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
          listing.description.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((listing) => listing.category?.name === selectedCategory);
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
          <p className="text-gray-600">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Storefront Not Found</h2>
          <p className="text-gray-600 mb-6">The seller you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Storefront Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-start space-x-6">
            {/* Seller Avatar */}
            <div className="flex-shrink-0">
              {seller.profile_photo_url ? (
                <img
                  src={seller.profile_photo_url}
                  alt={seller.username}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-green-500 flex items-center justify-center text-3xl font-bold">
                  {seller.username[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold">{storeName}</h1>
                <Store size={28} />
              </div>
              <div className="flex items-center space-x-4 mb-4">
                {seller.rating > 0 && (
                  <div className="flex items-center space-x-1">
                    <Star size={18} className="fill-yellow-300 text-yellow-300" />
                    <span className="font-semibold">{seller.rating.toFixed(1)}</span>
                    <span className="text-green-100">({seller.total_reviews} reviews)</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Package size={18} />
                  <span>{listings.length} items</span>
                </div>
              </div>
              <p className="text-green-100">
                Member since {new Date(seller.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* List New Item Button - Only visible to store owner */}
            {user && seller && user.id === seller.id && (
              <div className="flex-shrink-0">
                <button
                  onClick={() => navigate('/listings/create')}
                  className="flex items-center space-x-2 px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors shadow-md"
                >
                  <Plus size={20} />
                  <span>List New Item</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-3">
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
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Items Found</h3>
            <p className="text-gray-600">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'This store has no items available at the moment.'}
            </p>
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
              {filteredListings.map((listing) => {
                try {
                  // Add seller info back to listing for ListingCard
                  const listingWithSeller = {
                    ...listing,
                    seller: seller ? {
                      id: seller.id,
                      username: seller.username,
                      rating: seller.rating
                    } : undefined
                  };
                  return (
                    <ListingCard 
                      key={listing.id} 
                      listing={listingWithSeller as any}
                      showActions={true}
                      onDelete={() => {
                        setListings(prev => prev.filter(l => l.id !== listing.id));
                        setFilteredListings(prev => prev.filter(l => l.id !== listing.id));
                      }}
                    />
                  );
                } catch (error) {
                  console.error('Error rendering listing:', listing.id, error);
                  return null;
                }
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
