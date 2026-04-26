import { useState, useEffect } from 'react';
import { Clock, Eye, Star, Package, ShoppingCart, Trash2 } from 'lucide-react';
import { Listing, supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ListingCardProps {
  listing: Listing;
  onClick?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export default function ListingCard({ listing, onClick, onDelete, showActions = false }: ListingCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isStore = listing.listing_type === 'store';
  const isAuction = listing.listing_type === 'auction' || !listing.listing_type; // Default to auction for old listings
  const isOwner = user?.id === listing.seller_id;

  useEffect(() => {
    if (!isAuction || !listing.end_time) return;

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(listing.end_time).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft('Ended');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);

    return () => clearInterval(interval);
  }, [listing.end_time, isAuction]);

  const imageUrl = listing.images?.[0] || 'https://images.pexels.com/photos/3345882/pexels-photo-3345882.jpeg?auto=compress&cs=tinysrgb&w=800';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/listings/${listing.id}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id);

      if (error) throw error;

      if (onDelete) {
        onDelete();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing. Please try again.');
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="market-panel market-panel-hover group relative cursor-pointer overflow-hidden rounded-2xl"
    >
      {/* Delete Button (only for owner) */}
      {(showActions || isOwner) && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`absolute top-2 left-2 z-10 ${
            showConfirm 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-red-500 hover:bg-red-600'
          } text-white p-2 rounded-full shadow-lg transition-all ${
            isDeleting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={showConfirm ? 'Click again to confirm delete' : 'Delete listing'}
        >
          {isDeleting ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      )}
      
      <div className="relative h-48 overflow-hidden bg-slate-800">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Type Badge */}
        {isStore ? (
          <div className="absolute right-2 top-2 flex items-center rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-emerald-950/40">
            <ShoppingCart size={12} className="mr-1" />
            STORE
          </div>
        ) : (
          listing.buy_now_price && (
            <div className="absolute right-2 top-2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-emerald-950/40">
              BUY NOW
            </div>
          )
        )}
        
        {/* Condition Badge */}
        <div className={`absolute left-2 top-2 rounded-full px-3 py-1 text-xs font-medium text-white shadow-md ${
          listing.condition === 'new' ? 'bg-gradient-primary' :
          listing.condition === 'handcrafted' ? 'bg-indigo-500' :
          'bg-slate-700'
        }`}>
          {listing.condition === 'new' ? '✨ New' :
           listing.condition === 'handcrafted' ? '🤲 Hand-crafted' :
           '♻️ Used'}
        </div>
        
        {/* Bottom Badge - Time Left (auction) or Stock (store) */}
        <div className="absolute bottom-2 left-2 flex items-center rounded-full bg-slate-950/80 px-3 py-1 text-xs text-slate-100 backdrop-blur-sm">
          {isStore ? (
            <>
              <Package size={12} className="mr-1" />
              {listing.stock_quantity || 0} in stock
            </>
          ) : (
            <>
              <Clock size={12} className="mr-1" />
              {timeLeft}
            </>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="mb-1 line-clamp-2 font-semibold text-slate-100 transition-colors group-hover:text-indigo-300">
          {listing.title}
        </h3>

        {/* Pricing Section - Different for Store vs Auction */}
        {isStore ? (
          <div className="mb-3">
            {listing.compare_at_price && listing.compare_at_price > listing.starting_bid && (
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm text-slate-500 line-through">
                  ${listing.compare_at_price.toFixed(2)}
                </span>
                <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300">
                  Save ${(listing.compare_at_price - listing.starting_bid).toFixed(2)}
                </span>
              </div>
            )}
            <p className="text-2xl font-bold text-emerald-400">
              ${(listing.starting_bid || 0).toFixed(2)}
            </p>
            {listing.stock_quantity === 0 && (
              <p className="mt-1 text-xs font-medium text-red-400">Out of Stock</p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-400">Current Bid</p>
              <p className="text-lg font-bold text-indigo-300">
                ${listing.current_bid > 0 ? listing.current_bid.toFixed(2) : listing.starting_bid.toFixed(2)}
              </p>
            </div>
            {listing.buy_now_price && (
              <div className="text-right">
                <p className="text-xs text-slate-400">Buy Now</p>
                <p className="text-sm font-semibold text-emerald-400">
                  ${listing.buy_now_price.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            {listing.seller && (
              <div className="flex items-center">
                <div className="mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-primary text-xs text-white shadow-sm">
                  {listing.seller.username[0].toUpperCase()}
                </div>
                <span>{listing.seller.username}</span>
              </div>
            )}
            {listing.seller && listing.seller.rating != null && listing.seller.rating > 0 && (
              <div className="flex items-center">
                <Star size={12} className="text-yellow-400 fill-current mr-1" />
                <span>{listing.seller.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center">
            <Eye size={12} className="mr-1" />
            {listing.view_count}
          </div>
        </div>
      </div>
    </div>
  );
}
