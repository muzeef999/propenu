import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  completeFieldMeetingNextAction,
  createFieldMeeting,
  getFieldMeetingById,
  getFieldMeetingTeamSummary,
  getFieldMeetingTerritory,
  listFieldMeetings,
  searchFieldMeetingContacts,
  updateFieldMeeting,
  updatePrepTask,
} from "../controller/fieldMeetingController";

const fieldMeetingRoute = express.Router();

fieldMeetingRoute.use(authMiddleware);

fieldMeetingRoute.get("/", listFieldMeetings);
fieldMeetingRoute.get("/team-summary", getFieldMeetingTeamSummary);
fieldMeetingRoute.get("/territory", getFieldMeetingTerritory);
fieldMeetingRoute.get("/contacts/search", searchFieldMeetingContacts);
fieldMeetingRoute.get("/:id", getFieldMeetingById);
fieldMeetingRoute.post("/", createFieldMeeting);
fieldMeetingRoute.patch("/:id", updateFieldMeeting);
fieldMeetingRoute.patch("/:id/prep/:taskId", updatePrepTask);
fieldMeetingRoute.patch("/:id/next-action", completeFieldMeetingNextAction);

export { fieldMeetingRoute };
export default fieldMeetingRoute;