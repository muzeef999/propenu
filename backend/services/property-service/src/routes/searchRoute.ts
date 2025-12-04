import { Router } from "express";
import streamSearchHandler from "../controller/searchController";
import { myProperties} from "../controller/topPropertiesController"
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", streamSearchHandler);

router.get("/my", authMiddleware, myProperties);

export default router;
