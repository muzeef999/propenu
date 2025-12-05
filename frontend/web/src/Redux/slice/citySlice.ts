// src/Redux/slice/citySlice.ts

import { LocationItem } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CityState {
  selected: LocationItem | null;
  popularCities: LocationItem[];
  normalCities: LocationItem[];
}

const initialState: CityState = {
  selected: null,
  popularCities: [
    {
      id: "hyd",
      name: "Hyderabad",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
    },
    {
      id: "vizag",
      name: "Visakhapatnam",
      city: "Visakhapatnam",
      state: "Andhra Pradesh",
      country: "India",
    },
  ],
  normalCities: [
    {
      id: "guntur",
      name: "Guntur",
      city: "Guntur",
      state: "Andhra Pradesh",
      country: "India",
    },
    {
      id: "vijayawada",
      name: "Vijayawada",
      city: "Vijayawada",
      state: "Andhra Pradesh",
      country: "India",
    },
    {
      id: "tenali",
      name: "Tenali",
      city: "Tenali",
      state: "Andhra Pradesh",
      country: "India",
    },
  ],
};

const citySlice = createSlice({
  name: "city",
  initialState,
  reducers: {
    // ✅ Action **with payload**
    setCity(state, action: PayloadAction<LocationItem | null>) {
      state.selected = action.payload;
    },
    clearCity(state) {
      state.selected = null;
    },
    setPopularCities(state, action: PayloadAction<LocationItem[]>) {
      state.popularCities = action.payload;
    },
    setNormalCities(state, action: PayloadAction<LocationItem[]>) {
      state.normalCities = action.payload;
    },
  },
});

export const { setCity, clearCity, setPopularCities, setNormalCities } =
  citySlice.actions;

export default citySlice.reducer;
