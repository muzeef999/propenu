import { Router } from "express";
import { addToShortlist, getBuilderFeaturedShortlists, getBuilderNotificationsController, getBuilderNotificationsSummaryController, getBuilderProjectActivityController, getMyShortlist, getProjectAnalytics, getShortlistStatus, getUserNotificationsController, getUserNotificationsSummaryController, markBuilderNotificationsSeenController, markUserNotificationsSeenController, removeFromShortlist, syncShortlist } from "../controller/shortlistController";
import { authMiddleware } from "../middlewares/authMiddleware";


const router = Router();

router.post("/", authMiddleware, addToShortlist);
router.post("/sync", authMiddleware, syncShortlist);
router.delete("/:propertyId", authMiddleware, removeFromShortlist);
router.get("/", authMiddleware, getMyShortlist);
router.get("/status", authMiddleware, getShortlistStatus);
router.get("/analytics", authMiddleware, getProjectAnalytics);
router.get("/featured-shortlists", authMiddleware, getBuilderFeaturedShortlists);
router.get("/notifications/me/summary", authMiddleware, getUserNotificationsSummaryController);
router.get("/notifications/me", authMiddleware, getUserNotificationsController);
router.post("/notifications/me/seen", authMiddleware, markUserNotificationsSeenController);
router.get("/notifications/summary", authMiddleware, getBuilderNotificationsSummaryController);
router.get("/notifications", authMiddleware, getBuilderNotificationsController);
router.post("/notifications/seen", authMiddleware, markBuilderNotificationsSeenController);
router.get("/projects/:projectId/activity", authMiddleware, getBuilderProjectActivityController);
export default router;
