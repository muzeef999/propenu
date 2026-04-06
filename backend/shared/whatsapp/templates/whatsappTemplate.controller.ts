import { Request, Response } from "express";
import {
  createTemplateService,
  getTemplatesService,
  deleteTemplateService,
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

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.response?.data || error.message,
    });
  }
};


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