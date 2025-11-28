import React from 'react';
import { isConfigured, supabaseError } from '../supabase';

export const ConfigurationStatus: React.FC = () => {
    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuration Status</h2>
                
                <div className="space-y-4">
                    {/* Supabase Status */}
                    <div className={`p-4 rounded-lg border-2 ${isConfigured ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                        <div className="flex items-center mb-2">
                            <span className="text-2xl mr-2">{isConfigured ? '✅' : '❌'}</span>
                            <h3 className="text-lg font-semibold">Supabase Database</h3>
                        </div>
                        <p className="text-sm text-gray-700">
                            {isConfigured 
                                ? 'Supabase is configured and ready to use!' 
                                : 'Supabase is not configured. Please add your credentials to continue.'}
                        </p>
                        {supabaseError && (
                            <p className="text-sm text-red-600 mt-2">
                                Error: {supabaseError}
                            </p>
                        )}
                    </div>

                    {/* Environment Variables */}
                    <div className="bg-gray-50 border-2 border-gray-300 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">Environment Variables</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center">
                                <span className={`mr-2 ${import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}`}>
                                    {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}
                                </span>
                                <code className="bg-gray-200 px-2 py-1 rounded">VITE_SUPABASE_URL</code>
                                <span className="ml-2 text-gray-600">
                                    {import.meta.env.VITE_SUPABASE_URL ? '(Set)' : '(Not set)'}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <span className={`mr-2 ${import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}`}>
                                    {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}
                                </span>
                                <code className="bg-gray-200 px-2 py-1 rounded">VITE_SUPABASE_ANON_KEY</code>
                                <span className="ml-2 text-gray-600">
                                    {import.meta.env.VITE_SUPABASE_ANON_KEY ? '(Set)' : '(Not set)'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Setup Steps */}
                    {!isConfigured && (
                        <div className="bg-blue-50 border-2 border-blue-500 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2 text-blue-900">Quick Setup</h3>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                                <li>Create a Supabase project at <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline">app.supabase.com</a></li>
                                <li>Run the SQL schema from <code className="bg-blue-100 px-2 py-1 rounded">supabase-schema.sql</code></li>
                                <li>Get your API keys from Settings → API</li>
                                <li>Add to <code className="bg-blue-100 px-2 py-1 rounded">.env</code> file:
                                    <div className="bg-gray-900 text-green-400 p-2 rounded mt-2 font-mono text-xs">
                                        <div>VITE_SUPABASE_URL=your-url-here</div>
                                        <div>VITE_SUPABASE_ANON_KEY=your-key-here</div>
                                    </div>
                                </li>
                                <li>Restart the dev server</li>
                            </ol>
                        </div>
                    )}

                    {/* Current Environment Info */}
                    <div className="bg-gray-50 border border-gray-300 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold mb-2 text-gray-700">Debug Information</h3>
                        <div className="text-xs text-gray-600 font-mono space-y-1">
                            <div>Node ENV: {import.meta.env.MODE || 'development'}</div>
                            <div>Build: {import.meta.env.PROD ? 'Production' : 'Development'}</div>
                            <div>Timestamp: {new Date().toISOString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
