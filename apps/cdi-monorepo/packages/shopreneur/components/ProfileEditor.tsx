import React, { useRef, useState } from 'react';
import { UserProfile } from '../types';
import { Camera, Save, User, AtSign, FileText, MapPin, Truck } from 'lucide-react';

interface ProfileEditorProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onUpdateProfile }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, avatarUrl: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddressChange = (field: keyof typeof formData.shippingAddress, value: string) => {
    setFormData(prev => ({
      ...prev,
      shippingAddress: {
        street: prev.shippingAddress?.street || '',
        city: prev.shippingAddress?.city || '',
        state: prev.shippingAddress?.state || '',
        zipCode: prev.shippingAddress?.zipCode || '',
        country: prev.shippingAddress?.country || 'USA',
        ...prev.shippingAddress,
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    alert("Profile & Shipping details updated successfully! 💅");
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-32 relative">
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md">
              <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-black text-white p-1.5 rounded-full hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Camera size={14} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        </div>
      </div>

      <div className="pt-16 pb-8 px-8">
        <h2 className="text-2xl font-display font-bold text-center text-gray-900 mb-6">Edit Your Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Public Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
              <User size={18} /> Public Info
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g. Trin"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Handle</label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-gray-400 font-bold">@</span>
                  <input
                    type="text"
                    value={formData.handle}
                    onChange={(e) => setFormData({...formData, handle: e.target.value})}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="trinstreasures"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="Tell the community about you and your shop..."
              />
            </div>
          </div>

          {/* Shipping Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                 <Truck size={18} /> Shipping Address
               </h3>
               <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                 <MapPin size={10} /> Private
               </span>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800 mb-4">
               <strong>Important:</strong> This is where Gifted items from your wishlist will be sent. 
               We do not share your exact street address publicly, but donors will need it to ship items to you via Amazon.
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                value={formData.shippingAddress?.street || ''}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="123 Entrepreneur Way"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.shippingAddress?.city || ''}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="Los Angeles"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={formData.shippingAddress?.state || ''}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="CA"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Zip Code</label>
                <input
                  type="text"
                  value={formData.shippingAddress?.zipCode || ''}
                  onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="90210"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 shadow-lg mt-4"
          >
            <Save size={18} />
            Save Profile & Settings
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditor;