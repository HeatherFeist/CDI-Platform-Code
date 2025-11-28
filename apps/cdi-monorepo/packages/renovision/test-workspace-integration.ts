/**
 * Test Google Workspace Integration
 * 
 * This script tests if the Workspace provisioning service is configured correctly
 * and can connect to Google Workspace.
 */

import { testWorkspaceConnection, isWorkspaceConfigured } from './services/workspaceProvisioningService';

async function runTests() {
    console.log('='.repeat(60));
    console.log('🧪 TESTING GOOGLE WORKSPACE INTEGRATION');
    console.log('='.repeat(60));
    console.log('');

    // Test 1: Check configuration
    console.log('Test 1: Checking configuration...');
    const isConfigured = isWorkspaceConfigured();
    
    if (isConfigured) {
        console.log('✅ Configuration found');
        console.log('   - Service Account: home-reno-vision-pro@appspot.gserviceaccount.com');
        console.log('   - Domain: constructivedesignsinc.org');
        console.log('');
    } else {
        console.log('❌ Configuration missing!');
        console.log('   Check workspaceProvisioningService.ts');
        return;
    }

    // Test 2: Test connection
    console.log('Test 2: Testing connection to Google Workspace...');
    try {
        const connected = await testWorkspaceConnection();
        
        if (connected) {
            console.log('✅ Connection successful!');
            console.log('   - Admin SDK API is enabled');
            console.log('   - Domain-wide delegation is configured');
            console.log('   - Service account has proper permissions');
            console.log('');
        } else {
            console.log('❌ Connection failed!');
            console.log('   Check console for error details');
            console.log('');
        }
    } catch (error: any) {
        console.log('❌ Connection error:', error.message);
        console.log('');
        
        if (error.message.includes('403')) {
            console.log('💡 Possible issues:');
            console.log('   1. Domain-wide delegation not set up');
            console.log('   2. OAuth scopes incorrect');
            console.log('   3. Wrong admin email in config');
        } else if (error.message.includes('404')) {
            console.log('💡 Possible issues:');
            console.log('   1. Admin SDK API not enabled');
            console.log('   2. Wrong project selected');
        }
        console.log('');
    }

    console.log('='.repeat(60));
    console.log('🎯 NEXT STEPS');
    console.log('='.repeat(60));
    console.log('');
    console.log('If tests passed:');
    console.log('   ✅ Go to your app signup page');
    console.log('   ✅ Create a test user');
    console.log('   ✅ Check console for Workspace provisioning logs');
    console.log('   ✅ Verify user created in Google Workspace Admin');
    console.log('');
    console.log('If tests failed:');
    console.log('   ❌ Review WORKSPACE_INTEGRATION_COMPLETE.md');
    console.log('   ❌ Double-check Step 2A (Enable Admin SDK)');
    console.log('   ❌ Double-check Step 2B (Domain-wide delegation)');
    console.log('');
}

runTests().catch(console.error);
