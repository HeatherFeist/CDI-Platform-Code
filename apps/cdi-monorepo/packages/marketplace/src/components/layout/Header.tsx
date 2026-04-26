import { useState } from 'react';
import { Gavel, Bell, Plus, Menu, X, ShoppingCart } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import AuthModal from '../auth/AuthModal';
import ShoppingCartModal from '../cart/ShoppingCart';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { getCartItemCount } = useCart();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const handleAuthClick = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/85 shadow-2xl backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link
                to="/"
                className="flex items-center space-x-3 text-white transition-colors hover:text-indigo-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-950/40">
                  <Gavel size={22} />
                </div>
                <div className="hidden sm:block">
                  <div className="text-lg font-bold tracking-tight">Constructive Designs</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Marketplace</div>
                  <div className="text-xs text-indigo-200">Auction and Store Platform</div>
                </div>
              </Link>

              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  to="/"
                  className={`font-medium transition-colors ${
                    location.pathname === '/' ? 'font-bold text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Auctions
                </Link>
                
                <Link
                  to="/trade"
                  className={`font-medium transition-colors ${
                    location.pathname === '/trade' ? 'font-bold text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Trade
                </Link>
                
                {/* Store Directory Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-1 font-medium text-slate-300 transition-colors hover:text-white">
                    <span>Stores</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl opacity-0 invisible transition-all group-hover:visible group-hover:opacity-100">
                    <Link
                      to="/store/browse"
                      className="block w-full rounded-t-2xl px-4 py-3 text-left text-slate-200 hover:bg-slate-900"
                    >
                      Shop Store Items
                    </Link>
                    <Link
                      to="/store/directory"
                      className="block w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-900"
                    >
                      Browse All Stores
                    </Link>
                    <Link
                      to="/members/register"
                      className="block w-full rounded-b-2xl px-4 py-3 text-left text-slate-200 hover:bg-slate-900"
                    >
                      Become a Member
                    </Link>
                  </div>
                </div>
                
                {/* Nonprofit Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-1 font-medium text-slate-300 transition-colors hover:text-white">
                    <span>About Us</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl opacity-0 invisible transition-all group-hover:visible group-hover:opacity-100">
                    <Link
                      to="/about"
                      className="block w-full rounded-t-2xl px-4 py-3 text-left text-slate-200 hover:bg-slate-900"
                    >
                      Our Mission
                    </Link>
                    <Link
                      to="/programs"
                      className="block w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-900"
                    >
                      Programs
                    </Link>
                    <Link
                      to="/impact"
                      className="block w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-900"
                    >
                      Our Impact
                    </Link>
                    <Link
                      to="/contact"
                      className="block w-full rounded-b-2xl px-4 py-3 text-left text-slate-200 hover:bg-slate-900"
                    >
                      Contact
                    </Link>
                  </div>
                </div>

                <Link
                  to="/donate"
                  className="market-button-secondary px-3 py-2 font-medium text-white"
                >
                  Donate
                </Link>

                {user && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`font-medium transition-colors ${
                        location.pathname === '/dashboard' ? 'font-bold text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      My Auctions
                    </Link>
                  </>
                )}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link
                    to="/listings/create"
                    className="market-button-primary hidden items-center space-x-2 px-4 py-2 font-medium sm:flex"
                  >
                    <Plus size={20} />
                    <span>List Item</span>
                  </Link>

                  <button 
                    onClick={() => setCartOpen(true)}
                    className="relative text-slate-200 transition-colors hover:text-white"
                  >
                    <ShoppingCart size={24} />
                    {getCartItemCount() > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-400 text-xs font-bold text-slate-950 shadow-md">
                        {getCartItemCount()}
                      </span>
                    )}
                  </button>

                  <button className="relative text-slate-200 transition-colors hover:text-white">
                    <Bell size={24} />
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-400 text-xs font-bold text-slate-950 shadow-md">
                      0
                    </span>
                  </button>

                  <div className="relative group">
                    <button className="flex items-center space-x-2 text-white transition-colors hover:text-indigo-200">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 font-bold text-white shadow-md">
                        {profile?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="hidden sm:block font-medium">{profile?.username}</span>
                    </button>

                    <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl opacity-0 invisible transition-all group-hover:visible group-hover:opacity-100">
                      <Link
                        to="/profile"
                        className="block w-full rounded-t-2xl px-4 py-3 text-left text-slate-200 hover:bg-slate-900"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/dashboard"
                        className="block w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-900"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/trading"
                        className="block w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-900"
                      >
                        Trading
                      </Link>
                      <Link
                        to="/settings/ai"
                        className="block w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-900"
                      >
                        AI Settings
                      </Link>
                      <Link
                        to="/settings/social"
                        className="block w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-900"
                      >
                        Social Settings
                      </Link>
                      {profile?.is_admin && (
                        <Link
                          to="/admin"
                          className="block w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-900"
                        >
                          Admin Panel
                        </Link>
                      )}
                      <hr className="my-1 border-slate-800" />
                      <button
                        onClick={signOut}
                        className="block w-full rounded-b-2xl px-4 py-3 text-left text-red-400 hover:bg-slate-900"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="hidden sm:flex items-center space-x-3">
                  <button
                    onClick={() => handleAuthClick('signin')}
                    className="px-4 py-2 font-medium text-slate-200 transition-colors hover:text-white"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="market-button-primary px-4 py-2 font-medium"
                  >
                    Sign Up
                  </button>
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-300 hover:text-white md:hidden"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-purple-300 bg-gradient-to-br from-purple-600 to-blue-500">
            <div className="px-4 py-3 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left px-4 py-2 text-white hover:bg-white/20 rounded-lg"
              >
                Auctions
              </Link>
              
              <Link
                to="/trade"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left px-4 py-2 text-white hover:bg-white/20 rounded-lg"
              >
                Trade
              </Link>
              
              <div className="text-xs font-semibold text-white/60 px-4 py-1">STORES</div>
              <Link
                to="/store/browse"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left px-4 py-2 text-white hover:bg-white/20 rounded-lg"
              >
                Shop Store Items
              </Link>
              <Link
                to="/store/directory"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left px-4 py-2 text-white hover:bg-white/20 rounded-lg"
              >
                Browse All Stores
              </Link>
              <Link
                to="/members/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left px-4 py-2 text-white hover:bg-white/20 rounded-lg"
              >
                Become a Member
              </Link>
              
              {/* Nonprofit Section */}
              <div className="border-t border-white/20 pt-2 mt-2">
                <div className="text-xs font-semibold text-white/60 px-4 py-1">ABOUT US</div>
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-4 py-2 text-white hover:bg-white/20 rounded-lg"
                >
                  Our Mission
                </Link>
                <Link
                  to="/programs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-4 py-2 text-white hover:bg-white/20 rounded-lg"
                >
                  Programs
                </Link>
                <Link
                  to="/impact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-4 py-2 text-white hover:bg-white/20 rounded-lg"
                >
                  Our Impact
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-4 py-2 text-white hover:bg-white/20 rounded-lg"
                >
                  Contact
                </Link>
                <Link
                  to="/donate"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-4 py-2 bg-white text-purple-600 rounded-lg font-medium shadow-md mt-2"
                >
                  Donate
                </Link>
              </div>

              {user ? (
                <>
                  <div className="border-t border-white/20 pt-2 mt-2">
                    <Link
                      to="/listings/create"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-left px-4 py-2 bg-white/20 text-white rounded-lg font-medium"
                    >
                      List Item
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-left px-4 py-2 text-white hover:bg-white/20 rounded-lg"
                    >
                      My Auctions
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-t border-white/20 pt-2 mt-2">
                    <button
                      onClick={() => {
                        handleAuthClick('signin');
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-white hover:bg-white/20 rounded-lg"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        handleAuthClick('signup');
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 bg-white/20 text-white rounded-lg font-medium"
                    >
                      Sign Up
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      <ShoppingCartModal
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </>
  );
}
