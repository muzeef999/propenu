import { Router } from 'express';
import { assignLeadController, checkLeadController, createLeadController, createPublicLeadController, downloadLeadsCSVController, getLeadByIdController, getLeadsController, getMyContactedProperties, getProjectLeadsController, updateLeadStatusController, updateProjectLeadStatusController } from "../controller/leadController"
import { LeadCreateSchema } from '../zod/leadZod';
import { validateBody } from '../middlewares/validate';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireActiveSubscription } from '../middlewares/requireActiveSubscription';
import { requireContactOwnerLimit } from '../middlewares/requireContactOwnerLimit';

const router = Router();


router.post(
  '/',
  (req, res, next) => {
    console.log("🧪 ROUTE HIT /leads");
    console.log("🧪 req.body BEFORE validation:", req.body);
    next();
  },
  validateBody(LeadCreateSchema),
  requireContactOwnerLimit,
  authMiddleware,
  createLeadController
);


router.post("/project/lead",  createPublicLeadController);
router.get("/project/:projectId/leads", getProjectLeadsController);
router.patch("/project/:id/status", updateProjectLeadStatusController);
router.get("/project/:projectId/leads/csv",downloadLeadsCSVController);



router.get('/my-contacts', authMiddleware, getMyContactedProperties);
router.patch('/:id/assign', assignLeadController);
router.patch('/:id/status', updateLeadStatusController);
router.get('/', getLeadsController);
router.get('/:id', getLeadByIdController);
router.get("/check", authMiddleware, checkLeadController);

export default router;
