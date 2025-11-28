// Quick test script for Gemini API
// Run with: node test-gemini.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

console.log('🔍 Testing Gemini API Connection...\n');

if (!API_KEY) {
  console.error('❌ No API key found in .env.local');
  console.log('Please add your Gemini API key to VITE_GEMINI_API_KEY in .env.local');
  process.exit(1);
}

if (!API_KEY.startsWith('AIza')) {
  console.error('❌ Invalid API key format');
  console.log('Gemini API keys should start with "AIza..."');
  console.log('Get your key from: https://makersuite.google.com/app/apikey');
  process.exit(1);
}

console.log('✅ API key found and formatted correctly');
console.log(`Key starts with: ${API_KEY.substring(0, 10)}...`);

try {
  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  // Test model access
  console.log('\n🧪 Testing model access...');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  
  // Simple test prompt
  console.log('📝 Sending test prompt...');
  const prompt = "Say 'Hello! Gemini API is working!' in one sentence.";
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  console.log('\n🎉 SUCCESS! Gemini API is working!');
  console.log(`Response: ${text}`);
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  
  if (error.message.includes('API_KEY_INVALID')) {
    console.log('\n🔧 SOLUTION: Your API key is invalid');
    console.log('1. Go to https://makersuite.google.com/app/apikey');
    console.log('2. Create a new API key');
    console.log('3. Make sure it starts with "AIza..."');
  }
  
  if (error.message.includes('models/gemini')) {
    console.log('\n🔧 SOLUTION: Model access issue');
    console.log('1. Make sure you created the key in Google AI Studio (not Google Cloud)');
    console.log('2. Check if Gemini is available in your region');
    console.log('3. Try enabling billing in Google Cloud Console');
  }
  
  if (error.message.includes('403')) {
    console.log('\n🔧 SOLUTION: Permission denied');
    console.log('1. Enable billing in Google Cloud Console');
    console.log('2. Check API restrictions on your key');
    console.log('3. Make sure your IP/location is allowed');
  }
  
  if (error.message.includes('LOCATION')) {
    console.log('\n🔧 SOLUTION: Geographic restriction');
    console.log('1. Gemini API may not be available in your country');
    console.log('2. Try using a VPN to a supported region (US, UK, etc.)');
    console.log('3. Check Google AI availability for your location');
  }
}