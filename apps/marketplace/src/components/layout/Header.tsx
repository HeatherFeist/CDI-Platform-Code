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
      <header className="bg-gradient-primary shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link
                to="/"
                className="flex items-center space-x-2 text-white hover:text-gray-100 transition-colors"
              >
                <Gavel size={28} />
                <div className="hidden sm:block">
                  <div className="font-bold text-lg">Constructive Designs</div>
                  <div className="text-xs text-gray-400">Marketplace</div>
                  <div className="text-xs text-purple-100">Auction & Trading Platform</div>
                </div>
              </Link>

              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  to="/"
                  className={`font-medium transition-colors ${
                    location.pathname === '/' ? 'text-white font-bold' : 'text-purple-100 hover:text-white'
                  }`}
                >
                  Auctions
                </Link>
                
                <Link
                  to="/trade"
                  className={`font-medium transition-colors ${
                    location.pathname === '/trade' ? 'text-white font-bold' : 'text-purple-100 hover:text-white'
                  }`}
                >
                  Trade
                </Link>
                
                {/* Store Directory Dropdown */}
                <div className="relative group">
                  <button className="font-medium text-purple-100 hover:text-white transition-colors flex items-center space-x-1">
                    <span>Stores</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link
                      to="/store/browse"
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg"
                    >
                      Shop Store Items
                    </Link>
                    <Link
                      to="/store/directory"
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      Browse All Stores
                    </Link>
                    <Link
                      to="/members/register"
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-b-lg"
                    >
                      Become a Member
                    </Link>
                  </div>
                </div>
                
                {/* Nonprofit Dropdown */}
                <div className="relative group">
                  <button className="font-medium text-purple-100 hover:text-white transition-colors flex items-center space-x-1">
                    <span>About Us</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link
                      to="/about"
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg"
                    >
                      Our Mission
                    </Link>
                    <Link
                      to="/programs"
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      Programs
                    </Link>
                    <Link
                      to="/impact"
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      Our Impact
                    </Link>
                    <Link
                      to="/contact"
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-b-lg"
                    >
                      Contact
                    </Link>
                  </div>
                </div>

                <Link
                  to="/donate"
                  className="font-medium bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors text-white"
                >
                  Donate
                </Link>

                {user && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`font-medium transition-colors ${
                        location.pathname === '/dashboard' ? 'text-white font-bold' : 'text-purple-100 hover:text-white'
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
                    className="hidden sm:flex items-center space-x-2 bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors font-medium shadow-md"
                  >
                    <Plus size={20} />
                    <span>List Item</span>
                  </Link>

                  <button 
                    onClick={() => setCartOpen(true)}
                    className="relative text-white hover:text-purple-100 transition-colors"
                  >
                    <ShoppingCart size={24} />
                    {getCartItemCount() > 0 && (
                      <span className="absolute -top-1 -right-1 bg-white text-purple-600 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md">
                        {getCartItemCount()}
                      </span>
                    )}
                  </button>

                  <button className="relative text-white hover:text-purple-100 transition-colors">
                    <Bell size={24} />
                    <span className="absolute -top-1 -right-1 bg-white text-purple-600 text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-md font-bold">
                      0
                    </span>
                  </button>

                  <div className="relative group">
                    <button className="flex items-center space-x-2 text-white hover:text-purple-100 transition-colors">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-purple-600 font-bold shadow-md">
                        {profile?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="hidden sm:block font-medium">{profile?.username}</span>
                    </button>

                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <Link
                        to="/profile"
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/dashboard"
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/trading"
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        Trading
                      </Link>
                      <Link
                        to="/settings/ai"
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        AI Settings
                      </Link>
                      <Link
                        to="/settings/social"
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        Social Settings
                      </Link>
                      {profile?.is_admin && (
                        <Link
                          to="/admin"
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          Admin Panel
                        </Link>
                      )}
                      <hr className="my-1" />
                      <button
                        onClick={signOut}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 rounded-b-lg"
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
                    className="px-4 py-2 text-white hover:text-purple-100 font-medium transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleAuthClick('signup')}
                    className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium shadow-md"
                  >
                    Sign Up
                  </button>
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-600 hover:text-gray-900"
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
