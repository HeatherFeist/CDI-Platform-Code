import React from 'react';
import { Building2, Heart, Users, Target, Award, Shield } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative min-h-[500px] bg-gradient-to-r from-blue-600/90 to-blue-800/90 text-white">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80")'
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-blue-800/80" />
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center min-h-[500px]">
          <div className="text-center w-full">
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg">About Constructive Designs Inc.</h1>
            <p className="text-2xl text-blue-100 max-w-3xl mx-auto drop-shadow-md">
              Building stronger communities through economic empowerment and innovative solutions
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-700 mb-4">
              Constructive Designs Inc. is a 501(c)(3) nonprofit organization dedicated to creating 
              pathways to economic stability and community development. We believe that everyone 
              deserves access to opportunities that foster independence, dignity, and prosperity.
            </p>
            <p className="text-lg text-gray-700">
              Through innovative programs like our Community Marketplace, job training initiatives, 
              and housing support services, we're building a stronger, more connected community where 
              everyone can thrive.
            </p>
          </div>
          <div className="bg-blue-50 p-8 rounded-xl">
            <div className="flex items-center mb-4">
              <Shield className="w-12 h-12 text-blue-600 mr-4" />
              <div>
                <h3 className="text-xl font-bold text-gray-900">501(c)(3) Nonprofit</h3>
                <p className="text-gray-600">Tax-Exempt Status</p>
              </div>
            </div>
            <div className="border-t border-blue-200 pt-4 mt-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>EIN:</strong> 86-3183952
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Founded:</strong> April 4, 2021
              </p>
              <p className="text-sm text-gray-700">
                <strong>Location:</strong> Dayton, Ohio
              </p>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <Heart className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community First</h3>
              <p className="text-gray-700">
                We prioritize the needs of our community, creating programs that directly address 
                local challenges and opportunities.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <Target className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sustainable Impact</h3>
              <p className="text-gray-700">
                Our programs are designed for long-term success, creating lasting change rather 
                than temporary solutions.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <Users className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Dignity & Respect</h3>
              <p className="text-gray-700">
                We treat every individual with dignity, recognizing their inherent worth and 
                potential to contribute to our community.
              </p>
            </div>
          </div>
        </div>

        {/* What We Do */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">What We Do</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl border border-blue-100">
              <Building2 className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Community Marketplace</h3>
              <p className="text-gray-700 mb-4">
                Our flagship platform connects buyers and sellers in the Dayton area, providing 
                a safe, trusted marketplace for auctions and direct sales. Revenue supports our 
                nonprofit programs.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Secure auction and buy-now options
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  Multiple delivery methods for convenience
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  AI-powered tools for better listings
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  10% platform fee funds our mission
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-xl border border-green-100">
              <Award className="w-10 h-10 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Job Training & Support</h3>
              <p className="text-gray-700 mb-4">
                We provide skills training, job placement assistance, and ongoing support to help 
                community members achieve economic independence.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Technical skills workshops
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Resume and interview preparation
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Connections with local employers
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Ongoing mentorship programs
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-xl border border-purple-100">
              <Heart className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Housing Assistance</h3>
              <p className="text-gray-700 mb-4">
                Helping individuals and families find and maintain stable housing through 
                direct assistance, navigation services, and advocacy.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  Housing search and placement
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  Emergency rental assistance
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  Landlord mediation services
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  Financial literacy education
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-xl border border-orange-100">
              <Users className="w-10 h-10 text-orange-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Community Programs</h3>
              <p className="text-gray-700 mb-4">
                Building connections and providing resources through events, workshops, and 
                collaborative initiatives that strengthen our community.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  Educational workshops and seminars
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  Community networking events
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  Resource fairs and information sessions
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 mr-2">•</span>
                  Partnership with local organizations
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Get Involved CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Whether through donations, volunteering, or using our marketplace, you can help build 
            a stronger community.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="/donate" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Make a Donation
            </a>
            <a 
              href="/programs" 
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition border-2 border-white"
            >
              Explore Programs
            </a>
            <a 
              href="/contact" 
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition border-2 border-white"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
