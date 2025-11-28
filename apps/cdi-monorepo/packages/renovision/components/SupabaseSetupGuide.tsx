import React from 'react';

export const SupabaseSetupGuide: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    🚀 Setup Required: Supabase Database
                </h1>
                <p className="text-lg text-gray-600">
                    To use the business portal features, you need to configure Supabase as your database backend.
                </p>
            </div>

            <div className="space-y-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-blue-900 mb-4">
                        📝 Step 1: Create a Supabase Project
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-blue-800">
                        <li>Go to <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">https://app.supabase.com</a></li>
                        <li>Create a new account or sign in</li>
                        <li>Click "New Project"</li>
                        <li>Choose your organization and enter project details</li>
                        <li>Wait for the project to be created (takes ~2 minutes)</li>
                    </ol>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-green-900 mb-4">
                        🗄️ Step 2: Set Up Database Schema
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-green-800">
                        <li>In your Supabase project, go to "SQL Editor"</li>
                        <li>Copy and paste the schema from <code className="bg-green-100 px-2 py-1 rounded">supabase-schema.sql</code></li>
                        <li>Click "Run" to create all necessary tables</li>
                        <li>Verify tables were created in the "Table Editor"</li>
                    </ol>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-purple-900 mb-4">
                        🔑 Step 3: Get Your API Keys
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-purple-800">
                        <li>Go to Settings → API in your Supabase project</li>
                        <li>Copy the "Project URL"</li>
                        <li>Copy the "anon public" key</li>
                        <li>Keep these secure - you'll need them in the next step</li>
                    </ol>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-orange-900 mb-4">
                        ⚙️ Step 4: Configure Environment Variables
                    </h2>
                    <p className="text-orange-800 mb-4">
                        Update your <code className="bg-orange-100 px-2 py-1 rounded">.env</code> file with your Supabase credentials:
                    </p>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                        <div>VITE_SUPABASE_URL=https://your-project.supabase.co</div>
                        <div>VITE_SUPABASE_ANON_KEY=your-anon-key-here</div>
                    </div>
                    <p className="text-orange-800 mt-4">
                        <strong>Important:</strong> Replace the placeholder values with your actual Supabase URL and anon key.
                    </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        🔄 Step 5: Restart the Application
                    </h2>
                    <ol className="list-decimal list-inside space-y-2 text-gray-800">
                        <li>Stop the development server (Ctrl+C)</li>
                        <li>Run <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code> again</li>
                        <li>The business portal should now work!</li>
                    </ol>
                </div>
            </div>

            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                    💡 Need Help?
                </h3>
                <p className="text-yellow-800">
                    If you encounter any issues, check the browser console for error messages or 
                    refer to the <a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-600">Supabase documentation</a>.
                </p>
            </div>
        </div>
    );
};