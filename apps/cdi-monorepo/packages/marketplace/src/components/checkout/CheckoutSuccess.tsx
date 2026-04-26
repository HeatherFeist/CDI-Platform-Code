import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { formatCurrency } from '../../services/StripeService';

export const CheckoutSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Fetch order details from Stripe session
      fetchOrderDetails(sessionId);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchOrderDetails = async (sessionId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/checkout-session/${sessionId}`);
      const data = await response.json();
      setOrderDetails(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="market-shell flex min-h-screen items-center justify-center">
        <div className="market-panel mx-4 w-full max-w-md p-8 text-center">
          <FaSpinner className="mx-auto mb-4 animate-spin text-6xl text-indigo-300" />
          <h2 className="mb-2 text-2xl font-bold text-white">Processing Your Order</h2>
          <p className="text-slate-300">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="market-shell flex min-h-screen items-center justify-center p-4">
      <div className="market-panel max-w-2xl w-full p-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
            <FaCheckCircle className="text-5xl text-emerald-300" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">
            Payment Successful!
          </h1>
          <p className="text-slate-300">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </div>

        {/* Order Details */}
        {orderDetails && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-slate-950/35 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Order Details</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Order Number:</span>
                <span className="font-semibold text-slate-100">
                  #{sessionId?.slice(-8).toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-semibold text-slate-100">
                  {formatCurrency(orderDetails.amount / 100)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-semibold text-slate-100">
                  {orderDetails.payment_method_type || 'Card'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-200">
                  Confirmed
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-6">
          <h3 className="mb-3 text-lg font-semibold text-cyan-100">What's Next?</h3>
          <ul className="space-y-2 text-cyan-100">
            <li className="flex items-start">
              <span className="mr-2 text-cyan-300">✓</span>
              <span>You'll receive an email confirmation shortly</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-cyan-300">✓</span>
              <span>The seller will be notified and will prepare your order</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-cyan-300">✓</span>
              <span>Track your order status in your dashboard</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-cyan-300">✓</span>
              <span>You'll receive shipping/delivery updates via email</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="market-button-primary flex-1 px-6 py-3 font-semibold"
          >
            View My Orders
          </button>
          <button
            onClick={() => navigate('/')}
            className="market-button-secondary flex-1 px-6 py-3 font-semibold"
          >
            Continue Shopping
          </button>
        </div>

        {/* Support */}
        <div className="mt-6 text-center text-sm text-slate-400">
          <p>
            Questions? Contact us at{' '}
            <a href="mailto:support@constructivedesignsinc.org" className="text-indigo-300 hover:underline">
              support@constructivedesignsinc.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
