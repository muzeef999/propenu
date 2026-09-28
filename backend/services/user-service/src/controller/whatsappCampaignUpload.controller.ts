import axios from "axios";
import { Request, Response } from "express";
import { uploadToS3 } from "../utils/s3Upload";
import { whatsappConfig } from "../whatsapp/whatsapp.config";

/**
 * Upload a campaign header image to S3 and return a public URL
 * for Meta WhatsApp template *sends* (runtime header link).
 */
export const uploadWhatsAppCampaignImage = async (
  req: Request,
  res: Response,
) => {
  try {
    const file = req.file;
    if (!file?.buffer) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    if (!String(file.mimetype || "").startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    const ext =
      (file.originalname || "").includes(".")
        ? `.${file.originalname.split(".").pop()?.toLowerCase()}`
        : "";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
      ? ext
      : ".jpg";

    const key = `whatsapp/campaigns/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}${safeExt}`;

    const uploaded = await uploadToS3({
      buffer: file.buffer,
      key,
      mimetype: file.mimetype || "image/jpeg",
    });

    return res.json({
      success: true,
      url: uploaded.url,
      key: uploaded.key,
      message: "Campaign image uploaded",
    });
  } catch (error: any) {
    console.error("❌ WhatsApp campaign image upload failed:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Image upload failed",
    });
  }
};

const ALLOWED_TEMPLATE_MIME: Record<string, string[]> = {
  IMAGE: ["image/jpeg", "image/jpg", "image/png"],
  VIDEO: ["video/mp4", "video/3gpp"],
  DOCUMENT: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

/**
 * Meta Resumable Upload → returns header_handle for template CREATE.
 * Public S3 URLs are NOT accepted by Meta as header_handle.
 */
export async function uploadToMetaResumable(opts: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}): Promise<{ handle: string }> {
  const token = whatsappConfig.token;
  const appId = whatsappConfig.appId;
  const apiVersion = whatsappConfig.apiVersion || "v23.0";

  if (!token) throw new Error("WHATSAPP_TOKEN is missing");
  if (!appId) throw new Error("WHATSAPP_APP_ID is missing");

  const fileName = String(opts.fileName || "sample.bin").replace(
    /[^\w.\-]+/g,
    "_",
  );
  const mimeType = String(opts.mimeType || "application/octet-stream");
  const fileLength = opts.buffer.length;

  // Step 1 — create upload session
  const sessionUrl = `https://graph.facebook.com/${apiVersion}/${appId}/uploads`;
  const sessionRes = await axios.post(
    sessionUrl,
    {
      file_length: fileLength,
      file_type: mimeType,
      file_name: fileName,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    },
  );

  const uploadSessionId = String(sessionRes.data?.id || "").trim();
  if (!uploadSessionId) {
    throw new Error("Meta upload session did not return an id");
  }

  // Step 2 — upload binary (Auth must be OAuth, not Bearer)
  const uploadUrl = `https://graph.facebook.com/${apiVersion}/${uploadSessionId}`;
  const uploadRes = await axios.post(uploadUrl, opts.buffer, {
    headers: {
      Authorization: `OAuth ${token}`,
      file_offset: "0",
      "Content-Type": "application/octet-stream",
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 120000,
  });

  const handle = String(uploadRes.data?.h || "").trim();
  if (!handle) {
    throw new Error(
      "Meta upload did not return a media handle (h). Try another JPEG/PNG file.",
    );
  }

  return { handle };
}

/**
 * Upload media for WhatsApp *template creation* (IMAGE/VIDEO/DOCUMENT header).
 * Returns Meta header_handle (+ optional S3 preview URL for IMAGE).
 */
export const uploadWhatsAppTemplateMedia = async (
  req: Request,
  res: Response,
) => {
  try {
    const file = req.file;
    if (!file?.buffer) {
      return res.status(400).json({
        success: false,
        message: "Media file is required",
      });
    }

    const format = String(req.body?.format || req.query?.format || "IMAGE")
      .trim()
      .toUpperCase();
    if (!["IMAGE", "VIDEO", "DOCUMENT"].includes(format)) {
      return res.status(400).json({
        success: false,
        message: "format must be IMAGE, VIDEO, or DOCUMENT",
      });
    }

    const mime = String(file.mimetype || "").toLowerCase();
    const allowed = ALLOWED_TEMPLATE_MIME[format] || [];
    if (allowed.length && !allowed.includes(mime)) {
      return res.status(400).json({
        success: false,
        message: `${format} sample must be one of: ${allowed.join(", ")} (got ${mime || "unknown"})`,
      });
    }

    const { handle } = await uploadToMetaResumable({
      buffer: file.buffer,
      fileName: file.originalname || `sample.${format.toLowerCase()}`,
      mimeType: mime || "application/octet-stream",
    });

    let previewUrl = "";
    // Optional public preview for the admin UI (IMAGE only)
    if (format === "IMAGE") {
      try {
        const ext = mime.includes("png")
          ? ".png"
          : mime.includes("webp")
            ? ".webp"
            : ".jpg";
        const key = `whatsapp/template-samples/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}${ext}`;
        const uploaded = await uploadToS3({
          buffer: file.buffer,
          key,
          mimetype: mime || "image/jpeg",
        });
        previewUrl = uploaded.url || "";
      } catch (previewErr) {
        console.warn(
          "Template media S3 preview skipped:",
          (previewErr as Error)?.message,
        );
      }
    }

    return res.json({
      success: true,
      handle,
      previewUrl: previewUrl || undefined,
      format,
      message: "Meta media handle ready for template header",
    });
  } catch (error: any) {
    console.error(
      "❌ WhatsApp template media upload failed:",
      error?.response?.data || error?.message || error,
    );
    const metaMsg =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Template media upload failed";
    return res.status(500).json({
      success: false,
      message: metaMsg,
      meta: error?.response?.data || undefined,
    });
  }
};
