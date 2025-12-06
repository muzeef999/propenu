export type PropertyType = "Residential" | "Commercial" | "Land" | "Agricultural";

export type SearchFilters = {
  propertyType?: string; // comma separated list like "Residential,Land"
    listingType?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
   status?: string;
   bedrooms?: number; 
  city?: string;
  sort?: "newest" | "price_asc" | "price_desc";

};

export type SearchResultItem = {
  
  id: string;
  type: PropertyType;
  title?: string;
  price?: number;
  location?: any; 
  thumbnailUrl?: string;
  areaSqFt?: number;
  status?: string;   
  bedrooms?: number;
  createdAt?: Date;
};
