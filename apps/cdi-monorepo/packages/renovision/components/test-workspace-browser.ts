/**
 * Browser-Based Workspace Integration Test
 * 
 * Open your browser console (F12) and paste this code to test
 * Google Workspace integration.
 */

// Test if service is configured
import { isWorkspaceConfigured, testWorkspaceConnection } from '../services/workspaceProvisioningService';

console.log('='.repeat(60));
console.log('🧪 TESTING GOOGLE WORKSPACE INTEGRATION');
console.log('='.repeat(60));

// Test 1: Configuration
console.log('\nTest 1: Configuration Check');
const configured = isWorkspaceConfigured();
console.log(configured ? '✅ Configuration found' : '❌ Configuration missing');

// Test 2: Connection (async)
console.log('\nTest 2: Testing connection...');
testWorkspaceConnection()
    .then(success => {
        if (success) {
            console.log('✅ Connection successful!');
            console.log('   - Admin SDK API is enabled');
            console.log('   - Domain-wide delegation is configured');
            console.log('   - Ready to provision accounts');
        } else {
            console.log('❌ Connection failed');
        }
    })
    .catch(error => {
        console.error('❌ Connection error:', error);
        
        if (error.message?.includes('403')) {
            console.log('\n💡 Issue: Domain-wide delegation not configured');
            console.log('   Fix: Review Step 2B in WORKSPACE_INTEGRATION_COMPLETE.md');
        } else if (error.message?.includes('404')) {
            console.log('\n💡 Issue: Admin SDK API not enabled');
            console.log('   Fix: Review Step 2A in WORKSPACE_INTEGRATION_COMPLETE.md');
        }
    });

console.log('\n' + '='.repeat(60));
