import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || ''; 
// Note: In a real-world scenario, keys should be handled via a secure backend proxy 
// or entered by the user in a setup screen to avoid exposing them in client-side code if not using a build process.

const ai = new GoogleGenAI({ apiKey });

export const generateInsightsFromData = async (systemData: any): Promise<any[]> => {
    if (!apiKey) {
        console.warn("Gemini API Key missing. Returning mock data.");
        return [];
    }

    try {
        const prompt = `
        You are an advanced financial AI analyst. Analyze the following system snapshot and generate 3 critical, actionable insights.
        
        System Data:
        ${JSON.stringify(systemData, null, 2)}
        
        Return the response strictly as a JSON array of objects. Each object should have:
        - title (string)
        - description (string)
        - urgency (one of: 'critical', 'high', 'medium', 'low', 'informational')
        - type (one of: 'risk', 'opportunity', 'operational', 'fraud', 'compliance')
        - explanation (string, brief reasoning)
        - recommendedActions (array of strings)
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            urgency: { type: Type.STRING },
                            type: { type: Type.STRING },
                            explanation: { type: Type.STRING },
                            recommendedActions: { 
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);

    } catch (error) {
        console.error("Gemini Insight Generation Failed:", error);
        return [];
    }
};

export const queryGemini = async (query: string, context: string): Promise<string> => {
    if (!apiKey) return "AI service is unavailable (Missing API Key).";

    try {
        const prompt = `
        You are a helpful Financial Operations AI Assistant. 
        Context: ${context}
        
        User Query: ${query}
        
        Provide a concise, strategic answer.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        return response.text || "No response generated.";
    } catch (error) {
        console.error("Gemini Query Failed:", error);
        return "I encountered an error processing your request.";
    }
};
