import React from 'react';
import { TrendingUp, Users, Home, Briefcase, Heart, Award } from 'lucide-react';

export default function ImpactPage() {
  const stats = [
    { icon: Users, label: 'Community Members Served', value: '500+', color: 'blue' },
    { icon: Briefcase, label: 'Jobs Placed', value: '150+', color: 'green' },
    { icon: Home, label: 'Housing Placements', value: '75+', color: 'purple' },
    { icon: Heart, label: 'Marketplace Transactions', value: '1,000+', color: 'red' }
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'Job Training Program Graduate',
      quote: 'The job training program gave me the skills and confidence I needed to land my dream job. The mentorship and support were invaluable.',
      image: '👩‍💼'
    },
    {
      name: 'James T.',
      role: 'Marketplace Seller',
      quote: 'The marketplace has been a game-changer for my small business. The platform is easy to use, and the community is incredibly supportive.',
      image: '👨‍💻'
    },
    {
      name: 'Maria G.',
      role: 'Housing Assistance Recipient',
      quote: 'When I was struggling to find housing, Constructive Designs helped me navigate the process and connected me with resources. I finally have a stable home for my family.',
      image: '👩‍👧‍👦'
    }
  ];

  const milestones = [
    { year: '2021', title: 'Organization Founded', description: 'Established as a 501(c)(3) nonprofit in Dayton, OH on April 4, 2021' },
    { year: '2022', title: 'First Programs Launch', description: 'Began providing job training and housing assistance services' },
    { year: '2023', title: 'Community Expansion', description: 'Expanded services and built partnerships with local organizations' },
    { year: '2024', title: 'Marketplace Development', description: 'Developed online marketplace platform to fund our mission' },
    { year: '2025', title: 'Platform Launch', description: 'Launched Constructive Designs Marketplace serving the Dayton community' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative min-h-[500px] bg-gradient-to-r from-purple-600/90 to-purple-800/90 text-white">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1531545514256-b1400bc00f31?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80")'
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/85 to-purple-800/85" />
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center min-h-[500px]">
          <div className="text-center w-full">
            <TrendingUp className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" />
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg">Our Impact</h1>
            <p className="text-2xl text-purple-100 max-w-3xl mx-auto drop-shadow-md">
              See how we're creating lasting change in the Dayton community
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600',
              green: 'bg-green-100 text-green-600',
              purple: 'bg-purple-100 text-purple-600',
              red: 'bg-red-100 text-red-600'
            };
            
            return (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className={`w-16 h-16 ${colorClasses[stat.color as keyof typeof colorClasses]} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Success Stories */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Success Stories</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Real stories from community members whose lives have been transformed through our programs
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
                <div className="text-6xl mb-4">{testimonial.image}</div>
                <p className="text-gray-700 italic mb-6">"{testimonial.quote}"</p>
                <div className="border-t border-gray-200 pt-4">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Journey</h2>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-purple-200"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <div className="bg-white p-6 rounded-xl shadow-lg inline-block">
                      <div className="text-purple-600 font-bold text-lg mb-2">{milestone.year}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="hidden md:block relative z-10">
                    <div className="w-6 h-6 bg-purple-600 rounded-full border-4 border-white shadow-lg"></div>
                  </div>
                  
                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Program Impact Details */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Program Highlights</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-600 text-white p-3 rounded-lg">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Job Training Success</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Program Completion Rate</span>
                  <span className="font-bold text-blue-600">85%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Job Placement Rate</span>
                  <span className="font-bold text-blue-600">78%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Average Wage Increase</span>
                  <span className="font-bold text-blue-600">$4.50/hr</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-xl border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-600 text-white p-3 rounded-lg">
                  <Home className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Housing Impact</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Families Housed</span>
                  <span className="font-bold text-green-600">75+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Emergency Assistance Provided</span>
                  <span className="font-bold text-green-600">$45,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Housing Stability Rate</span>
                  <span className="font-bold text-green-600">92%</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-xl border border-purple-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-600 text-white p-3 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Marketplace Growth</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Active Users</span>
                  <span className="font-bold text-purple-600">300+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Transactions</span>
                  <span className="font-bold text-purple-600">1,000+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Revenue to Programs</span>
                  <span className="font-bold text-purple-600">$12,000</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-xl border border-orange-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-orange-600 text-white p-3 rounded-lg">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Community Engagement</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Workshops Held</span>
                  <span className="font-bold text-orange-600">50+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Volunteer Hours</span>
                  <span className="font-bold text-orange-600">2,000+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Partner Organizations</span>
                  <span className="font-bold text-orange-600">15</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Be Part of Our Impact</h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Your support helps us continue creating opportunities and changing lives in the Dayton community
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="/donate" 
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition"
            >
              Donate Now
            </a>
            <a 
              href="/programs" 
              className="bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-600 transition border-2 border-white"
            >
              Learn About Programs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
