import { Router } from "express";
import { addToShortlist, getBuilderFeaturedShortlists, getBuilderNotificationsController, getBuilderProjectActivityController, getMyShortlist, getProjectAnalytics, getShortlistStatus, removeFromShortlist, syncShortlist } from "../controller/shortlistController";
import { authMiddleware } from "../middlewares/authMiddleware";


const router = Router();

router.post("/", authMiddleware, addToShortlist);
router.post("/sync", authMiddleware, syncShortlist);
router.delete("/:propertyId", authMiddleware, removeFromShortlist);
router.get("/", authMiddleware, getMyShortlist);
router.get("/status", authMiddleware, getShortlistStatus);
router.get("/analytics", authMiddleware, getProjectAnalytics);
router.get("/featured-shortlists", authMiddleware, getBuilderFeaturedShortlists);
router.get("/notifications", authMiddleware, getBuilderNotificationsController);
router.get("/projects/:projectId/activity", authMiddleware, getBuilderProjectActivityController);
export default router;
