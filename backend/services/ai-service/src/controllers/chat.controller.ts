import { Request, Response }
from "express";

import { geminiModel }
from "../config/gemini";

import { searchProperties }
from "../services/propertySearch.service";

import { sendNDJSON }
from "../utils/ndjson";

import { updateMemory }
from "../utils/updateMemory";

import { getNextStep }
from "../services/conversation.service";

export async function chatController(
  req: Request,
  res: Response
) {

  try {

    // STREAM HEADERS
    res.setHeader(
      "Content-Type",
      "application/x-ndjson"
    );

    res.setHeader(
      "Transfer-Encoding",
      "chunked"
    );

    // USER MESSAGE
    const message =
      req.body.message || "";

    // MEMORY
    req.memory =
      updateMemory(
        req.memory || {},
        message
      );

    // ASK NEXT QUESTION
    const nextStep =
      getNextStep(req.memory);

    // IF FLOW NOT COMPLETE
    if (nextStep) {

      sendNDJSON(res, {
        type: "question",
        ...nextStep,
      });

      return res.end();
    }

    // STATUS
    sendNDJSON(res, {
      type: "status",
      message:
        "Searching properties..."
    });

    // SEARCH
    const properties =
      await searchProperties(
        req.memory
      );

    // NO RESULTS
    if (!properties.length) {

      sendNDJSON(res, {
        type: "message",
        content:
          "No matching properties found.",
      });

      return res.end();
    }

    // STREAM PROPERTY CARDS
    for (const property of properties) {

      sendNDJSON(res, {
        type: "property",
        property,
      });
    }

    // AI PROMPT
    const prompt = `
You are Propenu AI,
an intelligent Indian real estate assistant.

User Preferences:
${JSON.stringify(req.memory)}

Matching Properties:
${JSON.stringify(properties)}

Rules:
- Recommend properties naturally
- Mention city and locality
- Mention investment potential
- Keep concise
- Sound like property consultant
`;

    // GEMINI
    const result =
      await geminiModel.generateContent(
        prompt
      );

    const aiText =
      result.response.text();

    // STREAM AI RESPONSE
    sendNDJSON(res, {
      type: "message",
      content: aiText,
    });

    // RECOMMENDATION OPTIONS
    sendNDJSON(res, {
      type: "suggestions",

      options: [
        "Compare Properties",
        "Explore Nearby",
        "Show Investment Areas",
        "Contact Builder",
      ],
    });

    res.end();

  } catch (error) {

    console.error(
      "CHAT CONTROLLER ERROR:",
      error
    );

    sendNDJSON(res, {
      type: "error",

      message:
        "AI search failed.",
    });

    res.end();
  }
}