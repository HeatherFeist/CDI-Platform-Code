import { useState, useEffect } from 'react';
import { Repeat, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase, Listing, Category } from '../../lib/supabase';
import ListingCard from '../listings/ListingCard';

export default function BrowseTrade() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    fetchCategories();
    fetchTradeListings();
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTradeListings = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_seller_id_fkey (
            username,
            avatar_url,
            rating
          )
        `)
        .eq('listing_type', 'trade')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,trade_for.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching trade listings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Repeat size={32} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trade & Barter</h1>
              <p className="text-gray-600">Exchange items without money - community trading made easy</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search trade items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Repeat className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How Trading Works</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Browse items available for trade</li>
                <li>✓ Contact the owner if you have what they're looking for</li>
                <li>✓ Arrange the exchange directly with each other</li>
                <li>✓ No money changes hands - just goods and services!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading trade items...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Repeat size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trade Items Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedCategory
                ? 'Try adjusting your search or filters'
                : 'Be the first to list an item for trade!'}
            </p>
            <Link
              to="/listings/create"
              className="inline-flex items-center space-x-2 bg-gradient-primary text-white px-6 py-3 rounded-lg hover:bg-gradient-primary-hover transition-colors"
            >
              <Repeat size={20} />
              <span>List Item for Trade</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Found {listings.length} item{listings.length !== 1 ? 's' : ''} available for trade
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <div key={listing.id} className="relative">
                  <ListingCard listing={listing} />
                  {/* Trade Badge */}
                  <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-lg">
                    <Repeat size={12} />
                    <span>TRADE</span>
                  </div>
                  {/* What they want */}
                  {listing.trade_for && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Looking for:</p>
                      <p className="text-sm text-blue-800">{listing.trade_for}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
