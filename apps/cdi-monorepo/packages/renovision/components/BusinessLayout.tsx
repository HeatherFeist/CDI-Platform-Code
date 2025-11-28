import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import ContextSwitcher from './common/ContextSwitcher';

export const BusinessLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userProfile, signOut, currentContext, canAccessBusinessFeatures, canAccessTeamMemberFeatures } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const handleLinkClick = () => {
        setIsMobileMenuOpen(false);
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const getContextBadgeColor = (context: string) => {
        switch (context) {
            case 'business_owner': return 'bg-blue-100 text-blue-800';
            case 'contractor': return 'bg-purple-100 text-purple-800';
            case 'team_member': return 'bg-green-100 text-green-800';
            case 'subcontractor': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-30 px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                >
                    <span className="material-icons text-gray-700">menu</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="material-icons text-blue-600">home_repair_service</span>
                    <span className="font-bold text-gray-900">Constructive</span>
                </div>
                <div className="w-8"></div> {/* Spacer for alignment */}
            </div>

            {/* Modern Sidebar */}
            <div className={`${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl flex flex-col border-r border-gray-200 transition-transform duration-300 ease-in-out`}>
                {/* Header with gradient */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-purple-600">
                    {/* Close button for mobile */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg"
                    >
                        <span className="material-icons">close</span>
                    </button>
                    
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                            <span className="material-icons text-blue-600 text-2xl">home_repair_service</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Constructive</h2>
                            <p className="text-xs text-blue-100">
                                {canAccessBusinessFeatures() ? 'Business Portal' : 'Team Portal'}
                            </p>
                        </div>
                    </div>
                    {userProfile && (
                        <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                            <div className="flex items-center gap-3">
                                <div className="modern-avatar modern-avatar-sm bg-white text-blue-600">
                                    {userProfile.first_name[0]}{userProfile.last_name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-white text-sm truncate">
                                        {userProfile.first_name} {userProfile.last_name}
                                    </div>
                                    <div className="text-blue-100 text-xs truncate">{userProfile.email}</div>
                                </div>
                            </div>
                            <span className={`mt-2 px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getContextBadgeColor(currentContext)} shadow-sm`}>
                                {currentContext.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Context Switcher with modern styling */}
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                    <ContextSwitcher />
                </div>

                {/* Modern Navigation */}
                <nav className="mt-2 px-3 flex-1 overflow-y-auto space-y-1">
                    {canAccessBusinessFeatures() ? (
                        // Business Owner / Contractor Navigation
                        <>
                            <Link
                                to="/business/dashboard"
                                onClick={handleLinkClick}
                                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive('/business/dashboard')
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                                }`}
                            >
                                <span className="material-icons-outlined mr-3 text-xl">dashboard</span>
                                Dashboard
                            </Link>
                            <Link
                                to="/business/customers"
                                onClick={handleLinkClick}
                                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive('/business/customers')
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                                }`}
                            >
                                <span className="material-icons-outlined mr-3 text-xl">people</span>
                                Customers
                            </Link>
                            <Link
                                to="/business/projects"
                                onClick={handleLinkClick}
                                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive('/business/projects')
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                                }`}
                            >
                                <span className="material-icons-outlined mr-3 text-xl">engineering</span>
                                Projects
                            </Link>
                            <Link
                                to="/business/team-members"
                                onClick={handleLinkClick}
                                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive('/business/team-members')
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                                }`}
                            >
                                <span className="material-icons-outlined mr-3 text-xl">group_add</span>
                                Team Members
                            </Link>
                            <Link
                                to="/business/estimates"
                                onClick={handleLinkClick}
                                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive('/business/estimates')
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                                }`}
                            >
                                <span className="material-icons-outlined mr-3 text-xl">description</span>
                                Estimates
                            </Link>
                            <Link
                                to="/business/invoices"
                                onClick={handleLinkClick}
                                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive('/business/invoices')
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                                }`}
                            >
                                <span className="material-icons-outlined mr-3 text-xl">receipt</span>
                                Invoices
                            </Link>
                            <Link
                                to="/business/payments"
                                onClick={handleLinkClick}
                                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive('/business/payments')
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                                }`}
                            >
                                <span className="material-icons-outlined mr-3 text-xl">payment</span>
                                Payment Settings
                            </Link>
                            <Link
                                to="/business/ai-settings"
                                onClick={handleLinkClick}
                                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive('/business/ai-settings')
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                                }`}
                            >
                                <span className="material-icons-outlined mr-3 text-xl">auto_awesome</span>
                                AI Settings
                            </Link>
                            <Link
                                to="/business/settings"
                                onClick={handleLinkClick}
                                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive('/business/settings')
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                                }`}
                            >
                                <span className="material-icons-outlined mr-3 text-xl">business</span>
                                Business Settings
                            </Link>
                            <Link
                                to="/business/transactions"
                                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive('/business/transactions')
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">account_balance_wallet</span>
                                Transactions
                            </Link>
                            <Link
                                to="/business/schedule"
                                className={`flex items-center px-4 py-2 text-gray-700 ${
                                    isActive('/business/schedule')
                                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">event</span>
                                Schedule
                            </Link>
                            <Link
                                to="/business/programs"
                                className={`flex items-center px-4 py-2 text-gray-700 ${
                                    isActive('/business/programs')
                                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">volunteer_activism</span>
                                Programs & Benefits
                            </Link>
                            <Link
                                to="/business/team"
                                className={`flex items-center px-4 py-2 text-gray-700 ${
                                    isActive('/business/team')
                                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">groups</span>
                                Team
                            </Link>
                            <Link
                                to="/business/analytics"
                                className={`flex items-center px-4 py-2 text-gray-700 ${
                                    isActive('/business/analytics')
                                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">analytics</span>
                                Analytics
                            </Link>
                            <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Community
                            </div>
                            <Link
                                to="/business/community"
                                className={`flex items-center px-4 py-2 text-gray-700 ${
                                    isActive('/business/community')
                                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">group</span>
                                Directory
                            </Link>
                            <Link
                                to="/business/champions"
                                className={`flex items-center px-4 py-2 text-gray-700 ${
                                    isActive('/business/champions')
                                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">emoji_events</span>
                                Champions
                            </Link>
                            <Link
                                to="/business/badges"
                                className={`flex items-center px-4 py-2 text-gray-700 ${
                                    isActive('/business/badges')
                                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">military_tech</span>
                                Badge Ranks
                            </Link>
                            <Link
                                to="/messages"
                                className={`flex items-center px-4 py-2 text-gray-700 ${
                                    location.pathname.startsWith('/messages')
                                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">chat</span>
                                Messages
                            </Link>
                            <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Financial
                            </div>
                            <Link
                                to="/tax/dashboard"
                                className={`flex items-center px-4 py-2 text-gray-700 ${
                                    location.pathname.startsWith('/tax')
                                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">receipt_long</span>
                                Tax Center
                            </Link>
                        </>
                    ) : (
                        // Team Member / Subcontractor Navigation
                        <>
                            <Link
                                to="/team/dashboard"
                                className={`flex items-center px-4 py-2 text-gray-700 ${
                                    isActive('/team/dashboard')
                                        ? 'bg-green-50 text-green-700 border-r-4 border-green-700'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">dashboard</span>
                                My Dashboard
                            </Link>
                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Quick Actions
                            </div>
                            <Link
                                to="/team/dashboard#invitations"
                                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                            >
                                <span className="material-icons-outlined mr-2">mail</span>
                                Pending Invitations
                            </Link>
                            <Link
                                to="/team/dashboard#active"
                                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                            >
                                <span className="material-icons-outlined mr-2">construction</span>
                                Active Projects
                            </Link>
                            <Link
                                to="/team/dashboard#earnings"
                                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                            >
                                <span className="material-icons-outlined mr-2">payments</span>
                                My Earnings
                            </Link>
                            <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Community
                            </div>
                            <Link
                                to="/business/community"
                                className={`flex items-center px-4 py-2 text-gray-700 ${
                                    isActive('/business/community')
                                        ? 'bg-green-50 text-green-700 border-r-4 border-green-700'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">group</span>
                                Directory
                            </Link>
                            <Link
                                to="/business/champions"
                                className={`flex items-center px-4 py-2 text-gray-700 ${
                                    isActive('/business/champions')
                                        ? 'bg-green-50 text-green-700 border-r-4 border-green-700'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">emoji_events</span>
                                Champions
                            </Link>
                            <Link
                                to="/business/badges"
                                className={`flex items-center px-4 py-2 text-gray-700 ${
                                    isActive('/business/badges')
                                        ? 'bg-green-50 text-green-700 border-r-4 border-green-700'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">military_tech</span>
                                Badge Ranks
                            </Link>
                            <Link
                                to="/messages"
                                className={`flex items-center px-4 py-2 text-gray-700 ${
                                    location.pathname.startsWith('/messages')
                                        ? 'bg-green-50 text-green-700 border-r-4 border-green-700'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">chat</span>
                                Messages
                            </Link>
                            <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Financial
                            </div>
                            <Link
                                to="/tax/dashboard"
                                className={`flex items-center px-4 py-2 text-gray-700 ${
                                    location.pathname.startsWith('/tax')
                                        ? 'bg-green-50 text-green-700 border-r-4 border-green-700'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className="material-icons-outlined mr-2">receipt_long</span>
                                Tax Center
                            </Link>
                        </>
                    )}
                </nav>

                {/* Footer Actions */}
                <div className="mt-auto border-t">
                    {/* Settings */}
                    <Link
                        to="/settings/profile"
                        onClick={handleLinkClick}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 border-b"
                    >
                        <span className="material-icons-outlined mr-2">settings</span>
                        Settings
                    </Link>

                    {/* Back to Design Tool */}
                    <Link
                        to="/"
                        onClick={handleLinkClick}
                        className="flex items-center px-4 py-3 text-blue-600 hover:bg-blue-50 border-b"
                    >
                        <span className="material-icons-outlined mr-2">palette</span>
                        Design Tool
                    </Link>
                    
                    {/* Logout Button */}
                    <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50"
                    >
                        <span className="material-icons-outlined mr-2">logout</span>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto pt-16 lg:pt-0">
                <div className="p-4 md:p-6 lg:p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};