import React from 'react';
import { Shield, FileText, CheckCircle, Download, ExternalLink } from 'lucide-react';

export default function NonprofitStatusPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative min-h-[400px] bg-gradient-to-r from-blue-600/90 to-blue-800/90 text-white">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")'
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/85 to-blue-800/85" />
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center min-h-[400px]">
          <div className="text-center w-full">
            <Shield className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
            <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">501(c)(3) Tax-Exempt Status</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto drop-shadow-md">
              Constructive Designs Inc. is a registered nonprofit organization recognized by the IRS
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Verification Box */}
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 mb-12">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-12 h-12 text-green-600 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">IRS-Recognized 501(c)(3) Nonprofit</h2>
              <p className="text-gray-700 mb-4">
                Constructive Designs Inc. is officially recognized by the Internal Revenue Service as a 
                tax-exempt charitable organization under Section 501(c)(3) of the Internal Revenue Code.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-gray-600 font-medium">EIN</div>
                  <div className="text-xl font-bold text-gray-900">86-3183952</div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-gray-600 font-medium">Date Recognized</div>
                  <div className="text-xl font-bold text-gray-900">April 4, 2021</div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-gray-600 font-medium">Classification</div>
                  <div className="text-xl font-bold text-gray-900">Public Charity</div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-gray-600 font-medium">Deductibility Status</div>
                  <div className="text-xl font-bold text-gray-900">Tax-Deductible</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* IRS Determination Letter */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">IRS Determination Letter</h2>
          </div>
          
          <p className="text-gray-700 mb-6">
            Our IRS determination letter confirms our tax-exempt status under Section 501(c)(3). 
            Donations to Constructive Designs Inc. are tax-deductible to the extent allowed by law.
          </p>

          {/* Embedded PDF or Image */}
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 mb-6">
            {/* Display PDF inline */}
            <iframe 
              src="/documents/IRS-Determination-Letter.pdf" 
              className="w-full h-[600px] border border-gray-300 rounded"
              title="IRS Determination Letter"
            />
          </div>

          {/* Download Button */}
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/documents/IRS-Determination-Letter.pdf"
              download
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </a>
            <button className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-medium">
              <ExternalLink className="w-5 h-5" />
              View Full Size
            </button>
          </div>
        </div>

        {/* What This Means */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What This Means for Donors</h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Tax-Deductible Donations</h3>
                <p>Your donations to Constructive Designs Inc. are tax-deductible to the extent allowed by law. Save your donation receipts for tax filing.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">IRS Compliance</h3>
                <p>We maintain our tax-exempt status by complying with all IRS regulations and filing required annual reports (Form 990).</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Public Transparency</h3>
                <p>As a 501(c)(3) organization, our Form 990 tax returns are publicly available through the IRS and nonprofit databases.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Mission-Driven</h3>
                <p>Our nonprofit status ensures that all revenue supports our charitable mission of economic empowerment and community development.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Links */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Verify Our Status</h2>
          <p className="text-gray-700 mb-6">
            You can independently verify our 501(c)(3) status through these trusted sources:
          </p>
          <div className="space-y-3">
            <a
              href="https://www.irs.gov/charities-non-profits/tax-exempt-organization-search"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition group"
            >
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-blue-600">IRS Tax Exempt Organization Search</div>
                <div className="text-sm text-gray-600">Search our EIN: 86-3183952</div>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </a>
            <a
              href="https://www.guidestar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition group"
            >
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-blue-600">GuideStar / Candid</div>
                <div className="text-sm text-gray-600">View our nonprofit profile and financials</div>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </a>
            <a
              href="https://www.charitynavigator.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition group"
            >
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-blue-600">Charity Navigator</div>
                <div className="text-sm text-gray-600">Independent nonprofit ratings and reviews</div>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Support Our Mission</h2>
          <p className="text-blue-100 mb-6">
            Your tax-deductible donation helps us create economic opportunities in the Dayton community
          </p>
          <a
            href="/donate"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Make a Donation
          </a>
        </div>
      </div>
    </div>
  );
}
