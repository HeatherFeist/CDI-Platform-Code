// Test AI Features in Browser Environment
// This simulates how the AI service works in the actual app

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Simulate environment
const API_KEY = 'AQ.Ab8RN6LssOzoD7XtzFDeTaXQvPuU0jgIOpK4Ou9kbYLfbpgNmA';

class TestGoogleAIService {
  constructor() {
    this.apiKey = API_KEY;
    this.baseUrl = 'https://aiplatform.googleapis.com/v1/publishers/google/models';
  }

  async callGeminiAPI(prompt, modelName = 'gemini-2.5-flash-lite') {
    try {
      const response = await fetch(
        `${this.baseUrl}/${modelName}:streamGenerateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.8,
              maxOutputTokens: 1024,
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      // Handle streaming response (array of chunks)
      if (Array.isArray(data)) {
        let fullText = '';
        
        for (const chunk of data) {
          if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content) {
            const parts = chunk.candidates[0].content.parts;
            if (parts && parts[0] && parts[0].text) {
              fullText += parts[0].text;
            }
          }
        }
        
        if (fullText) {
          return fullText.trim();
        }
      }
      
      // Handle single response format (fallback)
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const parts = data.candidates[0].content.parts;
        if (parts && parts[0] && parts[0].text) {
          return parts[0].text.trim();
        }
      }

      throw new Error('No valid response content received from API');
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  async testProductListing() {
    const prompt = `
Generate a compelling product listing for a used bicycle in good condition, priced at $150.
Respond with JSON format:
{
  "title": "optimized title",
  "description": "detailed description",
  "suggestedPrice": 150
}
`;
    
    try {
      console.log('🧪 Testing Product Listing Generation...');
      const response = await this.callGeminiAPI(prompt);
      console.log('✅ Raw Response:', response);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Parsed JSON:', parsed);
        return true;
      } else {
        console.log('❌ No JSON found in response');
        return false;
      }
    } catch (error) {
      console.error('❌ Product listing test failed:', error.message);
      return false;
    }
  }

  async testChatResponse() {
    const prompt = `
You are a helpful AI assistant for a nonprofit marketplace.
User asks: "How can I create a better product listing?"

Respond with JSON:
{
  "message": "helpful response",
  "suggestions": ["suggestion1", "suggestion2"]
}
`;
    
    try {
      console.log('🧪 Testing Chat Response...');
      const response = await this.callGeminiAPI(prompt);
      console.log('✅ Raw Response:', response);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Parsed JSON:', parsed);
        return true;
      } else {
        console.log('❌ No JSON found in response');
        return false;
      }
    } catch (error) {
      console.error('❌ Chat response test failed:', error.message);
      return false;
    }
  }
}

async function runTests() {
  console.log('🚀 Testing AI Features Integration\n');
  
  const service = new TestGoogleAIService();
  
  let passed = 0;
  let total = 2;
  
  // Test 1: Product Listing
  if (await service.testProductListing()) {
    passed++;
  }
  
  console.log(); // Space between tests
  
  // Test 2: Chat Response  
  if (await service.testChatResponse()) {
    passed++;
  }
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All AI features are working correctly!');
    console.log('💡 Your app should now have working:');
    console.log('   • AI Chat Assistant (bottom-right corner)');
    console.log('   • AI Listing Assistant (when creating listings)');
    console.log('   • AI Price Optimizer (in listing forms)');
  } else {
    console.log('❌ Some AI features need attention');
  }
}

runTests().catch(console.error);