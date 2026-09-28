import { Request, Response } from "express";
import {
  createTemplateService,
  getTemplatesService,
  deleteTemplateService,
  resolveTemplateHeaderMediaUrl,
} from "./whatsappTemplate.service";

// CREATE
export const createWhatsAppTemplate = async (req: Request, res: Response) => {
  try {
    const { name, language, category, components } = req.body;

    // ✅ Basic validation
    if (!name || !category || !components) {
      return res.status(400).json({
        success: false,
        message: "name, category, components are required",
      });
    }

    // Guard: Meta rejects public URLs in HEADER example.header_handle
    const comps = Array.isArray(components) ? components : [];
    for (const c of comps) {
      const type = String(c?.type || "").toUpperCase();
      const format = String(c?.format || "").toUpperCase();
      if (type !== "HEADER" || !["IMAGE", "VIDEO", "DOCUMENT"].includes(format)) {
        continue;
      }
      const handle = String(c?.example?.header_handle?.[0] || "").trim();
      if (!handle) {
        return res.status(400).json({
          success: false,
          message: `Templates with ${format} header type need an example/sample. Upload a media sample first.`,
        });
      }
      if (/^https?:\/\//i.test(handle)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid media sample: Meta does not accept S3/CDN URLs as header_handle. Re-upload the image so the server can create a Meta media handle.",
        });
      }
    }

    const payload = {
      name,
      language: language || "en",
      category,
      components,
    };

    const result = await createTemplateService(payload);

    res.status(201).json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error("CREATE TEMPLATE ERROR:", error?.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: error?.response?.data || error.message,
    });
  }
};

// GET ALL
export const getWhatsAppTemplates = async (_: Request, res: Response) => {
  try {
    const result = await getTemplatesService();
    const data = enrichTemplatesWithPreview(result);

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.response?.data || error.message,
    });
  }
};

/** Attach samplePreviewUrl (https) on each template for admin campaign UI. */
function enrichTemplatesWithPreview(result: any) {
  const list = Array.isArray(result?.data)
    ? result.data
    : Array.isArray(result)
      ? result
      : [];

  const enriched = list.map((tpl: any) => {
    const preview = resolveTemplateHeaderMediaUrl(tpl);
    if (!preview) return tpl;
    return {
      ...tpl,
      samplePreviewUrl: preview,
      headerImageUrl: preview,
    };
  });

  if (Array.isArray(result?.data)) {
    return { ...result, data: enriched };
  }
  if (Array.isArray(result)) return enriched;
  return result;
}

// DELETE
export const deleteWhatsAppTemplate = async (req: Request, res: Response) => {
  try {
    const { name } = req.params as { name: string };

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Template name is required",
      });
    }

    const result = await deleteTemplateService(name);

    res.json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error("DELETE ERROR:", error?.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: error?.response?.data || error.message,
    });
  }
};

