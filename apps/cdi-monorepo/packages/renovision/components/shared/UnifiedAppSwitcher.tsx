import React, { useState } from 'react';
import { supabase } from '../supabase';

interface UnifiedAppSwitcherProps {
  currentApp: 'renovision' | 'marketplace' | 'wallet' | 'portal' | 'launcher';
  userProfile?: any;
}

export default function UnifiedAppSwitcher({ currentApp, userProfile }: UnifiedAppSwitcherProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const apps = [
    {
      id: 'renovision',
      name: 'RenovVision',
      icon: '📊',
      url: 'https://renovision.web.app',
      color: 'bg-blue-600',
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      icon: '🏪',
      url: 'https://marketplace-cd.web.app',
      color: 'bg-green-600',
    },
    {
      id: 'wallet',
      name: 'Quantum Wallet',
      icon: '💰',
      url: 'https://wallet-cd.web.app',
      color: 'bg-purple-600',
      comingSoon: true,
    },
    {
      id: 'portal',
      name: 'Member Portal',
      icon: '👥',
      url: 'https://portal-cd.web.app',
      color: 'bg-indigo-600',
      requiresVerification: true,
    },
  ];

  const currentAppData = apps.find((a) => a.id === currentApp);

  return (
    <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo + App Switcher */}
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <a href="https://constructivedesignsinc.org" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">🏗️</span>
              </div>
              <span className="font-semibold hidden md:inline">Constructive Designs</span>
            </a>

            {/* Divider */}
            <div className="w-px h-8 bg-white/20"></div>

            {/* Current App + Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="text-xl">{currentAppData?.icon}</span>
                <span className="font-medium">{currentAppData?.name}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50">
                  <div className="p-2">
                    {apps.map((app) => {
                      const isCurrentApp = app.id === currentApp;
                      const isLocked =
                        app.requiresVerification && !userProfile?.is_verified_member;

                      return (
                        <a
                          key={app.id}
                          href={app.comingSoon || isLocked ? '#' : app.url}
                          onClick={(e) => {
                            if (app.comingSoon || isLocked) {
                              e.preventDefault();
                            } else {
                              setShowDropdown(false);
                            }
                          }}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            isCurrentApp
                              ? 'bg-white/20 cursor-default'
                              : app.comingSoon || isLocked
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-white/10 cursor-pointer'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 ${app.color} rounded-lg flex items-center justify-center text-xl`}
                          >
                            {app.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{app.name}</div>
                            {app.comingSoon && (
                              <div className="text-xs text-blue-300">Coming Soon</div>
                            )}
                            {isLocked && (
                              <div className="text-xs text-yellow-300">🔒 Verification Required</div>
                            )}
                            {isCurrentApp && (
                              <div className="text-xs text-green-300">● Active</div>
                            )}
                          </div>
                        </a>
                      );
                    })}
                  </div>

                  {/* Footer Link */}
                  <div className="border-t border-white/10 p-2">
                    <a
                      href="https://constructivedesignsinc.org"
                      className="flex items-center justify-center space-x-2 px-4 py-2 text-sm text-blue-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>App Launcher</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Profile */}
          {userProfile && (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden md:block">
                <div className="text-sm font-medium">
                  {userProfile.first_name} {userProfile.last_name}
                </div>
                <div className="text-xs text-blue-300">
                  {userProfile.workspace_email || userProfile.email}
                </div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center font-semibold">
                {userProfile.first_name?.[0]}{userProfile.last_name?.[0]}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
