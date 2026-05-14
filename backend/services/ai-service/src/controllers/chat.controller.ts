import { geminiModel } from "../config/gemini";
import { searchProperties } from "../services/propertySearch.service";
import { extractFilters } from "../utils/extractFilters";
import { sendNDJSON
} from "../utils/ndjson";
import { Request, Response } from "express";

export async function chatController(
  req:Request,
  res:Response
) {

  res.setHeader(
    "Content-Type",
    "application/x-ndjson"
  );

  res.setHeader(
    "Transfer-Encoding",
    "chunked"
  );

  // STEP 1
  sendNDJSON(res, {
    type: "status",
    message: "Analyzing query..."
  });

  // STEP 2
  const filters =
    extractFilters(req.body.message);

  // STEP 3
  sendNDJSON(res, {
    type: "status",
    message: "Searching properties..."
  });

  // STEP 4
  const properties =
    await searchProperties(filters);

  // STEP 5
  for (const property of properties) {

    sendNDJSON(res, {
      type: "property",
      property,
    });
  }

const prompt = `
You are Propenu AI,
an intelligent Indian real estate assistant.

User Query:
${req.body.message}

Matching Properties:
${JSON.stringify(properties)}

Rules:
- Recommend properties naturally
- Mention city and locality
- Keep response concise
- Sound like property consultant
`;

  // STEP 6
  const result =
    await geminiModel.generateContent(
      prompt
    );

  const text =
    result.response.text();

  // STEP 7
  sendNDJSON(res, {
    type: "message",
    content: text
  });

  res.end();
}