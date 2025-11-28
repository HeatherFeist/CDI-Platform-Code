// QUICK TEST: Find which Gemini model works with your API key
// Paste this in browser console (F12 > Console) and press Enter

const API_KEY = 'AIzaSyDJtwPJCmnjjCSEPhtsfY7amD0PrVHu5IM';

const testModels = async () => {
    const models = [
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest',
        'gemini-pro',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
    ];
    
    console.log('🧪 Testing which Gemini model works with your API key...\n');
    
    for (const model of models) {
        try {
            console.log(`Testing: ${model}...`);
            
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: "Say 'hello' in JSON format" }]
                    }]
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${model} WORKS!`);
                console.log('Response:', data.candidates[0]?.content?.parts[0]?.text);
                console.log(`\n🎯 USE THIS MODEL: ${model}\n`);
                return model;
            } else {
                const error = await response.text();
                console.log(`❌ ${model} failed (${response.status})`);
            }
        } catch (error) {
            console.log(`❌ ${model} error:`, error.message);
        }
    }
    
    console.log('\n⚠️ None of the models worked. Your API key might not be enabled for Gemini API.');
    console.log('Go to: https://aistudio.google.com/app/apikey');
    console.log('And make sure the API is enabled in Google Cloud Console.');
};

testModels();
