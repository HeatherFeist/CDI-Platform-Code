import React from 'react';
import { Building2, Award, Heart, Users, Package, ShoppingCart } from 'lucide-react';

export default function ProgramsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative min-h-[500px] bg-gradient-to-r from-orange-600/90 to-orange-800/90 text-white">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1556761175-4b46a572b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80")'
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/85 to-orange-800/85" />
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center min-h-[500px]">
          <div className="text-center w-full">
            <Package className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" />
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg">Our Programs</h1>
            <p className="text-2xl text-orange-100 max-w-3xl mx-auto drop-shadow-md">
              Creating pathways to economic empowerment through innovative community programs
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Programs Grid */}
        <div className="space-y-16">
          {/* Community Marketplace */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-12 bg-gradient-to-br from-blue-50 to-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-blue-600 text-white p-4 rounded-xl">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Community Marketplace</h2>
                </div>
                <p className="text-lg text-gray-700 mb-6">
                  Our flagship online platform connects buyers and sellers in the Dayton area, providing 
                  a safe, trusted marketplace for auctions and direct sales. Every transaction supports 
                  our nonprofit mission.
                </p>
                <div className="space-y-4 mb-8">
                  <h3 className="font-semibold text-gray-900">Features:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      <span>Auction-style bidding and buy-now options</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      <span>Multiple delivery methods (pickup, local delivery, shipping)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      <span>AI-powered listing tools for better descriptions and pricing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      <span>Secure payments through Stripe</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      <span>Personal storefronts for sellers</span>
                    </li>
                  </ul>
                </div>
                <a 
                  href="/" 
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Explore Marketplace
                </a>
              </div>
              <div className="p-12 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                <h3 className="text-2xl font-bold mb-6">How It Works</h3>
                <div className="space-y-6">
                  <div>
                    <div className="bg-white text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2">1</div>
                    <h4 className="font-semibold mb-2">Create Account</h4>
                    <p className="text-blue-100">Sign up for free and set up your profile</p>
                  </div>
                  <div>
                    <div className="bg-white text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2">2</div>
                    <h4 className="font-semibold mb-2">List Items or Browse</h4>
                    <p className="text-blue-100">Sellers list items with photos and descriptions. Buyers browse and bid or buy.</p>
                  </div>
                  <div>
                    <div className="bg-white text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2">3</div>
                    <h4 className="font-semibold mb-2">Choose Delivery</h4>
                    <p className="text-blue-100">Select pickup, local delivery, or shipping options</p>
                  </div>
                  <div>
                    <div className="bg-white text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2">4</div>
                    <h4 className="font-semibold mb-2">Complete Transaction</h4>
                    <p className="text-blue-100">Secure payment through Stripe. 10% platform fee supports our programs.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Training & Support */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="order-2 lg:order-1 p-12 bg-gradient-to-br from-green-600 to-green-800 text-white">
                <h3 className="text-2xl font-bold mb-6">Program Benefits</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-white text-green-600 p-2 rounded-lg mt-1">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Industry-Relevant Skills</h4>
                      <p className="text-green-100 text-sm">Learn in-demand technical and soft skills from experienced instructors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-white text-green-600 p-2 rounded-lg mt-1">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">One-on-One Mentorship</h4>
                      <p className="text-green-100 text-sm">Personalized guidance from career coaches and industry mentors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-white text-green-600 p-2 rounded-lg mt-1">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Employer Connections</h4>
                      <p className="text-green-100 text-sm">Direct connections with hiring employers in the Dayton area</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 p-12 bg-gradient-to-br from-green-50 to-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-green-600 text-white p-4 rounded-xl">
                    <Award className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Job Training & Support</h2>
                </div>
                <p className="text-lg text-gray-700 mb-6">
                  Our comprehensive job training program helps community members develop valuable skills, 
                  prepare for employment, and connect with local employers.
                </p>
                <div className="space-y-4 mb-8">
                  <h3 className="font-semibold text-gray-900">What We Offer:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Technical skills workshops (computers, software, trades)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Resume writing and interview preparation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Professional development and soft skills training</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Job placement assistance and follow-up support</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Ongoing mentorship and career coaching</span>
                    </li>
                  </ul>
                </div>
                <a 
                  href="/contact" 
                  className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Apply for Training
                </a>
              </div>
            </div>
          </div>

          {/* Housing Assistance */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-12 bg-gradient-to-br from-purple-50 to-white">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-purple-600 text-white p-4 rounded-xl">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Housing Assistance</h2>
                </div>
                <p className="text-lg text-gray-700 mb-6">
                  We help individuals and families find and maintain stable housing through navigation 
                  services, emergency assistance, and ongoing support.
                </p>
                <div className="space-y-4 mb-8">
                  <h3 className="font-semibold text-gray-900">Services Include:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-purple-600 mr-2">✓</span>
                      <span>Housing search and placement assistance</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-600 mr-2">✓</span>
                      <span>Emergency rental and utility assistance</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-600 mr-2">✓</span>
                      <span>Landlord and tenant mediation services</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-600 mr-2">✓</span>
                      <span>Financial literacy and budgeting education</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-600 mr-2">✓</span>
                      <span>Connections to community resources</span>
                    </li>
                  </ul>
                </div>
                <a 
                  href="/contact" 
                  className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Get Housing Help
                </a>
              </div>
              <div className="p-12 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
                <h3 className="text-2xl font-bold mb-6">Who We Serve</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Families in Crisis</h4>
                    <p className="text-purple-100">Facing eviction or homelessness and need immediate assistance</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">First-Time Renters</h4>
                    <p className="text-purple-100">Navigating the rental process for the first time</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Individuals in Transition</h4>
                    <p className="text-purple-100">Moving from unstable to stable housing situations</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Low-Income Households</h4>
                    <p className="text-purple-100">Struggling to afford housing in the current market</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Community Programs */}
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="text-center mb-12">
              <div className="bg-orange-600 text-white p-4 rounded-xl inline-block mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Community Programs & Events</h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                Building connections and providing resources through workshops, events, and collaborative 
                initiatives that strengthen our community.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center p-6 bg-orange-50 rounded-xl">
                <div className="text-4xl mb-3">📚</div>
                <h3 className="font-bold text-gray-900 mb-2">Educational Workshops</h3>
                <p className="text-gray-700 text-sm">
                  Regular workshops on financial literacy, digital skills, and career development
                </p>
              </div>
              <div className="text-center p-6 bg-orange-50 rounded-xl">
                <div className="text-4xl mb-3">🤝</div>
                <h3 className="font-bold text-gray-900 mb-2">Networking Events</h3>
                <p className="text-gray-700 text-sm">
                  Community gatherings to build connections and share resources
                </p>
              </div>
              <div className="text-center p-6 bg-orange-50 rounded-xl">
                <div className="text-4xl mb-3">📋</div>
                <h3 className="font-bold text-gray-900 mb-2">Resource Fairs</h3>
                <p className="text-gray-700 text-sm">
                  Information sessions connecting community members with local services
                </p>
              </div>
            </div>

            <div className="text-center">
              <a 
                href="/contact" 
                className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
              >
                View Upcoming Events
              </a>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-orange-600 to-orange-800 text-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Whether you need services or want to support our mission, we're here to help
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="/contact" 
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition"
            >
              Contact Us
            </a>
            <a 
              href="/donate" 
              className="bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition border-2 border-white"
            >
              Support Our Programs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
