import FeaturedProject from "../models/featurePropertiesModel";
import { Types } from "mongoose";
import PublicLead from "../models/PublicLead";
import { notifyOwnerAndAdmins } from "./pushNotificationService";

export const createPublicLead = async (data: any) => {
  const { projectId } = data;

  // 1️⃣ Validate ObjectId
  if (!Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  // 2️⃣ Check project exists
  const project = await FeaturedProject.findById(projectId);
  if (!project) {
    throw new Error("Featured project not found");
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
