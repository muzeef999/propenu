import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import multer from "multer";
import fs from "fs";
import csv from "csv-parser";
import EmailTemplate from "../../../../shared/email/templates/template.model";
import { parseTemplate } from "../utils/parseTemplate";
import { emailQueue, whatsappQueue } from "../queues";


const router = Router();

// 📁 upload config
const upload = multer({ dest: "uploads/" });

/**
 * 🔥 HELPER: normalize record data
 */
const normalizeData = (raw: any): Record<string, any> => {
  if (raw instanceof Map) return Object.fromEntries(raw);
  if (raw && typeof raw === "object") return raw;
  return {};
};


/**
 * 🔥 CSV BULK (MAIN NEW FEATURE 🚀)
 */
router.post(
  "/send-csv-bulk-email",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { templateId } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "CSV file required" });
      }

      const template = await EmailTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const results: any[] = [];

      // 📥 read CSV
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => {
          results.push(data);
        })
        .on("end", async () => {
          let jobCount = 0;

          for (const row of results) {
            const email = row.email;

            if (!email) continue;

            const subject = parseTemplate(template.subject || "", row);
            const html = parseTemplate(template.content || "", row);

            await emailQueue.add(
              "send-email",
              {
                to: email,
                subject,
                html,
              },
              {
                delay: jobCount * 2000, // 🧠 stagger emails
              },
            );

            jobCount++;
          }

          // 🧹 delete file after use
          fs.unlinkSync(req.file!.path);

          res.json({
            message: "✅ CSV bulk sent",
            totalJobs: jobCount,
          });
        });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
);

//////////////////////whatsapp template routes///////////////////////////////////////


router.post(
  "/send-csv-bulk-whatsapp",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { templateName } = req.body;
      const variableKeys = JSON.parse(req.body.variableKeys);

      if (!req.file) {
        return res.status(400).json({ message: "CSV file required" });
      }

      const results: any[] = [];

      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
          let jobCount = 0;

          for (const row of results) {
            const phone = "91" + String(row.phone).replace(/\D/g, "");

            if (!phone) continue;

            const variables = variableKeys.map((key: string) =>
              row[key] ? String(row[key]) : ""
            );

            await whatsappQueue.add("send-message", {
              to: phone,
              templateName,
              variables,
            });

            jobCount++;
          }

          fs.unlinkSync(req.file!.path);

          res.json({
            message: "✅ CSV bulk sent",
            totalJobs: jobCount,
          });
        });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
