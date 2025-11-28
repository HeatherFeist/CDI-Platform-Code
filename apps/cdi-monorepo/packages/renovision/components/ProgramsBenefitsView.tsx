import React from 'react';

export default function ProgramsBenefitsView() {
    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">Our Programs & Your Benefits</h1>
                <p className="text-lg text-gray-600">
                    When you join our platform, you're not just using software—you're becoming part of a community-driven network 
                    where <strong>everyone benefits</strong>. Your platform fees directly fund programs that can help grow your business.
                </p>
            </div>

            {/* Value Proposition Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg p-8 mb-8 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                    <span className="material-icons text-5xl">network_check</span>
                    <div>
                        <h2 className="text-3xl font-bold">The Constructive Home Reno Network</h2>
                        <p className="text-blue-100 text-lg">Your 5% isn't just a fee—it's an investment in a system designed to benefit YOU</p>
                    </div>
                </div>
                <div className="bg-white/10 rounded-lg p-6 mt-4">
                    <p className="text-lg">
                        Unlike traditional for-profit platforms where fees only benefit 1-2 individuals, the <strong>Constructive Designs Inc.</strong> nonprofit 
                        network ensures <strong>every dollar works to support the entire community</strong>—including your business. The programs your fees 
                        fund can provide you with trained labor, affordable materials, and new customers.
                    </p>
                </div>
            </div>

            {/* Programs Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Earn While You Learn */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-green-200">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-icons text-4xl">school</span>
                            <h3 className="text-2xl font-bold">Earn While You Learn</h3>
                        </div>
                        <p className="text-green-100">Training the next generation of skilled tradespeople</p>
                    </div>
                    <div className="p-6">
                        <div className="mb-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="material-icons text-green-600">lightbulb</span>
                                How It Works:
                            </h4>
                            <p className="text-sm text-gray-700 mb-3">
                                Participants in need of affordable housing are matched with distressed properties. They renovate their future 
                                homes with guidance from professional contractors, learning valuable skills while earning sweat equity.
                            </p>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <span className="material-icons text-sm">thumb_up</span>
                                YOUR BENEFIT:
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>Access to trained labor:</strong> Participants become skilled workers you can hire for future projects</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>Volunteer labor exchange:</strong> Get helping hands on projects in exchange for professional training</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>Build your reputation:</strong> Be recognized as a trainer helping your community</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>Pipeline of workers:</strong> Create relationships with future employees and subcontractors</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Buy1: Give1 Program */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-purple-200">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-icons text-4xl">redeem</span>
                            <h3 className="text-2xl font-bold">Buy1: Give1 Program</h3>
                        </div>
                        <p className="text-purple-100">Purchase materials, help the community, save money</p>
                    </div>
                    <div className="p-6">
                        <div className="mb-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="material-icons text-purple-600">lightbulb</span>
                                How It Works:
                            </h4>
                            <p className="text-sm text-gray-700 mb-3">
                                Buy 2 items for around the same retail price as 1! Because we're tax-exempt, we source products at wholesale 
                                prices. Your second item is donated to community renovation projects, and you get a tax-deductible receipt.
                            </p>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <span className="material-icons text-sm">thumb_up</span>
                                YOUR BENEFIT:
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>Save money on materials:</strong> Get 2 items for the price of 1 through our wholesale sourcing</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>Tax deduction:</strong> Receive receipts for donated materials to reduce your tax burden</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>Marketing advantage:</strong> Promote your community involvement to attract conscious customers</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>Bulk purchasing power:</strong> Access to materials at prices usually reserved for large companies</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Home Reno Program */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-orange-200">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-icons text-4xl">home_repair_service</span>
                            <h3 className="text-2xl font-bold">Home Reno Program</h3>
                        </div>
                        <p className="text-orange-100">Affordable housing through community renovation</p>
                    </div>
                    <div className="p-6">
                        <div className="mb-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="material-icons text-orange-600">lightbulb</span>
                                How It Works:
                            </h4>
                            <p className="text-sm text-gray-700 mb-3">
                                We acquire abandoned and distressed properties in the community, connecting them with participants who 
                                renovate them into livable homes. This revitalizes neighborhoods while creating affordable housing opportunities.
                            </p>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <span className="material-icons text-sm">thumb_up</span>
                                YOUR BENEFIT:
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>New project opportunities:</strong> Be the professional contractor guiding renovations</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>Neighborhood improvement:</strong> Property values increase as distressed homes are renovated</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>Community referrals:</strong> Happy participants become advocates who refer you to neighbors</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>Portfolio building:</strong> Showcase before/after transformations to attract new clients</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Business Management Platform */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-blue-200">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-icons text-4xl">business_center</span>
                            <h3 className="text-2xl font-bold">Business Platform</h3>
                        </div>
                        <p className="text-blue-100">All-in-one management system</p>
                    </div>
                    <div className="p-6">
                        <div className="mb-4">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="material-icons text-blue-600">lightbulb</span>
                                What You Get:
                            </h4>
                            <p className="text-sm text-gray-700 mb-3">
                                Complete business management tools: scheduling, estimates, invoicing, customer management, project tracking, 
                                payments, team collaboration, and AI-powered design tools—all in one place.
                            </p>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <span className="material-icons text-sm">thumb_up</span>
                                YOUR BENEFIT:
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>No monthly fees:</strong> Only pay 5% when you get paid—no subscriptions or hidden costs</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>Save $200+/month:</strong> Replaces multiple tools (CRM, invoicing, scheduling, payments)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>Network effects:</strong> Connect with other contractors, share resources and referrals</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-icons text-xs mt-0.5">check_circle</span>
                                    <span><strong>Your fees fund YOUR benefits:</strong> Access to programs that directly help your business grow</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* The Difference Section */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-lg p-8 mb-8 shadow-xl">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <span className="material-icons text-4xl">compare</span>
                    The Difference: For-Profit vs Our Nonprofit Network
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-red-900/30 border border-red-500 rounded-lg p-6">
                        <h3 className="text-xl font-bold mb-4 text-red-300 flex items-center gap-2">
                            <span className="material-icons">close</span>
                            Traditional For-Profit Platforms
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-xs text-red-400 mt-0.5">remove</span>
                                <span>Your fees benefit 1-2 wealthy individuals or shareholders</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-xs text-red-400 mt-0.5">remove</span>
                                <span>No community programs or reinvestment</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-xs text-red-400 mt-0.5">remove</span>
                                <span>You're just a customer—profits go elsewhere</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-xs text-red-400 mt-0.5">remove</span>
                                <span>No access to trained labor or wholesale materials</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-xs text-red-400 mt-0.5">remove</span>
                                <span>Higher fees with no tangible community benefits</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-green-900/30 border border-green-500 rounded-lg p-6">
                        <h3 className="text-xl font-bold mb-4 text-green-300 flex items-center gap-2">
                            <span className="material-icons">check_circle</span>
                            Our Nonprofit Network
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-xs text-green-400 mt-0.5">add</span>
                                <span><strong>Your fees fund programs that benefit YOU directly</strong></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-xs text-green-400 mt-0.5">add</span>
                                <span><strong>Access to trained labor</strong> from Earn While You Learn program</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-xs text-green-400 mt-0.5">add</span>
                                <span><strong>Wholesale material pricing</strong> through Buy1: Give1 with tax deductions</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-xs text-green-400 mt-0.5">add</span>
                                <span><strong>New project opportunities</strong> from Home Reno properties</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-xs text-green-400 mt-0.5">add</span>
                                <span><strong>Community improvement</strong> increases property values and customer base</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-xs text-green-400 mt-0.5">add</span>
                                <span><strong>Network effects:</strong> Connect with other contractors, share resources</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-icons text-xs text-green-400 mt-0.5">add</span>
                                <span><strong>Lower effective costs:</strong> 5% fee offset by material savings and free labor</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* No Question Where to Go */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-8 shadow-xl">
                <div className="flex items-start gap-4">
                    <span className="material-icons text-6xl">explore</span>
                    <div>
                        <h2 className="text-3xl font-bold mb-4">No Question Where to Go</h2>
                        <p className="text-lg text-indigo-100 mb-4">
                            We're not just another software platform. We're a <strong>complete ecosystem</strong> designed to support every 
                            aspect of your renovation business:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-white/10 rounded-lg p-4">
                                <h3 className="font-bold mb-2">✓ Need software?</h3>
                                <p className="text-indigo-100">Complete business management platform included</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <h3 className="font-bold mb-2">✓ Need materials?</h3>
                                <p className="text-indigo-100">Buy1: Give1 program with wholesale pricing</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <h3 className="font-bold mb-2">✓ Need labor?</h3>
                                <p className="text-indigo-100">Access trained workers from our programs</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <h3 className="font-bold mb-2">✓ Need projects?</h3>
                                <p className="text-indigo-100">Home Reno properties and community referrals</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <h3 className="font-bold mb-2">✓ Need to save money?</h3>
                                <p className="text-indigo-100">No subscriptions, tax deductions, bulk pricing</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <h3 className="font-bold mb-2">✓ Want to give back?</h3>
                                <p className="text-indigo-100">Every transaction improves your community</p>
                            </div>
                        </div>
                        <div className="mt-6 bg-yellow-400 text-gray-900 rounded-lg p-6">
                            <p className="text-lg font-bold">
                                🎯 Same services. Better value. Greater impact. All in one place. 
                                That's why there's no question where to go.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-8">
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8">
                    <h2 className="text-2xl font-bold text-green-900 mb-3">Join the Constructive Home Reno Network Today</h2>
                    <p className="text-green-800 mb-6">
                        Start with a platform that works FOR you, not just for itself. Be part of the <strong>Constructive Designs Inc.</strong> family 
                        where your success is our success, and your community's improvement is everyone's benefit.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a
                            href="/business/payments"
                            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <span className="material-icons">rocket_launch</span>
                            Set Up Payments
                        </a>
                        <a
                            href="/business/schedule"
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <span className="material-icons">event</span>
                            Schedule First Project
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
