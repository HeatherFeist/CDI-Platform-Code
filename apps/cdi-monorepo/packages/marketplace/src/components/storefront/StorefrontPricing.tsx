import { FiCheck, FiX, FiZap, FiTrendingUp, FiAward, FiUsers } from 'react-icons/fi';
import { TIER_FEATURES, SubscriptionTier } from '../../types/storefront';

export function StorefrontPricing() {
  const handleSelectTier = (tier: SubscriptionTier) => {
    // TODO: Implement tier selection/upgrade flow
    if (tier === 'free') {
      alert('You\'re already on the free tier! Start listing to build your business.');
    } else {
      alert(`Upgrading to ${tier} tier - Payment integration coming soon!`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Build Your Brand. Grow Your Business.
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Start free on our marketplace, then upgrade to your own custom domain store when you're ready. 
          <span className="font-semibold text-purple-600"> Pay less, earn more</span> with lower fees as you grow.
        </p>
      </div>

      {/* Nonprofit Callout */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 mb-12">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <FiUsers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              💚 Nonprofit Member? Get Even More!
            </h3>
            <p className="text-gray-700 mb-3">
              If you qualify for our nonprofit program, you get a <strong>FREE Google Site</strong>, 
              complete training, mentorship, and reduced marketplace fees (5% instead of 10%) on your first $1,000 in sales.
            </p>
            <a 
              href="/nonprofit/apply" 
              className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Learn About Nonprofit Membership
            </a>
            <p className="text-sm text-gray-600 mt-2">
              Open to individuals below 200% poverty line, unemployed, single parents, veterans, or re-entry participants.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* FREE TIER */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6 flex flex-col">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-2xl font-bold text-gray-900">Starter</h3>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-600">/month</span>
            </div>
            <p className="text-gray-600">
              Perfect for testing the waters and learning the basics
            </p>
          </div>

          <div className="flex-1 mb-6">
            <div className="space-y-3">
              {TIER_FEATURES.free.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-start gap-2">
                  <FiX className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500">No custom domain</span>
                </div>
                <div className="flex items-start gap-2">
                  <FiX className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500">No custom branding</span>
                </div>
                <div className="flex items-start gap-2">
                  <FiX className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500">No blog or pages</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="text-sm font-semibold text-orange-900 mb-1">Marketplace Fee</div>
              <div className="text-2xl font-bold text-orange-600">10%</div>
              <div className="text-xs text-orange-700 mt-1">
                On $1,000 sales = $100 in fees
              </div>
            </div>
            
            <button
              onClick={() => handleSelectTier('free')}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Current Plan
            </button>
          </div>
        </div>

        {/* PRO TIER */}
        <div className="bg-white rounded-lg shadow-2xl border-2 border-purple-500 p-6 flex flex-col relative">
          {/* Popular Badge */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-1 rounded-full text-sm font-semibold">
              ⭐ MOST POPULAR
            </div>
          </div>

          <div className="mb-6 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-2xl font-bold text-gray-900">Professional</h3>
              <FiTrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                $39
              </span>
              <span className="text-gray-600">/month</span>
              <div className="text-sm text-gray-600 mt-1">
                or $390/year <span className="text-green-600 font-semibold">(save 17%)</span>
              </div>
            </div>
            <p className="text-gray-600">
              Build your brand with a custom domain and professional tools
            </p>
          </div>

          <div className="flex-1 mb-6">
            <div className="space-y-3">
              {TIER_FEATURES.pro.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <FiCheck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-3">
              <div className="text-sm font-semibold text-purple-900 mb-1">Marketplace Fee</div>
              <div className="text-2xl font-bold text-purple-600">5%</div>
              <div className="text-xs text-purple-700 mt-1">
                On $2,000 sales = $100 fee + $39 = $139
              </div>
              <div className="text-xs text-green-600 font-semibold mt-1">
                vs $200 on free tier = Save $61/month!
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
              <div className="text-xs font-semibold text-yellow-900 mb-1">💡 DOMAIN INCLUDED</div>
              <div className="text-xs text-yellow-800">
                We'll help you get YourName.shop for just $15-20/year through our partners (GoDaddy, Namecheap)
              </div>
            </div>
            
            <button
              onClick={() => handleSelectTier('pro')}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-600 transition-all shadow-lg"
            >
              Upgrade to Professional
            </button>
          </div>
        </div>

        {/* ENTERPRISE TIER */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6 flex flex-col">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-2xl font-bold text-gray-900">Business</h3>
              <FiAward className="w-6 h-6 text-blue-600" />
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">$99</span>
              <span className="text-gray-600">/month</span>
              <div className="text-sm text-gray-600 mt-1">
                or $990/year <span className="text-green-600 font-semibold">(save 17%)</span>
              </div>
            </div>
            <p className="text-gray-600">
              Scale your business with advanced tools and multiple brands
            </p>
          </div>

          <div className="flex-1 mb-6">
            <div className="space-y-3">
              {TIER_FEATURES.enterprise.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <FiCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm font-semibold text-blue-900 mb-1">Marketplace Fee</div>
              <div className="text-2xl font-bold text-blue-600">3%</div>
              <div className="text-xs text-blue-700 mt-1">
                On $5,000 sales = $150 fee + $99 = $249
              </div>
              <div className="text-xs text-green-600 font-semibold mt-1">
                vs $500 on free tier = Save $251/month!
              </div>
            </div>
            
            <button
              onClick={() => handleSelectTier('enterprise')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Upgrade to Business
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Detailed Comparison
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 text-gray-900 font-semibold">Feature</th>
                <th className="text-center py-3 px-4 text-gray-900 font-semibold">Starter</th>
                <th className="text-center py-3 px-4 text-purple-600 font-semibold">Professional</th>
                <th className="text-center py-3 px-4 text-gray-900 font-semibold">Business</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-3 px-4 text-gray-700">Marketplace Listings</td>
                <td className="text-center py-3 px-4"><FiCheck className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="text-center py-3 px-4"><FiCheck className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="text-center py-3 px-4"><FiCheck className="w-5 h-5 text-green-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">All 4 Delivery Options</td>
                <td className="text-center py-3 px-4"><FiCheck className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="text-center py-3 px-4"><FiCheck className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="text-center py-3 px-4"><FiCheck className="w-5 h-5 text-green-600 mx-auto" /></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-3 px-4 text-gray-700 font-semibold">Marketplace Fee</td>
                <td className="text-center py-3 px-4 text-orange-600 font-bold">10%</td>
                <td className="text-center py-3 px-4 text-purple-600 font-bold">5%</td>
                <td className="text-center py-3 px-4 text-blue-600 font-bold">3%</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Custom Domain Store</td>
                <td className="text-center py-3 px-4"><FiX className="w-5 h-5 text-gray-300 mx-auto" /></td>
                <td className="text-center py-3 px-4"><span className="text-purple-600 font-semibold">1 domain</span></td>
                <td className="text-center py-3 px-4"><span className="text-blue-600 font-semibold">3 domains</span></td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Custom Branding</td>
                <td className="text-center py-3 px-4"><FiX className="w-5 h-5 text-gray-300 mx-auto" /></td>
                <td className="text-center py-3 px-4"><FiCheck className="w-5 h-5 text-green-600 mx-auto" /></td>
                <td className="text-center py-3 px-4"><FiCheck className="w-5 h-5 text-green-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Custom Pages</td>
                <td className="text-center py-3 px-4 text-gray-400">0</td>
                <td className="text-center py-3 px-4 text-purple-600 font-semibold">20</td>
                <td className="text-center py-3 px-4 text-blue-600 font-semibold">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Blog Posts</td>
                <td className="text-center py-3 px-4 text-gray-400">0</td>
                <td className="text-center py-3 px-4 text-purple-600 font-semibold">10/month</td>
                <td className="text-center py-3 px-4 text-blue-600 font-semibold">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Discount Codes</td>
                <td className="text-center py-3 px-4"><FiX className="w-5 h-5 text-gray-300 mx-auto" /></td>
                <td className="text-center py-3 px-4 text-purple-600 font-semibold">10 codes</td>
                <td className="text-center py-3 px-4 text-blue-600 font-semibold">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Email Marketing</td>
                <td className="text-center py-3 px-4"><FiX className="w-5 h-5 text-gray-300 mx-auto" /></td>
                <td className="text-center py-3 px-4"><FiX className="w-5 h-5 text-gray-300 mx-auto" /></td>
                <td className="text-center py-3 px-4 text-blue-600 font-semibold">500 subscribers</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">API Access</td>
                <td className="text-center py-3 px-4"><FiX className="w-5 h-5 text-gray-300 mx-auto" /></td>
                <td className="text-center py-3 px-4"><FiX className="w-5 h-5 text-gray-300 mx-auto" /></td>
                <td className="text-center py-3 px-4"><FiCheck className="w-5 h-5 text-green-600 mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-gray-700">Support</td>
                <td className="text-center py-3 px-4 text-gray-600">Community</td>
                <td className="text-center py-3 px-4 text-purple-600 font-semibold">Priority (24hr)</td>
                <td className="text-center py-3 px-4 text-blue-600 font-semibold">Phone + Calls</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ROI Calculator */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          📊 See Your Potential Savings
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-center mb-4">
              <div className="text-gray-600 mb-2">If you sell</div>
              <div className="text-3xl font-bold text-gray-900">$1,000/mo</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Starter (10%):</span>
                <span className="font-semibold">$100/mo</span>
              </div>
              <div className="flex justify-between text-purple-600">
                <span>Pro (5% + $39):</span>
                <span className="font-semibold">$89/mo</span>
              </div>
              <div className="pt-2 border-t flex justify-between text-green-600 font-bold">
                <span>You save:</span>
                <span>$11/mo</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border-2 border-purple-300">
            <div className="text-center mb-4">
              <div className="text-gray-600 mb-2">If you sell</div>
              <div className="text-3xl font-bold text-purple-600">$2,500/mo</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Starter (10%):</span>
                <span className="font-semibold">$250/mo</span>
              </div>
              <div className="flex justify-between text-purple-600">
                <span>Pro (5% + $39):</span>
                <span className="font-semibold">$164/mo</span>
              </div>
              <div className="pt-2 border-t flex justify-between text-green-600 font-bold">
                <span>You save:</span>
                <span>$86/mo 🎉</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-center mb-4">
              <div className="text-gray-600 mb-2">If you sell</div>
              <div className="text-3xl font-bold text-blue-600">$5,000/mo</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Starter (10%):</span>
                <span className="font-semibold">$500/mo</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Business (3% + $99):</span>
                <span className="font-semibold">$249/mo</span>
              </div>
              <div className="pt-2 border-t flex justify-between text-green-600 font-bold">
                <span>You save:</span>
                <span>$251/mo 🚀</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-600 mt-6">
          💡 <strong>The more you sell, the more you save!</strong> Plus you get professional branding and tools to sell even more.
        </p>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Frequently Asked Questions
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Can I start free and upgrade later?</h3>
            <p className="text-gray-600 text-sm">
              Absolutely! Start on the free tier, and upgrade anytime. Your listings will automatically sync to your new custom store.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What if I already own a domain?</h3>
            <p className="text-gray-600 text-sm">
              Perfect! We'll help you connect your existing domain (like HeatherFeist.shop) to your store. Just update your DNS settings with our guidance.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
            <p className="text-gray-600 text-sm">
              Yes, cancel anytime. Your custom store will remain viewable for 30 days, and your marketplace listings stay active forever (free tier).
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Do I need technical skills?</h3>
            <p className="text-gray-600 text-sm">
              Not at all! Our store builder is drag-and-drop easy. We provide templates, tutorials, and support every step of the way.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What's included in "custom branding"?</h3>
            <p className="text-gray-600 text-sm">
              Upload your logo, choose your colors and fonts, customize your homepage layout, add your story, and make it uniquely yours!
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">How do I qualify for nonprofit membership?</h3>
            <p className="text-gray-600 text-sm">
              Income below 200% poverty line, unemployed, single parent, veteran, or re-entry participant. Apply at /nonprofit/apply for free training + reduced fees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
