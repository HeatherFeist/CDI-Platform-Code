/**
 * Google Apps Script for Member Application Form Webhook
 * 
 * This script automatically sends form responses to your Next.js application
 * when someone submits a member application through Google Forms.
 * 
 * Setup Instructions:
 * 1. Open Google Apps Script (script.google.com)
 * 2. Create a new project
 * 3. Replace the default code with this script
 * 4. Update the WEBHOOK_URL constant with your actual endpoint
 * 5. Save the project and set up triggers
 * 
 * Required Permissions:
 * - Google Forms API
 * - Google Sheets API
 * - URL Fetch (for webhooks)
 */

// ===========================
// CONFIGURATION
// ===========================

// Your Next.js application webhook endpoint
const WEBHOOK_URL = 'https://your-domain.com/api/webhooks/google-forms';

// Optional: Webhook secret for security (should match your .env file)
const WEBHOOK_SECRET = 'your-webhook-secret-key';

// Form ID (will be auto-detected if this script is bound to a form)
const FORM_ID = 'your-form-id'; // Only needed if not bound to form

// Sheet ID for logging (optional)
const LOG_SHEET_ID = 'your-log-sheet-id';

// ===========================
// MAIN WEBHOOK FUNCTION
// ===========================

/**
 * Main function that handles form submissions
 * This should be set as the trigger function
 */
function onFormSubmit(e) {
  try {
    console.log('Form submission detected');
    
    // Get form response data
    const formResponse = e.response;
    const form = FormApp.getActiveForm();
    
    // Parse the form data
    const formData = parseFormResponse(formResponse, form);
    
    // Log the submission (optional)
    logSubmission(formData);
    
    // Send to webhook
    const webhookResult = sendToWebhook(formData);
    
    console.log('Webhook result:', webhookResult);
    
    // Update form response with processing status (optional)
    if (webhookResult.success) {
      console.log('Successfully processed form submission');
    } else {
      console.error('Failed to process form submission:', webhookResult.error);
      
      // You might want to add retry logic here
      retryWebhook(formData, 3);
    }
    
  } catch (error) {
    console.error('Error in onFormSubmit:', error);
    
    // Log error for debugging
    logError(error, e);
  }
}

/**
 * Parse form response into standardized format
 */
function parseFormResponse(formResponse, form) {
  const items = form.getItems();
  const responses = formResponse.getItemResponses();
  
  const formData = {
    responseId: formResponse.getId(),
    timestamp: formResponse.getTimestamp().toISOString(),
    respondentEmail: formResponse.getRespondentEmail(),
    editResponseUrl: formResponse.getEditResponseUrl()
  };
  
  // Map responses to field names
  responses.forEach(itemResponse => {
    const item = itemResponse.getItem();
    const title = item.getTitle().toLowerCase();
    const response = itemResponse.getResponse();
    
    // Map form fields to standard field names
    // Adjust these mappings based on your actual form fields
    if (title.includes('email')) {
      formData.email = response;
    } else if (title.includes('first name')) {
      formData.firstName = response;
    } else if (title.includes('last name')) {
      formData.lastName = response;
    } else if (title.includes('phone')) {
      formData.phone = response;
    } else if (title.includes('address')) {
      formData.address = response;
    } else if (title.includes('city')) {
      formData.city = response;
    } else if (title.includes('state')) {
      formData.state = response;
    } else if (title.includes('zip') || title.includes('postal')) {
      formData.zipCode = response;
    } else if (title.includes('store name') || title.includes('business name')) {
      formData.storeName = response;
    } else if (title.includes('store description') || title.includes('business description')) {
      formData.storeDescription = response;
    } else if (title.includes('business type') || title.includes('category')) {
      formData.businessType = response;
    } else if (title.includes('tier') || title.includes('membership')) {
      formData.tierRequested = response;
    } else if (title.includes('referral code')) {
      formData.referralCode = response;
    } else if (title.includes('mentor')) {
      formData.mentorUsername = response;
    }
  });
  
  // Ensure email is set (fallback to respondent email)
  if (!formData.email && formData.respondentEmail) {
    formData.email = formData.respondentEmail;
  }
  
  return formData;
}

/**
 * Send form data to webhook endpoint
 */
