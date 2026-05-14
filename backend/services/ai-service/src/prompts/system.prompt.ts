export function buildPropertyPrompt(
  message: string,
  properties: any[]
) {

  return `
You are Propenu AI.

User Query:
${message}

Matching Properties:
${JSON.stringify(properties)}

Rules:
- Be concise
- Mention locality and city
- Mention prices
- Sound like property consultant
`;
}