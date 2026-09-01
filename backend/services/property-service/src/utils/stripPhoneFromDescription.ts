/**
 * Block contact / address leakage in property descriptions.
 */

const PHONE_CANDIDATE_RE = /\+?\d(?:[\d\s\-().]{6,20})\d/g;
const EMAIL_RE =
  /[a-zA-Z0-9][a-zA-Z0-9._%+-]{0,63}@[a-zA-Z0-9][a-zA-Z0-9.-]{0,253}\.[a-zA-Z]{2,}/g;
const DOOR_ADDRESS_RE =
  /\b\d{1,3}\s*-\s*\d{1,4}(?:\s*\/\s*[A-Za-z0-9]{1,6})?(?:\s+[A-Za-z][\w.']*){0,5}/gi;

const KEEP_AFTER_DOOR_RE =
  /^(?:\s*)(lakh|lakhs|crore|crores|bhk|rk|sq\.?ft|sqft|sqm|km|metre|meter|meters|metres|year|years|month|months|acre|acres|gunta|guntas|cent|cents|floor|floors|ft|to)\b/i;

const doorOnlyFrom = (full = "") =>
  full.match(/^\d{1,3}\s*-\s*\d{1,4}(?:\s*\/\s*[A-Za-z0-9]{1,6})?/i)?.[0] || "";

const isMeasurementRange = (full = "") =>
  KEEP_AFTER_DOOR_RE.test(full.slice(doorOnlyFrom(full).length));

const digitsOnly = (value = "") => String(value).replace(/\D/g, "");

const collapseSpaces = (value = "") =>
  String(value)
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

export function isPhoneLikeToken(raw = "") {
  const token = String(raw || "").trim();
  if (!token) return false;
  const digits = digitsOnly(token);
  if (!digits) return false;

  if (digits.length === 10) return true;
  if (digits.length === 11 && digits.startsWith("0")) return true;
  if (digits.length === 12 && digits.startsWith("91")) return true;
  if (token.includes("+") && digits.length >= 10 && digits.length <= 13) {
    return true;
  }

  return false;
}

export function hasPhoneNumberInText(text = "") {
  const value = String(text || "");
  if (!value) return false;
  const matches = value.match(PHONE_CANDIDATE_RE) || [];
  return matches.some((match) => isPhoneLikeToken(match));
}

export function hasBlockedContentInDescription(text = "") {
  const value = String(text || "");
  if (!value) return false;
  EMAIL_RE.lastIndex = 0;
  DOOR_ADDRESS_RE.lastIndex = 0;
  if (hasPhoneNumberInText(value)) return true;
  if (EMAIL_RE.test(value)) return true;

  DOOR_ADDRESS_RE.lastIndex = 0;
  let match;
  while ((match = DOOR_ADDRESS_RE.exec(value))) {
    if (isMeasurementRange(match[0])) continue;
    return true;
  }
  return false;
}

export function stripPhoneNumbersFromText(text = "") {
  const value = String(text ?? "");
  if (!value) return { cleaned: value, removed: false };

  let removed = false;
  let cleaned = value;

  cleaned = cleaned.replace(EMAIL_RE, () => {
    removed = true;
    return "";
  });

  cleaned = cleaned.replace(PHONE_CANDIDATE_RE, (match) => {
    if (!isPhoneLikeToken(match)) return match;
    removed = true;
    return "";
  });

  cleaned = cleaned.replace(DOOR_ADDRESS_RE, (full) => {
    if (isMeasurementRange(full)) return full;
    removed = true;
    return "";
  });

  cleaned = collapseSpaces(cleaned);
  return { cleaned, removed };
}

/** Zod-friendly preprocess: strip phones, emails, door addresses. */
export const sanitizePropertyDescription = (value: unknown) => {
  if (typeof value !== "string") return value;
  return stripPhoneNumbersFromText(value).cleaned;
};
