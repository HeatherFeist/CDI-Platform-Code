import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimesCircle, FaArrowLeft, FaShoppingCart } from 'react-icons/fa';

export const CheckoutCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="market-shell flex min-h-screen items-center justify-center p-4">
      <div className="market-panel max-w-md w-full p-8">
        {/* Cancel Icon */}
        <div className="text-center mb-8">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/15">
            <FaTimesCircle className="text-5xl text-amber-300" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">
            Checkout Cancelled
          </h1>
          <p className="text-slate-300">
            Your payment was not processed. No charges have been made.
          </p>
        </div>

        {/* Information */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-slate-950/35 p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">What Happened?</h2>
          <p className="mb-4 text-slate-300">
            You cancelled the checkout process before completing your payment. 
            This could be because:
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start">
              <span className="mr-2 text-slate-500">•</span>
              <span>You clicked the back button during checkout</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-slate-500">•</span>
              <span>You closed the payment window</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-slate-500">•</span>
              <span>You decided not to complete the purchase</span>
            </li>
          </ul>
        </div>

        {/* Reassurance */}
        <div className="mb-6 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-4">
          <p className="text-sm text-cyan-100">
            <strong>Don't worry!</strong> Your item is still available and waiting for you. 
            You can return anytime to complete your purchase.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="market-button-primary flex w-full items-center justify-center space-x-2 px-6 py-3 font-semibold"
          >
            <FaArrowLeft />
            <span>Return to Item</span>
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="market-button-secondary flex w-full items-center justify-center space-x-2 px-6 py-3 font-semibold"
          >
            <FaShoppingCart />
            <span>Browse More Items</span>
          </button>
        </div>

        {/* Support */}
        <div className="mt-6 text-center text-sm text-slate-400">
          <p>
            Need help?{' '}
            <a href="mailto:support@constructivedesignsinc.org" className="text-indigo-300 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
