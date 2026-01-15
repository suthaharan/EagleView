
import { GoogleGenAI } from "@google/genai";
import { AnalysisType } from "../types";
import { SYSTEM_PROMPTS, getPillboxPrompt } from "../constants";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const analyzeImage = async (
  base64Image: string,
  type: AnalysisType,
  medicationSchedule?: string
): Promise<any> => {
  const ai = getAIClient();
  const model = "gemini-3-flash-preview";

  let prompt = SYSTEM_PROMPTS[type];
  if (type === AnalysisType.PILLBOX && medicationSchedule) {
    prompt = getPillboxPrompt(medicationSchedule);
  }

  try {
    const response = await ai.models.generateContent({
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
      },
    });

    const resultText = response.text || "{}";
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
  const ai = getAIClient();
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are EagleView, a supportive assistant. 
    Context: You previously analyzed an image and found: ${JSON.stringify(originalAnalysis)}.
    The user is looking at this same image and has a follow-up question: "${question}".
    Answer the question based on the image provided and the previous context. 
    Be clear, supportive, and use simple language suitable for seniors or busy caregivers.
  `;

  try {
    const response = await ai.models.generateContent({
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
