
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoginDisabled?: boolean;
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ user, onLogin, onLogout, isLoginDisabled, children }) => {
  const displayName = user?.user_metadata?.full_name || user?.email;
  const photoURL = user?.user_metadata?.avatar_url;

  return (
    <header className="w-full p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
  <div>{children}</div>
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-800">
              Constructive Designs
            </h1>
            <p className="mt-2 text-md text-zinc-600 max-w-2xl mx-auto">
              An AI-powered design studio to visualize your ideas. Upload a photo, add products, try paint colors, or describe edits to create photorealistic results.
            </p>
        </div>
        <div>
            {user ? (
                <div className="flex items-center gap-3">
                    <img src={photoURL || undefined} alt={displayName || 'User'} className="w-10 h-10 rounded-full" />
                    <button onClick={onLogout} className="px-4 py-2 bg-zinc-100 text-zinc-700 text-sm font-bold rounded-md hover:bg-zinc-200 transition-colors">
                        Logout
                    </button>
                </div>
            ) : (
                <button 
                    onClick={onLogin} 
                    className="px-4 py-2 bg-zinc-800 text-white text-sm font-bold rounded-md hover:bg-zinc-900 transition-colors disabled:bg-zinc-400 disabled:cursor-not-allowed"
                    disabled={isLoginDisabled}
                    title={isLoginDisabled ? "Login is disabled due to a configuration error." : "Login with Google"}
                >
                    Login with Google
                </button>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;
