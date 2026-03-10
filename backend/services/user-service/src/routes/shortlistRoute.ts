import { Router } from "express";
import { addToShortlist, getMyShortlist, getProjectAnalytics, getShortlistStatus, removeFromShortlist, syncShortlist } from "../controller/shortlistController";
import { authMiddleware } from "../middlewares/authMiddleware";


const router = Router();

router.post("/", authMiddleware, addToShortlist);
router.post("/sync", authMiddleware, syncShortlist);
router.delete("/:propertyId", authMiddleware, removeFromShortlist);
router.get("/", authMiddleware, getMyShortlist);
router.get("/status", authMiddleware, getShortlistStatus);
router.get("/analytics", authMiddleware, getProjectAnalytics)
export default router;
