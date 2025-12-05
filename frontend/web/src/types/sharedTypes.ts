
export type ListingType = 'sale' | 'rent' | 'lease';
export type AreaUnit = 'sqft' | 'sqmt' | 'acre' | 'guntha' | 'kanal' | 'hectare';
export type FurnishingStatus = 'unfurnished' | 'semi-furnished' | 'fully-furnished';
export type ConstructionStatus = 'ready-to-move' | 'under-construction';
export type PropertyStatus = 'active' | 'inactive' | 'archived';





export interface IBaseListing {
  title: string;
  slug?: string;         // optional because you generate it in pre('validate')
  address?: string;
  city?: string;
  // add other truly-shared listing props here
}


/* -------------------------
   FILE / MEDIA SCHEMAS
   ------------------------- */
export interface IFileRef {
  title?: string;
  url?: string;
  key?: string;
  filename?: string;
  mimetype?: string;
  uploadedAt?: Date;
}



export interface IImage {
  url: string;
  key?: string;
  filename?: string;
  mimetype?: string;
  order?: number;
  caption?: string;
}