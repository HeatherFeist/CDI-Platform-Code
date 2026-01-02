
import React, { useRef, useState } from 'react';
import { UserProfile } from '../types';
import { Camera, Save, User, AtSign, FileText, MapPin, Truck, ShieldCheck } from 'lucide-react';

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
    alert("Executive Identity Synchronized! 💅");
  };

  return (
    <div className="max-w-4xl mx-auto glass-card rounded-[3rem] overflow-hidden border border-white/5 shadow-3xl bg-white/[0.01]">
      <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 h-48 relative">
        <div className="absolute -bottom-16 left-12">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[2rem] border-4 border-[#020617] bg-slate-800 overflow-hidden shadow-2xl">
              <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-500 transition-colors shadow-xl"
            >
              <Camera size={18} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>
        </div>
      </div>

      <div className="pt-24 pb-12 px-12">
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Public Info */}
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                <User className="text-indigo-400" size={24} /> Executive Credentials
              </h3>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><ShieldCheck size={12} /> Verified Identity</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Display Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-white font-bold"
                  placeholder="e.g. Trin"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Identity Handle</label>
                <div className="relative">
                  <span className="absolute left-6 top-4 text-slate-600 font-bold">@</span>
                  <input
                    type="text"
                    value={formData.handle}
                    onChange={(e) => setFormData({...formData, handle: e.target.value})}
                    className="w-full pl-10 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-indigo-500 text-white"
                    placeholder="trinstreasures"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Executive Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 outline-none focus:border-indigo-500 text-slate-300 font-light leading-relaxed"
                placeholder="Tell the community about your strategic vision..."
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-white text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-3xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3">
            <Save size={20} /> Synchronize Hub Identity
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditor;
