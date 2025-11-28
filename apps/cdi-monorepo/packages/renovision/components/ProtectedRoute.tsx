import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';

type UserRole = 'admin' | 'manager' | 'technician' | 'sales';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, userProfile, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
        return (
            <div className="flex flex-col justify-center items-center h-screen p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
                    <p className="text-red-600 mb-4">
                        You don't have permission to access this page.
                    </p>
                    <p className="text-sm text-gray-600">
                        Required roles: {allowedRoles.join(', ')}
                    </p>
                    <p className="text-sm text-gray-600">
                        Your role: {userProfile.role}
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
