import { Types } from "mongoose";
import Lead from "../models/LeadModel";
import { Subscription } from "../models/subscriptionModel";
import { Plan } from "../models/planModel";

import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import Agricultural from "../models/agriculturalModel";
import LandPlot from "../models/landModel";
import FeaturedProject from "../models/featurePropertiesModel";

const PROPERTY_MODEL_MAP: Record<string, any> = {
  featuredprojects: FeaturedProject,
  residentials: Residential,
  commercials: Commercial,
  agriculturals: Agricultural,
  landplots: LandPlot,
};

/** CREATE LEAD **/
export const createLead = async (data: any, userId: string) => {
  const { propertyType, projectId } = data;

  if (!Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid project/property ID");
  }

  const PropertyModel = PROPERTY_MODEL_MAP[propertyType];
  if (!PropertyModel) {
    throw new Error(`Invalid propertyType: ${propertyType}`);
  }

  if (propertyType === "featuredprojects") {
    return await Lead.create({
      ...data,
      propertyModel: "FeaturedProject",
      createdBy: userId,
    });
  }

  const existingLead = await Lead.findOne({ projectId, createdBy: userId });
  if (existingLead) {
    throw new Error("You have already contacted for this property");
  }

  const property = await PropertyModel.findById(projectId);
  if (!property) {
    throw new Error("Property not found");
  }

  const listingType = property.listingType; // sale | rent
  const ownerId = property.createdBy;

  const requiredCategory = listingType === "sale" ? "sell" : "rent";
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
  // ✅ OWNER subscription (VERY IMPORTANT FIX)
  const ownerSub = await Subscription.findOne({
    userId: ownerId,
    userType: "owner",
    category: requiredCategory,
    status: "active",
  });

  if (!ownerSub) {
    throw new Error("Owner plan does not allow enquiries for this property");
  }

  if (!viewerSub.usage) viewerSub.usage = { contactUsed: 0, enquiryUsed: 0 };
  if (!ownerSub.usage) ownerSub.usage = { contactUsed: 0, enquiryUsed: 0 };

  const viewerPlan = await Plan.findOne({ code: viewerSub.planCode });
  const ownerPlan = await Plan.findOne({ code: ownerSub.planCode });

  if (!viewerPlan || !ownerPlan) throw new Error("Invalid subscription setup");

  // 👤 BUYER limits
  if (viewerPlan.features?.get("CONTACT_OWNER_LIMIT")) {
    const contactLimit = viewerPlan.features.get("CONTACT_OWNER_LIMIT");

    if (viewerSub.usage.contactUsed >= contactLimit) {
      throw new Error("Your contact limit is over. Upgrade your plan.");
    }
  }

  // 🏠 OWNER enquiry limits
  if (ownerPlan.features?.get("ENQUIRY_LIMIT")) {
    const enquiryLimit = ownerPlan.features.get("ENQUIRY_LIMIT");

    if (ownerSub.usage.enquiryUsed >= enquiryLimit) {
      throw new Error("Owner enquiry limit reached");
    }
  }

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

  ownerSub.usage.enquiryUsed += 1;
  await ownerSub.save();

  return lead;
};





/**  ASSIGN LEAD TO SALES **/
export const assignLead = async (leadId: string, assignedTo: string) => {
  if (!Types.ObjectId.isValid(leadId)) {
    throw new Error("Invalid lead ID");
  }

  if (!Types.ObjectId.isValid(assignedTo)) {
    throw new Error("Invalid user ID");
  }

  const lead = await Lead.findByIdAndUpdate(
    leadId,
    { assignedTo },
    { new: true }
  );

  if (!lead) throw new Error("Lead not found");

  return lead;
};

/**   UPDATE LEAD STATUS **/
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

  /* ✅ Project-wise filter */
  if (query.projectId) {
    if (!Types.ObjectId.isValid(query.projectId)) {
      throw new Error("Invalid projectId");
    }
    filter.projectId = query.projectId;
  }

  /* Optional filters */
  if (query.propertyType) filter.propertyType = query.propertyType;
  if (query.status) filter.status = query.status;

  /* Role-based rules */
  if (user?.role === "sales") {
    filter.assignedTo = user.id;
  }

  return Lead.find(filter)
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 })
    .lean();
};

/*** GET SINGLE LEAD **/
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
