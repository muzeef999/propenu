import express from "express";
import {
  addTicketComment,
  assignTicket,
  changeTicketPriority,
  changeTicketStatus,
  createRequestCall,
  createTicket,
  deleteTicket,
  getTicketById,
  getTicketSummary,
  getTickets,
  removeTicketComment,
  updateTicket,
} from "./ticket.controller";
import {
  validateAssignment,
  validateComment,
  validateCreateTicket,
  validatePriorityChange,
  validateRequestCall,
  validateStatusChange,
  validateUpdateTicket,
} from "./ticket.validation";

const router = express.Router();

router.get("/summary", getTicketSummary);
router.get("/", getTickets);
router.post("/request-call", validateRequestCall, createRequestCall);
router.post("/", validateCreateTicket, createTicket);
router.get("/:id", getTicketById);
router.patch("/:id", validateUpdateTicket, updateTicket);
router.delete("/:id", deleteTicket);

router.patch("/:id/status", validateStatusChange, changeTicketStatus);
router.patch("/:id/assign", validateAssignment, assignTicket);
router.patch("/:id/priority", validatePriorityChange, changeTicketPriority);

router.post("/:id/comments", validateComment, addTicketComment);
router.delete("/:id/comments/:commentId", removeTicketComment);

export default router;
