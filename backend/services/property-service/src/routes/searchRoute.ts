import { Router } from "express";
import streamSearchHandler, {
  getActiveLocationsHandler,
  getSearchSuggestionsHandler,
} from "../controller/searchController";
import { myProperties} from "../controller/topPropertiesController"
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/active-locations", getActiveLocationsHandler);
router.get("/suggestions", getSearchSuggestionsHandler);
router.get("/", streamSearchHandler);

router.get("/my", authMiddleware, myProperties);

export default router;
