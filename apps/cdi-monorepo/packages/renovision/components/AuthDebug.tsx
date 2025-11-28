import React from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';

export const AuthDebug: React.FC = () => {
    const { user, userProfile, loading, session, error } = useAuth();

    return (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-md text-xs font-mono z-50">
            <h3 className="font-bold mb-2 text-sm">🐛 Auth Debug</h3>
            <div className="space-y-1">
                <p><span className="text-gray-400">Loading:</span> {loading ? '⏳' : '✅ NO'}</p>
                <p><span className="text-gray-400">User:</span> {user ? `✅ ${user.email}` : '❌ None'}</p>
                <p><span className="text-gray-400">Session:</span> {session ? '✅ Active' : '❌ None'}</p>
                <p><span className="text-gray-400">Profile:</span> {userProfile ? `✅ Loaded` : '❌ Not loaded'}</p>
                {error && (
                    <div className="mt-2 p-2 bg-red-900 bg-opacity-50 rounded">
                        <p className="text-red-300 font-semibold">⚠️ Error:</p>
                        <p className="text-red-200 mt-1">{error}</p>
                    </div>
                )}
                {userProfile && (
                    <>
                        <p className="text-gray-400 mt-2">Profile Details:</p>
                        <p className="pl-2">Name: {userProfile.first_name} {userProfile.last_name}</p>
                        <p className="pl-2">Business ID: {userProfile.business_id?.substring(0, 8)}...</p>
                        <p className="pl-2">Role: {userProfile.role}</p>
                    </>
                )}
            </div>
        </div>
    );
};
