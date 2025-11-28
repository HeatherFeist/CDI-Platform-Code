import React, { useState } from 'react';
import { projectService } from '../services/business/projectService';
// import { testWorkspaceConnection } from '../services/workspaceProvisioningService'; // DISABLED - needs server-side

export const DiagnosticsPage: React.FC = () => {
    const [projectTest, setProjectTest] = useState<string>('Not tested');
    const [workspaceTest, setWorkspaceTest] = useState<string>('Disabled - needs server-side implementation');
    const [loading, setLoading] = useState(false);

    const testProjects = async () => {
        setLoading(true);
        try {
            const projects = await projectService.getBusinessProjects('test-business-id');
            setProjectTest(`✅ SUCCESS: Found ${projects.length} projects. Projects service using Supabase!`);
        } catch (error) {
            setProjectTest(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    const testWorkspace = async () => {
        setWorkspaceTest('⚠️ Google Workspace integration requires server-side implementation (Supabase Edge Function). googleapis library cannot run in browser.');
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">🔧 System Diagnostics</h1>

            {/* Projects Service Test */}
            <div className="mb-8 p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Projects Service (Supabase)</h2>
                <button
                    onClick={testProjects}
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
                >
                    Test Projects Service
                </button>
                <div className="p-4 bg-gray-50 rounded">
                    <pre className="whitespace-pre-wrap">{projectTest}</pre>
                </div>
            </div>

            {/* Workspace Service Test */}
            <div className="mb-8 p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Google Workspace Provisioning</h2>
                <button
                    onClick={testWorkspace}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
                >
                    Test Workspace Connection
                </button>
                <div className="p-4 bg-gray-50 rounded">
                    <pre className="whitespace-pre-wrap">{workspaceTest}</pre>
                </div>
            </div>

            {/* Instructions */}
            <div className="p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <h3 className="font-semibold mb-2">What This Tests:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Projects Service:</strong> Checks if Supabase connection works (should NOT say "Firebase not initialized")</li>
                    <li><strong>Workspace:</strong> Tests if Google Admin SDK can connect (needs domain-wide delegation configured)</li>
                </ul>
            </div>
        </div>
    );
};
