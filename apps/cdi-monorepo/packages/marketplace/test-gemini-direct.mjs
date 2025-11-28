// Direct test of Gemini API to diagnose key issues
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.argv[2];

if (!API_KEY) {
  console.log('❌ Usage: node test-gemini-direct.mjs YOUR_API_KEY_HERE');
  process.exit(1);
}

console.log('🔑 Testing API key:', API_KEY.substring(0, 10) + '...');
console.log('');

const modelsToTry = [
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash'
];

async function testModel(modelName) {
  try {
    console.log(`Testing model: ${modelName}...`);
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent('Say hello');
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ SUCCESS with ${modelName}`);
    console.log(`   Response: ${text.substring(0, 50)}...`);
    return true;
  } catch (error) {
    console.log(`❌ FAILED with ${modelName}`);
    console.log(`   Error: ${error.message}`);
    if (error.status) console.log(`   Status: ${error.status}`);
    return false;
  }
}

async function runTests() {
  console.log('Starting Gemini API tests...\n');
  
  let anySuccess = false;
  for (const model of modelsToTry) {
    const success = await testModel(model);
    if (success) {
      anySuccess = true;
      break;
    }
    console.log('');
  }
  
  if (anySuccess) {
    console.log('\n✅ API KEY WORKS! You can use this in your app.');
  } else {
    console.log('\n❌ API KEY FAILED ALL TESTS');
    console.log('\nPossible issues:');
    console.log('1. Geographic restriction - Gemini not available in your country');
    console.log('2. Wrong key source - Must be from https://aistudio.google.com/apikey');
    console.log('3. Key needs billing enabled in Google Cloud Console');
    console.log('4. Key is brand new - wait 5-10 minutes and try again');
  }
}

runTests().catch(console.error);
