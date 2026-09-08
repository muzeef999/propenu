import sharp from "sharp";
import {
  BANNER_MAX_BYTES,
  BANNER_SIZE_TOLERANCE_PX,
  BANNER_SLOTS,
  BannerSlot,
  LOGO_ASPECT_RATIO,
  LOGO_ASPECT_TOLERANCE,
  LOGO_MAX_BYTES,
} from "./siteBranding.constants";

export function assertWebpFile(file: Express.Multer.File, slotLabel: string) {
  const name = String(file.originalname || "").toLowerCase();
  const isWebp =
    file.mimetype === "image/webp" || name.endsWith(".webp");
  if (!isWebp) {
    throw new Error(`${slotLabel}: only WebP images are allowed`);
  }
  if (file.size > BANNER_MAX_BYTES) {
    throw new Error(`${slotLabel}: image must be below 1 MB`);
  }
}

export function assertGifFile(file: Express.Multer.File) {
  const name = String(file.originalname || "").toLowerCase();
  const isGif = file.mimetype === "image/gif" || name.endsWith(".gif");
  if (!isGif) {
    throw new Error("Logo: only GIF files are allowed");
  }
  if (file.size > LOGO_MAX_BYTES) {
    throw new Error("Logo: file must be below 1 MB");
  }
}

export async function assertBannerDimensions(
  buffer: Buffer,
  slot: BannerSlot,
) {
  const expected = BANNER_SLOTS[slot];
  const meta = await sharp(buffer).metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  const okW = Math.abs(width - expected.width) <= BANNER_SIZE_TOLERANCE_PX;
  const okH = Math.abs(height - expected.height) <= BANNER_SIZE_TOLERANCE_PX;
  if (!okW || !okH) {
    throw new Error(
      `${expected.label}: expected ${expected.width}×${expected.height}px, got ${width}×${height}px`,
    );
  }
}

export async function assertLogoAspectRatio(buffer: Buffer) {
  const meta = await sharp(buffer).metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  if (!width || !height) {
    throw new Error("Logo: could not read image dimensions");
  }
  const ratio = width / height;
  if (Math.abs(ratio - LOGO_ASPECT_RATIO) > LOGO_ASPECT_TOLERANCE) {
    throw new Error(
      `Logo: expected ~3.34:1 ratio (e.g. 167×50). Got ${width}×${height} (${ratio.toFixed(2)}:1)`,
    );
  }
}

export function normalizeClickUrl(raw: unknown, { optional = false } = {}): string {
  const value = String(raw || "").trim();
  if (!value) {
    if (optional) return "";
    throw new Error("Click URL is required");
  }
  if (value.startsWith("/")) {
    return value;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("invalid");
    }
    return parsed.toString();
  } catch {
    throw new Error("Click URL must be a full http(s) link or a path starting with /");
  }
}

export function normalizeLocation(body: Record<string, unknown>) {
  const state = String(body.state || "").trim();
  const city = String(body.city || "").trim();
  const locality = String(body.locality || "").trim();
  const subLocality = String(body.subLocality || body.sub_locality || "").trim();

  if (city && !state) {
    throw new Error("State is required when City is set");
  }
  if (locality && !city) {
    throw new Error("City is required when Locality is set");
  }
  if (subLocality && !locality) {
    throw new Error("Locality is required when Sub-locality is set");
  }

  return { state, city, locality, subLocality };
}

export function normalizePriority(raw: unknown): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Priority must be a number ≥ 0");
  }
  return Math.min(9999, Math.floor(n));
}

function parseBool(raw: unknown, fallback = true): boolean {
  if (raw === undefined || raw === null || raw === "") return fallback;
  if (typeof raw === "boolean") return raw;
  const s = String(raw).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(s)) return true;
  if (["0", "false", "no", "off"].includes(s)) return false;
  return fallback;
}

/** Keep TipTap formatting (color/font/highlight); strip scripts & unsafe handlers. */
export function sanitizeBannerHtml(raw: unknown, label: string): string {
  let html = String(raw || "");
  if (html.length > 20000) {
    throw new Error(`${label} text is too long`);
  }

  html = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "")
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/on\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/expression\s*\(/gi, "");

  // Allow style= for color / background-color / font-* / text-align only
  html = html.replace(/style\s*=\s*(['"])(.*?)\1/gi, (_match, quote, styleBody) => {
    const kept = String(styleBody)
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((decl) => {
        const prop = decl.split(":")[0]?.trim().toLowerCase() || "";
        return [
          "color",
          "background-color",
          "background",
          "font-size",
          "font-family",
          "font-weight",
          "font-style",
          "text-align",
          "text-decoration",
          "line-height",
        ].includes(prop);
      })
      .join("; ");
    return kept ? `style=${quote}${kept}${quote}` : "";
  });

  if (html === "<p></p>" || html === "<p><br></p>") return "";
  return html;
}

export function normalizeTextBlock(
  body: Record<string, unknown>,
  kind: "heading" | "subheading",
  fallback?: { enabled?: boolean; html?: string },
) {
  const enabledKey = `${kind}Enabled`;
  const htmlKey = `${kind}Html`;
  const nested = body[kind];

  let enabled = fallback?.enabled ?? true;
  let html = fallback?.html ?? "";

  if (nested && typeof nested === "object") {
    const obj = nested as Record<string, unknown>;
    if (obj.enabled !== undefined) enabled = parseBool(obj.enabled, enabled);
    if (obj.html !== undefined) html = sanitizeBannerHtml(obj.html, kind);
  }

  if (body[enabledKey] !== undefined) {
    enabled = parseBool(body[enabledKey], enabled);
  }
  if (body[htmlKey] !== undefined) {
    html = sanitizeBannerHtml(body[htmlKey], kind);
  }

  return { enabled, html };
}
