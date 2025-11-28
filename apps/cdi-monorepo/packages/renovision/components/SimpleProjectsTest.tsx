import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export const SimpleProjectsTest: React.FC = () => {
    const [result, setResult] = useState<string>('Testing...');

    useEffect(() => {
        testDirectly();
    }, []);

    const testDirectly = async () => {
        try {
            console.log('🧪 Testing Supabase projects query directly...');
            
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .limit(5);

            if (error) {
                console.error('❌ Supabase error:', error);
                setResult(`❌ ERROR: ${error.message}`);
            } else {
                console.log('✅ Query successful:', data);
                setResult(`✅ SUCCESS! Found ${data?.length || 0} projects.\n\nSupabase is working perfectly!\n\nThe Projects tab should work now.`);
            }
        } catch (err) {
            console.error('❌ Unexpected error:', err);
            setResult(`❌ UNEXPECTED ERROR: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">🧪 Direct Supabase Test</h1>
            <div className="p-6 bg-gray-50 rounded-lg">
                <pre className="whitespace-pre-wrap text-lg">{result}</pre>
            </div>
            <div className="mt-4 text-sm text-gray-600">
                <p>This bypasses all service layers and queries Supabase directly.</p>
                <p>If this works, the issue is in the service layer caching.</p>
            </div>
        </div>
    );
};
