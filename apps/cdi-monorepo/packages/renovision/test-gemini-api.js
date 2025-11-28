// TEST GEMINI API DIRECTLY
// Copy this entire code, paste into browser console (F12 > Console tab), and press Enter

const API_KEY = 'AIzaSyDJtwPJCmnjjCSEPhtsfY7amD0PrVHu5IM';

const testGeminiAPI = async () => {
    console.log('🧪 Testing Gemini API...');
    console.log('API Key:', API_KEY.substring(0, 20) + '...');
    
    const prompt = "List 3 popular paint brands for contractors in JSON format";
    
    try {
        // Test v1 endpoint with gemini-1.5-flash
        console.log('\n1️⃣ Testing v1/gemini-1.5-flash...');
        const url1 = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        console.log('URL:', url1);
        
        const response1 = await fetch(url1, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });
        
        console.log('Status:', response1.status);
        const data1 = await response1.json();
        console.log('Response:', data1);
        
        if (response1.ok) {
            console.log('✅ SUCCESS with v1/gemini-1.5-flash!');
            console.log('Text response:', data1.candidates[0]?.content?.parts[0]?.text);
            return;
        } else {
            console.log('❌ v1/gemini-1.5-flash failed');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
    // Test alternative endpoints
    try {
        console.log('\n2️⃣ Testing v1/gemini-1.5-pro...');
        const url2 = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;
        
        const response2 = await fetch(url2, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });
        
        console.log('Status:', response2.status);
        const data2 = await response2.json();
        console.log('Response:', data2);
        
        if (response2.ok) {
            console.log('✅ SUCCESS with v1/gemini-1.5-pro!');
        } else {
            console.log('❌ v1/gemini-1.5-pro also failed');
        }
        
    } catch (error) {
        console.error('❌ Second test failed:', error);
    }
    
    // Test if API key needs to be enabled for specific models
    try {
        console.log('\n3️⃣ Testing v1beta/gemini-1.5-flash...');
        const url3 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const response3 = await fetch(url3, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });
        
        console.log('Status:', response3.status);
        const data3 = await response3.json();
        console.log('Response:', data3);
        
        if (response3.ok) {
            console.log('✅ SUCCESS with v1beta/gemini-1.5-flash!');
        }
        
    } catch (error) {
        console.error('❌ Third test failed:', error);
    }
};

// Run the test
testGeminiAPI();

// INSTRUCTIONS:
// 1. Go to https://renovision.web.app
// 2. Press F12 to open Developer Tools
// 3. Click Console tab
// 4. Copy this ENTIRE file and paste into console
// 5. Press Enter
// 6. Copy ALL the output and send it to me
