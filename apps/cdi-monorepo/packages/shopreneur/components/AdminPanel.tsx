import React, { useState, useRef, useEffect } from 'react';
import { ProductCategory, Product, DailyContent, CreatorStats, ContentPrompt, ShopSettings, SaleRecord, SocialPlatform } from '../types';
import { generateProductDescription, generateProductImage, searchTrendingProducts } from '../services/geminiService';
import BusinessTip from './BusinessTip';
import BusinessMentor from './BusinessMentor';
import MerchantCoinConfigurator from './MerchantCoinConfigurator';
import { Sparkles, Plus, Loader2, Link as LinkIcon, Upload, Image as ImageIcon, Wand2, Save, X, Lightbulb, ChevronDown, ChevronUp, Megaphone, ShieldCheck, TrendingUp, Video, Tv, Edit2, Trophy, Target, Zap, Palette, Type, Layout, Instagram, Facebook, Smartphone, CheckCircle, DollarSign, Crown, Code, AtSign, Share2, ExternalLink, Check, Calendar, Flame, ShoppingBag, Bot, Lock, Package, ArrowUpCircle, Rocket, FileText, PieChart, Youtube, Link2, BarChart2, Search as SearchIcon, Send, RefreshCcw } from 'lucide-react';

interface AdminPanelProps {
  onAddProduct: (product: Product | Product[]) => void;
  productToEdit?: Product | null;
  onUpdateProduct?: (product: Product) => void;
  onCancelEdit?: () => void;
  dailyContent?: DailyContent | null;
  onUpdateDailyContent?: (content: DailyContent) => void;
  creatorStats: CreatorStats;
  onCompleteChallenge: (points: number) => void;
  shopSettings: ShopSettings;
  onUpdateShopSettings: (settings: ShopSettings) => void;
  onUpgradeTier?: () => void;
  products: Product[];
  onRecordSale?: (productName: string, price: number) => void;
  onSellProduct?: (productId: string, price: number) => void;
  salesHistory?: SaleRecord[];
}

const INITIAL_CHALLENGES: ContentPrompt[] = [
  { 
    id: '1', 
    type: 'Daily',
    title: 'Welcome Vlog', 
    description: 'Create your channel and post a "Welcome to my Shop" intro video. Link your wishlist in the description!', 
    difficulty: 'Easy', 
    xpReward: 150, 
    platform: 'YouTube',
    expiresIn: '24h'
  }
];

const THEME_PRESETS = [
  {
    name: 'Coquette Dream',
    primary: '#ec4899',
    secondary: '#fbcfe8',
    bg: '#fff1f2',
    heading: 'Playfair Display',
    body: 'Quicksand'
  },
  {
    name: 'Y2K Cyber',
    primary: '#d946ef',
    secondary: '#06b6d4',
    bg: '#0f172a',
    heading: 'Orbitron', 
    body: 'Inter'
  },
  {
    name: 'Clean Girl',
    primary: '#78716c',
    secondary: '#a8a29e',
    bg: '#fafaf9',
    heading: 'Montserrat',
    body: 'Lato'
  },
  {
    name: 'Dark Academia',
    primary: '#713f12',
    secondary: '#a16207',
    bg: '#fffbeb',
    heading: 'Merriweather',
    body: 'Open Sans'
  }
];

