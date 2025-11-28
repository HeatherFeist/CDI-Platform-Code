"use strict";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeVideoQuestion = exports.handlePayPalWebhook = exports.getCostEstimate = void 0;
const admin = __importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
const genai_1 = require("@google/genai");
const cors = require('cors');
// Initialize Firebase Admin SDK
admin.initializeApp();
// Initialize CORS middleware with specific allowed origins
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'https://home-reno-vision-pro.web.app', 'https://home-reno-vision-pro.firebaseapp.com'],
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
};
const corsHandler = cors(corsOptions);
// --- LIVE DATA FETCHING FUNCTION ---
async function getRealPrices(items, zipCode) {
    console.log(`Fetching prices for zip code: ${zipCode}`, items);
    const materials = [];
    let totalMaterialCost = 0;
    // Use mock data as a fallback
    for (const item of items) {
        const mockPrices = {
            'modern armchair': 479.99,
            'floor lamp': 125.50,
            'potted plant': 85.00,
            'paint': 55.00, // per gallon
        };
        // Use mock price if available, otherwise use default price
        const unitCost = mockPrices[item.name.toLowerCase()] || 150.00;
        const totalCost = unitCost * item.quantity;
        materials.push({
            item: item.name,
            quantity: item.quantity,
            unitCost: unitCost,
            totalCost: totalCost,
        });
        totalMaterialCost += totalCost;
    }
    // Mock labor estimate
    const labor = [{
            item: "General Labor & Installation",
            quantity: 8, // hours
            unitCost: 70, // per hour, could be adjusted by zip code
            totalCost: 8 * 70
        }];
    const totalLaborCost = labor.reduce((sum, item) => sum + item.totalCost, 0);
    const subtotal = totalMaterialCost + totalLaborCost;
    const platformFee = Number((subtotal * 0.10).toFixed(2)); // 10% platform fee
    const totalWithFee = Number((subtotal + platformFee).toFixed(2));
    return {
        materials,
        labor,
        totalMaterialCost,
        totalLaborCost,
        subtotal,
        platformFee,
        totalProjectCost: totalWithFee,
        zipCode,
        notes: "This estimate includes materials, labor, and a 10% platform fee. Prices may vary based on local suppliers and contractor rates. Always get a binding quote from a professional.",
    };
}
exports.getCostEstimate = firebase_functions_1.https.onRequest((request, response) => {
    // Use the cors handler to allow requests from your web app
    corsHandler(request, response, async () => {
        // We only want to handle POST requests for this function
        if (request.method !== "POST") {
            response.status(405).send("Method Not Allowed");
            return;
        }
        try {
            // Parse the 'items' and 'zipCode' from the request body
            const { items, zipCode } = request.body;
            // Basic validation
            if (!Array.isArray(items) || !zipCode || typeof zipCode !== 'string') {
                response.status(400).send("Invalid request body. Expected 'items' (array) and 'zipCode' (string).");
                return;
            }
            // Get the estimate
            const estimate = await getRealPrices(items, zipCode);
            // Add CORS headers explicitly
            response.set('Access-Control-Allow-Origin', request.headers.origin || '*');
            response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
            response.set('Access-Control-Allow-Headers', 'Content-Type');
            response.set('Access-Control-Allow-Credentials', 'true');
            // Send the response
            response.status(200).json(estimate);
        }
        catch (error) {
            console.error("Error in getCostEstimate function:", error);
            response.status(500).send("Internal Server Error");
        }
    });
});
// --- VIDEO QUESTION ANALYSIS FUNCTION ---
// PayPal Webhook handling
exports.handlePayPalWebhook = firebase_functions_1.https.onRequest(async (request, response) => {
    var _a;
    // Verify PayPal webhook signature
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
        console.error("PayPal webhook ID not configured");
        response.status(500).send("Internal Server Error");
        return;
    }
    try {
        const { event_type, resource } = request.body;
        // Get the payment record from Firestore
        const paymentsRef = admin.firestore().collection('payments');
        const paymentQuery = await paymentsRef
            .where('transactionId', '==', resource.id)
            .limit(1)
            .get();
        if (paymentQuery.empty) {
            console.warn(`No payment record found for transaction ${resource.id}`);
            response.status(200).send("OK");
            return;
        }
        const paymentDoc = paymentQuery.docs[0];
        switch (event_type) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                await paymentDoc.ref.update({
                    status: 'completed',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    metadata: {
                        paypalEvent: event_type,
                        captureId: resource.id,
                        captureStatus: resource.status,
                    }
                });
                break;
            case 'PAYMENT.CAPTURE.DENIED':
            case 'PAYMENT.CAPTURE.DECLINED':
                await paymentDoc.ref.update({
                    status: 'failed',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    metadata: {
                        paypalEvent: event_type,
                        captureId: resource.id,
                        captureStatus: resource.status,
                        reason: ((_a = resource.status_details) === null || _a === void 0 ? void 0 : _a.reason) || 'Unknown'
                    }
                });
                break;
            default:
                console.log(`Unhandled PayPal webhook event: ${event_type}`);
        }
        response.status(200).send("OK");
    }
    catch (error) {
        console.error("Error processing PayPal webhook:", error);
        response.status(500).send("Internal Server Error");
    }
});
exports.analyzeVideoQuestion = firebase_functions_1.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
        var _a, _b, _c, _d, _e;
        if (request.method !== "POST") {
            response.status(405).send("Method Not Allowed");
            return;
        }
        try {
            const { videoUrl, question, transcription } = request.body;
            // Basic validation
            if (!videoUrl || !question) {
                response.status(400).send("Invalid request body. Expected 'videoUrl' and 'question'.");
                return;
            }
            // Initialize Google GenAI with API key from environment
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("Missing Gemini API key");
            }
            const ai = new genai_1.GoogleGenAI({ apiKey });
            // Create context for analysis
            const context = `
Video Description: ${transcription || 'No transcription available'}
Customer Question: ${question}

Please analyze this renovation project request and provide:
1. A detailed analysis of what's needed
2. Suggested products and materials with specific recommendations
3. Estimated cost range based on current market prices
4. Estimated timeline for completion
5. Additional notes or considerations for the project

Format the response in a clear, structured way that can be parsed into sections.`;
            // Cast to any due to type mismatch in @google/generative-ai
            const model = ai.getGenerativeModel({ model: 'gemini-pro' });
            const prompt = model.startChat();
            const result = await prompt.sendMessage(context);
            if (!result || result instanceof Error) {
                throw new Error("Failed to get response from Gemini API");
            }
            const aiResponse = await result.text();
            // Parse the response into structured sections
            const sections = aiResponse.split('\n\n');
            const structuredResponse = {
                analysis: sections[0] || '',
                suggestedProducts: (sections[1] || '').split('\n').filter(Boolean),
                estimatedCost: parseFloat(((_c = (_b = (_a = sections[2]) === null || _a === void 0 ? void 0 : _a.match(/\$?([\d,]+)/)) === null || _b === void 0 ? void 0 : _b[1]) === null || _c === void 0 ? void 0 : _c.replace(',', '')) || '0'),
                timelineEstimate: parseInt(((_e = (_d = sections[3]) === null || _d === void 0 ? void 0 : _d.match(/(\d+)/)) === null || _e === void 0 ? void 0 : _e[1]) || '0'),
                additionalNotes: sections[4] || ''
            };
            // Store the analysis in Firestore
            const videoQuestionRef = admin.firestore().collection('videoQuestions').doc();
            await videoQuestionRef.set({
                id: videoQuestionRef.id,
                videoUrl,
                question,
                transcription: transcription || '',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                status: 'completed',
                aiResponse: structuredResponse
            });
            // Add CORS headers explicitly
            response.set('Access-Control-Allow-Origin', request.headers.origin || '*');
            response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
            response.set('Access-Control-Allow-Headers', 'Content-Type');
            response.set('Access-Control-Allow-Credentials', 'true');
            // Send the response
            response.status(200).json({
                id: videoQuestionRef.id,
                aiResponse: structuredResponse
            });
        }
        catch (error) {
            console.error("Error in analyzeVideoQuestion function:", error);
            response.status(500).send("Internal Server Error");
        }
    });
});
//# sourceMappingURL=index.js.map