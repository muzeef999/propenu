import { FilterState } from "@/types/sharedTypes";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { set } from "zod";

/* ---------------- Types ---------------- */

export type ListingOption = "Buy" | "Rent" | "Lease";

export type categoryOption =
  | "Residential"
  | "Commercial"
  | "Land"
  | "Agricultural";

/* ---------------- State ---------------- */

/* ---------------- Initial State ---------------- */

const initialState: FilterState = {
  listingType: "Buy",
  category: "Residential",
  searchText: "",

  /* ✅ Budget defaults (5 Lac → 50 Cr) */
  minBudget: 5,
  maxBudget: 5000,
};

/* ---------------- Slice ---------------- */

const filterSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    /* -------- Core -------- */

    setListingType(state, action: PayloadAction<ListingOption>) {
      state.listingType = action.payload;
    },

    setCategory(state, action: PayloadAction<categoryOption>) {
      state.category = action.payload;

      // 🔥 Reset category-specific filters
      state.bhk = undefined;
      state.bedrooms = undefined;
      state.bathrooms = undefined;
      state.postedBy = undefined;

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

    /* -------- Budget -------- */

    setBudget(state, action: PayloadAction<{ min: number; max: number }>) {
      state.minBudget = action.payload.min;
      state.maxBudget = action.payload.max;
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

    setPostedBy(state, action: PayloadAction<string | undefined>) {
      state.postedBy = action.payload;
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

  setBudget,

  setMinArea,
  setMaxArea,

  setBhk,
  setBedrooms,
  setBathrooms,
  setPostedBy,
  setCommercialType,
  setParking,

  setFacing,
  setRoadFacing,

  setSoilType,
} = filterSlice.actions;

export default filterSlice.reducer;
