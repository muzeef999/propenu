import express from "express";
import {
  createWhatsAppTemplate,
  deleteWhatsAppTemplate,
  getWhatsAppTemplates,
} from "../../../../shared/whatsapp/templates/whatsappTemplate.controller";

const whatsappRouter = express.Router();


whatsappRouter.post("/whatsapp/template", createWhatsAppTemplate);
whatsappRouter.get("/whatsapp/template", getWhatsAppTemplates);
whatsappRouter.delete("/whatsapp/template/:name", deleteWhatsAppTemplate);

export default whatsappRouter;
