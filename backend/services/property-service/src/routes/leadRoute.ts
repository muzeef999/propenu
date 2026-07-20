import { Router } from 'express';
import multer from "multer";
import { assignLeadController, checkLeadController, createLeadController, createPublicLeadController, deleteLeadController, deleteProjectLeadsController, downloadLeadsCSVController, exportAdminLeadsController, getAdminLeadsController, getLeadByIdController, getLeadsController, getMyContactedProperties, getProjectLeadsController, importProjectLeadsCSVController, updateLeadStatusController, updateProjectLeadStatusController } from "../controller/leadController"
import { LeadCreateSchema } from '../zod/leadZod';
import { validateBody } from '../middlewares/validate';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireActiveSubscription } from '../middlewares/requireActiveSubscription';
import { requireContactOwnerLimit } from '../middlewares/requireContactOwnerLimit';
import { requirePermission } from '../middlewares/requirePermission';
import {
  loadBuilderAccess,
  loadLeadProjectAccess,
  requireAssignableBuilderMember,
  requireBuilderPermission,
  requireProjectParamAccess,
} from '../middlewares/builderAccess';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});


router.post('/', (req, res, next) => {
    console.log("🧪 ROUTE HIT /leads");
    console.log("🧪 req.body BEFORE validation:", req.body);
    next();
  },

  validateBody(LeadCreateSchema),
  authMiddleware,
  requireContactOwnerLimit,
  createLeadController
);


router.post("/project/lead",  createPublicLeadController);
router.get(
  "/project/:projectId/leads",
  authMiddleware,
  loadBuilderAccess,
  requireBuilderPermission("lead:view"),
  requireProjectParamAccess("projectId"),
  getProjectLeadsController,
);
router.post(
  "/project/:projectId/leads/import",
  authMiddleware,
  loadBuilderAccess,
  requireBuilderPermission("lead:import"),
  requireProjectParamAccess("projectId"),
  upload.single("file"),
  importProjectLeadsCSVController,
);
router.patch(
  "/project/:id/status",
  authMiddleware,
  loadBuilderAccess,
  requireBuilderPermission("lead:update"),
  loadLeadProjectAccess("id"),
  updateProjectLeadStatusController,
);
router.get(
  "/project/:projectId/leads/csv",
  authMiddleware,
  loadBuilderAccess,
  requireBuilderPermission("lead:download"),
  requireProjectParamAccess("projectId"),
  downloadLeadsCSVController,
);
router.delete(
  "/project/:projectId/leads",
  authMiddleware,
  loadBuilderAccess,
  requireBuilderPermission("lead:delete"),
  requireProjectParamAccess("projectId"),
  deleteProjectLeadsController,
);



router.get('/my-contacts', authMiddleware, getMyContactedProperties);
router.get("/check", authMiddleware, checkLeadController);
router.get(
  "/admin/overview",
  authMiddleware,
  requirePermission("lead:view"),
  getAdminLeadsController,
);
router.get("/admin/export", authMiddleware, requirePermission("lead:export"), exportAdminLeadsController);
router.patch(
  '/:id/assign',
  authMiddleware,
  loadBuilderAccess,
  requireBuilderPermission("lead:assign"),
  loadLeadProjectAccess("id"),
  requireAssignableBuilderMember,
  assignLeadController,
);
router.patch(
  '/:id/status',
  authMiddleware,
  loadBuilderAccess,
  requireBuilderPermission("lead:update"),
  loadLeadProjectAccess("id"),
  updateLeadStatusController,
);
router.delete(
  '/:id',
  authMiddleware,
  loadBuilderAccess,
  requireBuilderPermission("lead:delete"),
  loadLeadProjectAccess("id"),
  deleteLeadController,
);
router.get('/', getLeadsController);
router.get('/:id', getLeadByIdController);

export default router;
