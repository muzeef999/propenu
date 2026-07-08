import express from "express";
import {
  createComment,
  deleteComment,
  listComments,
  updateComment,
} from "./comment.controller";
import { validateCommentPayload } from "./comment.validation";

const router = express.Router();

router.get("/", listComments);
router.post("/", validateCommentPayload(), createComment);
router.post("/tickets/:ticketId", validateCommentPayload(), createComment);
router.patch("/tickets/:ticketId/:commentId", validateCommentPayload(true), updateComment);
router.delete("/tickets/:ticketId/:commentId", deleteComment);

export default router;

