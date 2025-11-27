// src/validation/property/commercial.schema.ts
import { z } from 'zod';
import { BaseCreateSchema, FileRefSchema, ImageSchema, BhkSummarySchema, LegalChecksSchema, PropertyListQuerySchema } from './sharedZod';

export const CommercialCreateSchema = BaseCreateSchema.extend({
  floorNumber: z.number().int().optional(),
  totalFloors: z.number().int().optional(),
  furnishedStatus: z.enum(['unfurnished', 'semi-furnished', 'fully-furnished']).optional(),
  powerBackup: z.string().optional(),
  powerCapacityKw: z.number().optional(),
  lift: z.boolean().optional(),
  washrooms: z.number().int().optional(),
  ceilingHeightFt: z.number().optional(),
  builtYear: z.number().int().optional(),
  maintenanceCharges: z.number().optional(),
  fireSafety: z.boolean().optional(),
  fireNOCFile: FileRefSchema.optional().nullable(),
  loadingDock: z.boolean().optional(),
  loadingDockDetails: z.string().optional(),
  parkingCapacity: z.number().int().optional(),
  tenantInfo: z
    .array(
      z.object({
        currentTenant: z.string().optional(),
        leaseStart: z.preprocess((v) => (v ? new Date(v as string) : undefined), z.date().optional()),
        leaseEnd: z.preprocess((v) => (v ? new Date(v as string) : undefined), z.date().optional()),
        rent: z.number().optional(),
      })
    )
    .optional()
    .default([]),
  zoning: z.string().optional(),
  occupancyCertificateFile: FileRefSchema.optional().nullable(),
  leaseDocuments: z.array(FileRefSchema).optional().default([]),
  buildingManagement: z.object({ security: z.boolean().optional(), managedBy: z.string().optional(), contact: z.string().optional() }).optional(),
  bhkSummary: z.array(BhkSummarySchema).optional().default([]),
  legalChecks: LegalChecksSchema.optional().default({
      approvals: [],
      approvalsFiles: [],
      taxReceipts: [],
      litigation: { hasLitigation: false, documents: [] },
    }),
  gallery: z.array(ImageSchema).optional().default([]),
});
export type CommercialCreate = z.infer<typeof CommercialCreateSchema>;

export const CommercialUpdateSchema = CommercialCreateSchema.partial();
export type CommercialUpdate = z.infer<typeof CommercialUpdateSchema>;

export const CommercialFilterSchema = PropertyListQuerySchema;
export type CommercialFilter = z.infer<typeof CommercialFilterSchema>;
