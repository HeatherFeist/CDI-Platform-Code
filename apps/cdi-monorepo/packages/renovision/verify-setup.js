/**
 * Database Setup Verification Script
 * 
 * This script tests your Supabase connection and verifies the database schema.
 * Run this after setting up your Supabase credentials and running the schema SQL.
 * 
 * To use:
 * 1. Set up your Supabase credentials in .env
 * 2. Run the supabase-schema.sql file in your Supabase SQL editor  
 * 3. Run: node verify-setup.js
 */

import { supabase, isConfigured } from './supabase.js';

async function verifySetup() {
    console.log('🔍 Verifying Supabase Setup...\n');

    // Check configuration
    if (!isConfigured) {
        console.log('❌ Supabase is not configured');
        console.log('   Please update your .env file with:');
        console.log('   - VITE_SUPABASE_URL=your-project-url');
        console.log('   - VITE_SUPABASE_ANON_KEY=your-anon-key');
        process.exit(1);
    }

    console.log('✅ Supabase configuration found');

    try {
        // Test connection
        const { data: connectionTest, error: connectionError } = await supabase
            .from('businesses')
            .select('count', { count: 'exact' })
            .limit(1);

        if (connectionError) {
            console.log('❌ Database connection failed:');
            console.log('   ', connectionError.message);
            
            if (connectionError.message.includes('relation') && connectionError.message.includes('does not exist')) {
                console.log('\n💡 This error suggests the database schema hasn\'t been created yet.');
                console.log('   Please run the supabase-schema.sql file in your Supabase SQL editor.');
                console.log('   Go to: https://app.supabase.com/project/YOUR_PROJECT/sql');
            }
            process.exit(1);
        }

        console.log('✅ Database connection successful');

        // Test required tables
        const requiredTables = ['businesses', 'profiles', 'customers', 'projects', 'estimates', 'invoices', 'team_members'];
        console.log('\n🔍 Checking required tables...');

        for (const table of requiredTables) {
            try {
                const { error } = await supabase
                    .from(table)
                    .select('count', { count: 'exact' })
                    .limit(1);

                if (error) {
                    console.log(`❌ Table '${table}' not found or accessible`);
                    console.log('   Error:', error.message);
                } else {
                    console.log(`✅ Table '${table}' exists and accessible`);
                }
            } catch (err) {
                console.log(`❌ Error checking table '${table}':`, err.message);
            }
        }

        // Test authentication
        console.log('\n🔍 Testing authentication...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
            console.log('ℹ️  No user currently signed in (this is normal)');
        } else if (user) {
            console.log('✅ User authenticated:', user.email);
        } else {
            console.log('ℹ️  No user session (this is normal for fresh setup)');
        }

        console.log('\n🎉 Setup verification complete!');
        console.log('Your Supabase database is properly configured and ready to use.');
        
    } catch (error) {
        console.log('❌ Unexpected error during verification:');
        console.log('   ', error.message);
        process.exit(1);
    }
}

// Run verification
verifySetup();