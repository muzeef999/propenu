import { Router } from 'express';
import { assignLeadController, createLeadController, getLeadByIdController, getLeadsController, updateLeadStatusController } from "../controller/leadController"
import { LeadCreateSchema } from '../zod/leadZod';
import { validateBody } from '../middlewares/validate';

const router = Router();

router.post('/',   validateBody(LeadCreateSchema), createLeadController);
router.patch('/:id/assign', assignLeadController);
router.patch('/:id/status', updateLeadStatusController);
router.get('/', getLeadsController);
router.get('/:id', getLeadByIdController);

export default router;
