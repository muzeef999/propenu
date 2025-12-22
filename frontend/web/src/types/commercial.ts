import { IFileRef } from "./sharedTypes";


export type GalleryItem = {
  url: string;
  key: string;
  filename: string;
  order: number;
};


export type SpecificationItem = {
  title: string;
  description?: string;
};

export type Specification = {
  category: string;
  items: SpecificationItem[];
  order?: number; // optional, default can be handled in code / DB
}



export const PANTRY_TYPES = [
  "none",
  "dry",
  "wet",
  "shared",
  "cafeteria-access",
] as const;

export type PantryType = (typeof PANTRY_TYPES)[number];



export type AmenitiesItems = {
  key: string,
  title: string
}

export interface ICommercial {
  title: string;
  slug: string;
  floorNumber?: number;
  totalFloors?: number;
  price?: number;
  city?: string;
  furnishedStatus?: 'unfurnished' | 'semi-furnished' | 'fully-furnished';
  powerBackup?: string;
  powerCapacityKw?: number;
  lift?: boolean;
  superBuiltUpArea?: string;
  gallery?: GalleryItem[];
  constructionStatus?: string
  transactionType?: string
  carpetArea?: number;
  pricePerSqft?: number;
  furnishing?: string;
  seats?: number;
  officeRooms?: number;
  washrooms?: number;
  amenities: AmenitiesItems[];
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
  address?: string;
  pantry?: {
    type?: PantryType;
    insidePremises?: boolean;
    shared?: boolean;
  };
  description?: string;
  buildingManagement?: { security?: boolean; managedBy?: string; contact?: string };
  cabins: number,
  meetingRooms: number,
  conferenceRooms: number,
  specifications: SpecificationItem[],
  createdBy?: { name?: string; contact?: string; email?: string };
}