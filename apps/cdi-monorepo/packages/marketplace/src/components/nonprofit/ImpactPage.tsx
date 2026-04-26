import React from 'react';
import { TrendingUp, Users, Home, Briefcase, Heart, Award } from 'lucide-react';

export default function ImpactPage() {
  const stats = [
    { icon: Users, label: 'Community Members Served', value: '500+', color: 'sky' },
    { icon: Briefcase, label: 'Jobs Placed', value: '150+', color: 'emerald' },
    { icon: Home, label: 'Housing Placements', value: '75+', color: 'indigo' },
    { icon: Heart, label: 'Marketplace Transactions', value: '1,000+', color: 'rose' }
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
    <div className="min-h-screen text-slate-100">
      {/* Hero Section */}
      <div className="market-hero relative min-h-[500px] overflow-hidden text-white">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1531545514256-b1400bc00f31?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80")'
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-slate-950/72" />
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center min-h-[500px]">
          <div className="text-center w-full">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-2xl shadow-indigo-950/50">
              <TrendingUp className="h-10 w-10" />
            </div>
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg">Our Impact</h1>
            <p className="text-2xl text-slate-200 max-w-3xl mx-auto drop-shadow-md">
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
              sky: 'bg-sky-500/15 text-sky-300',
              emerald: 'bg-emerald-500/15 text-emerald-300',
              indigo: 'bg-indigo-500/15 text-indigo-300',
              rose: 'bg-rose-500/15 text-rose-300'
            };
            
            return (
              <div key={index} className="market-panel p-8 text-center">
                <div className={`w-16 h-16 ${colorClasses[stat.color as keyof typeof colorClasses]} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="mb-2 text-4xl font-bold text-white">{stat.value}</div>
                <div className="font-medium text-slate-400">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Success Stories */}
        <div className="mb-20">
          <h2 className="mb-4 text-center text-3xl font-bold text-white">Success Stories</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-slate-400">
            Real stories from community members whose lives have been transformed through our programs
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="market-panel p-8">
                <div className="text-6xl mb-4">{testimonial.image}</div>
                <p className="mb-6 italic text-slate-300">"{testimonial.quote}"</p>
                <div className="border-t border-white/10 pt-4">
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-slate-400">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-20">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">Our Journey</h2>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 hidden h-full w-px -translate-x-1/2 transform bg-indigo-300/20 md:block"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <div className="market-panel inline-block p-6 text-left">
                      <div className="mb-2 text-lg font-bold text-indigo-300">{milestone.year}</div>
                      <h3 className="mb-2 text-xl font-bold text-white">{milestone.title}</h3>
                      <p className="text-slate-400">{milestone.description}</p>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="hidden md:block relative z-10">
                    <div className="h-6 w-6 rounded-full border-4 border-slate-950 bg-indigo-400 shadow-lg shadow-indigo-950/50"></div>
                  </div>
                  
                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Program Impact Details */}
        <div className="mb-20">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">Program Highlights</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-sky-500/20 p-3 text-sky-300">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">Job Training Success</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Program Completion Rate</span>
                  <span className="font-bold text-sky-300">85%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Job Placement Rate</span>
                  <span className="font-bold text-sky-300">78%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Average Wage Increase</span>
                  <span className="font-bold text-sky-300">$4.50/hr</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-emerald-500/20 p-3 text-emerald-300">
                  <Home className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">Housing Impact</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Families Housed</span>
                  <span className="font-bold text-emerald-300">75+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Emergency Assistance Provided</span>
                  <span className="font-bold text-emerald-300">$45,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Housing Stability Rate</span>
                  <span className="font-bold text-emerald-300">92%</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-indigo-500/20 p-3 text-indigo-300">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">Marketplace Growth</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Active Users</span>
                  <span className="font-bold text-indigo-300">300+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Total Transactions</span>
                  <span className="font-bold text-indigo-300">1,000+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Revenue to Programs</span>
                  <span className="font-bold text-indigo-300">$12,000</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-cyan-500/20 p-3 text-cyan-300">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">Community Engagement</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Workshops Held</span>
                  <span className="font-bold text-cyan-300">50+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Volunteer Hours</span>
                  <span className="font-bold text-cyan-300">2,000+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Partner Organizations</span>
                  <span className="font-bold text-cyan-300">15</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="market-hero p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Be Part of Our Impact</h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-slate-200">
            Your support helps us continue creating opportunities and changing lives in the Dayton community
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="/donate" 
              className="market-button-primary px-8 py-3"
            >
              Donate Now
            </a>
            <a 
              href="/programs" 
              className="market-button-secondary px-8 py-3"
            >
              Learn About Programs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
