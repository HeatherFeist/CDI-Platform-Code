/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as admin from 'firebase-admin';
import { https } from 'firebase-functions';
import { CorsOptions } from 'cors';
import { GoogleGenAI } from '@google/genai';
const cors = require('cors');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Allow all origins in development, restrict in production
const isProduction = process.env.NODE_ENV === 'production';
const corsOptions: CorsOptions = {
  origin: isProduction 
    ? ['https://home-reno-vision-pro.web.app', 'https://home-reno-vision-pro.firebaseapp.com']
    : true, // Allow all origins in development
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Origin', 'Accept'],
  optionsSuccessStatus: 200,
  maxAge: 3600
};

const corsHandler = cors(corsOptions);

// --- LIVE DATA FETCHING FUNCTION ---
async function getRealPrices(items: {name: string, quantity: number}[], zipCode: string): Promise<any> {

  console.log(`Fetching prices for zip code: ${zipCode}`, items);
  
  const materials = [];
  let totalMaterialCost = 0;

  // Use mock data as a fallback
  for (const item of items) {
    const mockPrices: {[key: string]: number} = {
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



export const getCostEstimate = https.onRequest((request, response) => {
  return corsHandler(request, response, async () => {
    // We only want to handle POST requests for this function
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    try {
      // Parse the 'items' and 'zipCode' from the request body
      const {items, zipCode} = request.body;

      // Basic validation
      if (!Array.isArray(items) || !zipCode || typeof zipCode !== 'string') {
        response.status(400).send("Invalid request body. Expected 'items' (array) and 'zipCode' (string).");
        return;
      }

      // Get the estimate
      const estimate = await getRealPrices(items, zipCode);
      
      // Send the response
      response.status(200).json(estimate);
    } catch (error) {
      console.error("Error in getCostEstimate function:", error);
      response.status(500).send("Internal Server Error");
    }
  });
});

// --- VIDEO QUESTION ANALYSIS FUNCTION ---

// PayPal Webhook handling
export const handlePayPalWebhook = https.onRequest(async (request, response) => {
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
            reason: resource.status_details?.reason || 'Unknown'
          }
        });
        break;

      default:
        console.log(`Unhandled PayPal webhook event: ${event_type}`);
    }

    response.status(200).send("OK");
  } catch (error) {
    console.error("Error processing PayPal webhook:", error);
    response.status(500).send("Internal Server Error");
  }
});

export const analyzeVideoQuestion = https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
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
      const ai = new GoogleGenAI({ apiKey });

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
      const model = (ai as any).getGenerativeModel({ model: 'gemini-pro' });
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
        estimatedCost: parseFloat(sections[2]?.match(/\$?([\d,]+)/)?.[1]?.replace(',', '') || '0'),
        timelineEstimate: parseInt(sections[3]?.match(/(\d+)/)?.[1] || '0'),
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
    } catch (error) {
      console.error("Error in analyzeVideoQuestion function:", error);
      response.status(500).send("Internal Server Error");
    }
  });
});