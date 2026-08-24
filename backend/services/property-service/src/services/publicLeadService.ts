import FeaturedProject from "../models/featurePropertiesModel";
import { Types } from "mongoose";
import PublicLead from "../models/PublicLead";
import { notifyOwnerAndAdmins } from "./pushNotificationService";
import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import Agricultural from "../models/agriculturalModel";
import LandPlot from "../models/landModel";

const PROPERTY_MODEL_MAP: Record<string, any> = {
  featuredprojects: FeaturedProject,
  residentials: Residential,
  commercials: Commercial,
  agriculturals: Agricultural,
  landplots: LandPlot,
};

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

export const createPublicPropertyLead = async (
  data: any,
  options?: { actorUserId?: string | null },
) => {
  const { projectId, propertyType } = data;

  if (!Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  const PropertyModel = PROPERTY_MODEL_MAP[propertyType];
  if (!PropertyModel) {
    throw new Error(`Invalid propertyType: ${propertyType}`);
  }

  const property = await PropertyModel.findById(projectId).populate(
    "createdBy",
    "name phone email",
  );
  if (!property) {
    throw new Error("Property not found");
  }

  const actorUserId = String(options?.actorUserId || "").trim();
  const ownerId = String((property as any)?.createdBy?._id || (property as any)?.createdBy || "").trim();
  const ownerPhone = normalizePhone((property as any)?.createdBy?.phone);
  const ownerEmail = normalizeEmail((property as any)?.createdBy?.email);
  const submittedPhone = normalizePhone(data.phone);
  const submittedEmail = normalizeEmail(data.email);

  if (
    (actorUserId && ownerId && actorUserId === ownerId) ||
    (submittedPhone && ownerPhone && submittedPhone === ownerPhone) ||
    (submittedEmail && ownerEmail && submittedEmail === ownerEmail)
  ) {
    const error: any = new Error("You cannot submit a lead for your own property");
    error.statusCode = 403;
    throw error;
  }

  const exists = await PublicLead.findOne({
    projectId,
    propertyType,
    phone: data.phone,
  });

  if (exists) {
    throw new Error("You already contacted this property");
  }

  const listingType =
    propertyType === "featuredprojects"
      ? "sale"
      : String((property as any)?.listingType || "").trim().toLowerCase();

  if (!listingType || !["sale", "rent", "lease"].includes(listingType)) {
    throw new Error("Invalid listing type for property");
  }

  const lead = await PublicLead.create({
    ...data,
    ownerId: ownerId || undefined,
    propertyModel: PropertyModel.modelName,
    listingType,
  });

  const propertyTitle =
    (property as any)?.title ||
    (property as any)?.projectName ||
    (property as any)?.buildingName ||
    "your property";

  if (ownerId) {
    await notifyOwnerAndAdmins({
      type: "contact_requested",
      title: "New Contact Request",
      body: `${lead.name} requested contact for ${propertyTitle}.`,
      ownerId,
      projectId,
      propertyType,
      metadata: {
        leadId: String(lead._id),
        propertyTitle,
        userName: lead.name,
        userPhone: lead.phone,
        userEmail: lead.email || "",
        source: lead.source || "site",
      },
    });
  }

  return {
    ...lead.toObject(),
    ownerId: (property as any)?.createdBy
      ? {
          _id: (property as any).createdBy._id,
          name: (property as any).createdBy.name,
          phone: (property as any).createdBy.phone,
          email: (property as any).createdBy.email,
        }
      : null,
    projectId: {
      _id: (property as any)._id,
      title: (property as any).title,
      price: (property as any).price,
      priceFrom: (property as any).priceFrom,
      priceTo: (property as any).priceTo,
      createdAt: (property as any).createdAt,
    },
  };
};
