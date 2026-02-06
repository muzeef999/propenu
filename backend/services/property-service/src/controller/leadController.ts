import { Request, RequestHandler, Response } from "express";
import {
  assignLead,
  createLead,
  getLeadById,
  getLeads,
  updateLeadStatus,
} from "../services/leadService";
import { LeadCreateSchema } from "../zod/leadZod";
import { AuthRequest } from "../middlewares/authMiddleware";
import Lead from "../models/LeadModel";

/*** CREATE LEAD */
export const createLeadController: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest; // 👈 cast once

    const data = LeadCreateSchema.parse(authReq.body);
    const lead = await createLead(data, authReq.user!.id);

    res.status(201).json({ success: true, data: lead });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*** ASSIGN LEAD */
export const assignLeadController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Lead ID is required",
      });
    }

    const lead = await assignLead(id, req.body.assignedTo);
    res.json({ success: true, data: lead });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*** UPDATE LEAD STATUS */
export const updateLeadStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Lead ID is required",
      });
    }
    const lead = await updateLeadStatus(id, req.body.status);
    res.json({ success: true, data: lead });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*** GET ALL LEADS */
export const getLeadsController = async (req: Request, res: Response) => {
  try {
    const leads = await getLeads(req.query);
    res.json({ success: true, data: leads });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*** GET SINGLE LEAD*/
export const getLeadByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Lead ID is required",
      });
    }

    const lead = await getLeadById(id);
    res.json({ success: true, data: lead });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};


// controller/leadController.ts
export const checkLeadController = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({ message: "projectId required" });
  }

  const exists = await Lead.exists({
    projectId,
    createdBy: userId,
  });

  res.json({ contacted: !!exists });
};

export const getMyContactedProperties = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;



    const leads = await Lead.find({ createdBy: userId })
      .populate("projectId")                    // full property
      .populate("ownerId", "name phone email")  // owner details
      .sort({ createdAt: -1 })
      .lean();



    const properties = leads.map((lead: any) => {
      const property = lead.projectId;

      return {
        leadId: lead._id,
        contactedAt: lead.createdAt,

        // 🔥 lead info
        propertyType: lead.propertyType,
        listingType: lead.listingType,

        // 🔥 property info
        propertyId: property?._id,
        title:
          property?.title ||
          property?.projectName ||
          property?.buildingName ||
          "Property",

        city: property?.city || "",
        locality: property?.locality || "",
        price: property?.price || property?.expectedPrice || null,
        gallery: property?.gallery?.[0]?.url || null,

        // 🔥 owner info
        owner: {
          id: lead.ownerId?._id,
          name: lead.ownerId?.name,
          phone: lead.ownerId?.phone,
          email: lead.ownerId?.email,
        },
      };
    });

    res.json({
      success: true,
      total: properties.length,
      properties,
    });
  } catch (err) {
    console.error("getMyContactedProperties error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load contacted properties",
    });
  }
};
