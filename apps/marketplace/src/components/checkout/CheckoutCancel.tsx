import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimesCircle, FaArrowLeft, FaShoppingCart } from 'react-icons/fa';

export const CheckoutCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        {/* Cancel Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
            <FaTimesCircle className="text-5xl text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Checkout Cancelled
          </h1>
          <p className="text-gray-600">
            Your payment was not processed. No charges have been made.
          </p>
        </div>

        {/* Information */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">What Happened?</h2>
          <p className="text-gray-600 mb-4">
            You cancelled the checkout process before completing your payment. 
            This could be because:
          </p>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>You clicked the back button during checkout</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>You closed the payment window</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>You decided not to complete the purchase</span>
            </li>
          </ul>
        </div>

        {/* Reassurance */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            <strong>Don't worry!</strong> Your item is still available and waiting for you. 
            You can return anytime to complete your purchase.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
          >
            <FaArrowLeft />
            <span>Return to Item</span>
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
          >
            <FaShoppingCart />
            <span>Browse More Items</span>
          </button>
        </div>

        {/* Support */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Need help?{' '}
            <a href="mailto:support@constructivedesignsinc.org" className="text-purple-600 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
