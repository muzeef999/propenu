import FeaturedProject from "../models/featurePropertiesModel";
import { Types } from "mongoose";
import PublicLead from "../models/PublicLead";
import { notifyOwnerAndAdmins } from "./pushNotificationService";

const normalizePhone = (value?: string | null) =>
  String(value || "").replace(/[^\d+]/g, "");

const normalizeEmail = (value?: string | null) =>
  String(value || "").trim().toLowerCase();

export const createPublicLead = async (
  data: any,
  options?: { actorUserId?: string | null },
) => {
  const { projectId } = data;

  // 1️⃣ Validate ObjectId
  if (!Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  // 2️⃣ Check project exists
  const project = await FeaturedProject.findById(projectId).populate(
    "createdBy",
    "phone email",
  );
  if (!project) {
    throw new Error("Featured project not found");
  }

  const actorUserId = String(options?.actorUserId || "").trim();
  const ownerId = String((project as any)?.createdBy?._id || project.createdBy || "").trim();
  const ownerPhone = normalizePhone((project as any)?.createdBy?.phone);
  const ownerEmail = normalizeEmail((project as any)?.createdBy?.email);
  const submittedPhone = normalizePhone(data.phone);
  const submittedEmail = normalizeEmail(data.email);

  if (
    (actorUserId && ownerId && actorUserId === ownerId) ||
    (submittedPhone && ownerPhone && submittedPhone === ownerPhone) ||
    (submittedEmail && ownerEmail && submittedEmail === ownerEmail)
  ) {
    const error: any = new Error("You cannot submit a lead for your own project");
    error.statusCode = 403;
    throw error;
  }

  // 3️⃣ Prevent duplicate spam (same phone same project)
  const exists = await PublicLead.findOne({
    projectId,
    phone: data.phone,
  });

  if (exists) {
    throw new Error("You already contacted this project");
  }

  // 4️⃣ Save lead
  const lead = await PublicLead.create(data);
  const projectTitle =
    project.title || (project as any).projectName || "your project";

  if (!project.createdBy) {
    return lead;
  }

  await notifyOwnerAndAdmins({
    type: "contact_requested",
    title: "New Project Lead",
    body: `${lead.name} submitted a lead for ${projectTitle}.`,
    ownerId: project.createdBy,
    projectId,
    propertyType: "featuredprojects",
    metadata: {
      leadId: String(lead._id),
      projectTitle,
      userName: lead.name,
      userPhone: lead.phone,
      userEmail: lead.email || "",
      source: lead.source || "site",
    },
  });

  return lead;
};
