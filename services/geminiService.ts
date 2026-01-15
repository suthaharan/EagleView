
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
