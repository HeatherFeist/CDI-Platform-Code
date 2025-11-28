// Quick AI Test in Browser Console
// Open browser console (F12) and paste this to test AI

const testAI = async () => {
  console.log('🧪 Testing AI Configuration...');
  
  // Check if API key is loaded
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log('API Key present:', !!apiKey);
  console.log('API Key value:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
  
  // Test direct API call
  try {
    const response = await fetch(
      `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:streamGenerateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: 'Say hello' }]
          }]
        })
      }
    );
    
    const data = await response.json();
    console.log('✅ AI Response:', data);
    
    if (Array.isArray(data) && data.length > 0) {
      const text = data.map(chunk => 
        chunk.candidates?.[0]?.content?.parts?.[0]?.text || ''
      ).join('');
      console.log('✅ Parsed text:', text);
    }
  } catch (error) {
    console.error('❌ AI Error:', error);
  }
};

testAI();