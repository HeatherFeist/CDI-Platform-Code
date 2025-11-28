// Test Google AI Studio API connection
// Run with: node test-google-ai-studio.mjs

const API_KEY = 'AQ.Ab8RN6LssOzoD7XtzFDeTaXQvPuU0jgIOpK4Ou9kbYLfbpgNmA'; // Your actual API key

async function testGoogleAI() {
  console.log('🧪 Testing Google AI Studio connection...');
  
  if (!API_KEY) {
    console.error('❌ API key not found!');
    return;
  }

  const baseUrl = 'https://aiplatform.googleapis.com/v1/publishers/google/models';
  const prompt = `You are an AI assistant for a nonprofit marketplace. 
  Say hello and briefly explain how you can help sellers create better product listings. 
  Keep it under 50 words.`;

  try {
    console.log('🚀 Sending test prompt to Gemini 2.5 Flash Lite...');
    
    const response = await fetch(
      `${baseUrl}/gemini-2.5-flash-lite:streamGenerateContent?key=${API_KEY}`,
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
            maxOutputTokens: 100,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ API Error Response:', errorData);
      throw new Error(`API request failed: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('📡 Full API Response:', JSON.stringify(data, null, 2));
    
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
        console.log('✅ AI Response received:');
        console.log('📝', fullText);
        console.log('\n🎉 Google AI Studio integration test successful!');
        console.log('💡 Your Gemini 2.5 Flash Lite AI features are ready to use.');
        return;
      }
    }
    
    // Handle single response format (fallback)
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.log('❌ Unexpected response structure');
      console.log('📊 Response keys:', Object.keys(data));
      throw new Error('Invalid response format from API');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    
    console.log('✅ AI Response received:');
    console.log('📝', aiResponse);
    console.log('\n🎉 Google AI Studio integration test successful!');
    console.log('💡 Your Gemini 2.5 Flash Lite AI features are ready to use.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('403')) {
      console.log('\n🔧 Fix: Check your API key');
      console.log('🔗 Get a new key: https://makersuite.google.com/app/apikey');
    }
    
    if (error.message.includes('400')) {
      console.log('\n🔧 Fix: Check the request format');
    }
    
    if (error.message.includes('quota')) {
      console.log('\n🔧 Fix: You may have hit API quota limits');
    }
  }
}

testGoogleAI();