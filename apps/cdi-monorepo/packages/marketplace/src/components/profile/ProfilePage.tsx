import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, Camera, MapPin, Upload } from 'lucide-react';
import { supabase, Review } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LocationService } from '../../services/LocationService';
import { City } from '../../types/location';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    phone: '',
    city_id: '',
    zip_code: '',
    show_location: false,
    profile_photo_url: '',
  });
  const locationService = LocationService.getInstance();

  useEffect(() => {
    fetchCities();
    if (profile) {
      setFormData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        city_id: (profile as any).city_id || '',
        zip_code: (profile as any).zip_code || '',
        show_location: (profile as any).show_location || false,
        profile_photo_url: (profile as any).profile_photo_url || '',
      });
      fetchReviews();
    }
  }, [profile]);

  const fetchCities = async () => {
    try {
      const citiesList = await locationService.getCities();
      setCities(citiesList);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchReviews = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(id, username)
        `)
        .eq('reviewee_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) {
      console.log('No file or user:', { file: !!file, user: !!user });
      return;
    }

    console.log('File selected:', { 
      name: file.name, 
      size: file.size, 
      type: file.type,
      sizeMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('Image must be less than 50MB');
      return;
    }

    try {
      setUploading(true);
      console.log('Starting upload process...');

      // Delete old photo if exists
      if (formData.profile_photo_url) {
        console.log('Deleting old photo:', formData.profile_photo_url);
        const oldPath = formData.profile_photo_url.split('/').pop();
        if (oldPath) {
          const { error: deleteError } = await supabase.storage
            .from('profile-photos')
            .remove([`${user.id}/${oldPath}`]);
          
          if (deleteError) {
            console.warn('Could not delete old photo:', deleteError);
          }
        }
      }

      // Upload new photo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading to path:', filePath);

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      console.log('Profile updated successfully');

      setFormData(prev => ({ ...prev, profile_photo_url: publicUrl }));
      await refreshProfile();
      alert('Profile photo updated successfully!');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      
      // Provide more detailed error messages
      if (error.message?.includes('bucket')) {
        alert('Storage bucket not found. Please run the database setup script first (COMPLETE_SETUP.sql)');
      } else if (error.message?.includes('policy')) {
        alert('Permission denied. Please check storage policies in Supabase.');
      } else if (error.message?.includes('size')) {
        alert('File is too large. Maximum size is 50MB.');
      } else {
        alert(`Failed to upload photo: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.full_name,
          bio: formData.bio,
          phone: formData.phone,
          city_id: formData.city_id || null,
          zip_code: formData.zip_code || null,
          show_location: formData.show_location,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to update profile');
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Profile Photo */}
              <div className="relative">
                {formData.profile_photo_url ? (
                  <img 
                    src={formData.profile_photo_url} 
                    alt={profile.username}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {profile.username[0].toUpperCase()}
                  </div>
                )}
                {/* Upload Photo Button */}
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Camera size={16} className="text-blue-600" />
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
                <p className="text-gray-600">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
                {profile.rating > 0 && (
                  <div className="flex items-center mt-1">
                    <Star size={18} className="text-yellow-400 fill-current mr-1" />
                    <span className="font-semibold text-gray-900">{profile.rating.toFixed(1)}</span>
                    <span className="text-gray-600 ml-1">({profile.total_reviews} reviews)</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin size={16} className="inline mr-1" />
                    City
                  </label>
                  <select
                    value={formData.city_id}
                    onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a city</option>
                    {cities.length === 0 ? (
                      <option value="" disabled>No cities available - Run database setup</option>
                    ) : (
                      cities.map(city => (
                        <option key={city.id} value={city.id}>
                          {city.name}, {city.state}
                        </option>
                      ))
                    )}
                  </select>
                  {cities.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      Please run the profile-improvements.sql script in Supabase to add cities
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="45402"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show_location"
                  checked={formData.show_location}
                  onChange={(e) => setFormData({ ...formData, show_location: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="show_location" className="text-sm text-gray-700">
                  Show my location on my profile
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Changes
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {profile.full_name && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-gray-900">{profile.full_name}</p>
                </div>
              )}
              {profile.bio && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Bio</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}
              {profile.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{profile.phone}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Reviews</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Star size={48} className="mx-auto text-gray-300 mb-4" />
              <p>No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        {review.reviewer?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{review.reviewer?.username}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 mt-2">{review.comment}</p>
                  )}
                  <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {review.type === 'buyer_to_seller' ? 'As Seller' : 'As Buyer'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
