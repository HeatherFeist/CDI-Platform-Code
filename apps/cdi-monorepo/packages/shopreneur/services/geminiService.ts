
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductDescription = async (
  productName: string,
  category: string,
  keywords: string
): Promise<string> => {
  try {
    // Updated to gemini-3-flash-preview for basic text generation tasks
    const modelName = 'gemini-3-flash-preview';
    const prompt = `
      You are a trendy, Gen Z savvy copywriter for a teenage girl's online boutique on the "Shop'reneur" platform.
      Write a catchy, short, and appealing product description (max 40 words) for a product named "${productName}".
      Category: ${category}.
      Keywords/Vibe: ${keywords}.
      Use emojis sparingly but effectively. Make it sound exciting!
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    return response.text || "Check out this amazing find!";
  } catch (error) {
    console.error("Error generating description:", error);
    return "A must-have item for your collection!";
  }
};

export const generateProductImage = async (
  productName: string,
  category: string,
  description: string
): Promise<string | null> => {
  try {
    const prompt = `Professional product photography of ${productName}. 
    Category: ${category}. 
    Description: ${description}. 
    Style: High-end e-commerce, clean white or pastel background, studio lighting, 4k, detailed. 
    Ensure the item is the main focus and fully visible. No text overlays.`;

    // gemini-2.5-flash-image is correct for general image generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating product image:", error);
    return null;
  }
};

export const generateTryOnImage = async (
  userImageBase64: string,
  productName: string,
  productCategory: string,
  productDescription: string
): Promise<string | null> => {
  try {
    // Clean base64 string if it contains the data URL prefix
    const cleanBase64 = userImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    // gemini-2.5-flash-image is used for image editing tasks
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: `Detailed Instruction: This is a photo of a user who wants to virtually try on a product. 
            Generate a realistic image of this EXACT person wearing the following item: "${productName}". 
            
            Product Details: ${productDescription}
            Category: ${productCategory}
            
            Requirements:
            1. Maintain the person's identity, facial features, hair, and body shape exactly as they appear in the original photo.
            2. Maintain the background of the original photo if possible, or use a neutral flattering background if the outfit change requires it.
            3. The clothing/item should fit naturally.
            4. High quality, photorealistic output.
            `
          },
        ],
      },
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error generating try-on image:", error);
    throw error;
  }
};

export const searchTrendingProducts = async (query: string): Promise<any[]> => {
  try {
    const prompt = `
      You are a product scout for a teen dropshipping business.
      Generate a list of 4 trending/viral product ideas based on the search term: "${query}".
      
      Return ONLY a JSON array of objects with this exact schema:
      [
        {
          "name": "Creative Product Name",
          "price": number (realistic retail price),
          "category": "One of: Beauty & Skincare, Fashion & Apparel, Accessories, Tech & Gadgets",
          "description": "Short catchy description",
          "keywords": "comma, separated, keywords"
        }
      ]
    `;

    // gemini-3-flash-preview for structured text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              keywords: { type: Type.STRING },
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
};

// --- Business Mentor Functions ---

export const getBusinessMentorChat = () => {
  // gemini-3-flash-preview for interactive chat
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are "The Mentor", a smart, savvy, and encouraging AI business coach for the Shop'reneur app. 
      Your audience is teenage entrepreneurs who are dropshipping or curating products from Amazon/Shein.
      
      Your goal:
      1. Answer questions about entrepreneurship, affiliate marketing, profit margins, and branding.
      2. Be concise, use emojis, and keep the vibe motivational but practical.
      3. If they ask about trends, explain that you can "Scan the socials" for them if they click the scan button (don't try to scan in normal chat).
      `,
    }
  });
};

export const scanTrendsAndGenerateChallenges = async () => {
  try {
    const prompt = `
      Step 1: Use Google Search to find the top 3 current viral trends on TikTok and Instagram for teenagers (fashion, beauty, or lifestyle) RIGHT NOW.
      Step 2: Based on these trends, generate 3 specific business challenges for a shop owner to capitalize on them.
      
      Return ONLY a JSON array of objects with this schema:
      [
        {
          "title": "Short catchy title",
          "description": "Specific instruction on what content to create based on the trend",
          "platform": "TikTok" | "Instagram" | "YouTube",
          "difficulty": "Easy" | "Medium" | "Hard",
          "xpReward": number (between 100-500)
        }
      ]
    `;

    // gemini-3-pro-preview for complex reasoning task with search grounding
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              platform: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              xpReward: { type: Type.NUMBER },
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error scanning trends:", error);
    // Fallback data if search fails or hits limits
    return [
      {
        title: "GRWM: School Fit",
        description: "Get Ready With Me videos are trending. Show a outfit combo from your shop!",
        platform: "TikTok",
        difficulty: "Easy",
        xpReward: 150
      },
      {
        title: "ASMR Unboxing",
        description: "Satisfying unboxing videos are viral. Film a silent unboxing of your best seller.",
        platform: "Instagram",
        difficulty: "Medium",
        xpReward: 300
      }
    ];
  }
};
