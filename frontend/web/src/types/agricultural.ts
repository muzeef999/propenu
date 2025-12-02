import { IFileRef } from "./sharedTypes";

export interface IAgricultural  {

  boundaryWall?: boolean;
  areaUnit?: 'sqft' | 'sqmt' | 'acre' | 'guntha' | 'kanal' | 'hectare' | string;
  landShape?: string;
  soilType?: string;
  irrigationType?: string;
  currentCrop?: string;
  suitableFor?: string;
  plantationAge?: number;
  numberOfBorewells?: number;
  borewellDetails?: { depthMeters?: number; yieldLpm?: number; drilledYear?: number; files?: any[] };
  electricityConnection?: boolean;
  waterSource?: string;
  accessRoadType?: string;
  soilTestReport?: IFileRef | null;
  statePurchaseRestrictions?: string;
  agriculturalUseCertificate?: IFileRef | null;
}
