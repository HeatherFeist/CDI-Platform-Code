// =====================================================
// TEST YOUR GEMINI API KEY
// =====================================================
// Paste this in browser console (F12 > Console)
// =====================================================

const API_KEY = 'AIzaSyDJtwPJCmnjjCSEPhtsfY7amD0PrVHu5IM';

async function testGeminiKey() {
    console.log('🧪 Testing Gemini API key...');
    
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: 'Say hello in one word' }]
                    }]
                })
            }
        );

        console.log('Status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCCESS! API key works!');
            console.log('Response:', data.candidates[0]?.content?.parts[0]?.text);
            return true;
        } else {
            const error = await response.text();
            console.log('❌ FAILED! Status:', response.status);
            console.log('Error:', error);
            
            if (response.status === 404) {
                console.log('\n🔴 ERROR: API key not enabled for Gemini API');
                console.log('Fix it here: https://aistudio.google.com/app/apikey');
            } else if (response.status === 403) {
                console.log('\n🔴 ERROR: API key invalid or restricted');
            }
            
            return false;
        }
    } catch (error) {
        console.error('❌ Network error:', error);
        return false;
    }
}

// Run the test
testGeminiKey();
