import mongoose, { Types } from "mongoose";
import Lead from "../models/LeadModel";
import { Subscription } from "../models/subscriptionModel";
import { Plan } from "../models/planModel";
import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import Agricultural from "../models/agriculturalModel";
import LandPlot from "../models/landModel";
import FeaturedProject from "../models/featurePropertiesModel";
import PublicLead from "../models/PublicLead";

const PROPERTY_MODEL_MAP: Record<string, any> = {
  featuredprojects: FeaturedProject,
  residentials: Residential,
  commercials: Commercial,
  agriculturals: Agricultural,
  landplots: LandPlot,
};

/** CREATE LEAD **/
export const createLead = async (data: any, userId: string | null) => {
  const { propertyType, projectId } = data;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid project/property ID");
  }

  const PropertyModel = PROPERTY_MODEL_MAP[propertyType];
  if (!PropertyModel) {
    throw new Error(`Invalid propertyType: ${propertyType}`);
  }

  const existingLead = await Lead.findOne({
    projectId,
    createdBy: userId,
  });
  if (existingLead) {
    throw new Error("You have already contacted for this property");
  }

  const property = await PropertyModel.findById(projectId);
  if (!property) {
    throw new Error("Property not found");
  }

  const ownerId = (property as any).createdBy;
  if (!ownerId) {
    throw new Error("Property owner not found");
  }

  // User/agent/builder cannot contact their own property.
  if (String(ownerId) === String(userId)) {
    throw new Error("This is your own property");
  }

  const listingType = (property as any).listingType as
    | "sale"
    | "rent"
    | "lease"
    | undefined;
  if (!listingType) {
    throw new Error("Invalid listing type for property");
  }

  // Featured projects skip subscription checks.
  if (propertyType === "featuredprojects") {
    return await Lead.create({
      ...data,
      propertyModel: "FeaturedProject",
      createdBy: userId,
      ownerId,
      listingType,
    });
  }

  const requiredViewerCategory = listingType === "sale" ? "buy" : "rent_view";

  const viewerSub = await Subscription.findOne({
    userId,
    status: "active",
    category: requiredViewerCategory,
  });

  if (!viewerSub) {
    throw new Error(
      listingType === "sale"
        ? "Please purchase a Buyer plan to contact this property owner"
        : "Please purchase a Rent View plan to contact this property owner"
    );
  }

  if (!viewerSub.usage) {
    viewerSub.usage = { contactUsed: 0, enquiryUsed: 0 };
  }

  const viewerPlan = await Plan.findOne({ code: viewerSub.planCode });
  if (!viewerPlan) {
    throw new Error("Invalid buyer subscription plan");
  }

  const contactLimit = viewerPlan.features?.get("CONTACT_OWNER_LIMIT");
  if (
    typeof contactLimit === "number" &&
    viewerSub.usage.contactUsed >= contactLimit
  ) {
    throw new Error("Your contact limit is over. Please upgrade your plan.");
  }

  // Do not trust listingType sent by client.
  const { listingType: _ignore, ...safeData } = data;

  const lead = await Lead.create({
    ...safeData,
    propertyModel: PropertyModel.modelName,
    createdBy: userId,
    ownerId,
    listingType,
  });

  viewerSub.usage.contactUsed += 1;
  await viewerSub.save();

  return lead;
};

/** ASSIGN LEAD TO SALES **/
export const assignLead = async (leadId: string, assignedTo: string) => {
  if (!Types.ObjectId.isValid(leadId)) {
    throw new Error("Invalid lead ID");
  }

  if (!Types.ObjectId.isValid(assignedTo)) {
    throw new Error("Invalid user ID");
  }

  const lead = await Lead.findByIdAndUpdate(leadId, { assignedTo }, { new: true });

  if (!lead) throw new Error("Lead not found");

  return lead;
};

/** UPDATE LEAD STATUS **/
export const updateLeadStatus = async (
  leadId: string,
  status: string,
  user?: any
) => {
  if (!Types.ObjectId.isValid(leadId)) {
    throw new Error("Invalid lead ID");
  }

  // Manager-only approval
  if (status === "approved" && user?.role !== "manager") {
    throw new Error("Only manager can approve leads");
  }

  const lead = await Lead.findByIdAndUpdate(
    leadId,
    {
      status,
      approvedByManager: status === "approved",
    },
    { new: true }
  );

  if (!lead) throw new Error("Lead not found");

  return lead;
};

/** GET LEADS (ROLE BASED) **/
export const getLeads = async (query: any, user?: any) => {
  const filter: any = {};

  if (query.projectId) {
    if (!Types.ObjectId.isValid(query.projectId)) {
      throw new Error("Invalid projectId");
    }
    filter.projectId = query.projectId;
  }

  if (query.propertyType) filter.propertyType = query.propertyType;
  if (query.status) filter.status = query.status;

  if (user?.role === "sales") {
    filter.assignedTo = user.id;
  }

  return Lead.find(filter)
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 })
    .lean();
};

/** GET SINGLE LEAD **/
export const getLeadById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid lead ID");
  }

  const lead = await Lead.findById(id)
    .populate("assignedTo", "name email")
    .populate("projectId");

  if (!lead) throw new Error("Lead not found");

  return lead;
};

export const updateLeadStatusService = async (
  leadId: string,
  status: string
) => {
  if (!mongoose.Types.ObjectId.isValid(leadId)) {
    throw new Error("Invalid Lead ID");
  }

  const lead = await PublicLead.findByIdAndUpdate(
    leadId,
    { status },
    { new: true }
  );

  if (!lead) {
    throw new Error("Lead not found");
  }

  return lead;
};
