
import React, { useState, useEffect } from 'react';
import { ProductCategory, Product, CreatorStats, ShopSettings, UserProfile } from '../types';
import { generateProductDescription, generateProductImage } from '../services/geminiService';
import BusinessTip from './BusinessTip';
import BusinessMentor from './BusinessMentor';
import ProfileEditor from './ProfileEditor';
import { 
  Sparkles, Loader2, Image as ImageIcon, Save, Bot, Cloud, 
  Rocket, Palette, ArrowUpCircle, Globe, CheckCircle, Boxes, 
  Database, ShieldCheck, Tag, LayoutGrid, Info, Layers, 
  Filter, CheckCircle2, Trash2, TrendingUp, DollarSign, 
  Monitor, UserCircle, Video, Home, Lock, Unlock, AlertCircle
} from 'lucide-react';

interface AdminPanelProps {
  onAddProduct: (product: Product | Product[]) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProduct: (product: Product) => void;
  creatorStats: CreatorStats;
  onCompleteChallenge: (points: number) => void;
  shopSettings: ShopSettings;
  onUpdateShopSettings: (settings: ShopSettings) => void;
  products: Product[];
  currentUser: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  dbConnected?: boolean;
  onBackToStore: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  onAddProduct, 
  onDeleteProduct,
  onUpdateProduct,
  creatorStats,
  shopSettings,
  onUpdateShopSettings,
  products,
  currentUser,
  onUpdateProfile,
  dbConnected = false,
  onBackToStore
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'inventory' | 'brand' | 'marketplace' | 'identity'>('inventory');
  const [settingsForm, setSettingsForm] = useState<ShopSettings>(shopSettings);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => { setSettingsForm(shopSettings); }, [shopSettings]);

  const [formData, setFormData] = useState({
    name: '', price: '', costPrice: '', category: ProductCategory.FASHION, keywords: '', affiliateLink: '', platform: 'Amazon' as 'Amazon' | 'Shein' | 'eBay', description: '', imageUrl: '', additionalImages: [] as string[], videoUrl: '', isReceived: false, marketplaceId: ''
  });

  const handleMagicWrite = async () => {
    if (!formData.name) return;
    setLoading(true);
    const desc = await generateProductDescription(formData.name, formData.category, formData.keywords || 'professional high-end');
    setFormData(prev => ({ ...prev, description: desc }));
    setLoading(false);
  };

  const handleGenerateImage = async () => {
    if (!formData.name) return;
    setImageLoading(true);
    const img = await generateProductImage(formData.name, formData.category, formData.description || 'Professional Product');
    if (img) setFormData(prev => ({ ...prev, imageUrl: img }));
    setImageLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProduct({
      id: Date.now().toString(),
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      category: formData.category as ProductCategory,
      description: formData.description,
      imageUrl: formData.imageUrl || `https://picsum.photos/seed/${formData.name}/400/500`,
      affiliateLink: formData.affiliateLink,
      platform: formData.platform,
      isWishlist: true,
      isReceived: false,
      videoReviewCompleted: false,
      stockCount: 0,
      asin: formData.platform === 'Amazon' ? formData.marketplaceId : undefined,
      marketplaceId: formData.marketplaceId
    });
    setFormData({ name: '', price: '', costPrice: '', category: ProductCategory.FASHION, keywords: '', affiliateLink: '', platform: 'Amazon', description: '', imageUrl: '', additionalImages: [], videoUrl: '', isReceived: false, marketplaceId: '' });
  };

  const handleUpdateSettings = async () => {
    setIsSavingSettings(true);
    await onUpdateShopSettings(settingsForm);
    setIsSavingSettings(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAttachVideo = (productId: string) => {
    const url = prompt("Paste your TikTok/Reels review link for this product:");
    if (url) {
      const product = products.find(p => p.id === productId);
      if (product) {
        onUpdateProduct({ ...product, videoUrl: url, videoReviewCompleted: true });
      }
    }
  };

  const getMarketplaceLabel = () => {
    switch(formData.platform) {
      case 'Amazon': return 'Amazon ASIN';
      case 'eBay': return 'eBay Item ID';
      case 'Shein': return 'Shein Product Code';
      default: return 'Product ID';
    }
  };

  const selectStyles = "w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-white appearance-none cursor-pointer";

  return (
    <div className="glass-card p-10 rounded-[3rem] border border-white/5 relative bg-white/[0.01]">
      <BusinessMentor isOpen={isMentorOpen} onClose={() => setIsMentorOpen(false)} onAddChallenge={() => {}} />
      
      <button onClick={() => setIsMentorOpen(true)} className="fixed bottom-10 right-10 z-50 bg-white text-black p-5 rounded-3xl shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform group border border-white/10">
        <Bot size={24} className="text-indigo-600" />
        <span className="text-xs font-black uppercase tracking-widest pr-2">Executive Advisor</span>
      </button>

      <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-10 min-w-max">
          <button onClick={onBackToStore} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
             <Home size={20} />
          </button>
          <button onClick={() => setActiveAdminTab('inventory')} className={`pb-6 px-2 font-black text-xs uppercase tracking-[0.2em] transition-all ${activeAdminTab === 'inventory' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>Inventory Ops</button>
          <button onClick={() => setActiveAdminTab('marketplace')} className={`pb-6 px-2 font-black text-xs uppercase tracking-[0.2em] transition-all ${activeAdminTab === 'marketplace' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>Marketplace Sync</button>
          <button onClick={() => setActiveAdminTab('identity')} className={`pb-6 px-2 font-black text-xs uppercase tracking-[0.2em] transition-all ${activeAdminTab === 'identity' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>Identity Ops</button>
          <button onClick={() => setActiveAdminTab('brand')} className={`pb-6 px-2 font-black text-xs uppercase tracking-[0.2em] transition-all ${activeAdminTab === 'brand' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>Org Settings</button>
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${dbConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
           <Cloud size={12} className={dbConnected ? 'animate-pulse' : ''} />
           {dbConnected ? 'System Online' : 'Cloud Offline'}
        </div>
      </div>

      {activeAdminTab === 'inventory' && (
        <div className="animate-fadeIn space-y-16">
          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-4xl font-display font-bold text-white tracking-tight">Asset Onboarding</h3>
                <p className="text-slate-500 text-sm">Define strategic inventory across verified global marketplaces.</p>
              </div>
              <BusinessTip title="The 2-Unit Rule" content="New assets start as 'Incubator' items. To unlock full sales, you must provide 1 Review Video and have at least 1 unit in stock for customers (2 units total purchased)." />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Marketplace</label>
                      <div className="relative">
                        <select 
                          value={formData.platform} 
                          onChange={e => setFormData({...formData, platform: e.target.value as any})}
                          className={selectStyles}
                        >
                          <option value="Amazon" className="bg-slate-900 text-white">Amazon</option>
                          <option value="Shein" className="bg-slate-900 text-white">Shein</option>
                          <option value="eBay" className="bg-slate-900 text-white">eBay</option>
                        </select>
                      </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Department</label>
                      <div className="relative">
                        <select 
                          value={formData.category} 
                          onChange={e => setFormData({...formData, category: e.target.value as any})}
                          className={selectStyles}
                        >
                          {Object.values(ProductCategory).map(cat => (
                            <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>
                          ))}
                        </select>
                      </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Asset Name</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Product Title" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-white font-medium" />
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Retail Target ($)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Cost Price ($)</label>
                  <input type="number" step="0.01" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} placeholder="Your price" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{getMarketplaceLabel()}</label>
                  <input type="text" value={formData.marketplaceId} onChange={e => setFormData({...formData, marketplaceId: e.target.value})} placeholder="ID / SKU" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-white font-mono" />
                </div>
            </div>

            <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Affiliate Landing URL</label>
                  <input type="url" value={formData.affiliateLink} onChange={e => setFormData({...formData, affiliateLink: e.target.value})} placeholder="Paste your affiliate link here..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-indigo-400 text-sm" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Market Positioning (Bio)</label>
                  <div className="relative">
                      <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 outline-none focus:border-indigo-500 h-40 text-slate-300 font-light leading-relaxed" placeholder="Detailed marketing copy..." />
                      <button type="button" onClick={handleMagicWrite} className="absolute bottom-4 right-4 bg-indigo-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors flex items-center gap-2 shadow-xl">
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI Generate Pitch
                      </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Asset Imagery</label>
                  <div className="flex gap-4">
                      <input type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="Image Source URL" className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-white" />
                      <button type="button" onClick={handleGenerateImage} className="bg-white/10 text-white px-6 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                        {imageLoading ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
                      </button>
                  </div>
                </div>
            </div>

            <button type="submit" className="w-full bg-white text-black py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-3xl hover:bg-slate-200 transition-all flex items-center justify-center gap-4 group">
              <Database size={24} className="text-indigo-600" /> Commit to Ledger
            </button>
          </form>

          {/* ACTIVE INVENTORY LEDGER */}
          <div className="pt-16 border-t border-white/5 space-y-8">
             <div className="flex justify-between items-center">
                <h3 className="text-3xl font-display font-bold text-white flex items-center gap-4">
                   <Boxes className="text-indigo-400" /> Lifecycle Ledger
                </h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{products.length} Items Indexed</span>
             </div>

             {products.length > 0 ? (
                <div className="overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02]">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b border-white/5 bg-white/[0.03]">
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Asset</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Lifecycle</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Cost</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Retail</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Margin</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Actions</th>
                         </tr>
                      </thead>
                      <tbody>
                         {products.map(product => {
                           const margin = product.price - (product.costPrice || 0);
                           const stockCount = product.stockCount || 0;
                           const hasReview = product.videoReviewCompleted;
                           const isUnlocked = hasReview && stockCount >= 2;
                           
                           return (
                            <tr key={product.id} className={`border-b border-white/5 hover:bg-white/[0.04] transition-colors group ${isUnlocked ? 'bg-indigo-500/[0.02]' : ''}`}>
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                     <img src={product.imageUrl} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="" />
                                     <div>
                                        <p className="font-bold text-white text-sm">{product.name}</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{product.category}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="flex flex-col items-center gap-2">
                                     <div className="flex gap-1.5">
                                        <div title="Review Video" className={`p-1.5 rounded-md ${hasReview ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                           <Video size={12} />
                                        </div>
                                        <div title={`Stock: ${stockCount}/2`} className={`p-1.5 rounded-md ${stockCount >= 2 ? 'bg-emerald-500/20 text-emerald-400' : stockCount >= 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-700'}`}>
                                           <Boxes size={12} />
                                        </div>
                                     </div>
                                     <span className={`text-[8px] font-black uppercase tracking-widest ${isUnlocked ? 'text-indigo-400' : 'text-slate-600'}`}>
                                        {isUnlocked ? 'Enterprise Grade' : hasReview ? 'Personal Stock Only' : 'Incubator Phase'}
                                     </span>
                                  </div>
                               </td>
                               <td className="px-8 py-6 text-right font-mono text-slate-400 text-sm">
                                  ${(product.costPrice || 0).toFixed(2)}
                                </td>
                               <td className={`px-8 py-6 text-right font-mono text-sm ${isUnlocked ? 'text-white font-bold' : 'text-slate-600'}`}>
                                  <div className="flex items-center justify-end gap-2">
                                     {!isUnlocked && <Lock size={10} />}
                                     ${product.price.toFixed(2)}
                                  </div>
                                </td>
                               <td className="px-8 py-6 text-right">
                                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${margin >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                     ${margin.toFixed(2)}
                                  </div>
                               </td>
                               <td className="px-8 py-6 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                     {!hasReview && stockCount >= 1 && (
                                       <button onClick={() => handleAttachVideo(product.id)} className="p-2.5 text-white bg-rose-600 rounded-xl transition-all shadow-lg animate-pulse" title="Immediate Action: Review Video">
                                          <AlertCircle size={14} />
                                       </button>
                                     )}
                                     {!hasReview && stockCount === 0 && (
                                       <button onClick={() => handleAttachVideo(product.id)} className="p-2.5 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl transition-all" title="Upload Review Video">
                                          <Video size={14} />
                                       </button>
                                     )}
                                     <button onClick={() => onDeleteProduct(product.id)} className="p-2.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all" title="Retire Asset">
                                        <Trash2 size={14} />
                                     </button>
                                  </div>
                               </td>
                            </tr>
                           );
                         })}
                      </tbody>
                   </table>
                </div>
             ) : (
                <div className="p-20 text-center space-y-4 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                   <Monitor size={48} className="mx-auto text-slate-800" />
                   <p className="text-xl font-display font-bold text-slate-600">No active inventory found in the ledger.</p>
                </div>
             )}
          </div>
        </div>
      )}

      {activeAdminTab === 'identity' && (
        <div className="animate-fadeIn py-8 space-y-8">
           <button onClick={onBackToStore} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
              <Home size={12} /> Back to Hub
           </button>
           <ProfileEditor profile={currentUser} onUpdateProfile={onUpdateProfile} />
        </div>
      )}

      {activeAdminTab === 'brand' && (
        <div className="animate-fadeIn space-y-12">
           <div className="glass-card p-12 rounded-[3rem] border border-white/10 space-y-10">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-3xl font-display font-bold text-white flex items-center gap-4 mb-2"><Layers className="text-indigo-400" /> Global Integration Hub</h3>
                  <p className="text-slate-500 text-sm">Configure your family organization's affiliate signatures and aesthetics.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Enterprise Title</label>
                   <input type="text" value={settingsForm.storeName} onChange={e => setSettingsForm({...settingsForm, storeName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-white font-bold" />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Brand Tagline</label>
                   <input type="text" value={settingsForm.tagline} onChange={e => setSettingsForm({...settingsForm, tagline: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-slate-400" />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Logo URL</label>
                   <input type="text" value={settingsForm.logoUrl || ''} onChange={e => setSettingsForm({...settingsForm, logoUrl: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-white" placeholder="https://..." />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Amazon Associate Tag</label>
                   <input type="text" value={settingsForm.amazonAffiliateTag || ''} onChange={e => setSettingsForm({...settingsForm, amazonAffiliateTag: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-indigo-400 font-mono" />
                </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Hero Headline</label>
                 <input type="text" value={settingsForm.heroHeadline} onChange={e => setSettingsForm({...settingsForm, heroHeadline: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 text-white" />
              </div>

              <button onClick={handleUpdateSettings} disabled={isSavingSettings} className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-3xl transition-all flex items-center justify-center gap-4 ${saveSuccess ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
                {isSavingSettings ? <><Loader2 size={24} className="animate-spin" /> Syncing Logistics...</> : saveSuccess ? <><CheckCircle2 size={24} /> Updates Synchronized</> : <><Save size={24} /> Deploy Enterprise Updates</>}
              </button>
           </div>
        </div>
      )}

      {activeAdminTab === 'marketplace' && (
        <div className="animate-fadeIn space-y-12 text-center py-20">
           <Rocket size={64} className="mx-auto text-slate-700 mb-6" />
           <h3 className="text-3xl font-display font-bold text-white">Marketplace Promotion</h3>
           <p className="text-slate-500 max-w-xl mx-auto">Promote fulfilled incubator assets to the public storefront to generate external revenue.</p>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
