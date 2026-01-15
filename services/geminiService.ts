
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AnalysisType } from "../types";
import { SYSTEM_PROMPTS, getPillboxPrompt } from "../constants";

const getAnalysisSchema = (type: AnalysisType) => {
  switch (type) {
    case AnalysisType.PILLBOX:
      return {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          compartments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                status: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ['name', 'status', 'description']
            }
          }
        },
        required: ['summary', 'compartments']
      };
    case AnalysisType.FINE_PRINT:
      return {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          dosage: { type: Type.STRING },
          warnings: { type: Type.STRING },
          expiry: { type: Type.STRING },
          fullSnippet: { type: Type.STRING }
        },
        required: ['summary']
      };
    case AnalysisType.DOCUMENT:
      return {
        type: Type.OBJECT,
        properties: {
          docType: { type: Type.STRING },
          summary: { type: Type.STRING },
          sender: { type: Type.STRING },
          amount: { type: Type.STRING },
          dueDate: { type: Type.STRING },
          fraudRisk: { type: Type.STRING },
          fraudReasoning: { type: Type.STRING }
        },
        required: ['docType', 'summary', 'fraudRisk']
      };
    default:
      return {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING }
        }
      };
  }
};

export const analyzeImage = async (
  base64Image: string,
  type: AnalysisType,
  medicationSchedule?: string
): Promise<any> => {
  // Always initialize right before use as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = "gemini-3-flash-preview";

  let prompt = SYSTEM_PROMPTS[type];
  if (type === AnalysisType.PILLBOX && medicationSchedule) {
    prompt = getPillboxPrompt(medicationSchedule);
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: getAnalysisSchema(type),
      },
    });

    const resultText = response.text?.trim() || "{}";
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw new Error("I had trouble seeing that. Could you try taking a clearer photo?");
  }
};

export const askFollowUpQuestion = async (
  originalAnalysis: any,
  base64Image: string,
  question: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are EagleView, a supportive assistant. 
    Context: You previously analyzed an image and found: ${JSON.stringify(originalAnalysis)}.
    User follow-up: "${question}".
    Answer clearly and supportively based on the image context.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image,
            },
          },
          { text: prompt },
        ],
      },
    });

    return response.text || "I'm sorry, I couldn't process that question right now.";
  } catch (error) {
    console.error("Follow-up error:", error);
    return "I'm having a little trouble answering. Could you ask in a different way?";
  }
};
