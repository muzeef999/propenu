import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/* ---------------- Types ---------------- */

export type ListingOption = "Buy" | "Rent" | "Lease";

export type categoryOption =
  | "Residential"
  | "Commercial"
  | "Land"
  | "Agricultural";

interface FilterState {
  /* -------- Core (DO NOT REMOVE) -------- */
  listingType: ListingOption;
  category: categoryOption;
  searchText: string;

  /* -------- Shared -------- */
  minArea?: number;
  maxArea?: number;

  /* -------- Residential -------- */
  bhk?: number;
  bedrooms?: number;
  bathrooms?: number;

  /* -------- Commercial -------- */
  commercialType?: string;
  parking?: string;

  /* -------- Land -------- */
  facing?: string;
  roadFacing?: string;

  /* -------- Agricultural -------- */
  soilType?: string;     // ✅ NEW
}

/* ---------------- Initial State ---------------- */

const initialState: FilterState = {
  listingType: "Buy",
  category: "Residential",
  searchText: "",
};

/* ---------------- Slice ---------------- */

const filterSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    /* -------- Core (existing) -------- */

    setListingType(state, action: PayloadAction<ListingOption>) {
      state.listingType = action.payload;
    },

    setCategory(state, action: PayloadAction<categoryOption>) {
      state.category = action.payload;

      // 🔥 Reset category-specific filters ONLY
      state.bhk = undefined;
      state.bedrooms = undefined;
      state.bathrooms = undefined;

      state.commercialType = undefined;
      state.parking = undefined;

      state.facing = undefined;
      state.roadFacing = undefined;

      state.soilType = undefined;

      state.minArea = undefined;
      state.maxArea = undefined;
    },

    setSearchText(state, action: PayloadAction<string>) {
      state.searchText = action.payload;
    },

    /* -------- Shared -------- */

    setMinArea(state, action: PayloadAction<number | undefined>) {
      state.minArea = action.payload;
    },

    setMaxArea(state, action: PayloadAction<number | undefined>) {
      state.maxArea = action.payload;
    },

    /* -------- Residential -------- */

    setBhk(state, action: PayloadAction<number | undefined>) {
      state.bhk = action.payload;
    },

    setBedrooms(state, action: PayloadAction<number | undefined>) {
      state.bedrooms = action.payload;
    },

    setBathrooms(state, action: PayloadAction<number | undefined>) {
      state.bathrooms = action.payload;
    },

    /* -------- Commercial -------- */

    setCommercialType(state, action: PayloadAction<string | undefined>) {
      state.commercialType = action.payload;
    },

    setParking(state, action: PayloadAction<string | undefined>) {
      state.parking = action.payload;
    },

    /* -------- Land -------- */

    setFacing(state, action: PayloadAction<string | undefined>) {
      state.facing = action.payload;
    },

    setRoadFacing(state, action: PayloadAction<string | undefined>) {
      state.roadFacing = action.payload;
    },

    /* -------- Agricultural -------- */

    setSoilType(state, action: PayloadAction<string | undefined>) {
      state.soilType = action.payload;
    },
  },
});

/* ---------------- Exports ---------------- */

export const {
  setListingType,
  setCategory,
  setSearchText,

  setMinArea,
  setMaxArea,

  setBhk,
  setBedrooms,
  setBathrooms,

  setCommercialType,
  setParking,

  setFacing,
  setRoadFacing,

  setSoilType, // ✅ NEW
} = filterSlice.actions;

export default filterSlice.reducer;
