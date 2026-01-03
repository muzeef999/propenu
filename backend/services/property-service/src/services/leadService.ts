import { Types } from "mongoose";
import Lead from "../models/LeadModel";

const PROPERTY_MODEL_MAP: Record<string, string> = {
  featuredprojects: "FeaturedProject",
  residentials: "Residential",
  commercials: "Commercial",
  agriculturals: "Agricultural",
  landplots: "LandPlot",
};

/** CREATE LEAD **/
export const createLead = async (data: any) => {

  const { propertyType, projectId } = data;

  if (!Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid project/property ID");
  }

  const propertyModel = PROPERTY_MODEL_MAP[propertyType];

  if (!propertyModel) {
    throw new Error(`Invalid propertyType: ${propertyType}`);
  }

  const leadPayload = {
    ...data,
    propertyModel, // 🔥 REQUIRED
  };

  return await Lead.create(leadPayload);
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
