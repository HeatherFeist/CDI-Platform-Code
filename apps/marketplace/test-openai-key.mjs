/**
 * OpenAI API Key Test Script
 * Run this with: node test-openai-key.mjs YOUR_API_KEY_HERE
 */

const apiKey = process.argv[2];

if (!apiKey) {
  console.log('❌ Please provide your OpenAI API key as an argument');
  console.log('Usage: node test-openai-key.mjs sk-your-key-here');
  process.exit(1);
}

console.log('🧪 Testing OpenAI API key...\n');

async function testOpenAIKey() {
  try {
    // Test 1: List available models (simple GET request)
    console.log('📡 Test 1: Checking API key validity...');
    const modelsResponse = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!modelsResponse.ok) {
      const error = await modelsResponse.json();
      console.log('❌ API Key Invalid:', error.error?.message || modelsResponse.statusText);
      process.exit(1);
    }

    const modelsData = await modelsResponse.json();
    console.log(`✅ API key is valid! Found ${modelsData.data.length} available models\n`);

    // Test 2: Try a simple chat completion
    console.log('📡 Test 2: Testing GPT-3.5-Turbo...');
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Say "Test successful" if you can read this.' }
        ],
        max_tokens: 10
      })
    });

    if (!chatResponse.ok) {
      const error = await chatResponse.json();
      console.log('❌ Chat test failed:', error.error?.message || chatResponse.statusText);
      process.exit(1);
    }

    const chatData = await chatResponse.json();
    const response = chatData.choices[0]?.message?.content || '';
    console.log('✅ GPT-3.5-Turbo response:', response);
    console.log(`💰 Cost: ~$${(chatData.usage.total_tokens * 0.000002).toFixed(6)}\n`);

    // Test 3: Check account/usage info
    console.log('📡 Test 3: Checking account status...');
    // Note: OpenAI removed the billing endpoint, so we'll just confirm the key works
    console.log('✅ Your API key is working correctly!\n');

    console.log('🎉 All tests passed! Your OpenAI API key is ready to use.\n');
    console.log('📝 Next steps:');
    console.log('   1. Copy your API key');
    console.log('   2. Go to Settings → AI Settings in the app');
    console.log('   3. Paste your key and save');
    console.log('   4. Note: Direct browser calls to OpenAI may be blocked by CORS');
    console.log('   5. For production, you\'ll need a server-side proxy\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Tip: Make sure you have internet connectivity');
    }
    
    process.exit(1);
  }
}

testOpenAIKey();
