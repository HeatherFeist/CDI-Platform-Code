import React from 'react';
import { Building2, Award, Heart, Users, Package, ShoppingCart } from 'lucide-react';

export default function ProgramsPage() {
  return (
    <div className="min-h-screen text-slate-100">
      {/* Hero Section */}
      <div className="market-hero relative min-h-[500px] overflow-hidden text-white">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1556761175-4b46a572b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80")'
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-slate-950/72" />
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center min-h-[500px]">
          <div className="text-center w-full">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-2xl shadow-indigo-950/50">
              <Package className="h-10 w-10" />
            </div>
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg">Our Programs</h1>
            <p className="text-2xl text-slate-200 max-w-3xl mx-auto drop-shadow-md">
              Creating pathways to economic empowerment through innovative community programs
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Programs Grid */}
        <div className="space-y-16">
          {/* Community Marketplace */}
          <div className="market-panel overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-12 bg-slate-950/25">
                <div className="flex items-center gap-4 mb-6">
                  <div className="rounded-xl bg-cyan-500/15 p-4 text-cyan-300">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Community Marketplace</h2>
                </div>
                <p className="text-lg text-slate-300 mb-6">
                  Our flagship online platform connects buyers and sellers in the Dayton area, providing 
                  a safe, trusted marketplace for auctions and direct sales. Every transaction supports 
                  our nonprofit mission.
                </p>
                <div className="space-y-4 mb-8">
                  <h3 className="font-semibold text-white">Features:</h3>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start">
                      <span className="mr-2 text-cyan-300">✓</span>
                      <span>Auction-style bidding and buy-now options</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-cyan-300">✓</span>
                      <span>Multiple delivery methods (pickup, local delivery, shipping)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-cyan-300">✓</span>
                      <span>AI-powered listing tools for better descriptions and pricing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-cyan-300">✓</span>
                      <span>Secure payments through Stripe</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-cyan-300">✓</span>
                      <span>Personal storefronts for sellers</span>
                    </li>
                  </ul>
                </div>
                <a 
                  href="/" 
                  className="market-button-primary inline-block px-6 py-3"
                >
                  Explore Marketplace
                </a>
              </div>
              <div className="border-l border-white/10 bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 p-12 text-white">
                <h3 className="text-2xl font-bold mb-6">How It Works</h3>
                <div className="space-y-6">
                  <div>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-indigo-600 font-bold">1</div>
                    <h4 className="font-semibold mb-2">Create Account</h4>
                    <p className="text-slate-200">Sign up for free and set up your profile</p>
                  </div>
                  <div>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-indigo-600 font-bold">2</div>
                    <h4 className="font-semibold mb-2">List Items or Browse</h4>
                    <p className="text-slate-200">Sellers list items with photos and descriptions. Buyers browse and bid or buy.</p>
                  </div>
                  <div>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-indigo-600 font-bold">3</div>
                    <h4 className="font-semibold mb-2">Choose Delivery</h4>
                    <p className="text-slate-200">Select pickup, local delivery, or shipping options</p>
                  </div>
                  <div>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-indigo-600 font-bold">4</div>
                    <h4 className="font-semibold mb-2">Complete Transaction</h4>
                    <p className="text-slate-200">Secure payment through Stripe. 10% platform fee supports our programs.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Training & Support */}
          <div className="market-panel overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="order-2 border-r border-white/10 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-12 text-white lg:order-1">
                <h3 className="text-2xl font-bold mb-6">Program Benefits</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-lg bg-white p-2 text-emerald-600">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Industry-Relevant Skills</h4>
                      <p className="text-sm text-slate-200">Learn in-demand technical and soft skills from experienced instructors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-lg bg-white p-2 text-emerald-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">One-on-One Mentorship</h4>
                      <p className="text-sm text-slate-200">Personalized guidance from career coaches and industry mentors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-lg bg-white p-2 text-emerald-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Employer Connections</h4>
                      <p className="text-sm text-slate-200">Direct connections with hiring employers in the Dayton area</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 bg-slate-950/25 p-12 lg:order-2">
                <div className="flex items-center gap-4 mb-6">
                  <div className="rounded-xl bg-emerald-500/15 p-4 text-emerald-300">
                    <Award className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Job Training & Support</h2>
                </div>
                <p className="text-lg text-slate-300 mb-6">
                  Our comprehensive job training program helps community members develop valuable skills, 
                  prepare for employment, and connect with local employers.
                </p>
                <div className="space-y-4 mb-8">
                  <h3 className="font-semibold text-white">What We Offer:</h3>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start">
                      <span className="mr-2 text-emerald-300">✓</span>
                      <span>Technical skills workshops (computers, software, trades)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-emerald-300">✓</span>
                      <span>Resume writing and interview preparation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-emerald-300">✓</span>
                      <span>Professional development and soft skills training</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-emerald-300">✓</span>
                      <span>Job placement assistance and follow-up support</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-emerald-300">✓</span>
                      <span>Ongoing mentorship and career coaching</span>
                    </li>
                  </ul>
                </div>
                <a 
                  href="/contact" 
                  className="market-button-primary inline-block px-6 py-3"
                >
                  Apply for Training
                </a>
              </div>
            </div>
          </div>

          {/* Housing Assistance */}
          <div className="market-panel overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="bg-slate-950/25 p-12">
                <div className="flex items-center gap-4 mb-6">
                  <div className="rounded-xl bg-indigo-500/15 p-4 text-indigo-300">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Housing Assistance</h2>
                </div>
                <p className="text-lg text-slate-300 mb-6">
                  We help individuals and families find and maintain stable housing through navigation 
                  services, emergency assistance, and ongoing support.
                </p>
                <div className="space-y-4 mb-8">
                  <h3 className="font-semibold text-white">Services Include:</h3>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start">
                      <span className="mr-2 text-indigo-300">✓</span>
                      <span>Housing search and placement assistance</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-indigo-300">✓</span>
                      <span>Emergency rental and utility assistance</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-indigo-300">✓</span>
                      <span>Landlord and tenant mediation services</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-indigo-300">✓</span>
                      <span>Financial literacy and budgeting education</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-indigo-300">✓</span>
                      <span>Connections to community resources</span>
                    </li>
                  </ul>
                </div>
                <a 
                  href="/contact" 
                  className="market-button-secondary inline-block px-6 py-3"
                >
                  Get Housing Help
                </a>
              </div>
              <div className="border-l border-white/10 bg-gradient-to-br from-indigo-500/20 to-violet-500/10 p-12 text-white">
                <h3 className="text-2xl font-bold mb-6">Who We Serve</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Families in Crisis</h4>
                    <p className="text-slate-200">Facing eviction or homelessness and need immediate assistance</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">First-Time Renters</h4>
                    <p className="text-slate-200">Navigating the rental process for the first time</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Individuals in Transition</h4>
                    <p className="text-slate-200">Moving from unstable to stable housing situations</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Low-Income Households</h4>
                    <p className="text-slate-200">Struggling to afford housing in the current market</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Community Programs */}
          <div className="market-panel p-12">
            <div className="text-center mb-12">
              <div className="mb-4 inline-block rounded-xl bg-sky-500/15 p-4 text-sky-300">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Community Programs & Events</h2>
              <p className="text-lg text-slate-300 max-w-3xl mx-auto">
                Building connections and providing resources through workshops, events, and collaborative 
                initiatives that strengthen our community.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="rounded-xl border border-white/10 bg-slate-950/35 p-6 text-center">
                <div className="text-4xl mb-3">📚</div>
                <h3 className="font-bold text-white mb-2">Educational Workshops</h3>
                <p className="text-sm text-slate-300">
                  Regular workshops on financial literacy, digital skills, and career development
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/35 p-6 text-center">
                <div className="text-4xl mb-3">🤝</div>
                <h3 className="font-bold text-white mb-2">Networking Events</h3>
                <p className="text-sm text-slate-300">
                  Community gatherings to build connections and share resources
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/35 p-6 text-center">
                <div className="text-4xl mb-3">📋</div>
                <h3 className="font-bold text-white mb-2">Resource Fairs</h3>
                <p className="text-sm text-slate-300">
                  Information sessions connecting community members with local services
                </p>
              </div>
            </div>

            <div className="text-center">
              <a 
                href="/contact" 
                className="market-button-primary inline-block px-8 py-3"
              >
                View Upcoming Events
              </a>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="market-hero mt-16 p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
            Whether you need services or want to support our mission, we're here to help
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="/contact" 
              className="market-button-primary px-8 py-3"
            >
              Contact Us
            </a>
            <a 
              href="/donate" 
              className="market-button-secondary px-8 py-3"
            >
              Support Our Programs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
