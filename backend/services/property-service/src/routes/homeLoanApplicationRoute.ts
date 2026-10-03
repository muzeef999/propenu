import { Router } from "express";
import { createHomeLoanApplicationController } from "../controller/homeLoanApplicationController";

const router = Router();

router.post("/applications", createHomeLoanApplicationController);

export default router;
