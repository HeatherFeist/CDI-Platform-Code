import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Package, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase, Listing, Profile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminPanel() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'listings' | 'users'>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchData();
    }
  }, [activeTab, profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'listings') {
        const { data, error } = await supabase
          .from('listings')
          .select(`
            *,
            seller:profiles!listings_seller_id_fkey(id, username),
            category:categories(id, name)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setListings(data || []);
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`${currentStatus ? 'Remove' : 'Grant'} admin privileges?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to update user');
    }
  };

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-gray-600 text-lg">Access Denied</p>
          <p className="text-gray-500 mt-2">You do not have admin privileges</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Shield size={32} className="text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-gray-600">Manage users and content across the platform</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('listings')}
                className={`py-4 border-b-2 font-medium transition-colors flex items-center ${
                  activeTab === 'listings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package size={20} className="mr-2" />
                Listings
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 border-b-2 font-medium transition-colors flex items-center ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users size={20} className="mr-2" />
                Users
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : activeTab === 'listings' ? (
              <div className="space-y-4">
                {listings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p>No listings found</p>
                  </div>
                ) : (
                  listings.map((listing) => (
                    <div
                      key={listing.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
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
                              <h3 className="font-semibold text-gray-900 mb-1">{listing.title}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>Seller: {listing.seller?.username}</span>
                                {listing.category && (
                                  <span className="bg-gray-100 px-2 py-1 rounded">
                                    {listing.category.name}
                                  </span>
                                )}
                                <span className={`px-2 py-1 rounded font-medium ${
                                  listing.status === 'active' ? 'bg-green-100 text-green-700' :
                                  listing.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {listing.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-2">
                                Created: {new Date(listing.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Current Bid</p>
                              <p className="text-xl font-bold text-blue-600">
                                ${listing.current_bid > 0 ? listing.current_bid.toFixed(2) : listing.starting_bid.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-3">
                            <button
                              onClick={() => navigate(`/listings/${listing.id}`)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleDeleteListing(listing.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                            >
                              <Trash2 size={14} className="mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {users.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">User</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rating</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Joined</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                                  {user.username[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{user.username}</p>
                                  {user.full_name && (
                                    <p className="text-sm text-gray-500">{user.full_name}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{user.id}</td>
                            <td className="px-4 py-3">
                              {user.rating > 0 ? (
                                <span className="text-sm text-gray-900">
                                  {user.rating.toFixed(1)} ({user.total_reviews})
                                </span>
                              ) : (
                                <span className="text-sm text-gray-500">No reviews</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {user.is_admin ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  <Shield size={12} className="mr-1" />
                                  Admin
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  User
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                                className={`text-sm font-medium ${
                                  user.is_admin
                                    ? 'text-red-600 hover:text-red-700'
                                    : 'text-green-600 hover:text-green-700'
                                }`}
                              >
                                {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
