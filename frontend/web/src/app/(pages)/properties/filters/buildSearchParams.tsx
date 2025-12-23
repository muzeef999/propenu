import { FilterState } from "@/types/sharedTypes";

export type SearchFilterParams = {
  category: string;
  listingType: string;
  search?: string;
  minBudget?: number;
  maxBudget?: number;
  bhk?: number;
  bedrooms?: number;
  bathrooms?: number;
  postedBy?: string;
};

export function buildSearchParams(filters: FilterState): SearchFilterParams {
  const params: SearchFilterParams = {
    category: filters.category,
    listingType: filters.listingType,
  };

  // 🔍 search
  if (filters.searchText.trim()) {
    params.search = filters.searchText.trim();
  }

  // 💰 budget
  if (filters.minBudget) params.minBudget = filters.minBudget;
  if (filters.maxBudget) params.maxBudget = filters.maxBudget;

  // 🏠 Residential only
  if (filters.category === "Residential") {
    console.log("filter testing 11", filters.bhk);

    if (filters.bhk !== undefined) {
      params.bhk = filters.bhk;
    }

    if (filters.bedrooms) params.bedrooms = filters.bedrooms;
    if (filters.bathrooms) params.bathrooms = filters.bathrooms;
    if (filters.postedBy) params.postedBy = filters.postedBy;
  }

  // 🏢 Commercial
  if (filters.category === "Commercial") {
    console;
  }

  // 🌾 Land
  if (filters.category === "Land") {
    console.log("Land filters to be implemented");
  }

  // 🌱 Agricultural
  if (filters.category === "Agricultural") {
    console.log("Agricultural filters to be implemented");
  }

  return params;
}
