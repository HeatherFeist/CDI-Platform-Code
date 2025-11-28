import { GoogleGenAI, Modality } from "@google/genai";

// Helper to strip the data URL prefix if present, though GoogleGenAI usually handles raw base64
const cleanBase64 = (b64: string) => {
  return b64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

export const generateImageEdit = async (
  modelName: string,
  prompt: string,
  baseImageBase64: string,
  baseImageMimeType: string,
  referenceImages: { base64: string; mimeType: string }[] = []
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const parts: any[] = [];

  // 1. Add the Base Image (The image to be edited)
  parts.push({
    inlineData: {
      data: cleanBase64(baseImageBase64),
      mimeType: baseImageMimeType,
    },
  });

  // 2. Add Reference Images (Products, Styles, etc.)
  referenceImages.forEach((ref) => {
    parts.push({
      inlineData: {
        data: cleanBase64(ref.base64),
        mimeType: ref.mimeType,
      },
    });
  });

  // 3. Add the Text Prompt
  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: parts,
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      const imagePart = parts.find((p: any) => p.inlineData);

      if (imagePart && imagePart.inlineData) {
        return `data:image/png;base64,${imagePart.inlineData.data}`;
      }
    }

    throw new Error("No image data returned from Gemini.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate image.");
  }
};
