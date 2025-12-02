import { Router } from "express";
import streamSearchHandler from "../controller/searchController";

const router = Router();

router.get("/", streamSearchHandler);

export default router;
