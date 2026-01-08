import { Router } from 'express';
import { assignLeadController, checkLeadController, createLeadController, getLeadByIdController, getLeadsController, updateLeadStatusController } from "../controller/leadController"
import { LeadCreateSchema } from '../zod/leadZod';
import { validateBody } from '../middlewares/validate';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/',   validateBody(LeadCreateSchema), authMiddleware,  createLeadController);
router.patch('/:id/assign', assignLeadController);
router.patch('/:id/status', updateLeadStatusController);
router.get('/', getLeadsController);
router.get('/:id', getLeadByIdController);
// routes/leadRoute.ts
router.get("/check", authMiddleware, checkLeadController);


export default router;