const PlatformIcon = ({ platform, className = "" }: { platform: string, className?: string }) => {
  switch (platform) {
    case 'TikTok': return <Smartphone size={16} className={className} />;
    case 'Instagram': return <Instagram size={16} className={className} />;
    case 'Facebook': return <Facebook size={16} className={className} />;
    case 'YouTube': return <Youtube size={16} className={className} />;
    default: return <Video size={16} className={className} />;
  }
};

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  onAddProduct, 
  productToEdit, 
  onUpdateProduct, 
  onCancelEdit,
  dailyContent,
  onUpdateDailyContent,
  creatorStats,
  onCompleteChallenge,
  shopSettings,
  onUpdateShopSettings,
  onUpgradeTier,
  products,
  onRecordSale,
  onSellProduct,
  salesHistory = []
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'inventory' | 'brand' | 'finance' | 'merchant-coins'>('inventory');
  
  // Settings Form State - Ensure it updates if props change
  const [settingsForm, setSettingsForm] = useState<ShopSettings>(shopSettings);
  
  useEffect(() => {
    setSettingsForm(shopSettings);
  }, [shopSettings]);

  // Existing States
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [isScouting, setIsScouting] = useState(false);
  const [scoutQuery, setScoutQuery] = useState('');
  const [scoutResults, setScoutResults] = useState<any[]>([]);
  const [scoutLoading, setScoutLoading] = useState(false);
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [proofLink, setProofLink] = useState('');
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<ContentPrompt>(INITIAL_CHALLENGES[0]);
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<SocialPlatform | 'All'>('All');
  
  const [connectedAccounts, setConnectedAccounts] = useState({
    YouTube: false,
    Instagram: false,
    TikTok: false,
    Facebook: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const dailyVideoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Product Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    costPrice: '',
    category: ProductCategory.FASHION,
    keywords: '',
    affiliateLink: 'https://amazon.com',
    platform: 'Amazon' as 'Amazon' | 'Shein',
    description: '',
    imageUrl: '',
    additionalImages: [] as string[],
    videoUrl: '',
    isReceived: false
  });

  const [dailyData, setDailyData] = useState<DailyContent>({
    videoUrl: '',
    title: '',
    message: '',
    taggedUsers: []
  });

  const receivedCount = products.filter(p => (p.stockCount || 0) > 0).length;
  const reviewCount = products.filter(p => (p.stockCount || 0) > 0 && p.videoUrl).length;
  const canUpgrade = creatorStats.tier === 'Starter' && receivedCount >= 1 && reviewCount >= 1;

  const totalRevenue = salesHistory.reduce((acc, sale) => acc + sale.salePrice, 0);
  const totalRestockCost = salesHistory.reduce((acc, sale) => acc + (sale.restockCost || 0), 0);
  const totalNetProfit = salesHistory.reduce((acc, sale) => acc + (sale.profit || sale.salePrice), 0);

  useEffect(() => {
    if (dailyContent) setDailyData(dailyContent);
  }, [dailyContent]);

  useEffect(() => {
    if (productToEdit) {
      setActiveAdminTab('inventory');
      setFormData({
        name: productToEdit.name,
        price: productToEdit.price.toString(),
        costPrice: productToEdit.costPrice?.toString() || '',
        category: productToEdit.category,
        keywords: '', 
        affiliateLink: productToEdit.affiliateLink,
        platform: productToEdit.platform,
        description: productToEdit.description,
        imageUrl: productToEdit.imageUrl,
        additionalImages: productToEdit.additionalImages || [],
        videoUrl: productToEdit.videoUrl || '',
        isReceived: productToEdit.isReceived || false
      });
    }
  }, [productToEdit]);

  const handleMagicWrite = async () => {
    if (!formData.name) return;
    setLoading(true);
    const desc = await generateProductDescription(formData.name, formData.category, formData.keywords || 'trendy');
    setFormData(prev => ({ ...prev, description: desc }));
    setLoading(false);
  };

  const handleGenerateImage = async () => {
    if (!formData.name) return;
    setImageLoading(true);
    const img = await generateProductImage(formData.name, formData.category, formData.description || 'Product');
    if (img) setFormData(prev => ({ ...prev, imageUrl: img }));
    setImageLoading(false);
  };

  const handleScoutSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoutQuery.trim()) return;
    setScoutLoading(true);
    const results = await searchTrendingProducts(scoutQuery);
    setScoutResults(results);
    setScoutLoading(false);
  };

  const handleAddScoutedItem = (item: any) => {
    const costEstimate = item.price * 0.7;
    const newItem: Product = {
      id: Date.now().toString(),
      name: item.name,
      price: item.price,
      costPrice: parseFloat(costEstimate.toFixed(2)),
      category: item.category as ProductCategory || ProductCategory.FASHION,
      description: item.description,
      imageUrl: `https://picsum.photos/seed/${item.name.replace(/\s/g, '')}/400/500`,
      affiliateLink: `https://amazon.com/s?k=${encodeURIComponent(item.name)}`,
      platform: 'Amazon',
      isWishlist: true,
      stockCount: 0
    };
    onAddProduct(newItem);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setSettingsForm(prev => ({ ...prev, logoUrl: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const applyTheme = (theme: typeof THEME_PRESETS[0]) => {
    setSettingsForm(prev => ({
        ...prev,
        primaryColor: theme.primary,
        secondaryColor: theme.secondary,
        backgroundColor: theme.bg,
        fontHeading: theme.heading as any,
        fontBody: theme.body as any,
    }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateShopSettings(settingsForm);
    alert("Settings saved to your empire! ✨");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productToEdit && onUpdateProduct) {
      onUpdateProduct({
        ...productToEdit,
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        costPrice: parseFloat(formData.costPrice) || 0,
        category: formData.category as ProductCategory,
        description: formData.description,
        imageUrl: formData.imageUrl,
        additionalImages: formData.additionalImages,
        videoUrl: formData.videoUrl,
        affiliateLink: formData.affiliateLink,
        platform: formData.platform,
        isReceived: formData.isReceived
      });
      onCancelEdit?.();
    } else {
      onAddProduct({
        id: Date.now().toString(),
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        costPrice: parseFloat(formData.costPrice) || 0,
        category: formData.category as ProductCategory,
        description: formData.description,
        imageUrl: formData.imageUrl || `https://picsum.photos/seed/${formData.name}/400/500`,
        additionalImages: formData.additionalImages,
        videoUrl: formData.videoUrl,
        affiliateLink: formData.affiliateLink,
        platform: formData.platform,
        isWishlist: true,
        isReceived: false
      });
    }
    setFormData({ name: '', price: '', costPrice: '', category: ProductCategory.FASHION, keywords: '', affiliateLink: 'https://amazon.com', platform: 'Amazon', description: '', imageUrl: '', additionalImages: [], videoUrl: '', isReceived: false });
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-purple-100 relative">
      <BusinessMentor isOpen={isMentorOpen} onClose={() => setIsMentorOpen(false)} onAddChallenge={() => {}} />
      
      <button onClick={() => setIsMentorOpen(true)} className="fixed bottom-6 right-6 z-40 bg-black text-white p-3 rounded-full shadow-lg flex items-center gap-2 group">
        <Bot size={20} className="text-green-400" />
        <span className="hidden group-hover:inline pr-2 text-sm font-bold">Ask Mentor</span>
      </button>

      <div className="flex gap-4 mb-6 border-b border-gray-100 pb-1 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveAdminTab('inventory')} className={`pb-3 px-2 font-bold text-sm ${activeAdminTab === 'inventory' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}>Inventory</button>
        <button onClick={() => setActiveAdminTab('finance')} className={`pb-3 px-2 font-bold text-sm ${activeAdminTab === 'finance' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}>Finance</button>
        <button onClick={() => setActiveAdminTab('brand')} className={`pb-3 px-2 font-bold text-sm ${activeAdminTab === 'brand' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}>Brand Design</button>
        <button onClick={() => setActiveAdminTab('merchant-coins')} className={`pb-3 px-2 font-bold text-sm ${activeAdminTab === 'merchant-coins' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}>Merchant Coins</button>
      </div>

      {activeAdminTab === 'finance' && (
        <div className="animate-fadeIn space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h4 className="text-gray-500 font-bold text-xs uppercase mb-1">Total Revenue</h4>
                <p className="text-3xl font-display font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                <h4 className="text-orange-800 font-bold text-xs uppercase mb-1">Restock Fund</h4>
                <p className="text-3xl font-display font-bold text-orange-900">${totalRestockCost.toFixed(2)}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                <h4 className="text-green-800 font-bold text-xs uppercase mb-1">My Profit</h4>
                <p className="text-3xl font-display font-bold text-green-900">${totalNetProfit.toFixed(2)}</p>
              </div>
           </div>

           <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Inventory</th>
                    <th className="px-6 py-3">Cost</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(p => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 font-bold">{p.name}</td>
                      <td className="px-6 py-4">{p.stockCount || 0}</td>
                      <td className="px-6 py-4">${(p.costPrice || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">${p.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        {(p.stockCount || 0) > 1 && (
                          <button onClick={() => onSellProduct?.(p.id, p.price)} className="bg-green-500 text-white px-3 py-1 rounded text-xs">Sell</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {activeAdminTab === 'brand' && (
        <form onSubmit={handleSaveSettings} className="animate-fadeIn space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2"><Palette size={18} /> Visual Identity</h3>
                 <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1 uppercase">Store Name</label>
                    <input type="text" value={settingsForm.storeName} onChange={e => setSettingsForm({...settingsForm, storeName: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-gray-900" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1 uppercase">Tagline</label>
                    <input type="text" value={settingsForm.tagline} onChange={e => setSettingsForm({...settingsForm, tagline: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-gray-900" />
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border bg-white flex items-center justify-center overflow-hidden">
                       {settingsForm.logoUrl ? <img src={settingsForm.logoUrl} className="w-full h-full object-cover" /> : <Upload size={20} className="text-gray-300" />}
                    </div>
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="text-sm font-bold text-primary">Upload Logo</button>
                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />
                 </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2"><Sparkles size={18} /> Quick Themes</h3>
                 <div className="grid grid-cols-2 gap-2">
                    {THEME_PRESETS.map(theme => (
                      <button key={theme.name} type="button" onClick={() => applyTheme(theme)} className="p-3 border rounded-xl bg-white hover:border-primary text-xs font-bold text-gray-700 transition-all">{theme.name}</button>
                    ))}
                 </div>
                 <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Primary</label>
                      <input type="color" value={settingsForm.primaryColor} onChange={e => setSettingsForm({...settingsForm, primaryColor: e.target.value})} className="w-full h-8 rounded border-none cursor-pointer" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Secondary</label>
                      <input type="color" value={settingsForm.secondaryColor} onChange={e => setSettingsForm({...settingsForm, secondaryColor: e.target.value})} className="w-full h-8 rounded border-none cursor-pointer" />
                    </div>
                 </div>
              </div>
           </div>
           <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-gray-900 transition-all flex items-center justify-center gap-2"><Save size={20} /> Save Brand Settings</button>
        </form>
      )}

      {activeAdminTab === 'merchant-coins' && (
        <div className="animate-fadeIn">
          <MerchantCoinConfigurator
            config={settingsForm.merchantCoinConfig}
            onChange={(config) => setSettingsForm({ ...settingsForm, merchantCoinConfig: config })}
            onSave={() => {
              onUpdateShopSettings(settingsForm);
              alert('Merchant Coin settings saved! 🪙✨');
            }}
          />
        </div>
      )}

      {activeAdminTab === 'inventory' && (
        <form onSubmit={handleSubmit} className="animate-fadeIn space-y-6">
           <div className="flex justify-between items-center">
             <h3 className="text-lg font-bold text-gray-800">{productToEdit ? 'Edit Item' : 'Add to Wishlist'}</h3>
             <button type="button" onClick={() => setIsScouting(!isScouting)} className="text-xs font-bold text-primary flex items-center gap-1"><SearchIcon size={14} /> AI Product Scout</button>
           </div>
           
           {isScouting && (
             <div className="bg-indigo-50 p-4 rounded-2xl space-y-4">
               <div className="flex gap-2">
                 <input type="text" value={scoutQuery} onChange={e => setScoutQuery(e.target.value)} placeholder="Search trending products..." className="flex-1 px-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
                 <button type="button" onClick={handleScoutSearch} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold">{scoutLoading ? '...' : 'Search'}</button>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                 {scoutResults.map((r, i) => (
                   <button key={i} type="button" onClick={() => handleAddScoutedItem(r)} className="bg-white p-2 rounded-lg text-[10px] border border-indigo-100 font-bold hover:bg-indigo-100">{r.name}</button>
                 ))}
               </div>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Product Name" className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none text-gray-900" />
              <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as ProductCategory})} className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none text-gray-900 font-medium">
                <option value="">Select Category</option>
                <option value={ProductCategory.BEAUTY}>Beauty & Skincare</option>
                <option value={ProductCategory.FASHION}>Fashion & Apparel</option>
                <option value={ProductCategory.ACCESSORIES}>Accessories</option>
                <option value={ProductCategory.HAIR}>Hair Care</option>
                <option value={ProductCategory.TECH}>Tech & Gadgets</option>
                <option value={ProductCategory.SHEIN}>Shein Finds</option>
              </select>
              <div className="flex gap-2">
                 <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Sell Price" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none text-gray-900" />
                 <input type="number" step="0.01" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} placeholder="Amazon Cost" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none text-gray-900" />
              </div>
              <select required value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value as 'Amazon' | 'Shein' | 'Temu'})} className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none text-gray-900 font-medium">
                <option value="Amazon">Amazon</option>
                <option value="Shein">Shein</option>
                <option value="Temu">Temu</option>
              </select>
           </div>

           <div className="space-y-2">
              <div className="flex gap-2">
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none text-gray-900" placeholder="Description..." rows={3} />
                <button type="button" onClick={handleMagicWrite} className="bg-purple-100 text-purple-700 px-4 rounded-xl font-bold">{loading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}</button>
              </div>
              <input type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="Image URL" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none text-gray-900" />
              <div className="flex gap-2">
                <input type="url" value={formData.affiliateLink} onChange={e => setFormData({...formData, affiliateLink: e.target.value})} placeholder="Amazon Link" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none text-gray-900" />
                <button type="button" onClick={handleGenerateImage} className="bg-blue-100 text-blue-700 px-4 rounded-xl font-bold">{imageLoading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}</button>
              </div>
           </div>

           <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2">
             {productToEdit ? <Save size={20} /> : <Plus size={20} />}
             {productToEdit ? 'Update Item' : 'Add to Wishlist'}
           </button>
           {productToEdit && <button type="button" onClick={onCancelEdit} className="w-full py-2 text-gray-400 font-bold">Cancel Edit</button>}
        </form>
      )}
    </div>
  );
};

export default AdminPanel;