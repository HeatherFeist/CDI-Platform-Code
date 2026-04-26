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
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-400" />
          <p className="text-lg text-slate-200">Access Denied</p>
          <p className="mt-2 text-slate-500">You do not have admin privileges</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 font-medium text-indigo-300 hover:text-indigo-200"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-950/40">
              <Shield size={26} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          </div>
          <p className="text-slate-400">Manage users and content across the platform</p>
        </div>

        <div className="market-panel overflow-hidden">
          <div className="border-b border-slate-800">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('listings')}
                className={`py-4 border-b-2 font-medium transition-colors flex items-center ${
                  activeTab === 'listings'
                    ? 'border-indigo-400 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Package size={20} className="mr-2" />
                Listings
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 border-b-2 font-medium transition-colors flex items-center ${
                  activeTab === 'users'
                    ? 'border-indigo-400 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-white'
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
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-400"></div>
                <p className="mt-4 text-slate-400">Loading...</p>
              </div>
            ) : activeTab === 'listings' ? (
              <div className="space-y-4">
                {listings.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Package size={48} className="mx-auto mb-4 text-slate-700" />
                    <p>No listings found</p>
                  </div>
                ) : (
                  listings.map((listing) => (
                    <div
                      key={listing.id}
                      className="rounded-xl border border-white/10 bg-slate-950/35 p-4 transition-colors hover:border-indigo-400/40"
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
                              <h3 className="mb-1 font-semibold text-white">{listing.title}</h3>
                              <div className="flex items-center space-x-4 text-sm text-slate-400">
                                <span>Seller: {listing.seller?.username}</span>
                                {listing.category && (
                                  <span className="rounded-full border border-white/10 bg-slate-900 px-3 py-1">
                                    {listing.category.name}
                                  </span>
                                )}
                                <span className={`rounded-full px-3 py-1 font-medium ${
                                  listing.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' :
                                  listing.status === 'sold' ? 'bg-cyan-500/15 text-cyan-300' :
                                  'bg-slate-800 text-slate-300'
                                }`}>
                                  {listing.status}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-slate-500">
                                Created: {new Date(listing.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-400">Current Bid</p>
                              <p className="text-xl font-bold text-indigo-300">
                                ${listing.current_bid > 0 ? listing.current_bid.toFixed(2) : listing.starting_bid.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-3">
                            <button
                              onClick={() => navigate(`/listings/${listing.id}`)}
                              className="text-sm font-medium text-indigo-300 hover:text-indigo-200"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleDeleteListing(listing.id)}
                              className="flex items-center text-sm font-medium text-red-400 hover:text-red-300"
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
                  <div className="py-12 text-center text-slate-500">
                    <Users size={48} className="mx-auto mb-4 text-slate-700" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/45">
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">User</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Rating</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Joined</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-900/30">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 font-medium text-white">
                                  {user.username[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-white">{user.username}</p>
                                  {user.full_name && (
                                    <p className="text-sm text-slate-500">{user.full_name}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-400">{user.id}</td>
                            <td className="px-4 py-3">
                              {user.rating > 0 ? (
                                <span className="text-sm text-slate-200">
                                  {user.rating.toFixed(1)} ({user.total_reviews})
                                </span>
                              ) : (
                                <span className="text-sm text-slate-500">No reviews</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {user.is_admin ? (
                                <span className="inline-flex items-center rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300">
                                  <Shield size={12} className="mr-1" />
                                  Admin
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                                  User
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-400">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                                className={`text-sm font-medium ${
                                  user.is_admin
                                    ? 'text-red-400 hover:text-red-300'
                                    : 'text-emerald-300 hover:text-emerald-200'
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
