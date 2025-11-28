import React, { useState } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../supabase';
import { auth } from '../firebase';

/**
 * Debug Profile Loader
 * 
 * This component helps diagnose and fix the "Business Profile Required" issue
 * by forcing a fresh profile reload from Supabase and showing Firebase/Supabase ID mismatch.
 * 
 * Place this temporarily in your dashboard or settings page to test.
 */
export const DebugProfileLoader: React.FC = () => {
    const { user, userProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    
    const firebaseUser = auth?.currentUser;

    const forceReloadProfile = async () => {
        if (!user) {
            setDebugInfo({ error: 'No user logged in' });
            return;
        }

        setLoading(true);
        setDebugInfo(null);

        try {
            console.log('🔄 Force reloading profile for user:', user.id);

            // Fetch fresh profile directly from Supabase
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('❌ Error fetching profile:', error);
                setDebugInfo({
                    error: error.message,
                    code: error.code,
                    details: error.details,
                });
                setLoading(false);
                return;
            }

            console.log('✅ Fresh profile fetched:', data);

            setDebugInfo({
                success: true,
                profile: data,
                hasBusiness: !!data?.business_id,
                businessId: data?.business_id || 'MISSING',
            });

            // Force a full page reload to refresh all contexts
            if (data?.business_id) {
                alert('✅ Profile has business_id! Reloading page in 2 seconds...');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                alert('❌ Profile still missing business_id. Check database!');
            }

        } catch (error) {
            console.error('❌ Exception:', error);
            setDebugInfo({
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                <span className="material-icons">bug_report</span>
                Debug Profile Loader
            </h3>

            <div className="space-y-3">
                {/* Current Profile Info */}
                <div className="bg-white rounded p-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">🔥 Firebase User (Logged In As):</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40 mb-3">
{JSON.stringify({
    firebaseUID: firebaseUser?.uid || 'NOT LOGGED IN',
    email: firebaseUser?.email,
}, null, 2)}
                    </pre>
                    
                    <p className="text-sm font-semibold text-gray-700 mb-2">📊 Supabase Profile (What App Sees):</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
{JSON.stringify({
    supabaseUserId: user?.id || 'NO SUPABASE USER',
    email: user?.email,
    profileLoaded: !!userProfile,
    hasBusiness: !!userProfile?.business_id,
    businessId: userProfile?.business_id || 'MISSING',
    firstName: userProfile?.first_name,
    lastName: userProfile?.last_name,
}, null, 2)}
                    </pre>
                    
                    {firebaseUser?.uid !== user?.id && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-xs text-red-800 font-semibold">
                                ⚠️ ID MISMATCH DETECTED!
                            </p>
                            <p className="text-xs text-red-700">
                                Firebase UID and Supabase User ID don't match. 
                                This is why the profile isn't loading!
                            </p>
                        </div>
                    )}
                </div>

                {/* Force Reload Button */}
                <button
                    onClick={forceReloadProfile}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Reloading Profile...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-icons">refresh</span>
                            <span>Force Reload Profile from Database</span>
                        </>
                    )}
                </button>

                {/* Debug Info */}
                {debugInfo && (
                    <div className={`rounded p-3 ${debugInfo.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <p className="text-sm font-semibold mb-2">
                            {debugInfo.success ? '✅ Fresh Profile Loaded:' : '❌ Error:'}
                        </p>
                        <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-60">
{JSON.stringify(debugInfo, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Instructions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-xs text-yellow-900">
                        <strong>What this does:</strong>
                        <br />
                        1. Fetches your profile directly from Supabase (bypasses cache)
                        <br />
                        2. Shows if business_id exists in database
                        <br />
                        3. If found, reloads the page to refresh all contexts
                        <br />
                        4. If not found, tells you to run SQL setup script
                    </p>
                </div>
            </div>
        </div>
    );
};
