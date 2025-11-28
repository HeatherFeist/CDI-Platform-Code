import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Star, Heart, TrendingUp, ShoppingCart, ArrowLeftRight, Edit, Truck, Package, MapPin, Home } from 'lucide-react';
import { supabase, Listing, Bid, DeliveryOption } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import PaymentModal from '../payment/PaymentModal';
import CreateTradeModal from '../trading/CreateTradeModal';
import FacebookShareButton from '../social/FacebookShareButton';
import { FacebookShareData } from '../../types/facebook';
import { CheckoutButton } from '../checkout/CheckoutButton';

export default function ListingDetail() {
  const { id: listingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // If no listing ID, redirect to home
  if (!listingId) {
    navigate('/');
    return null;
  }
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidding, setBidding] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchListing();
    fetchBids();
    checkWatchlist();
    if (user) {
      fetchUserListings();
    }

    const subscription = supabase
      .channel(`listing:${listingId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bids',
        filter: `listing_id=eq.${listingId}`,
      }, () => {
        fetchListing();
        fetchBids();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [listingId, user]);

  useEffect(() => {
    if (!listing) return;

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(listing.end_time).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft('Auction ended');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [listing]);

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          seller:profiles!listings_seller_id_fkey(id, username, rating, total_reviews),
          category:categories(id, name, icon)
        `)
        .eq('id', listingId)
        .maybeSingle();

      if (error) throw error;
      setListing(data);

      if (data) {
        await supabase
          .from('listings')
          .update({ view_count: data.view_count + 1 })
          .eq('id', listingId);
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          bidder:profiles!bids_bidder_id_fkey(id, username, rating)
        `)
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBids(data || []);
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };

  const checkWatchlist = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
        .maybeSingle();

      if (error) throw error;
      setIsWatching(!!data);
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError('');

    if (!user) {
      setBidError('You must be logged in to place a bid');
      return;
    }

    if (!listing) return;

    const amount = parseFloat(bidAmount);
    const minBid = listing.current_bid > 0
      ? listing.current_bid + listing.bid_increment
      : listing.starting_bid;

    if (amount < minBid) {
      setBidError(`Minimum bid is $${minBid.toFixed(2)}`);
      return;
    }

    setBidding(true);

    try {
      const { error } = await supabase
        .from('bids')
        .insert([{
          listing_id: listingId,
          bidder_id: user.id,
          amount,
        }]);

      if (error) throw error;

      setBidAmount('');
      fetchListing();
      fetchBids();
    } catch (err: any) {
      setBidError(err.message || 'Failed to place bid');
    } finally {
      setBidding(false);
    }
  };

  const fetchUserListings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .eq('status', 'active')
        .neq('id', listingId); // Don't include the current listing

      if (error) throw error;
      setUserListings(data || []);
    } catch (error) {
      console.error('Error fetching user listings:', error);
    }
  };

  const handleBuyNow = async () => {
    if (!user || !listing || !listing.buy_now_price) return;
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    if (!listing || !user) return;

    try {
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: listing.seller_id,
          amount: listing.buy_now_price,
          payment_status: 'completed',
          payment_method_id: paymentMethodId,
        }]);

      if (transactionError) throw transactionError;

      // Update listing status
      await supabase
        .from('listings')
        .update({ status: 'sold', winner_id: user.id })
        .eq('id', listingId);

      setShowPaymentModal(false);
      
      // Show success message and redirect
      alert('Purchase successful! You have won this auction.');
      navigate('/dashboard');
      
    } catch (err: any) {
      console.error('Payment processing error:', err);
      alert('Payment failed. Please try again.');
    }
  };

  const toggleWatchlist = async () => {
    if (!user) {
      alert('You must be logged in to add items to your watchlist');
      return;
    }

    try {
      if (isWatching) {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId);

        if (error) throw error;
        setIsWatching(false);
      } else {
        const { error } = await supabase
          .from('watchlist')
          .insert([{
            user_id: user.id,
            listing_id: listingId,
          }]);

        if (error) throw error;
        setIsWatching(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update watchlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading auction...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Auction not found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Return to browse
          </button>
        </div>
      </div>
    );
  }

  const imageUrl = listing.images?.[currentImage] || 'https://images.pexels.com/photos/3345882/pexels-photo-3345882.jpeg?auto=compress&cs=tinysrgb&w=1200';
  const isAuctionActive = new Date(listing.end_time) > new Date() && listing.status === 'active';
  const minBid = listing.current_bid > 0
    ? listing.current_bid + listing.bid_increment
    : listing.starting_bid;

  // Create Facebook share data
  const facebookShareData: FacebookShareData = {
    type: 'auction',
    title: listing.title,
    description: listing.description,
    image_url: listing.images?.[0] || undefined,
    link: `${window.location.origin}/listing/${listing.id}`,
    price: listing.current_bid > 0 ? listing.current_bid : listing.starting_bid,
    location: undefined, // Will be populated from location data if available
    ends_at: listing.end_time
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to browse
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={listing.title}
                  className="w-full h-96 object-cover"
                />
                {listing.buy_now_price && isAuctionActive && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-lg font-bold">
                    BUY NOW AVAILABLE
                  </div>
                )}
                
                {/* Condition Badge */}
                <div className={`absolute top-4 left-4 text-white px-3 py-1 rounded-lg font-medium shadow-md ${
                  listing.condition === 'new' ? 'bg-gradient-primary' :
                  listing.condition === 'handcrafted' ? 'bg-purple-600' :
                  'bg-gray-500'
                }`}>
                  {listing.condition === 'new' ? '✨ New Item' :
                   listing.condition === 'handcrafted' ? '🤲 Hand-crafted' :
                   '♻️ Used Item'}
                </div>
              </div>

              {listing.images && listing.images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {listing.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${listing.title} ${idx + 1}`}
                      onClick={() => setCurrentImage(idx)}
                      className={`w-20 h-20 object-cover rounded cursor-pointer transition-all ${
                        currentImage === idx ? 'ring-2 ring-blue-500' : 'opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
                <div className="flex items-center space-x-2">
                  <FacebookShareButton 
                    shareData={facebookShareData}
                    variant="icon"
                    size="md"
                    showResults={false}
                  />
                  <button
                    onClick={toggleWatchlist}
                    className={`p-2 rounded-full transition-colors ${
                      isWatching
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-400 hover:text-red-600'
                    }`}
                  >
                    <Heart size={24} className={isWatching ? 'fill-current' : ''} />
                  </button>
                </div>
              </div>

              {listing.category && (
                <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm mb-4 mr-2">
                  {listing.category.name}
                </span>
              )}
              
              <span className={`inline-block px-3 py-1 rounded-full text-sm mb-4 ${
                listing.condition === 'new' ? 'bg-blue-100 text-blue-700' :
                listing.condition === 'handcrafted' ? 'bg-purple-100 text-purple-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {listing.condition === 'new' ? '✨ New Item' :
                 listing.condition === 'handcrafted' ? '🤲 Hand-crafted' :
                 '♻️ Used Item'}
              </span>

              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {listing.description}
              </div>
            </div>

            {/* Delivery Options */}
            {listing.delivery_options && listing.delivery_options.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <Truck size={20} className="mr-2 text-blue-600" />
                  Delivery & Fulfillment Options
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listing.delivery_options
                    .filter((option: DeliveryOption) => option.enabled)
                    .map((option: DeliveryOption, index: number) => {
                      const methodConfig = {
                        pickup: {
                          icon: Home,
                          color: 'text-green-600',
                          bgColor: 'bg-green-50',
                          borderColor: 'border-green-200',
                          label: '🏠 Local Pickup'
                        },
                        local_delivery: {
                          icon: MapPin,
                          color: 'text-blue-600',
                          bgColor: 'bg-blue-50',
                          borderColor: 'border-blue-200',
                          label: '🚗 Local Delivery'
                        },
                        seller_delivery: {
                          icon: Truck,
                          color: 'text-purple-600',
                          bgColor: 'bg-purple-50',
                          borderColor: 'border-purple-200',
                          label: '🚚 Seller Delivers'
                        },
                        shipping: {
                          icon: Package,
                          color: 'text-orange-600',
                          bgColor: 'bg-orange-50',
                          borderColor: 'border-orange-200',
                          label: '📦 Ship via Carrier'
                        }
                      };

                      const config = methodConfig[option.method as keyof typeof methodConfig];
                      const Icon = config.icon;

                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 ${config.bgColor} ${config.borderColor}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Icon size={18} className={config.color} />
                              <span className={`font-semibold ${config.color}`}>
                                {config.label}
                              </span>
                            </div>
                            <span className={`font-bold ${option.fee === 0 ? 'text-green-600' : config.color}`}>
                              {option.fee === 0 ? 'FREE' : `$${option.fee.toFixed(2)}`}
                            </span>
                          </div>
                          
                          {option.description && (
                            <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                          )}

                          <div className="text-xs text-gray-500 space-y-1">
                            {option.method === 'local_delivery' && option.radius_miles && (
                              <p>• Within {option.radius_miles} miles</p>
                            )}
                            {option.method === 'pickup' && option.available_hours && (
                              <p>• Available: {option.available_hours}</p>
                            )}
                            {option.method === 'shipping' && option.carrier && (
                              <p>• Carrier: {option.carrier}</p>
                            )}
                            {option.method === 'shipping' && option.estimated_days && (
                              <p>• Estimated: {option.estimated_days} days</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {listing.pickup_instructions && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-yellow-800">Pickup Instructions:</span>{' '}
                      {listing.pickup_instructions}
                    </p>
                  </div>
                )}
              </div>
            )}

            {bids.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <TrendingUp size={20} className="mr-2" />
                  Bid History
                </h3>
                <div className="space-y-3">
                  {bids.map((bid, idx) => (
                    <div
                      key={bid.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        idx === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                          {bid.bidder?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{bid.bidder?.username}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(bid.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">${bid.amount.toFixed(2)}</p>
                        {idx === 0 && (
                          <span className="text-xs text-green-600 font-medium">Highest Bid</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              {/* Store Item UI */}
              {listing.listing_type === 'store' ? (
                <>
                  <div className="mb-6">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
                      STORE ITEM
                    </span>
                    <div className="flex items-baseline space-x-3 mb-2">
                      <p className="text-3xl font-bold text-green-600">
                        ${(listing.starting_bid || 0).toFixed(2)}
                      </p>
                      {listing.compare_at_price && listing.starting_bid && listing.compare_at_price > listing.starting_bid && (
                        <p className="text-lg text-gray-400 line-through">
                          ${listing.compare_at_price.toFixed(2)}
                        </p>
                      )}
                    </div>
                    {listing.compare_at_price && listing.starting_bid && listing.compare_at_price > listing.starting_bid && (
                      <p className="text-sm text-green-600 font-medium">
                        Save ${(listing.compare_at_price - listing.starting_bid).toFixed(2)} (
                        {Math.round(((listing.compare_at_price - listing.starting_bid) / listing.compare_at_price) * 100)}% off)
                      </p>
                    )}
                  </div>

                  {listing.stock_quantity && listing.stock_quantity > 0 ? (
                    <>
                      <div className="mb-4 pb-4 border-b">
                        <p className="text-sm text-gray-600 mb-1">Stock Available</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {listing.stock_quantity} {listing.stock_quantity === 1 ? 'unit' : 'units'} in stock
                        </p>
                      </div>

                      {user && user.id !== listing.seller_id && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantity
                            </label>
                            <div className="flex items-center space-x-3">
                              <button
                                type="button"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-semibold text-gray-700"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={listing.stock_quantity}
                                value={quantity}
                                onChange={(e) => setQuantity(Math.min(listing.stock_quantity!, Math.max(1, parseInt(e.target.value) || 1)))}
                                className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                              <button
                                type="button"
                                onClick={() => setQuantity(Math.min(listing.stock_quantity!, quantity + 1))}
                                className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-semibold text-gray-700"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Stripe Checkout Button */}
                          <CheckoutButton
                            listingId={listing.id}
                            title={listing.title}
                            price={(listing.starting_bid || 0) * quantity}
                            sellerId={listing.seller_id}
                            imageUrl={listing.images?.[0]}
                            deliveryOptions={listing.delivery_options}
                          />

                          <button
                            onClick={() => addToCart(listing, quantity)}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                          >
                            <ShoppingCart size={20} className="mr-2" />
                            Add to Cart
                          </button>

                          {/* Trade Button for Store Items */}
                          {userListings.length > 0 && (
                            <button
                              onClick={() => setShowTradeModal(true)}
                              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
                            >
                              <ArrowLeftRight size={20} className="mr-2" />
                              Propose Trade
                            </button>
                          )}
                        </div>
                      )}

                      {user && user.id === listing.seller_id && (
                        <div className="space-y-3">
                          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                            This is your listing
                          </div>
                          <button
                            onClick={() => navigate(`/listings/${listing.id}/edit`)}
                            className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                          >
                            <Edit size={20} />
                            <span>Edit Listing</span>
                          </button>
                        </div>
                      )}

                      {!user && (
                        <button
                          onClick={() => navigate('/login')}
                          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                          Sign in to Purchase
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      Out of Stock
                    </div>
                  )}
                </>
              ) : (
                /* Auction Item UI */
                <>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    <span className="text-gray-600">Time Left</span>
                    <div className="flex items-center text-red-600 font-semibold">
                      <Clock size={18} className="mr-2" />
                      {timeLeft}
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-gray-600 text-sm mb-1">Current Bid</p>
                    <p className="text-3xl font-bold text-purple-600">
                      ${listing.current_bid > 0 ? listing.current_bid.toFixed(2) : listing.starting_bid.toFixed(2)}
                    </p>
                    {bids.length > 0 && (
                      <p className="text-sm text-gray-500 mt-1">{bids.length} bid{bids.length !== 1 ? 's' : ''}</p>
                    )}
                  </div>

                  {isAuctionActive && user && user.id !== listing.seller_id ? (
                    <div className="space-y-4">
                      <form onSubmit={handlePlaceBid} className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Bid (Min: ${minBid.toFixed(2)})
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min={minBid}
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter bid amount"
                            required
                          />
                        </div>

                        {bidError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                            {bidError}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={bidding}
                          className="w-full bg-gradient-primary text-white py-3 rounded-lg font-medium hover:bg-gradient-primary-hover transition-colors disabled:opacity-50 shadow-md"
                        >
                          {bidding ? 'Placing Bid...' : 'Place Bid'}
                        </button>
                      </form>

                      {listing.buy_now_price && (
                        <CheckoutButton
                          listingId={listing.id}
                          title={listing.title}
                          price={listing.buy_now_price}
                          sellerId={listing.seller_id}
                          imageUrl={listing.images?.[0]}
                          deliveryOptions={listing.delivery_options}
                        />
                      )}

                      {/* Trade Button */}
                      {userListings.length > 0 && (
                        <button
                          onClick={() => setShowTradeModal(true)}
                          className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
                        >
                          <ArrowLeftRight size={20} className="mr-2" />
                          Propose Trade
                        </button>
                      )}
                    </div>
                  ) : !isAuctionActive ? (
                    <div className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg text-center font-medium">
                      Auction Ended
                    </div>
                  ) : user && user.id === listing.seller_id ? (
                    <div className="space-y-3">
                      <div className="bg-purple-50 text-purple-700 py-3 px-4 rounded-lg text-center font-medium shadow-sm">
                        This is your listing
                      </div>
                      {bids.length === 0 && (
                        <button
                          onClick={() => navigate(`/listings/${listing.id}/edit`)}
                          className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                          <Edit size={20} />
                          <span>Edit Listing</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => alert('Please sign in to place a bid')}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Sign In to Bid
                    </button>
                  )}

                  {listing.reserve_price && listing.current_bid < listing.reserve_price && (
                    <p className="text-sm text-orange-600 text-center mt-4">
                      Reserve price not yet met
                    </p>
                  )}
                </>
              )}
            </div>

            {listing.seller && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-lg mb-4">Seller Information</h3>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                    {listing.seller.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{listing.seller.username}</p>
                    {listing.seller.rating > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Star size={14} className="text-yellow-400 fill-current mr-1" />
                        {listing.seller.rating.toFixed(1)} ({listing.seller.total_reviews} reviews)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={listing.buy_now_price || 0}
          itemTitle={listing.title}
          onPaymentSuccess={handlePaymentSuccess}
        />

        {/* Trade Modal */}
        <CreateTradeModal
          isOpen={showTradeModal}
          onClose={() => setShowTradeModal(false)}
          targetListing={listing}
          targetUserId={listing.seller_id}
          userListings={userListings}
        />
      </div>
    </div>
  );
}
