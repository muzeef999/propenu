import FeaturedProject from "../models/featurePropertiesModel";
import { Types } from "mongoose";
import PublicLead from "../models/PublicLead";

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
  return await PublicLead.create(data);
};