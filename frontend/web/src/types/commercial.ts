import { IFileRef } from "./sharedTypes";

export interface ICommercial  {
  title: string;
  slug: string;
  floorNumber?: number;
  totalFloors?: number;
  furnishedStatus?: 'unfurnished' | 'semi-furnished' | 'fully-furnished';
  powerBackup?: string;
  powerCapacityKw?: number;
  lift?: boolean;
  washrooms?: number;
  ceilingHeightFt?: number;
  builtYear?: number;
  maintenanceCharges?: number;
  fireSafety?: boolean;
  fireNOCFile?: IFileRef | null;
  loadingDock?: boolean;
  loadingDockDetails?: string;
  parkingCapacity?: number;
  tenantInfo?: { currentTenant?: string; leaseStart?: Date; leaseEnd?: Date; rent?: number }[];
  zoning?: string;
  occupancyCertificateFile?: IFileRef | null;
  leaseDocuments?: IFileRef[];
  buildingManagement?: { security?: boolean; managedBy?: string; contact?: string };
}