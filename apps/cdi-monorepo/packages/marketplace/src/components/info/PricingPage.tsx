import { useState } from 'react';
import { FiDollarSign, FiShield, FiZap, FiUsers, FiCheck, FiHelpCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export function PricingPage() {
  const [saleAmount, setSaleAmount] = useState('100');
  
  const platformFee = Number(import.meta.env.VITE_PLATFORM_FEE_PERCENTAGE || 10);
  const calculatedFee = (parseFloat(saleAmount) || 0) * (platformFee / 100);
  const youReceive = (parseFloat(saleAmount) || 0) - calculatedFee;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          No hidden fees. No monthly subscriptions. You only pay when you sell.
        </p>
      </div>

      {/* Main Pricing Card */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-xl p-8 mb-12 border-2 border-purple-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full mb-4">
            <FiDollarSign className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {platformFee}% Platform Fee
          </h2>
          <p className="text-gray-600">
            Only charged on successful sales
          </p>
        </div>

        {/* Fee Calculator */}
        <div className="bg-white rounded-xl p-6 max-w-md mx-auto shadow-md">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">
            Fee Calculator
          </h3>
          
          <div className="mb-4">
            <label htmlFor="saleAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Sale Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="saleAmount"
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Sale Amount</span>
              <span className="font-semibold text-gray-900">
                ${parseFloat(saleAmount || '0').toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Platform Fee ({platformFee}%)</span>
              <span className="text-purple-600 font-semibold">
                -${calculatedFee.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 bg-green-50 px-3 rounded-lg">
              <span className="font-semibold text-gray-900">You Receive</span>
              <span className="text-xl font-bold text-green-600">
                ${youReceive.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison with Other Platforms */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          How We Compare
        </h2>
        
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-purple-500">
            <h3 className="font-bold text-purple-600 mb-2">Our Platform</h3>
            <div className="text-3xl font-bold text-gray-900 mb-1">{platformFee}%</div>
            <p className="text-sm text-gray-600">+ Payment processing</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-bold text-gray-900 mb-2">eBay</h3>
            <div className="text-3xl font-bold text-gray-900 mb-1">10-15%</div>
            <p className="text-sm text-gray-600">+ Payment processing</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-bold text-gray-900 mb-2">Etsy</h3>
            <div className="text-3xl font-bold text-gray-900 mb-1">6.5%</div>
            <p className="text-sm text-gray-600">+ Transaction fee + Payment processing + Listing fee</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-bold text-gray-900 mb-2">Amazon</h3>
            <div className="text-3xl font-bold text-gray-900 mb-1">15%+</div>
            <p className="text-sm text-gray-600">+ Fulfillment + Storage</p>
          </div>
        </div>
      </div>

      {/* What Your Fee Covers */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          What Your {platformFee}% Fee Covers
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiShield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Secure Infrastructure</h3>
              <p className="text-sm text-gray-600">
                Enterprise-grade hosting, SSL certificates, database management, and backups
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Payment Processing</h3>
              <p className="text-sm text-gray-600">
                Secure Stripe integration for safe transactions and fraud protection
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiZap className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Platform Features</h3>
              <p className="text-sm text-gray-600">
                Real-time bidding, messaging system, notifications, and search functionality
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiUsers className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Customer Support</h3>
              <p className="text-sm text-gray-600">
                Ongoing maintenance, bug fixes, feature updates, and user support
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <p className="text-gray-700 text-center">
            <span className="font-semibold">Our Mission:</span> We're not here to maximize profits. 
            Our {platformFee}% fee is designed to cover operational costs and maintain a sustainable, 
            secure platform that serves our community fairly.
          </p>
        </div>
      </div>

      {/* Free Features */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Always Free
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <FiCheck className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Unlimited Listings</h3>
              <p className="text-sm text-gray-600">
                Create as many store or auction listings as you want
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FiCheck className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Browse & Bid</h3>
              <p className="text-sm text-gray-600">
                Search, browse, and participate in auctions completely free
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FiCheck className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Image Hosting</h3>
              <p className="text-sm text-gray-600">
                Upload multiple high-quality photos for each listing
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FiCheck className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Messaging</h3>
              <p className="text-sm text-gray-600">
                Communicate directly with buyers and sellers
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FiCheck className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Dashboard & Analytics</h3>
              <p className="text-sm text-gray-600">
                Track your sales, bids, and earnings in real-time
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FiCheck className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Profile Customization</h3>
              <p className="text-sm text-gray-600">
                Build your seller reputation and buyer history
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Features Note */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl shadow-xl p-8 text-white mb-12">
        <div className="flex items-start gap-4">
          <FiZap className="w-8 h-8 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-bold mb-3">AI Features - You Control the Costs</h2>
            <p className="text-purple-100 mb-4">
              Our platform offers powerful AI features like auto-generated descriptions, smart pricing, 
              and image analysis. To keep our fees low and give you control, these features use your own 
              Google Gemini API key.
            </p>
            <ul className="space-y-2 text-purple-100 mb-4">
              <li className="flex items-center gap-2">
                <FiCheck className="w-5 h-5" />
                <span>Google offers a generous free tier (60 requests/minute)</span>
              </li>
              <li className="flex items-center gap-2">
                <FiCheck className="w-5 h-5" />
                <span>Most users stay within the free tier</span>
              </li>
              <li className="flex items-center gap-2">
                <FiCheck className="w-5 h-5" />
                <span>If you exceed it, costs are pennies per request</span>
              </li>
              <li className="flex items-center gap-2">
                <FiCheck className="w-5 h-5" />
                <span>You control your usage and billing directly with Google</span>
              </li>
            </ul>
            <Link
              to="/settings/ai"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:shadow-lg transition-shadow"
            >
              Set Up AI Features
              <FiZap className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-start gap-3 mb-2">
              <FiHelpCircle className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
              <h3 className="font-semibold text-gray-900">
                When is the {platformFee}% fee charged?
              </h3>
            </div>
            <p className="text-gray-600 ml-8">
              The fee is only charged when you successfully sell an item. If your item doesn't sell 
              or if you're a buyer, there's no fee. For auctions, the fee is charged when the auction 
              ends with a winning bidder. For store items, it's charged when a buyer completes their purchase.
            </p>
          </div>

          <div>
            <div className="flex items-start gap-3 mb-2">
              <FiHelpCircle className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
              <h3 className="font-semibold text-gray-900">
                Are there any other fees?
              </h3>
            </div>
            <p className="text-gray-600 ml-8">
              Payment processing fees (Stripe's standard rates) apply to all transactions. These are 
              clearly displayed during checkout. There are no listing fees, no subscription fees, and 
              no hidden charges. What you see is what you pay.
            </p>
          </div>

          <div>
            <div className="flex items-start gap-3 mb-2">
              <FiHelpCircle className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
              <h3 className="font-semibold text-gray-900">
                How do refunds work?
              </h3>
            </div>
            <p className="text-gray-600 ml-8">
              If a sale is cancelled or refunded, the {platformFee}% platform fee is also refunded. 
              We only earn when you successfully complete a sale, aligning our interests with yours.
            </p>
          </div>

          <div>
            <div className="flex items-start gap-3 mb-2">
              <FiHelpCircle className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
              <h3 className="font-semibold text-gray-900">
                Why {platformFee}% instead of a lower percentage?
              </h3>
            </div>
            <p className="text-gray-600 ml-8">
              {platformFee}% is industry-standard and allows us to maintain secure infrastructure, provide 
              reliable service, and continuously improve the platform. Unlike higher-fee platforms, we're 
              transparent about costs and committed to keeping fees minimal while delivering quality service.
              We're not profit-maximizing - we're cost-covering.
            </p>
          </div>

          <div>
            <div className="flex items-start gap-3 mb-2">
              <FiHelpCircle className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
              <h3 className="font-semibold text-gray-900">
                Do I need AI features to use the platform?
              </h3>
            </div>
            <p className="text-gray-600 ml-8">
              Not at all! AI features are completely optional helpers that can save you time. All core 
              auction and store functionality works perfectly without AI. You can write your own descriptions, 
              set your own prices, and create successful listings manually.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-gray-600 mb-6">
          Start listing and selling today. You only pay when you make a sale.
        </p>
        <Link
          to="/create-listing"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-purple-600 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all"
        >
          Create Your First Listing
          <FiZap className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
