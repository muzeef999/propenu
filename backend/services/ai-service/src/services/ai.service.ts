import { geminiModel } from "../config/gemini";
import { SYSTEM_PROMPT } from "../prompts/system.prompt";

export const askAI = async (
  message: string
): Promise<string> => {
  try {
    const prompt = `
${SYSTEM_PROMPT}

User Question:
${message}
`;

    const result = await geminiModel.generateContent(
      prompt
    );

    const response = result.response.text();

    return response || "No AI response generated";
  } catch (error) {
    console.error("Gemini AI Error:", error);

    throw new Error("Failed to generate AI response");
  }
};