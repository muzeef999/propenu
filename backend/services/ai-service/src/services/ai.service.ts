
import { buildPropertyPrompt } from "../prompts/system.prompt";
import { extractFilters } from "../utils/extractFilters";
import { searchProperties } from "./propertySearch.service";
import { geminiModel } from "../config/gemini";


export async function askAI(
  message: string
) {

  const filters = extractFilters(message);

  if (!filters.city) {
    return {
      type: "question",
      message:
        "Which city are you searching in?"
    };
  }

  const properties = await searchProperties(filters);

  if (!properties.length) {
    return {
      type: "message",
      message:
        "No matching properties found."
    };
  }

  // STEP 5
  const prompt = buildPropertyPrompt(message, properties);

  // STEP 6
const result =
  await geminiModel.generateContent(
    prompt
  );

  const response =
    result.response.text();

  // STEP 7
  return {
    type: "properties",

    message: response,

    properties,
  };
}