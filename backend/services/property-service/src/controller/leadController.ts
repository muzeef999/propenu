import { Request, RequestHandler, Response } from "express";
import {
  assignLead,
  createLead,
  getLeadById,
  getLeads,
  updateLeadStatus,
  updateLeadStatusService,
} from "../services/leadService";
import { LEAD_STATUSES, LeadCreateSchema } from "../zod/leadZod";
import { AuthRequest } from "../middlewares/authMiddleware";
import Lead from "../models/LeadModel";
import { PublicLeadSchemaZ } from "../zod/publicLeadZod";
import { createPublicLead } from "../services/publicLeadService";
import PublicLead from "../models/PublicLead";
import mongoose, { Types } from "mongoose";


const sendCSV = (leads: any[], res: Response) => {
  const header = "Name,Phone,Status,Date\n";

  const rows = leads
    .map(
      (l) =>
        `${l.name},${l.phone},${l.status},${new Date(
          l.createdAt
        ).toLocaleDateString("en-IN")}`
    )
    .join("\n");

  const csv = header + rows;

  res.header("Content-Type", "text/csv");
  res.attachment("leads.csv");
  res.send(csv);
};

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




export const createPublicLeadController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = PublicLeadSchemaZ.parse(req.body);
    const lead = await createPublicLead(data);

    res.status(201).json({
      success: true,
      message: "Lead submitted successfully",
      data: lead,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};


export const getProjectLeadsController = async (
  req: Request,
  res: Response
) => {
  try {
    const projectId = req.params.projectId;
    const { from, to } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: "projectId is required" });
    }

    if (!Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid projectId" });
    }

    const query: any = { projectId };

    // ✅ Date filter without any package
    if (from || to) {
      query.createdAt = {};

      if (from) {
        query.createdAt.$gte = new Date(from as string);
      }

      if (to) {
        const toDate = new Date(to as string);
        toDate.setHours(23, 59, 59, 999); // include full day
        query.createdAt.$lte = toDate;
      }
    }

    const leads = await PublicLead.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: leads.length,
      data: leads,
    });

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProjectLeadStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Lead ID is required",
      });
    }

    if (!status || !LEAD_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updatedLead = await updateLeadStatusService(id, status);

    res.json({
      success: true,
      data: updatedLead,
      message: "Lead status updated",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const downloadLeadsCSVController = async (
  req: Request,
  res: Response
) => {
  try {
    const projectId = req.params.projectId;
    const { from, to } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: "projectId required" });
    }

    if (!Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid projectId" });
    }

    const query: any = { projectId };

    // ✅ Only apply date filter IF provided
    if (from || to) {
      query.createdAt = {};

      if (from) {
        query.createdAt.$gte = new Date(from as string);
      }

      if (to) {
        const toDate = new Date(to as string);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    const leads = await PublicLead.find(query).lean();

    // ✅ If no leads found → still send full file
    if (!leads.length && !from && !to) {
      const allLeads = await PublicLead.find({ projectId }).lean();
      return sendCSV(allLeads, res);
    }

    return sendCSV(leads, res);

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};