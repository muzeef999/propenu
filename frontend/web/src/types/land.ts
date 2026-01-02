import { LandFilterKey } from ".";
import { BaseSearchParams, IFileRef, LandFilters } from "./sharedTypes";

export type GalleryItem = {
  url: string;
  key: string;
  filename: string;
  order: number;
};

export interface NearbyPlace {
  name?: string;
  type?: string;
  distanceText?: string;
  coordinates?: [number, number]; // [lng, lat]
  order?: number;
}

export interface ILand {
  plotArea?: number;
  id?: string;
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
  location?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  _id: string;
  description?: string;
  gallery?: GalleryItem[];
  createdBy?: { name?: string; contact?: string; email?: string };
  pricePerSqft?: number;
  listingSource?: string;
  listingType?: 'buy' | 'rent' | 'lease';
  propertyType?: string;
  amenities?: string[];
verifiedProperties?:Boolean;
  nearbyPlaces?: NearbyPlace[];
  relatedProjects?: ILand[];

}



export type LandSearchParams = BaseSearchParams & {
  category: "Land";
  facing?: string;
};



export const landKeyMapping: Record<
  LandFilterKey,
  keyof LandFilters
> = {
  "Land Type": "landType",
  "Land Sub Type": "landSubType",
  "Plot Area": "plotArea",
  "Dimensions": "dimensions",

  "Road Width": "roadWidth",
  "Facing": "facing",

  "Corner Plot": "cornerPlot",
  "Ready To Construct": "readyToConstruct",

  "Water Connection": "waterConnection",
  "Electricity Connection": "electricityConnection",

  "Approved By": "approvedBy",
  "Land Use Zone": "landUseZone",

  "Banks Approved": "banksApproved",
  "Price Negotiable": "priceNegotiable",
  "Verified Properties": "verifiedProperties",

  "Posted Since": "postedSince",
  "Posted By": "postedBy",

};
