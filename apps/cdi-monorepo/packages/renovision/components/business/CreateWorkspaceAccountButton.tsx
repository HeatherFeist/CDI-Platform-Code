import React, { useState } from 'react';
import { supabase } from '../../supabase';

interface CreateWorkspaceAccountButtonProps {
  profileId: string;
  firstName: string;
  lastName: string;
  recoveryEmail: string;
  onSuccess?: (workspaceEmail: string, tempPassword: string) => void;
}

export default function CreateWorkspaceAccountButton({
  profileId,
  firstName,
  lastName,
  recoveryEmail,
  onSuccess,
}: CreateWorkspaceAccountButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const handleCreateAccount = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call Supabase Edge Function
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-workspace-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            profileId,
            firstName,
            lastName,
            recoveryEmail,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create workspace account');
      }

      setSuccess(true);
      setCredentials({
        email: result.workspaceEmail,
        password: result.tempPassword,
      });

      if (onSuccess) {
        onSuccess(result.workspaceEmail, result.tempPassword);
      }
    } catch (err: any) {
      console.error('Error creating workspace account:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (credentials) {
      navigator.clipboard.writeText(
        `Email: ${credentials.email}\nTemporary Password: ${credentials.password}\n\nYou will be required to change your password on first login.`
      );
      alert('Credentials copied to clipboard!');
    }
  };

  if (success && credentials) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-green-900">Workspace Account Created!</h4>
            <div className="mt-2 space-y-1 text-sm">
              <p className="text-green-800">
                <span className="font-medium">Email:</span> {credentials.email}
              </p>
              <p className="text-green-800">
                <span className="font-medium">Temporary Password:</span>{' '}
                <code className="bg-white px-2 py-1 rounded">{credentials.password}</code>
              </p>
              <p className="text-green-700 text-xs mt-2">
                ⚠️ User must change password on first login
              </p>
            </div>
            <button
              onClick={handleCopyCredentials}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              Copy Credentials
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        onClick={handleCreateAccount}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Account...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Google Workspace Account
          </>
        )}
      </button>

      <p className="mt-2 text-sm text-gray-600">
        This will create a @constructivedesignsinc.org email account for this contractor
      </p>
    </div>
  );
}
