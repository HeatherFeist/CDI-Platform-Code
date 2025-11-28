import React, { useState } from 'react';
import { Phone, Mail, MessageSquare, Video, Shield, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface ContactPreferences {
  phone_visible: boolean;
  email_visible: boolean;
  phone_number?: string;
  preferred_contact_method: 'phone' | 'email' | 'app_message' | 'any';
  business_hours?: string;
  accepts_video_calls: boolean;
}

export const ContactPreferencesSettings: React.FC = () => {
  const { userProfile } = useAuth();
  const [preferences, setPreferences] = useState<ContactPreferences>({
    phone_visible: false,
    email_visible: true,
    preferred_contact_method: 'app_message',
    accepts_video_calls: false
  });
  const [saving, setSaving] = useState(false);

  const savePreferences = async () => {
    if (!userProfile?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone_visible: preferences.phone_visible,
          email_visible: preferences.email_visible,
          phone: preferences.phone_number,
          preferred_contact_method: preferences.preferred_contact_method,
          business_hours: preferences.business_hours,
          accepts_video_calls: preferences.accepts_video_calls
        })
        .eq('id', userProfile.id);

      if (error) throw error;
      alert('✅ Contact preferences saved!');
    } catch (err) {
      console.error('Error saving preferences:', err);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-2">Contact Preferences</h2>
      <p className="text-sm text-gray-600 mb-6">
        Choose how customers can reach you. You control what information is visible.
      </p>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Your Privacy, Your Choice</p>
            <p>
              You decide what contact information to share. Uncheck any option to keep it private.
              Customers can always message you through the app.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Phone Number */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <h3 className="font-semibold">Phone Number</h3>
                <p className="text-sm text-gray-600">
                  Let customers call you directly
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.phone_visible}
                onChange={(e) => setPreferences({ ...preferences, phone_visible: e.target.checked })}
                className="w-5 h-5 text-blue-600"
              />
              {preferences.phone_visible ? (
                <Eye className="w-5 h-5 text-green-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-400" />
              )}
            </label>
          </div>

          {preferences.phone_visible && (
            <div className="space-y-3">
              <input
                type="tel"
                value={preferences.phone_number || ''}
                onChange={(e) => setPreferences({ ...preferences, phone_number: e.target.value })}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={preferences.accepts_video_calls}
                  onChange={(e) => setPreferences({ ...preferences, accepts_video_calls: e.target.checked })}
                  className="w-4 h-4 text-blue-600 mt-0.5"
                />
                <div>
                  <p className="font-medium">I accept video calls</p>
                  <p className="text-gray-600">
                    Customers can FaceTime/WhatsApp video call me to inspect products
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <h3 className="font-semibold">Email Address</h3>
                <p className="text-sm text-gray-600">
                  {userProfile?.email || 'your@email.com'}
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email_visible}
                onChange={(e) => setPreferences({ ...preferences, email_visible: e.target.checked })}
                className="w-5 h-5 text-blue-600"
              />
              {preferences.email_visible ? (
                <Eye className="w-5 h-5 text-green-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-400" />
              )}
            </label>
          </div>
        </div>

        {/* Business Hours */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Business Hours (Optional)</h3>
          <input
            type="text"
            value={preferences.business_hours || ''}
            onChange={(e) => setPreferences({ ...preferences, business_hours: e.target.value })}
            placeholder="e.g., Mon-Fri 9am-5pm, Sat 10am-2pm"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Let customers know when you're available
          </p>
        </div>

        {/* Preferred Contact Method */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Preferred Contact Method</h3>
          <div className="space-y-2">
            {[
              { value: 'phone', label: 'Phone Call', icon: Phone },
              { value: 'email', label: 'Email', icon: Mail },
              { value: 'app_message', label: 'App Message (In-Platform)', icon: MessageSquare },
              { value: 'any', label: 'Any Method Works', icon: null }
            ].map((method) => (
              <label key={method.value} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                <input
                  type="radio"
                  name="preferred_method"
                  value={method.value}
                  checked={preferences.preferred_contact_method === method.value}
                  onChange={(e) => setPreferences({ ...preferences, preferred_contact_method: e.target.value as any })}
                  className="w-4 h-4 text-blue-600"
                />
                {method.icon && <method.icon className="w-4 h-4 text-gray-600" />}
                <span>{method.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={savePreferences}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {saving ? 'Saving...' : 'Save Contact Preferences'}
        </button>
      </div>
    </div>
  );
};

// Simple contact card shown to customers
interface UserContactCardProps {
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  phoneVisible: boolean;
  emailVisible: boolean;
  acceptsVideoCalls: boolean;
  preferredMethod: string;
  businessHours?: string;
}

export const UserContactCard: React.FC<UserContactCardProps> = ({
  userName,
  userEmail,
  userPhone,
  phoneVisible,
  emailVisible,
  acceptsVideoCalls,
  preferredMethod,
  businessHours
}) => {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-bold text-lg mb-4">Contact {userName}</h3>

      {businessHours && (
        <div className="bg-blue-50 rounded p-3 mb-4 text-sm">
          <p className="font-semibold text-blue-900">Business Hours:</p>
          <p className="text-blue-800">{businessHours}</p>
        </div>
      )}

      <div className="space-y-3">
        {/* Phone */}
        {phoneVisible && userPhone && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">{userPhone}</p>
                {acceptsVideoCalls && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    Accepts video calls
                  </p>
                )}
              </div>
            </div>
            <a
              href={`tel:${userPhone}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Call
            </a>
          </div>
        )}

        {/* Email */}
        {emailVisible && userEmail && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <p className="font-medium">{userEmail}</p>
            </div>
            <a
              href={`mailto:${userEmail}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Email
            </a>
          </div>
        )}

        {/* App Message (Always Available) */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <p className="font-medium">Send Message via App</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Message
          </button>
        </div>

        {preferredMethod !== 'any' && (
          <p className="text-xs text-gray-600 text-center">
            Preferred: {preferredMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
        )}
      </div>

      {!phoneVisible && !emailVisible && (
        <p className="text-sm text-gray-600 text-center mt-4">
          This user prefers in-app messaging. Click "Message" above to start a conversation.
        </p>
      )}
    </div>
  );
};
