// Simple test script to verify Vertex AI connection
// Run this with: node test-vertex-ai.mjs

import { VertexAI } from '@google-cloud/vertexai';

const projectId = 'gen-lang-client-0262440131';
const location = 'us-central1';

console.log('🧪 Testing Vertex AI Connection...');
console.log(`Project: ${projectId}`);
console.log(`Location: ${location}`);

try {
  // Initialize Vertex AI
  const vertexAI = new VertexAI({
    project: projectId,
    location: location,
    // Will automatically use GOOGLE_APPLICATION_CREDENTIALS from environment
  });

  console.log('✅ Vertex AI initialized successfully');

  // Initialize Gemini model
  const model = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    generationConfig: {
      maxOutputTokens: 100,
      temperature: 0.7,
    }
  });

  console.log('✅ Gemini model initialized successfully');

  // Test a simple prompt
  const prompt = `You are an AI assistant for a nonprofit marketplace. 
  Say hello and briefly explain how you can help sellers create better product listings. 
  Keep it under 50 words.`;

  console.log('🚀 Sending test prompt...');
  
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  console.log('✅ AI Response received:');
  console.log('📝', text);
  console.log('\n🎉 Vertex AI integration test successful!');
  console.log('💡 Your AI features are ready to use.');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  
  if (error.message.includes('permission')) {
    console.log('\n🔧 Fix: Make sure Vertex AI API is enabled in Google Cloud Console');
    console.log('🔗 https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=gen-lang-client-0262440131');
  }
  
  if (error.message.includes('authentication')) {
    console.log('\n🔧 Fix: Check your service account JSON file path');
    console.log('📁 Expected: ./cdi-marketplace-service-account.json');
  }
  
  if (error.message.includes('quota')) {
    console.log('\n🔧 Fix: You may have hit API quota limits');
    console.log('📊 Check usage: https://console.cloud.google.com/iam-admin/quotas');
  }
}