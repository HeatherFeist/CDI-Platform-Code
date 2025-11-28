/**
 * Diagnostic Script: Check Product Suggestion Feature Setup
 * Run this to see what's missing for the AI Product Suggestion feature
 */

import { createClient } from '@supabase/supabase-js';

// Load from your .env or config
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Checking Product Suggestion Feature Setup...\n');

// Check 1: Database Tables
async function checkDatabaseTables() {
    console.log('1️⃣ Checking Database Tables...');
    
    try {
        // Check estimate_materials table
        const { data: materials, error: materialsError } = await supabase
            .from('estimate_materials')
            .select('id')
            .limit(1);
        
        if (materialsError) {
            if (materialsError.message.includes('does not exist')) {
                console.log('   ❌ estimate_materials table: NOT FOUND');
                console.log('      → Run SQL script from PRODUCT_SUGGESTION_SETUP.md Step 2\n');
            } else {
                console.log('   ⚠️  estimate_materials table: ERROR');
                console.log('      Error:', materialsError.message, '\n');
            }
        } else {
            console.log('   ✅ estimate_materials table: EXISTS');
            console.log(`      Found ${materials?.length || 0} records\n`);
        }
        
        // Check product_suggestions_cache table
        const { data: cache, error: cacheError } = await supabase
            .from('product_suggestions_cache')
            .select('id')
            .limit(1);
        
        if (cacheError) {
            if (cacheError.message.includes('does not exist')) {
                console.log('   ❌ product_suggestions_cache table: NOT FOUND');
                console.log('      → Run SQL script from PRODUCT_SUGGESTION_SETUP.md Step 2\n');
            } else {
                console.log('   ⚠️  product_suggestions_cache table: ERROR');
                console.log('      Error:', cacheError.message, '\n');
            }
        } else {
            console.log('   ✅ product_suggestions_cache table: EXISTS');
            console.log(`      Found ${cache?.length || 0} cached products\n`);
        }
        
    } catch (error) {
        console.log('   ❌ Database check failed:', error.message, '\n');
    }
}

// Check 2: Edge Functions
async function checkEdgeFunctions() {
    console.log('2️⃣ Checking Edge Functions...');
    
    // Check fetch-product-suggestions
    try {
        console.log('   Testing fetch-product-suggestions...');
        const { data, error } = await supabase.functions.invoke('fetch-product-suggestions', {
            body: {
                description: 'Test paint, 1 gallon',
                projectType: 'interior painting',
                quantity: 1,
                unit: 'gallon'
            }
        });
        
        if (error) {
            if (error.message.includes('not found') || error.message.includes('404')) {
                console.log('   ❌ fetch-product-suggestions: NOT DEPLOYED');
                console.log('      → Deploy using Supabase CLI (Step 4 in PRODUCT_SUGGESTION_SETUP.md)\n');
            } else if (error.message.includes('OPENAI_API_KEY')) {
                console.log('   ⚠️  fetch-product-suggestions: DEPLOYED but missing API key');
                console.log('      → Set OPENAI_API_KEY in Supabase secrets (Step 3)\n');
            } else {
                console.log('   ⚠️  fetch-product-suggestions: ERROR');
                console.log('      Error:', error.message, '\n');
            }
        } else {
            console.log('   ✅ fetch-product-suggestions: WORKING');
            console.log('      Returned:', data.category || 'Unknown category');
            console.log('      Products:', {
                budget: data.suggestions?.budget?.length || 0,
                mid: data.suggestions?.mid?.length || 0,
                high: data.suggestions?.high?.length || 0
            }, '\n');
        }
    } catch (error) {
        console.log('   ❌ fetch-product-suggestions test failed:', error.message, '\n');
    }
    
    // Check fetch-estimate-products
    try {
        console.log('   Testing fetch-estimate-products...');
        const { data, error } = await supabase.functions.invoke('fetch-estimate-products', {
            body: {
                items: [
                    { description: 'Paint', quantity: 2, unit: 'gallon' }
                ],
                projectType: 'interior painting'
            }
        });
        
        if (error) {
            if (error.message.includes('not found') || error.message.includes('404')) {
                console.log('   ❌ fetch-estimate-products: NOT DEPLOYED');
                console.log('      → Deploy using Supabase CLI (Step 4)\n');
            } else {
                console.log('   ⚠️  fetch-estimate-products: ERROR');
                console.log('      Error:', error.message, '\n');
            }
        } else {
            console.log('   ✅ fetch-estimate-products: WORKING');
            console.log('      Returned:', data.categories?.length || 0, 'categories\n');
        }
    } catch (error) {
        console.log('   ❌ fetch-estimate-products test failed:', error.message, '\n');
    }
}

// Check 3: Frontend Integration
async function checkFrontendIntegration() {
    console.log('3️⃣ Checking Frontend Integration...');
    
    // Check if service file exists
    try {
        const fs = await import('fs');
        const path = await import('path');
        
        const servicePath = path.join(process.cwd(), 'services', 'productSuggestionService.ts');
        if (fs.existsSync(servicePath)) {
            console.log('   ✅ productSuggestionService.ts: EXISTS\n');
        } else {
            console.log('   ❌ productSuggestionService.ts: NOT FOUND\n');
        }
        
        const componentPath = path.join(process.cwd(), 'components', 'estimates', 'ProductSelector.tsx');
        if (fs.existsSync(componentPath)) {
            console.log('   ✅ ProductSelector.tsx: EXISTS\n');
        } else {
            console.log('   ❌ ProductSelector.tsx: NOT FOUND\n');
        }
    } catch (error) {
        console.log('   ⚠️  File system check skipped (run in Node.js environment)\n');
    }
}

// Run all checks
async function runDiagnostics() {
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('  🤖 AI Product Suggestion Feature Diagnostics\n');
    console.log('═══════════════════════════════════════════════════════\n');
    
    await checkDatabaseTables();
    await checkEdgeFunctions();
    await checkFrontendIntegration();
    
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📋 Summary:\n');
    console.log('If you see ❌ errors above, follow these steps:');
    console.log('1. Read PRODUCT_SUGGESTION_SETUP.md');
    console.log('2. Complete the missing steps');
    console.log('3. Run this script again to verify\n');
    console.log('For detailed help: See PRODUCT_SUGGESTION_SETUP.md');
    console.log('═══════════════════════════════════════════════════════\n');
}

// Run diagnostics
runDiagnostics().catch(error => {
    console.error('Diagnostic script failed:', error);
    process.exit(1);
});
