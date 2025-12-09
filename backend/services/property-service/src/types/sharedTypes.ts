// ../types/sharedTypes.ts
import type { IndexDefinition } from 'mongoose';
import { Types } from 'mongoose';


/* -------------------------
   COMMON ENUMS / TYPES
   ------------------------- */
export type ListingType = 'sale' | 'rent' | 'lease';
export type AreaUnit = 'sqft' | 'sqmt' | 'acre' | 'guntha' | 'kanal' | 'hectare';
export type FurnishingStatus = 'unfurnished' | 'semi-furnished' | 'fully-furnished';
export type ConstructionStatus = 'ready-to-move' | 'under-construction';
export type PropertyStatus = 'active' | 'inactive' | 'archived';



export const TEXT_INDEX_FIELDS: IndexDefinition = {
  title: 'text',
  address: 'text',
  city: 'text',
};


export interface IBaseListing {
  title: string;
  slug?: string;         // optional because you generate it in pre('validate')
  address?: string;
  city?: string;
  listingType: 'sale' | 'rent' | 'lease';
  listingSource?: string;
  pincode?: string;  
  state?: string;
 createdBy?: Types.ObjectId;
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