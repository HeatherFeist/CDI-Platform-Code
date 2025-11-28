import { Mail, CheckCircle, Users, Briefcase, X } from 'lucide-react';

interface MembershipOfferModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function MembershipOfferModal({ onAccept, onDecline }: MembershipOfferModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-primary text-white p-6 rounded-t-lg relative">
          <button
            onClick={onDecline}
            className="absolute top-4 right-4 text-white hover:text-gray-200"
            aria-label="Close"
          >
            <X size={24} />
          </button>
          
          <h2 className="text-2xl font-bold mb-2">
            🎉 Welcome to Constructive Designs!
          </h2>
          <p className="text-blue-100">
            Your marketplace account is ready. Want to unlock more?
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-medium text-green-900">Account Created!</h3>
              <p className="text-sm text-green-700 mt-1">
                You can now buy and sell on the marketplace
              </p>
            </div>
          </div>

          {/* Membership Offer */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              💼 Become a Full Member
            </h3>
            <p className="text-gray-600 mb-4">
              Upgrade to a professional membership and get access to our complete business platform!
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Professional Email */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail size={20} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Professional Email
                  </h4>
                  <p className="text-sm text-gray-600">
                    Get yourname@constructivedesignsinc.org
                  </p>
                </div>
              </div>
            </div>

            {/* RenovVision Access */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase size={20} className="text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    RenovVision Platform
                  </h4>
                  <p className="text-sm text-gray-600">
                    Project management and estimation tools
                  </p>
                </div>
              </div>
            </div>

            {/* Google Workspace */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Google Workspace
                  </h4>
                  <p className="text-sm text-gray-600">
                    Gmail, Drive, Calendar, and more
                  </p>
                </div>
              </div>
            </div>

            {/* Community */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users size={20} className="text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Member Community
                  </h4>
                  <p className="text-sm text-gray-600">
                    Connect with contractors and pros
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Also included:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-600" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-600" />
                <span>Advanced marketplace features</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-600" />
                <span>Business networking opportunities</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-600" />
                <span>Training and resources</span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={onAccept}
              className="w-full bg-gradient-primary text-white px-6 py-3 rounded-lg hover:bg-gradient-primary-hover transition-all font-medium shadow-lg"
            >
              Yes, Become a Member!
            </button>
            
            <button
              onClick={onDecline}
              className="w-full border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Maybe Later - Just Use Marketplace
            </button>
          </div>

          {/* Note */}
          <p className="text-xs text-gray-500 text-center">
            You can upgrade to a membership anytime from your dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