function sendToWebhook(formData, retryCount = 0) {
  try {
    const payload = {
      ...formData,
      source: 'google-forms',
      retryCount: retryCount
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify(payload)
    };
    
    // Add webhook signature if secret is configured
    if (WEBHOOK_SECRET) {
      const signature = generateSignature(JSON.stringify(payload), WEBHOOK_SECRET);
      options.headers['x-webhook-signature'] = signature;
    }
    
    console.log('Sending webhook to:', WEBHOOK_URL);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('Webhook response code:', responseCode);
    console.log('Webhook response:', responseText);
    
    if (responseCode >= 200 && responseCode < 300) {
      const result = JSON.parse(responseText);
      return {
        success: true,
        data: result
      };
    } else {
      return {
        success: false,
        error: `HTTP ${responseCode}: ${responseText}`
      };
    }
    
  } catch (error) {
    console.error('Error sending webhook:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Retry webhook with exponential backoff
 */
function retryWebhook(formData, maxRetries) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Retry attempt ${attempt} of ${maxRetries}`);
    
    // Wait before retry (exponential backoff)
    const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s, etc.
    Utilities.sleep(delay);
    
    const result = sendToWebhook(formData, attempt);
    
    if (result.success) {
      console.log(`Retry attempt ${attempt} succeeded`);
      return result;
    }
    
    console.log(`Retry attempt ${attempt} failed:`, result.error);
  }
  
  console.error(`All ${maxRetries} retry attempts failed`);
  return { success: false, error: 'Max retries exceeded' };
}

/**
 * Generate HMAC signature for webhook security
 */
function generateSignature(payload, secret) {
  const signature = Utilities.computeHmacSha256Signature(payload, secret);
  const hexSignature = signature.map(byte => {
    const hex = (byte & 0xFF).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
  
  return `sha256=${hexSignature}`;
}

/**
 * Log form submission for debugging
 */
function logSubmission(formData) {
  if (!LOG_SHEET_ID) return;
  
  try {
    const sheet = SpreadsheetApp.openById(LOG_SHEET_ID).getActiveSheet();
    
    // Add headers if this is the first row
    if (sheet.getLastRow() === 0) {
      const headers = [
        'Timestamp', 'Email', 'First Name', 'Last Name', 'Phone',
        'Store Name', 'Business Type', 'Tier Requested', 'Status', 'Response ID'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    // Add the form data
    const rowData = [
      formData.timestamp,
      formData.email || '',
      formData.firstName || '',
      formData.lastName || '',
      formData.phone || '',
      formData.storeName || '',
      formData.businessType || '',
      formData.tierRequested || '',
      'LOGGED',
      formData.responseId || ''
    ];
    
    sheet.appendRow(rowData);
    
  } catch (error) {
    console.error('Error logging submission:', error);
  }
}

/**
 * Log errors for debugging
 */
function logError(error, event) {
  console.error('Error details:', {
    error: error.toString(),
    stack: error.stack,
    event: event ? event.toString() : 'No event data'
  });
  
  // Optionally send error to your error tracking service
  // sendErrorToTrackingService(error, event);
}

// ===========================
// SETUP AND TESTING FUNCTIONS
// ===========================

/**
 * Test function to verify webhook connectivity
 * Run this manually to test your setup
 */
function testWebhook() {
  const testData = {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '555-123-4567',
    address: '123 Test St',
    city: 'Test City',
    state: 'OH',
    zipCode: '12345',
    storeName: 'Test Store',
    storeDescription: 'A test store for validation',
    businessType: 'Retail',
    tierRequested: 'Free',
    responseId: 'test-response-' + Date.now(),
    timestamp: new Date().toISOString(),
    source: 'manual-test'
  };
  
  console.log('Testing webhook with sample data...');
  
  const result = sendToWebhook(testData);
  
  if (result.success) {
    console.log('✅ Webhook test successful!');
    console.log('Response:', result.data);
  } else {
    console.log('❌ Webhook test failed!');
    console.log('Error:', result.error);
  }
  
  return result;
}

/**
 * Setup function to install triggers
 * Run this once to set up the form submission trigger
 */
function setupTriggers() {
  try {
    // Delete existing triggers to avoid duplicates
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'onFormSubmit') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create new form submit trigger
    const form = FormApp.getActiveForm();
    if (form) {
      ScriptApp.newTrigger('onFormSubmit')
        .onForm(form)
        .onFormSubmit()
        .create();
      
      console.log('✅ Form submit trigger created successfully');
    } else {
      console.log('❌ No active form found. Make sure this script is bound to a Google Form.');
    }
    
  } catch (error) {
    console.error('Error setting up triggers:', error);
  }
}

/**
 * Get form information for debugging
 */
function getFormInfo() {
  try {
    const form = FormApp.getActiveForm();
    if (!form) {
      console.log('No active form found');
      return;
    }
    
    console.log('Form Title:', form.getTitle());
    console.log('Form ID:', form.getId());
    console.log('Form URL:', form.getEditUrl());
    
    const items = form.getItems();
    console.log('Form Fields:');
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.getTitle()} (${item.getType()})`);
    });
    
  } catch (error) {
    console.error('Error getting form info:', error);
  }
}

// ===========================
// CONFIGURATION VALIDATION
// ===========================

/**
 * Validate configuration
 */
function validateConfiguration() {
  const issues = [];
  
  if (!WEBHOOK_URL || WEBHOOK_URL === 'https://your-domain.com/api/webhooks/google-forms') {
    issues.push('WEBHOOK_URL is not configured');
  }
  
  if (WEBHOOK_URL && !WEBHOOK_URL.startsWith('https://')) {
    issues.push('WEBHOOK_URL should use HTTPS for security');
  }
  
  try {
    const form = FormApp.getActiveForm();
    if (!form) {
      issues.push('Script is not bound to a Google Form');
    }
  } catch (error) {
    issues.push('Error accessing form: ' + error.message);
  }
  
  if (issues.length > 0) {
    console.log('❌ Configuration Issues:');
    issues.forEach(issue => console.log('- ' + issue));
    return false;
  } else {
    console.log('✅ Configuration looks good!');
    return true;
  }
}

// ===========================
// MANUAL EXECUTION HELPERS
// ===========================

/**
 * Run this function manually to set everything up
 */
function initialSetup() {
  console.log('Starting initial setup...');
  
  // Validate configuration
  if (!validateConfiguration()) {
    console.log('Please fix configuration issues before proceeding');
    return;
  }
  
  // Get form information
  getFormInfo();
  
  // Set up triggers
  setupTriggers();
  
  // Test webhook
  testWebhook();
  
  console.log('Initial setup complete!');
}