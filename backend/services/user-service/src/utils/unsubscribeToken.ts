/**
 * Encodes an identifier (email or phone) to a URL-safe base64 string.
 * Used to embed the email in unsubscribe links without exposing it plainly.
 *
 * Example link:
 *   https://propenu.com/unsubscribe?email=dXNlckBleGFtcGxlLmNvbQ%3D%3D
 */
export function generateUnsubscribeToken(identifier: string): string {
  return Buffer.from(identifier.toLowerCase().trim()).toString("base64url");
}

/**
 * Decodes a base64url token back to the original identifier.
 * Returns null if the token is not valid base64url.
 */
export function decodeUnsubscribeToken(token: string): string | null {
  try {
    return Buffer.from(token, "base64url").toString("utf-8");
  } catch {
    return null;
  }
}

/**
 * Verifies that the given token decodes to the expected identifier.
 */
export function verifyUnsubscribeToken(
  identifier: string,
  token: string,
): boolean {
  const decoded = decodeUnsubscribeToken(token);
  return decoded !== null && decoded === identifier.toLowerCase().trim();
}

/**
 * Builds a full unsubscribe URL to embed in emails.
 * The email is base64url-encoded in the query param.
 *
 * @param identifier - email or phone number of the recipient
 * @param type - "email" (default) or "phone"
 */
export function buildUnsubscribeUrl(
  identifier: string,
  type: "email" | "phone" = "email",
): string {
  const base =
    process.env.FRONTEND_URL?.replace(/\/$/, "") || "https://propenu.com";
  const encoded = generateUnsubscribeToken(identifier);
  return `${base}/unsubscribe?${type}=${encoded}`;
}
