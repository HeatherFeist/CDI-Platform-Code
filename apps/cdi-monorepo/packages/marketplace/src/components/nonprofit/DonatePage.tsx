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
    <div className="min-h-screen text-slate-100">
      {/* Hero Section */}
      <div className="market-hero relative min-h-[500px] overflow-hidden text-white">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")'
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-slate-950/70" />
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center min-h-[500px]">
          <div className="text-center w-full">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-2xl shadow-indigo-950/50">
              <Heart className="h-10 w-10" />
            </div>
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg">Support Our Mission</h1>
            <p className="text-2xl text-slate-200 max-w-3xl mx-auto drop-shadow-md">
              Your donation helps us create economic opportunities and build stronger communities
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Donation Form */}
          <div className="lg:col-span-2">
            <div className="market-panel p-8">
              <h2 className="text-3xl font-bold text-white mb-6">Make a Donation</h2>
              
              {/* Frequency Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Donation Frequency
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFrequency('once')}
                    className={`p-4 rounded-lg border-2 font-semibold transition ${
                      frequency === 'once'
                        ? 'border-indigo-400/70 bg-indigo-500/15 text-white'
                        : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    One-Time Gift
                  </button>
                  <button
                    onClick={() => setFrequency('monthly')}
                    className={`p-4 rounded-lg border-2 font-semibold transition ${
                      frequency === 'monthly'
                        ? 'border-indigo-400/70 bg-indigo-500/15 text-white'
                        : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    Monthly Donation
                  </button>
                </div>
              </div>

              {/* Amount Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-300 mb-3">
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
                          ? 'border-indigo-400/70 bg-indigo-500/15 text-white'
                          : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-slate-500 hover:text-white'
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
                        ? 'border-indigo-400/70 bg-indigo-500/15 text-white'
                        : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    Custom Amount
                  </button>
                  {customAmount && (
                    <div className="flex-1 relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                        className="market-input w-full pl-8 pr-4 py-2"
                        placeholder="Enter amount"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Impact Preview */}
              {amount && (
                <div className="mb-8 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-6">
                  <h3 className="mb-3 font-semibold text-emerald-300">Your Impact</h3>
                  <p className="text-slate-200">
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
                className="market-button-primary flex w-full items-center justify-center gap-2 py-4 text-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CreditCard className="w-5 h-5" />
                {frequency === 'monthly' ? 'Set Up Monthly Donation' : 'Donate Now'}
              </button>

              <p className="mt-4 text-center text-sm text-slate-400">
                Secure payment powered by Stripe • 
                <strong> Constructive Designs Inc. is a 501(c)(3) nonprofit organization.</strong>
                <br />
                <strong>EIN: 86-3183952</strong> • Your donation is tax-deductible to the extent allowed by law.
              </p>
            </div>

            {/* Other Ways to Give */}
            <div className="market-panel mt-8 p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Other Ways to Give</h3>
              <div className="space-y-4">
                <div className="rounded-lg border border-white/10 bg-slate-950/35 p-4">
                  <h4 className="mb-2 font-semibold text-white">Mail a Check</h4>
                  <p className="text-sm text-slate-300">
                    Make checks payable to "Constructive Designs Inc." and mail to:<br />
                    <strong>Constructive Designs Inc.</strong><br />
                    Dayton, OH 45402
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/35 p-4">
                  <h4 className="mb-2 font-semibold text-white">Donate Stock or Securities</h4>
                  <p className="text-sm text-slate-300">
                    For information about donating stock, bonds, or other securities, please{' '}
                    <a href="/contact" className="text-cyan-300 transition hover:text-cyan-200 hover:underline">contact us</a>.
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-950/35 p-4">
                  <h4 className="mb-2 font-semibold text-white">Corporate Matching Gifts</h4>
                  <p className="text-sm text-slate-300">
                    Many employers match charitable donations. Check if your company has a matching 
                    gift program to double your impact!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Impact Info */}
          <div className="lg:col-span-1">
            <div className="market-panel sticky top-8 p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Where Your Money Goes</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-cyan-500/15 p-3">
                    <Building2 className="h-6 w-6 text-cyan-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Community Marketplace</h4>
                    <p className="text-sm text-slate-400">
                      Platform development and support for buyers and sellers
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-emerald-500/15 p-3">
                    <Award className="h-6 w-6 text-emerald-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Job Training</h4>
                    <p className="text-sm text-slate-400">
                      Skills workshops, resume help, and job placement
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-indigo-500/15 p-3">
                    <Heart className="h-6 w-6 text-indigo-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Housing Support</h4>
                    <p className="text-sm text-slate-400">
                      Rental assistance and housing navigation services
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-sky-500/15 p-3">
                    <Users className="h-6 w-6 text-sky-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Community Programs</h4>
                    <p className="text-sm text-slate-400">
                      Events, workshops, and resources for the community
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-xl border border-white/10 bg-slate-950/45 p-6">
                <div className="text-center mb-4">
                  <DollarSign className="mx-auto mb-2 h-12 w-12 text-indigo-300" />
                  <h4 className="font-bold text-white">Tax Deductible</h4>
                </div>
                <p className="text-center text-sm text-slate-300">
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
