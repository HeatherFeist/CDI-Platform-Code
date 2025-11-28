import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/SupabaseAuthContext';

export const DatabaseStatusCheck: React.FC = () => {
    const { userProfile } = useAuth();
    const [status, setStatus] = useState<any>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        checkDatabaseStatus();
    }, [userProfile]);

    const checkDatabaseStatus = async () => {
        if (!supabase || !userProfile?.business_id) {
            setStatus({
                configured: false,
                error: 'Supabase not configured or user not logged in'
            });
            setChecking(false);
            return;
        }

        const results: any = {
            configured: true,
            tables: {},
            businessId: userProfile.business_id
        };

        // Check each table
        const tables = ['businesses', 'profiles', 'customers', 'projects', 'estimates', 'invoices', 'team_members'];
        
        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('id')
                    .limit(1);
                
                results.tables[table] = {
                    exists: !error,
                    error: error?.message,
                    hasData: data && data.length > 0
                };
            } catch (err) {
                results.tables[table] = {
                    exists: false,
                    error: err instanceof Error ? err.message : 'Unknown error'
                };
            }
        }

        setStatus(results);
        setChecking(false);
    };

    if (checking) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800">Checking database status...</p>
            </div>
        );
    }

    if (!status || !status.configured) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-900 mb-2">⚠️ Database Not Configured</h3>
                <p className="text-red-700 text-sm">{status?.error || 'Unknown error'}</p>
            </div>
        );
    }

    const allTablesExist = Object.values(status.tables).every((t: any) => t.exists);

    return (
        <div className={`border rounded-lg p-4 mb-4 ${allTablesExist ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <h3 className={`font-semibold mb-2 ${allTablesExist ? 'text-green-900' : 'text-yellow-900'}`}>
                {allTablesExist ? '✅ Database Schema Deployed' : '⚠️ Database Schema Not Deployed'}
            </h3>
            
            <div className="space-y-2 text-sm">
                {Object.entries(status.tables).map(([table, info]: [string, any]) => (
                    <div key={table} className="flex items-center gap-2">
                        <span className={info.exists ? 'text-green-600' : 'text-red-600'}>
                            {info.exists ? '✓' : '✗'}
                        </span>
                        <span className="font-mono">{table}</span>
                        {info.exists ? (
                            <span className="text-gray-600">
                                {info.hasData ? '(has data)' : '(empty)'}
                            </span>
                        ) : (
                            <span className="text-red-600 text-xs">
                                {info.error}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {!allTablesExist && (
                <div className="mt-4 p-3 bg-white rounded border border-yellow-300">
                    <h4 className="font-semibold text-yellow-900 mb-2">Action Required:</h4>
                    <ol className="text-xs text-yellow-800 space-y-1 list-decimal list-inside">
                        <li>Go to: <a href="https://app.supabase.com/project/gjbrjysuqdvvqlxklvos/sql/new" target="_blank" className="text-blue-600 underline">Supabase SQL Editor</a></li>
                        <li>Copy the entire content of <code className="bg-yellow-100 px-1">supabase-schema.sql</code></li>
                        <li>Paste it into the SQL editor and click "RUN"</li>
                        <li>Wait for success confirmation</li>
                        <li>Refresh this page</li>
                    </ol>
                </div>
            )}

            <button
                onClick={checkDatabaseStatus}
                className="mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
                Re-check Database Status
            </button>
        </div>
    );
};
