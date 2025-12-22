// src/Redux/slice/citySlice.ts

import { LocationItem } from "@/types";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

const url = process.env.NEXT_PUBLIC_API_URL;

export const fetchLocations = createAsyncThunk(
  "city/fetchLocations",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${url}/api/users/location`);
      if (!res.ok) {
        return rejectWithValue("Failed to fetch locations");
      }
      const data = await res.json();
      return data.locations;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export interface CityState {
  selected: LocationItem | null;
  locations: LocationItem[];
}

const initialState: CityState = {
  selected: null,
  locations: [],
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
    setLocations(state, action: PayloadAction<LocationItem[]>) {
      state.locations = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocations.pending, () => {})
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.locations = action.payload || [];
      })
      .addCase(fetchLocations.rejected, (_, action) => {
      });
  },
});

export const { setCity, clearCity, setLocations } = citySlice.actions;

export default citySlice.reducer;
