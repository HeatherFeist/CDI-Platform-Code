import React from 'react';
import { Shield, Eye, Lock, Database, UserCheck, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 20, 2025';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-gray-300">Last Updated: {lastUpdated}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          {/* Introduction */}
          <div className="mb-12">
            <p className="text-lg text-gray-700 leading-relaxed">
              Constructive Designs Inc. ("we," "our," or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you visit our marketplace platform at constructivedesignsinc.org or use our services.
            </p>
          </div>

          {/* Information We Collect */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
            </div>
            
            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
                <p>When you create an account or use our services, we may collect:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Name, email address, and phone number</li>
                  <li>Username and password</li>
                  <li>Billing and shipping addresses</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Profile information (photo, bio, location)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Marketplace Activity</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Listings you create (items, descriptions, photos, pricing)</li>
                  <li>Bids placed and purchases made</li>
                  <li>Messages sent through our platform</li>
                  <li>Reviews and ratings</li>
                  <li>Transaction history</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Automatically Collected Information</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Pages visited and time spent on our platform</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 p-3 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
            </div>
            
            <div className="text-gray-700 space-y-3">
              <p>We use the information we collect to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Provide, operate, and maintain our marketplace platform</li>
                <li>Process transactions and send related information</li>
                <li>Facilitate communication between buyers and sellers</li>
                <li>Send account notifications and platform updates</li>
                <li>Respond to customer service requests and support needs</li>
                <li>Detect and prevent fraud or unauthorized activity</li>
                <li>Improve our services and user experience</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Comply with legal obligations and enforce our Terms of Service</li>
                <li>Support our nonprofit mission and programs</li>
              </ul>
            </div>
          </section>

          {/* Information Sharing */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Information Sharing and Disclosure</h2>
            </div>
            
            <div className="text-gray-700 space-y-4">
              <p>We may share your information in the following situations:</p>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">With Other Users</h3>
                <p>
                  Your public profile information, listings, and reviews are visible to other marketplace 
                  users. Buyers and sellers can communicate through our messaging system.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Service Providers</h3>
                <p>We share information with third-party service providers who help us operate our platform:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li><strong>Stripe:</strong> Payment processing (subject to Stripe's privacy policy)</li>
                  <li><strong>Supabase:</strong> Database and authentication services</li>
                  <li><strong>Google Cloud:</strong> Hosting and infrastructure</li>
                  <li><strong>Email providers:</strong> Transactional and marketing emails</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Legal Requirements</h3>
                <p>
                  We may disclose information if required by law, court order, or to protect our rights, 
                  property, or safety, or that of our users or the public.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Business Transfers</h3>
                <p>
                  In the event of a merger, acquisition, or sale of assets, your information may be 
                  transferred to the new entity.
                </p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-100 p-3 rounded-lg">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
            </div>
            
            <div className="text-gray-700 space-y-3">
              <p>
                We implement appropriate technical and organizational security measures to protect your 
                personal information, including:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>HTTPS encryption for all data transmission</li>
                <li>Secure password hashing and storage</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication requirements</li>
                <li>PCI-compliant payment processing through Stripe</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the Internet is 100% secure. While we strive to 
                protect your information, we cannot guarantee absolute security.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your Privacy Rights</h2>
            </div>
            
            <div className="text-gray-700 space-y-3">
              <p>You have the right to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Data portability:</strong> Receive your data in a portable format</li>
                <li><strong>Restrict processing:</strong> Limit how we use your information</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us at{' '}
                <a href="mailto:privacy@constructivedesignsinc.org" className="text-blue-600 hover:underline">
                  privacy@constructivedesignsinc.org
                </a>
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking Technologies</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                We use cookies and similar tracking technologies to improve your experience, including:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li><strong>Essential cookies:</strong> Required for platform functionality</li>
                <li><strong>Analytics cookies:</strong> Help us understand how users interact with our site</li>
                <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
              </ul>
              <p className="mt-4">
                You can control cookies through your browser settings, but disabling certain cookies may 
                affect platform functionality.
              </p>
            </div>
          </section>

          {/* Children's Privacy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700">
              Our services are not intended for users under the age of 18. We do not knowingly collect 
              personal information from children. If you believe we have collected information from a 
              child, please contact us immediately.
            </p>
          </section>

          {/* Third-Party Links */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Links</h2>
            <p className="text-gray-700">
              Our platform may contain links to third-party websites. We are not responsible for the 
              privacy practices of these sites. We encourage you to review their privacy policies.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any material 
              changes by posting the new policy on this page and updating the "Last Updated" date. 
              Your continued use of our services after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Information */}
          <section className="bg-gray-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please 
              contact us:
            </p>
            <div className="text-gray-700 space-y-2">
              <p><strong>Constructive Designs Inc.</strong></p>
              <p>Email: <a href="mailto:privacy@constructivedesignsinc.org" className="text-blue-600 hover:underline">privacy@constructivedesignsinc.org</a></p>
              <p>Phone: <a href="tel:+15555551234" className="text-blue-600 hover:underline">(555) 555-1234</a></p>
              <p>Address: [Your Mailing Address], Dayton, OH [ZIP]</p>
            </div>
          </section>

          {/* Nonprofit Status */}
          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> Constructive Designs Inc. is a 501(c)(3) nonprofit organization 
              (EIN: 86-3183952). Revenue from our marketplace platform supports our mission of economic 
              empowerment and community development. Founded April 4, 2021 in Dayton, OH.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
