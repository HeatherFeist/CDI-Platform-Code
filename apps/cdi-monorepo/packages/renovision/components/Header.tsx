/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';

export default function Header() {
    const navigate = useNavigate();
    const { user, signOut, userProfile, currentContext } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const getContextBadge = () => {
        switch (currentContext) {
            case 'business_owner':
                return { label: 'Business Owner', color: 'bg-blue-100 text-blue-800' };
            case 'contractor':
                return { label: 'Contractor', color: 'bg-purple-100 text-purple-800' };
            case 'team_member':
                return { label: 'Team Member', color: 'bg-green-100 text-green-800' };
            case 'subcontractor':
                return { label: 'Subcontractor', color: 'bg-orange-100 text-orange-800' };
            default:
                return { label: 'User', color: 'bg-gray-100 text-gray-800' };
        }
    };

    const contextBadge = getContextBadge();

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-gray-900">Constructive Home Reno</h1>
                    <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                        Powered by Constructive Designs Inc.
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {user && (
                        <>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${contextBadge.color}`}>
                                    {contextBadge.label}
                                </span>
                                <span className="text-sm text-gray-600">{userProfile?.email}</span>
                            </div>
                            <button
                                onClick={() => navigate('/settings/profile')}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <span className="material-icons text-sm align-middle">settings</span>
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                                Sign Out
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}