
import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, CartItem, CreatorStats, ShopSettings, UserProfile, Message } from './types';
import ProductCard from './components/ProductCard';
import AdminPanel from './components/AdminPanel';
import CartDrawer from './components/CartDrawer';
import VirtualTryOn from './components/VirtualTryOn';
import CommunityLobby from './components/CommunityLobby';
import DirectMessages from './components/DirectMessages';
import ProfileEditor from './components/ProfileEditor';
import ApiKeySettings from './components/ApiKeySettings';
import { dbService } from './services/dbService';
import { supabaseUrl } from './services/supabaseClient';
import { 
  ShoppingBag, 
  LayoutGrid, 
  MessageCircle, 
  UserPlus, 
  Users, 
  Lock, 
  Store, 
  ArrowRight,
  Monitor,
  Search,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Settings2,
  AlertCircle,
  X,
  Rocket,
  Loader2,
  Zap,
  User,
  Home,
  Palette
} from 'lucide-react';

const INITIAL_SETTINGS: ShopSettings = {
  storeName: "Enterprise Hub",
  tagline: "Curated Professional Assets",
  logoUrl: "",
  heroHeadline: "Professional Infrastructure",
  heroSubtext: "Building generational wealth through curated affiliate storefronts and strategic asset management.",
  primaryColor: "#6366f1", 
  secondaryColor: "#8b5cf6", 
  backgroundColor: "#020617", 
  fontHeading: 'Playfair Display',
  fontBody: 'Inter',
  amazonAffiliateTag: 'family-biz-20'
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(INITIAL_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Portal Interaction State
  const [searchStoreName, setSearchStoreName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Owner' | 'Shopper'>('Shopper');
  const [foundProfile, setFoundProfile] = useState<UserProfile | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegLoading, setIsRegLoading] = useState(false);
  const [regData, setRegData] = useState({ name: '', key: '' });
  const [regSuccess, setRegSuccess] = useState(false);

  // General UI State
  const [activeTab, setActiveTab] = useState<'shop' | 'tryon' | 'admin' | 'community' | 'messages' | 'profile'>('shop');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [platformFilter, setPlatformFilter] = useState<'All' | 'Amazon' | 'Shein' | 'eBay' | 'Temu'>('All');
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);

  const isConfigured = !supabaseUrl.includes("your-project-id");

  useEffect(() => {
    if (!isConfigured) {
      setIsInitialized(true);
      setIsFetching(false);
      return;
    }

    const productsChannel = dbService.subscribeToProducts((p) => {
      setProducts(p || []);
    });
    const settingsChannel = dbService.subscribeToSettings(setShopSettings);
    const messagesChannel = dbService.subscribeToMessages(setAllMessages);
    
    const profilesChannel = dbService.subscribeToProfiles((p) => {
      setProfiles(p || []);
      setIsDbConnected(true);
      setIsInitialized(true);
      setIsFetching(false);
    });

    return () => {
      productsChannel.unsubscribe();
      settingsChannel.unsubscribe();
      messagesChannel.unsubscribe();
      profilesChannel.unsubscribe();
    };
  }, [isConfigured]);

  // Real-time Store Search Engine
  useEffect(() => {
    const query = searchStoreName.trim().toLowerCase();
    if (query.length > 1) {
      const match = profiles.find(p => {
        const nameMatch = p?.name ? String(p.name).toLowerCase().includes(query) : false;
        const handleMatch = p?.handle ? String(p.handle).toLowerCase().includes(query) : false;
        return nameMatch || handleMatch;
      });
      setFoundProfile(match || null);
    } else {
      setFoundProfile(null);
    }
  }, [searchStoreName, profiles]);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', shopSettings.primaryColor);
    document.documentElement.style.setProperty('--color-secondary', shopSettings.secondaryColor);
    document.documentElement.style.setProperty('--color-background', shopSettings.backgroundColor);
    document.documentElement.style.setProperty('--font-heading', shopSettings.fontHeading);
    document.documentElement.style.setProperty('--font-body', shopSettings.fontBody);
    document.title = `${shopSettings.storeName}`;
  }, [shopSettings]);

  const handleAccessHub = () => {
    if (!foundProfile) {
      alert("Verification Pending: You must find a valid store identity before entering.");
      return;
    }

    if (selectedRole === 'Owner') {
      const pass = prompt(`Management Access Key for ${foundProfile.name}:`);
      if (pass === foundProfile.password) {
        setCurrentUser(foundProfile);
        setActiveTab('admin'); 
      } else if (pass !== null) {
        alert("Authentication Failed: The Management Key entered is incorrect.");
      }
    } else {
      setCurrentUser({ 
        ...foundProfile, 
        role: 'Shopper', 
        id: 'customer_' + Date.now(), 
        name: 'Guest Customer' 
      });
      setActiveTab('shop');
    }
  };

  const handleFinalizeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.name.trim()) return;
    
    setIsRegLoading(true);
    
    const uniqueId = `owner_${Date.now()}`;
    const handle = regData.name.toLowerCase().replace(/\s/g, '_') + Math.floor(Math.random() * 100);
    
    const newProfile: UserProfile = {
      id: uniqueId,
      name: regData.name,
      handle,
      role: 'Owner',
      password: regData.key,
      bio: `Executive boutique hub for ${regData.name}. Strategic inventory management active.`,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${regData.name}`
    };

    try {
      const saved = await dbService.upsertProfile(newProfile);
      setProfiles(prev => [...prev, saved]);
      completeRegistration(saved);
    } catch (err: any) {
      setProfiles(prev => [...prev, newProfile]);
      completeRegistration(newProfile);
    }
  };

  const completeRegistration = (profile: UserProfile) => {
    setRegSuccess(true);
    setTimeout(() => {
      setCurrentUser(profile);
      setActiveTab('admin');
      setIsRegistering(false);
      setIsRegLoading(false);
      setRegSuccess(false);
      setRegData({ name: '', key: '' });
    }, 1000);
  };

  const handleUpdateShopSettings = async (settings: ShopSettings) => {
    setShopSettings(settings);
    try {
      await dbService.updateSettings(settings);
    } catch (e) {
      console.error("Settings Sync Failed", e);
    }
  };

  const handleUpdateProfile = async (updated: UserProfile) => {
    setCurrentUser(updated);
    try {
      await dbService.upsertProfile(updated);
    } catch (e) {
      console.error("Profile sync failed", e);
    }
  };

  const handleAddProduct = async (productOrProducts: Product | Product[]) => {
    const itemsToAdd = Array.isArray(productOrProducts) ? productOrProducts : [productOrProducts];
    setProducts(prev => [...itemsToAdd, ...prev]);
    try {
      for (const item of itemsToAdd) { 
        await dbService.saveProduct(item); 
      }
    } catch (e) {
      console.error("Product DB Save Failed", e);
    }
  };

  const handleUpdateProduct = async (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    try {
      await dbService.saveProduct(updated);
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      await dbService.deleteProduct(id);
    } catch (e) {
      console.error("Delete Failed", e);
    }
  };

  const handlePurchaseComplete = async (itemIds: string[]) => {
    const updatedProducts = products.map(p => {
      if (itemIds.includes(p.id)) {
        const currentStock = p.stockCount || 0;
        return { 
          ...p, 
          isReceived: true, 
          isWishlist: false,
          stockCount: currentStock + 1 
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    setCart([]); 
    
    try {
      for (const id of itemIds) {
        const prod = updatedProducts.find(x => x.id === id);
        if (prod) await dbService.saveProduct(prod);
      }
    } catch (e) {
      console.error("Inventory sync failed", e);
    }
  };

  const handleAttachVideo = (productId: string) => {
    const url = prompt("Paste your TikTok/Reels review link for this product:");
    if (url) {
      const product = products.find(p => p.id === productId);
      if (product) {
        handleUpdateProduct({ ...product, videoUrl: url, videoReviewCompleted: true });
      }
    }
  };

  const filteredProducts = products.filter(p => 
    platformFilter === 'All' || p.platform === platformFilter
  );

  const categorizedProducts = Object.values(ProductCategory).map(category => ({
    category,
    items: filteredProducts.filter(p => p.category === category)
  })).filter(group => group.items.length > 0);

  const isOwner = currentUser?.role === 'Owner';

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 -left-20 w-[40rem] h-[40rem] bg-indigo-600/5 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-0 -right-20 w-[40rem] h-[40rem] bg-violet-600/5 rounded-full blur-[150px] animate-pulse delay-1000"></div>

        {isRegistering && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
            <div className="glass-card max-w-xl w-full rounded-[4rem] p-12 border border-white/10 shadow-3xl relative">
              <button onClick={() => setIsRegistering(false)} disabled={isRegLoading} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors p-2 disabled:opacity-20"><X size={28} /></button>
              <div className="text-center space-y-4 mb-10">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border transition-all ${regSuccess ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'}`}>
                  {regSuccess ? <CheckCircle2 size={40} className="animate-bounce" /> : isRegLoading ? <Loader2 size={40} className="animate-spin" /> : <UserPlus size={40} />}
                </div>
                <h2 className="text-4xl font-display font-bold text-white">{regSuccess ? "Identity Confirmed!" : "Build Your Identity"}</h2>
                <p className="text-slate-500 text-sm italic">{regSuccess ? "Opening management dashboard..." : "Establish your store owner credentials."}</p>
              </div>
              {!regSuccess && (
                <form onSubmit={handleFinalizeRegistration} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Owner / Business Name</label>
                    <input required disabled={isRegLoading} type="text" value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} placeholder="e.g. Heather Feist" className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 outline-none focus:border-indigo-500 text-white text-lg font-medium disabled:opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Access Key (For Login)</label>
                    <input required disabled={isRegLoading} type="password" value={regData.key} onChange={e => setRegData({...regData, key: e.target.value})} placeholder="Set a secret code..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 outline-none focus:border-indigo-500 text-white text-lg font-mono disabled:opacity-50" />
                  </div>
                  <button type="submit" disabled={isRegLoading || !regData.name} className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-4 group disabled:opacity-50">
                    {isRegLoading ? <>Validating Registry... <Loader2 size={24} className="animate-spin text-indigo-600" /></> : <>Launch Enterprise <Rocket size={24} className="group-hover:translate-y-[-4px] group-hover:translate-x-[4px] transition-transform" /></>}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="max-w-7xl w-full glass-card rounded-[5rem] p-10 md:p-24 space-y-16 relative z-10 border border-white/5 shadow-3xl backdrop-blur-3xl">
          <div className="text-center space-y-4">
            <h1 className="text-6xl md:text-8xl font-display font-bold text-white tracking-tighter leading-none">Enterprise Access</h1>
            <p className="text-slate-500 text-xl font-light max-w-2xl mx-auto italic">Strategic management hub for store owners and customers.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
            <div className="flex flex-col space-y-8 bg-white/[0.03] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative">
              {isFetching && <RefreshCw size={20} className="absolute top-8 right-8 text-indigo-500 animate-spin" />}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-lg shadow-indigo-600/20"><Search size={28} /></div>
                   <div><h3 className="text-3xl font-display font-bold text-white">Identity Search</h3><p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Locate Your Storefront</p></div>
                </div>
                <div className="relative group">
                  <Search className="absolute left-8 top-8 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={24} />
                  <input type="text" value={searchStoreName} onChange={(e) => setSearchStoreName(e.target.value)} placeholder="Type Store Owner Name..." className="w-full bg-slate-900/50 border-2 border-white/5 rounded-[2.5rem] pl-20 pr-8 py-8 outline-none focus:border-indigo-500 text-white text-2xl font-display tracking-wide transition-all shadow-inner placeholder:text-slate-800" />
                </div>
                {foundProfile ? (
                  <div className="flex items-center gap-8 p-8 bg-indigo-600/10 border-2 border-indigo-500/30 rounded-[3rem] animate-fadeIn shadow-xl">
                    <img src={foundProfile.avatarUrl} className="w-24 h-24 rounded-[2rem] border-4 border-indigo-500/50 shadow-lg" alt="" />
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><CheckCircle2 size={12} /> Enterprise Located</p>
                      <h4 className="text-3xl font-display font-bold text-white leading-none">{foundProfile.name}</h4>
                      <p className="text-xs text-slate-500 mt-2 font-mono">HANDLE: @{foundProfile.handle}</p>
                    </div>
                  </div>
                ) : searchStoreName.length > 2 ? (
                  <div className="p-12 text-center text-slate-400 border-2 border-dashed border-red-500/20 rounded-[3rem] space-y-4 bg-red-500/[0.02]"><AlertCircle size={48} className="mx-auto text-red-500/50" /><p className="text-sm font-bold">" {searchStoreName} " Not Found</p><button onClick={() => setIsRegistering(true)} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors underline decoration-2 underline-offset-4">Create this Identity now</button></div>
                ) : (
                  <div className="p-12 text-center text-slate-700 border-2 border-dashed border-white/5 rounded-[3rem] space-y-4"><Store size={48} className="mx-auto opacity-10" /><p className="text-sm font-light italic">Type your name to reveal your management portal.</p></div>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-10">
               <div className="flex items-center gap-4 mb-2"><div className="bg-slate-800 p-4 rounded-3xl text-slate-400"><Users size={28} /></div><div><h3 className="text-3xl font-display font-bold text-white">Select Access</h3><p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Authorization Level</p></div></div>
               <div className="space-y-6">
                  <button onClick={() => setSelectedRole('Owner')} className={`flex items-center gap-8 w-full p-10 rounded-[3rem] transition-all border-2 text-left ${selectedRole === 'Owner' ? 'bg-indigo-600 border-indigo-400 shadow-2xl scale-[1.02]' : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}`}><div className={`p-5 rounded-[2rem] ${selectedRole === 'Owner' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-600'}`}><Lock size={32} /></div><div><p className="text-2xl font-display font-bold text-white">Executive Owner</p><p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">Full Hub Control</p></div></button>
                  <button onClick={() => setSelectedRole('Shopper')} className={`flex items-center gap-8 w-full p-10 rounded-[3rem] transition-all border-2 text-left ${selectedRole === 'Shopper' ? 'bg-indigo-600 border-indigo-400 shadow-2xl scale-[1.02]' : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}`}><div className={`p-5 rounded-[2rem] ${selectedRole === 'Shopper' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-600'}`}><ShoppingBag size={32} /></div><div><p className="text-2xl font-display font-bold text-white">Public Customer</p><p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">Browse Collection</p></div></button>
               </div>
            </div>
          </div>
          <div className="pt-16 border-t border-white/5 flex flex-col items-center gap-12">
            <button onClick={handleAccessHub} disabled={!foundProfile || isFetching} className="w-full max-w-2xl bg-white text-black py-8 rounded-[3rem] text-xl font-black uppercase tracking-[0.3em] shadow-3xl hover:bg-slate-200 transition-all flex items-center justify-center gap-6 disabled:opacity-10 group active:scale-95">Initialize Hub Session <ArrowRight size={32} className="group-hover:translate-x-3 transition-transform" /></button>
             <div className="flex items-center gap-12"><button onClick={() => setIsRegistering(true)} className="flex items-center gap-3 text-indigo-400 hover:text-white transition-all text-xs font-black uppercase tracking-[0.3em] group relative"><UserPlus size={18} className="group-hover:scale-125 transition-transform" /> Build Your Profile<span className="absolute -bottom-1 left-0 w-0 h-px bg-indigo-400 group-hover:w-full transition-all"></span></button></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-200 selection:bg-indigo-500/30">
      <nav className="sticky top-0 z-50 glass-nav px-8 h-20 flex justify-between items-center">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setActiveTab('shop')}>
          <div className="bg-indigo-600 text-white p-2.5 rounded-xl transition-transform group-hover:scale-110 shadow-lg shadow-indigo-600/20 overflow-hidden h-12 w-12 flex items-center justify-center">
            {shopSettings.logoUrl ? <img src={shopSettings.logoUrl} className="w-full h-full object-cover" alt="Logo" /> : <LayoutGrid size={22} />}
          </div>
          <div><h1 className="text-xl font-bold font-display text-white leading-none tracking-tight">{shopSettings.storeName}</h1><p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1.5">{shopSettings.tagline}</p></div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-10 mr-4">
            <button onClick={() => setActiveTab('shop')} className={`text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'shop' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>Storefront</button>
            <button onClick={() => setActiveTab('tryon')} className={`text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'tryon' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>Studio</button>
            {isOwner && <button onClick={() => setActiveTab('community')} className={`text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'community' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>Network</button>}
          </div>
          
          <div className="h-6 w-px bg-white/10"></div>
          
          {isOwner && (
            <div className="flex items-center gap-4">
               <button onClick={() => setActiveTab('profile')} className={`p-2.5 rounded-xl border transition-all ${activeTab === 'profile' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`} title="Edit My Profile">
                  <User size={20} />
               </button>
               <button onClick={() => setActiveTab('messages')} className="relative p-2.5 text-slate-500 hover:text-indigo-400 transition-colors bg-white/5 rounded-xl border border-white/5"><MessageCircle size={20} /><span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#020617]"></span></button>
            </div>
          )}
          
          <button onClick={() => setIsCartOpen(true)} className="relative p-2.5 text-slate-500 hover:text-indigo-400 transition-colors bg-white/5 rounded-xl border border-white/5"><ShoppingBag size={20} />{cart.length > 0 && <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg">{cart.length}</span>}</button>
          
          {isOwner && <button onClick={() => setActiveTab('admin')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl ${activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-white text-black hover:bg-slate-200 shadow-white/10'}`}>Dashboard</button>}
          
          <button onClick={() => setShowApiKeySettings(true)} className="p-2.5 text-slate-500 hover:text-indigo-400 transition-colors bg-white/5 rounded-xl border border-white/5" title="AI Settings"><Settings2 size={18} /></button>
          
          <button onClick={() => { setCurrentUser(null); setSearchStoreName(''); setActiveTab('shop'); }} className="p-2.5 text-slate-600 hover:text-red-400 transition-colors bg-white/5 rounded-xl border border-white/5" title="Log Out"><LogOut size={18} /></button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        {activeTab === 'shop' && (
          <div className="animate-fadeIn space-y-16">
            <div className="relative glass-card rounded-[4rem] p-16 md:p-24 overflow-hidden border border-white/5 bg-gradient-to-br from-indigo-500/5 to-transparent">
               <div className="relative z-10 max-w-3xl">
                  <div className="flex items-center gap-3 mb-8"><span className="bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">Verified Collection</span>{currentUser && <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active session for: {currentUser.name}</span>}</div>
                  <h2 className="text-6xl md:text-8xl font-display font-bold text-white mb-8 leading-tight tracking-tighter">{shopSettings.heroHeadline}</h2>
                  <p className="text-xl text-slate-400 font-light leading-relaxed mb-12 max-w-2xl">{shopSettings.heroSubtext}</p>
               </div>
            </div>
            <div className="space-y-12">
               <div className="flex flex-col md:flex-row justify-between items-end gap-6"><div><h3 className="text-4xl font-display font-bold text-white mb-2">Curated Assets</h3><p className="text-slate-500 text-sm font-light">Explore validated products by category.</p></div><div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">{['All', 'Amazon', 'Temu', 'eBay', 'Shein'].map((p) => (<button key={p} onClick={() => setPlatformFilter(p as any)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${platformFilter === p ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>{p}</button>))}</div></div>
               {categorizedProducts.length > 0 ? categorizedProducts.map((group) => (<section key={group.category} className="space-y-8 pb-12"><div className="flex items-center gap-4"><div className="h-px flex-1 bg-white/5"></div><h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">{group.category}</h4><div className="h-px flex-1 bg-white/5"></div></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">{group.items.map(p => (<ProductCard key={p.id} product={p} userRole={isOwner ? 'admin' : 'shopper'} onDelete={handleDeleteProduct} onAddToCart={(p, type) => { setCart([...cart, { ...p, quantity: 1, orderType: type }]); setIsCartOpen(true); }} onUploadReview={handleAttachVideo} />))}</div></section>)) : (<div className="py-20 text-center space-y-4 opacity-30"><Monitor size={48} className="mx-auto" /><p className="font-display text-2xl text-slate-600">Boutique Inventory Pending...</p></div>)}
            </div>
          </div>
        )}
        
        {activeTab === 'messages' && currentUser && isOwner && <DirectMessages currentUser={currentUser} allMessages={allMessages} onSendMessage={(text, recipientId) => dbService.sendMessage({ senderId: currentUser.id, recipientId, text, timestamp: Date.now() })} onDeleteMessage={dbService.deleteMessage} otherProfiles={profiles.filter(p => p.id !== currentUser.id)} />}
        
        {activeTab === 'admin' && isOwner && currentUser && (
          <AdminPanel 
            shopSettings={shopSettings} onUpdateShopSettings={handleUpdateShopSettings} onAddProduct={handleAddProduct} onDeleteProduct={handleDeleteProduct} onUpdateProduct={handleUpdateProduct} products={products} currentUser={currentUser} onUpdateProfile={handleUpdateProfile} creatorStats={{tier: 'Entrepreneur', streak: 1, points: 500, level: 'Influencer', inventoryCount: products.length, subscriptionPlan: 'Elite'}} onCompleteChallenge={() => {}} dbConnected={isDbConnected} onBackToStore={() => setActiveTab('shop')}
          />
        )}
        
        {activeTab === 'profile' && isOwner && currentUser && (
          <div className="space-y-8 animate-fadeIn">
             <button onClick={() => setActiveTab('shop')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                <Home size={12} /> Back to Storefront
             </button>
             <ProfileEditor profile={currentUser} onUpdateProfile={handleUpdateProfile} />
          </div>
        )}

        {activeTab === 'community' && isOwner && (<CommunityLobby creatorStats={{tier: 'Entrepreneur', streak: 1, points: 500, level: 'Influencer', inventoryCount: products.length, subscriptionPlan: 'Elite'}} onVote={() => {}} onBackToStore={() => setActiveTab('shop')} />)}
        
        {activeTab === 'tryon' && (
          <div className="space-y-8 animate-fadeIn">
             <button onClick={() => setActiveTab('shop')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"><Home size={12} /> Back to Storefront</button>
             <VirtualTryOn products={products} />
          </div>
        )}
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cart} onRemoveItem={(id) => setCart(cart.filter(i => i.id !== id))} shopSettings={shopSettings} userProfile={currentUser || undefined} onPurchaseComplete={handlePurchaseComplete} />

      {showApiKeySettings && <ApiKeySettings onClose={() => setShowApiKeySettings(false)} />}

      <footer className="bg-white/[0.02] border-t border-white/5 py-16 px-8 flex flex-col items-center gap-6"><div className="flex items-center gap-10"><div className="bg-white/5 px-6 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{isDbConnected ? 'Secure Cloud Hub' : 'Local Archive'}</span></div>{!isOwner && (<button onClick={() => { setCurrentUser(null); setSearchStoreName(''); }} className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors tracking-widest flex items-center gap-2"><Settings2 size={12} /> Access Management Console</button>)}</div><p className="text-slate-600 text-sm font-light">Infrastructure v3.2 | Enterprise Solutions Inc.</p></footer>
    </div>
  );
};

export default App;
