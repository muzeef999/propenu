import { Request, Response } from "express";
import { addToShortlistService, getShortlistStatusService, getUserShortlistService, removeFromShortlistService } from "../services/shortlistService";
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
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* REMOVE FROM SHORTLIST */
export const removeFromShortlist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user._id; // from auth middleware
    const { propertyId } = req.body;

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
