// slices/filtersSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ListingOption = "Buy" | "Rent" | "Lease";
export type PropertyTypeOption = "Residential" | "Commercial" | "Land" | "Agricultural";

interface FiltersState {
  listingType: ListingOption;
  propertyType: PropertyTypeOption;
  searchText: string;
  // add other filters like budget, locations etc. as needed
}

const initialState: FiltersState = {
  listingType: "Buy",
  propertyType: "Residential",
  searchText: "",
};

const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setListingType(state, action: PayloadAction<ListingOption>) {
      state.listingType = action.payload;
    },
    setPropertyType(state, action: PayloadAction<PropertyTypeOption>) {
      state.propertyType = action.payload;
    },
    setSearchText(state, action: PayloadAction<string>) {
      state.searchText = action.payload;
    },
    resetFilters(state) {
      // either return initialState or explicitly reset fields
      return initialState;
    },
    // optionally: bulk update
    setFilters(state, action: PayloadAction<Partial<FiltersState>>) {
      return { ...state, ...action.payload };
    },
  },
});

export const { setListingType, setPropertyType, setSearchText, resetFilters, setFilters } = filtersSlice.actions;
export default filtersSlice.reducer;
