import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-800 bg-slate-950/90 text-slate-300 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-white">Constructive Designs Inc.</h3>
            <p className="text-sm mb-4">
              A 501(c)(3) nonprofit organization dedicated to economic empowerment and community development.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-indigo-300" />
              <span>Building stronger communities</span>
            </div>
          </div>

          {/* Marketplace Links */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Marketplace</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition">Browse Auctions</Link>
              </li>
              <li>
                <Link to="/store/browse" className="hover:text-white transition">Browse Store</Link>
              </li>
              <li>
                <Link to="/listings/create" className="hover:text-white transition">List an Item</Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition">Pricing</Link>
              </li>
            </ul>
          </div>

          {/* Nonprofit Links */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Our Organization</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition">About Us</Link>
              </li>
              <li>
                <Link to="/programs" className="hover:text-white transition">Programs & Services</Link>
              </li>
              <li>
                <Link to="/impact" className="hover:text-white transition">Our Impact</Link>
              </li>
              <li>
                <Link to="/nonprofit-status" className="hover:text-white transition">501(c)(3) Status</Link>
              </li>
              <li>
                <Link to="/donate" className="hover:text-white transition">Donate</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Dayton, OH</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="mailto:info@constructivedesignsinc.org" className="hover:text-white transition">
                  info@constructivedesignsinc.org
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href="tel:+15555551234" className="hover:text-white transition">
                  (555) 555-1234
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-center md:text-left">
              <p>© {currentYear} Constructive Designs Inc. All rights reserved.</p>
              <p className="mt-1 text-slate-500">
                501(c)(3) Nonprofit Organization | EIN: 86-3183952 | Founded 2021
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <span className="text-slate-600">•</span>
              <Link to="/contact" className="hover:text-white transition">Terms of Service</Link>
              <span className="text-slate-600">•</span>
              <a 
                href="https://www.guidestar.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                GuideStar Profile
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
