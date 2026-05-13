import { Request, Response } from "express";
import { askAI } from "../services/ai.service";

export const chatController = async (
  req: Request,
  res: Response
) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const response = await askAI(message);

    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("Chat Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "AI Service Error",
    });
  }
};