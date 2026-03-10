import { Request, Response } from "express";
import { addToShortlistService, getBuilderAnalytics, getShortlistStatusService, getUserShortlistService, removeFromShortlistService } from "../services/shortlistService";
import { AuthRequest } from "../middlewares/authMiddleware";


/* ADD TO SHORTLIST */
export const addToShortlist = async (req: AuthRequest, res: Response) => {
  
try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user._id; // from auth middleware
    const { propertyId, propertyType  } = req.body;

    if (!propertyId || !propertyType) {
  return res.status(400).json({ message: "propertyId and propertyType required" });
}

    await addToShortlistService(userId, propertyId, propertyType);

    res.status(200).json({
      success: true,
      message: "Property shortlisted",
    });
  } catch (error) {
    // Handle bad ObjectId or duplicate key errors more gracefully
    const err: any = error;
    if (err?.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid propertyId" });
    }
    if (err?.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Property already shortlisted",
      });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* REMOVE FROM SHORTLIST */
export const removeFromShortlist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user._id;
    const { propertyId } = req.params; // ✅ FIX

    if (!propertyId) {
      return res.status(400).json({ message: "propertyId required" });
    }

    await removeFromShortlistService(userId, propertyId);

    res.status(200).json({
      success: true,
      message: "Property removed from shortlist",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/* GET USER SHORTLIST */
export const getMyShortlist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user._id; 
    const shortlist = await getUserShortlistService(userId);
    res.status(200).json({
      success: true,
      data: shortlist,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* SHORTLIST STATUS (for ⭐ icon) */
export const getShortlistStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user._id; // from auth middleware
    const { propertyId } = req.query as { propertyId: string };
    const shortlisted = await getShortlistStatusService(userId, propertyId);
    res.status(200).json({ shortlisted });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};




export const getProjectAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const builderId = req.user!.sub;   // from JWT token

    const data = await getBuilderAnalytics(builderId);

    res.json(data);
  } catch (e: any) {
    console.error("ANALYTICS_ERROR:", e);
    res.status(500).json({ message: "Failed to load analytics" });
  }
};


export const syncShortlist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { properties } = req.body;

    if (!properties || !Array.isArray(properties)) {
      return res.status(400).json({
        success: false,
        message: "Invalid shortlist data",
      });
    }

    for (const item of properties) {
      await addToShortlistService(
        userId,
        item.propertyId,
        item.propertyType
      );
    }

    res.status(200).json({
      success: true,
      message: "Shortlist synced successfully",
    });
  } catch (error) {
    console.error("SYNC_SHORTLIST_ERROR", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};