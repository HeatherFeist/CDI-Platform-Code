import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, TrendingUp, MapPin, Users } from 'lucide-react';
import { supabase, Listing, Category } from '../../lib/supabase';
import ListingCard from '../listings/ListingCard';
import LocationSelector from '../location/LocationSelector';
import { LocationService } from '../../services/LocationService';
import { City } from '../../types/location';
import { useAuth } from '../../contexts/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('ending_soon');
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const locationService = LocationService.getInstance();

  useEffect(() => {
    fetchCategories();
    loadDefaultCity();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      fetchListings();
    }
  }, [selectedCategory, selectedCondition, sortBy, selectedCity]);

  const loadDefaultCity = async () => {
    try {
      // Load Dayton as default city
      const dayton = await locationService.getCityByName('Dayton', 'Ohio');
      if (dayton) {
        setSelectedCity(dayton);
      }
    } catch (error) {
      console.error('Error loading default city:', error);
    }
  };

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

  const fetchListings = async () => {
    if (!selectedCity) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('listings')
        .select(`
          *,
          seller:profiles!listings_seller_id_fkey(id, username, rating),
          category:categories(id, name, icon),
          city:cities(id, name, state)
        `)
        .eq('status', 'active')
        .eq('city_id', selectedCity.id)
        .eq('listing_type', 'auction')
        .gt('end_time', new Date().toISOString());

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      if (selectedCondition !== 'all') {
        query = query.eq('condition', selectedCondition);
      }

      if (sortBy === 'ending_soon') {
        query = query.order('end_time', { ascending: true });
      } else if (sortBy === 'highest_bid') {
        query = query.order('current_bid', { ascending: false });
      } else if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = async (city: City) => {
    setSelectedCity(city);
    
    // Update user's preferred city if logged in
    if (user) {
      try {
        await locationService.updateUserLocationPreferences(user.id, {
          city_id: city.id
        });
      } catch (error) {
        console.error('Error updating user location preference:', error);
      }
    }
  };

  const filteredListings = listings.filter((listing) =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-primary text-white py-12 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Location Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome to Constructive Designs Marketplace {selectedCity && `in ${selectedCity.name}`}
              </h1>
              <p className="text-purple-100 text-lg">
                Auction, trade, and discover amazing deals with your local community
              </p>
            </div>
            
            <button
              onClick={() => setShowLocationSelector(true)}
              className="bg-white/10 backdrop-blur text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2"
            >
              <MapPin size={20} />
              <span>{selectedCity ? `${selectedCity.name}, ${selectedCity.state}` : 'Select Location'}</span>
            </button>
          </div>

          {/* Local Market Info */}
          {selectedCity && (
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <Users size={20} className="text-purple-200" />
                  <div>
                    <p className="font-medium">Local Pickup</p>
                    <p className="text-sm text-purple-200">Pick up directly from sellers</p>
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <MapPin size={20} className="text-purple-200" />
                  <div>
                    <p className="font-medium">Local Delivery</p>
                    <p className="text-sm text-purple-200">Convenient delivery to your door</p>
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Clock size={20} className="text-purple-200" />
                  <div>
                    <p className="font-medium">Fast Shipping</p>
                    <p className="text-sm text-purple-200">Multiple shipping options available</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-md"
              />
            </div>
            <button
              onClick={fetchListings}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-purple-50 transition-colors shadow-md"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 space-y-6">
            {/* Condition Filter Tabs */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Filter size={20} className="mr-2" />
                Item Condition
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCondition('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                    selectedCondition === 'all'
                      ? 'bg-gradient-primary text-white font-medium shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">📦</span>
                  All Items
                </button>
                <button
                  onClick={() => setSelectedCondition('new')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                    selectedCondition === 'new'
                      ? 'bg-gradient-primary text-white font-medium shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">✨</span>
                  New Items
                </button>
                <button
                  onClick={() => setSelectedCondition('used')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                    selectedCondition === 'used'
                      ? 'bg-gradient-primary text-white font-medium shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">♻️</span>
                  Used Items
                </button>
                <button
                  onClick={() => setSelectedCondition('handcrafted')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                    selectedCondition === 'handcrafted'
                      ? 'bg-gradient-primary text-white font-medium shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">🤲</span>
                  Hand-crafted
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Filter size={20} className="mr-2" />
                Categories
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-gradient-primary text-white font-medium shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-gradient-primary text-white font-medium shadow-md'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Sort By</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSortBy('ending_soon')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                    sortBy === 'ending_soon'
                      ? 'bg-gradient-primary text-white font-medium shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Clock size={16} className="mr-2" />
                  Ending Soon
                </button>
                <button
                  onClick={() => setSortBy('highest_bid')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                    sortBy === 'highest_bid'
                      ? 'bg-gradient-primary text-white font-medium shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <TrendingUp size={16} className="mr-2" />
                  Highest Bid
                </button>
                <button
                  onClick={() => setSortBy('newest')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    sortBy === 'newest'
                      ? 'bg-gradient-primary text-white font-medium shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Newest
                </button>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500 text-lg">No active auctions found</p>
                <p className="text-gray-400 mt-2">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-gray-600">
                  Showing {filteredListings.length} {filteredListings.length === 1 ? 'auction' : 'auctions'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onClick={() => navigate(`/listings/${listing.id}`)}
                    />
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Location Selector Modal */}
      <LocationSelector
        isOpen={showLocationSelector}
        onClose={() => setShowLocationSelector(false)}
        onLocationSelected={handleLocationChange}
        currentCityId={selectedCity?.id}
      />
    </div>
  );
}
