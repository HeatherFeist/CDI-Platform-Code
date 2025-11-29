const https = require('https');

const data = JSON.stringify({
    client_id: "6796072d486f1b002290d853",
    secret: "493138c29cde45986dc8fbcb10c085",
    user: {
        client_user_id: "user-id-test-" + Date.now(),
        phone_number: "+1 415 5550123"
    },
    client_name: "Quantum Wallet",
    products: ["transactions"],
    country_codes: ["US"],
    language: "en",
    // redirect_uri is commented out to avoid "INVALID_FIELD" error if not registered in dashboard
    // redirect_uri: "https://quantum-wallet-app.web.app/", 
    account_filters: {
        depository: {
            account_subtypes: ["checking", "savings"]
        },
        credit: {
            account_subtypes: ["credit card"]
        }
    }
});

const options = {
    hostname: 'sandbox.plaid.com',
    path: '/link/token/create',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Sending request to Plaid Sandbox...');

const req = https.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        try {
            const parsed = JSON.parse(responseBody);
            console.log('Response:', JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log('Raw Response:', responseBody);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
