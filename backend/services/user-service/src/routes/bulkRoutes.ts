import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import multer from "multer";
import fs from "fs";
import csv from "csv-parser";
import EmailTemplate from "../../../../shared/email/templates/template.model";
import { parseTemplate } from "../utils/parseTemplate";
import { emailQueue, whatsappQueue } from "../queues";
import { EmailLog } from "../logs/emailLog.model"; // 🔥 ADD THIS

const router = Router();

// 📁 upload config
const upload = multer({ dest: "uploads/" });

/**
 * 🔥 CSV BULK EMAIL (FIXED ✅)
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

      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
          let jobCount = 0;

          const campaignId = "campaign_" + Date.now(); // 🔥 group tracking

          for (const row of results) {
            const email = row.email;
            if (!email) continue;

            const subject = parseTemplate(template.subject || "", row);
            const html = parseTemplate(template.content || "", row);

            // ✅ STEP 1: CREATE LOG FIRST
            const log = await EmailLog.create({
              to: email,
              subject,
              html,
              status: "pending",
              campaignId,
            });

            // ✅ STEP 2: ADD TO QUEUE WITH logId
            await emailQueue.add(
              "send-email",
              {
                to: email,
                subject,
                html,
                logId: String(log._id), // 🔥 CRITICAL
                campaignId,
              },
              {
                delay: jobCount * 2000,
              }
            );

            jobCount++;
          }

          fs.unlinkSync(req.file!.path);

          res.json({
            message: "✅ CSV bulk sent",
            totalJobs: jobCount,
            campaignId,
          });
        });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

////////////////////// WHATSAPP (UNCHANGED) ///////////////////////

