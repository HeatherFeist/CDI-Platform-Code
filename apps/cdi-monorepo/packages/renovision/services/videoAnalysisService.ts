import { GoogleGenAI } from "@google/genai";
import { VideoQuestion } from '../types/videoQuestion';

/**
 * Analyzes video content and question to generate AI-powered estimates and insights
 */
export const analyzeVideoQuestion = async (
    videoUrl: string,
    question: string,
    transcription: string,
    apiKey: string
): Promise<VideoQuestion['aiResponse']> => {
    const ai = new GoogleGenAI({ apiKey });

    // Create context for analysis
    const context = `
Video Description: ${transcription}
Customer Question: ${question}

Please analyze this renovation project request and provide:
1. A detailed analysis of what's needed
2. Suggested products and materials with specific recommendations
3. Estimated cost range based on current market prices
4. Estimated timeline for completion
5. Additional notes or considerations for the project

Format the response in a clear, structured way that can be parsed into sections.`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-pro',
            contents: [{ role: 'user', parts: [{ text: context }] }],
        });

        const response = result.text;

        // Parse the response into structured sections
        // This is a simple parser - you might want to make it more robust
        const sections = response.split('\n\n');
        const aiResponse = {
            analysis: sections[0] || '',
            suggestedProducts: (sections[1] || '').split('\n').filter(Boolean),
            estimatedCost: parseFloat(sections[2]?.match(/\$?([\d,]+)/)?.[1]?.replace(',', '') || '0'),
            timelineEstimate: parseInt(sections[3]?.match(/(\d+)/)?.[1] || '0'),
            additionalNotes: sections[4] || ''
        };

        return aiResponse;
    } catch (error) {
        console.error('Error analyzing video question:', error);
        throw new Error('Failed to analyze video content');
    }
};