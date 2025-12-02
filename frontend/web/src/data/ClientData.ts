// services/property.service.ts

import { ApiResponse } from "@/types/property";
import axiosInstance from "@/utilies/axiosInstance";


export const searchFilter = async ({
  propertyType,
  listingType,
  searchText,
}: {
  propertyType?: string;
  listingType?: string;
  searchText?: string;
}) => {
  const res = await axiosInstance.get<ApiResponse>("/properties/search", {
    params: {
      propertyType,
      listingType,
      search: searchText,
    },
  });

  return res.data;
};
