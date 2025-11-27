// src/validation/property/land.schema.ts
import { z } from 'zod';
import { BaseCreateSchema, FileRefSchema, ImageSchema, LegalChecksSchema, PropertyListQuerySchema } from './sharedZod';

export const LandCreateSchema = BaseCreateSchema.extend({
  plotArea: z.number().positive().optional(),
  plotAreaUnit: z.enum(['sqft', 'sqmt', 'acre', 'guntha', 'kanal', 'hectare']).optional(),
  roadWidthFt: z.number().optional(),
  negotiable: z.boolean().optional(),
  readyToConstruct: z.boolean().optional(),
  waterConnection: z.boolean().optional(),
  electricityConnection: z.boolean().optional(),
  approvedByAuthority: z.array(z.string()).optional().default([]),
  facing: z.string().optional(),
  cornerPlot: z.boolean().optional(),
  fencing: z.boolean().optional(),
  landUseZone: z.string().optional(),
  conversionCertificateFile: FileRefSchema.optional().nullable(),
  encumbranceCertificateFile: FileRefSchema.optional().nullable(),
  soilTestReport: FileRefSchema.optional().nullable(),
  surveyNumber: z.string().optional(),
  layoutType: z.string().optional(),
  legalChecks: LegalChecksSchema.optional().default({
    approvals: [],
    approvalsFiles: [],
    taxReceipts: [],
    litigation: { hasLitigation: false, documents: [] },
  }),
  gallery: z.array(ImageSchema).optional().default([]),
});
export type LandCreate = z.infer<typeof LandCreateSchema>;

export const LandUpdateSchema = LandCreateSchema.partial();
export type LandUpdate = z.infer<typeof LandUpdateSchema>;

export const LandFilterSchema = PropertyListQuerySchema;
export type LandFilter = z.infer<typeof LandFilterSchema>;
