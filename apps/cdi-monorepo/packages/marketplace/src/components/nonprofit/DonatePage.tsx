import React, { useState } from 'react';
import { Heart, CreditCard, DollarSign, Users, Building2, Award } from 'lucide-react';

export default function DonatePage() {
  const [amount, setAmount] = useState<number | ''>('');
  const [customAmount, setCustomAmount] = useState(false);
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('once');

  const presetAmounts = [25, 50, 100, 250, 500];

  const handleDonate = () => {
    // TODO: Integrate with Stripe Checkout for donations
    alert(
      `Payment integration coming soon!\n\n` +
      `For now, please contact us directly to make a donation of $${amount}.\n\n` +
      `We're working on integrating Stripe for secure online donations.`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative min-h-[500px] bg-gradient-to-r from-green-600/90 to-green-800/90 text-white">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")'
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/85 to-green-800/85" />
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center min-h-[500px]">
          <div className="text-center w-full">
            <Heart className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" />
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg">Support Our Mission</h1>
            <p className="text-2xl text-green-100 max-w-3xl mx-auto drop-shadow-md">
              Your donation helps us create economic opportunities and build stronger communities
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Donation Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Make a Donation</h2>
              
              {/* Frequency Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Donation Frequency
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFrequency('once')}
                    className={`p-4 rounded-lg border-2 font-semibold transition ${
                      frequency === 'once'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    One-Time Gift
                  </button>
                  <button
                    onClick={() => setFrequency('monthly')}
                    className={`p-4 rounded-lg border-2 font-semibold transition ${
                      frequency === 'monthly'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Monthly Donation
                  </button>
                </div>
              </div>

              {/* Amount Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Donation Amount
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setAmount(preset);
                        setCustomAmount(false);
                      }}
                      className={`p-4 rounded-lg border-2 font-semibold transition ${
                        amount === preset && !customAmount
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
                
                {/* Custom Amount */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCustomAmount(true);
                      setAmount('');
                    }}
                    className={`px-4 py-2 rounded-lg border-2 font-semibold transition ${
                      customAmount
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Custom Amount
                  </button>
                  {customAmount && (
                    <div className="flex-1 relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                        className="w-full pl-8 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                        placeholder="Enter amount"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Impact Preview */}
              {amount && (
                <div className="mb-8 p-6 bg-green-50 rounded-xl border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3">Your Impact</h3>
                  <p className="text-green-800">
                    {frequency === 'monthly' ? (
                      <>
                        Your monthly donation of <strong>${amount}</strong> will provide{' '}
                        <strong>${amount * 12}</strong> annually to support our programs.
                      </>
                    ) : (
                      <>
                        Your donation of <strong>${amount}</strong> will directly support our mission 
                        to create economic opportunities and strengthen our community.
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Donate Button */}
              <button
                onClick={handleDonate}
                disabled={!amount}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                {frequency === 'monthly' ? 'Set Up Monthly Donation' : 'Donate Now'}
              </button>

              <p className="text-sm text-gray-600 mt-4 text-center">
                Secure payment powered by Stripe • 
                <strong> Constructive Designs Inc. is a 501(c)(3) nonprofit organization.</strong>
                <br />
                <strong>EIN: 86-3183952</strong> • Your donation is tax-deductible to the extent allowed by law.
              </p>
            </div>

            {/* Other Ways to Give */}
            <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Other Ways to Give</h3>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Mail a Check</h4>
                  <p className="text-gray-700 text-sm">
                    Make checks payable to "Constructive Designs Inc." and mail to:<br />
                    <strong>Constructive Designs Inc.</strong><br />
                    Dayton, OH 45402
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Donate Stock or Securities</h4>
                  <p className="text-gray-700 text-sm">
                    For information about donating stock, bonds, or other securities, please{' '}
                    <a href="/contact" className="text-green-600 hover:underline">contact us</a>.
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Corporate Matching Gifts</h4>
                  <p className="text-gray-700 text-sm">
                    Many employers match charitable donations. Check if your company has a matching 
                    gift program to double your impact!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Impact Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Where Your Money Goes</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Community Marketplace</h4>
                    <p className="text-sm text-gray-600">
                      Platform development and support for buyers and sellers
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Job Training</h4>
                    <p className="text-sm text-gray-600">
                      Skills workshops, resume help, and job placement
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Heart className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Housing Support</h4>
                    <p className="text-sm text-gray-600">
                      Rental assistance and housing navigation services
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Community Programs</h4>
                    <p className="text-sm text-gray-600">
                      Events, workshops, and resources for the community
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                <div className="text-center mb-4">
                  <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <h4 className="font-bold text-gray-900">Tax Deductible</h4>
                </div>
                <p className="text-sm text-gray-700 text-center">
                  <strong>EIN:</strong> 86-3183952<br />
                  All donations are tax-deductible to the extent allowed by law.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
