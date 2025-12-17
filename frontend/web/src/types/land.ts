import { IFileRef } from "./sharedTypes";

export type GalleryItem = {
  url: string;
  key: string;
  filename: string;
  order: number;
};

export interface ILand {
  plotArea?: number;
  plotAreaUnit?: 'sqft' | 'sqmt' | 'acre' | 'guntha' | 'kanal' | 'hectare';
  roadWidthFt?: number;
  negotiable?: boolean;
  readyToConstruct?: boolean;
  waterConnection?: boolean;
  electricityConnection?: boolean;
  approvedByAuthority?: string[];
  facing?: string;
  cornerPlot?: boolean;
  fencing?: boolean;
  landUseZone?: string;
  conversionCertificateFile?: IFileRef | null;
  encumbranceCertificateFile?: IFileRef | null;
  soilTestReport?: IFileRef | null;
  surveyNumber?: string;
  layoutType?: string;
  price?: number;
  dimensions: {
    length: number;
    width: number;
  };
  title?: string;
  slug?: string;
  address?: string;
  city?: string;
  location?: string;
  description?: string;
  gallery?: GalleryItem[];
  createdBy?: { name?: string; contact?: string; email?: string };
  pricePerSqft?: number;
  listingSource?: string;

}