import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { LocationItem } from "@/types";


const url = process.env.NEXT_PUBLIC_API_URL;

export const fetchLocations = createAsyncThunk<LocationItem[]>(
  "city/fetchLocations",
  async () => {
    const res = await fetch(`${url}/api/users/location`);
    const data = await res.json();
    return data.locations || [];
  }
);

interface CityState {
  locations: LocationItem[];
  selectedCityId: string | null;
}

const initialState: CityState = {
  locations: [],
  selectedCityId: null,
};

/* ---------------- SLICE ---------------- */
const citySlice = createSlice({
  name: "city",
  initialState,
  reducers: {
    setCityId(state, action: PayloadAction<string | null>) {
      state.selectedCityId = action.payload;
    },
    clearCity(state) {
      state.selectedCityId = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchLocations.fulfilled, (state, action) => {
      state.locations = action.payload;
    });
  },
});

/* ---------------- SELECTORS ---------------- */

// Selected city object
export const selectSelectedCity = (state: RootState) => {
  const { locations, selectedCityId } = state.city;
  return locations.find(c => c._id === selectedCityId) || null;
};

const EMPTY_ARRAY: any[] = [];


export const selectLocalitiesByCity = (state: RootState) =>
  selectSelectedCity(state)?.localities ?? EMPTY_ARRAY;


// Combined helper
export const selectCityWithLocalities = (state: RootState) => {
  const city = selectSelectedCity(state);
  if (!city) return null;

  return {
    city: city.city,
    state: city.state,
    localities: city.localities,
  };
};

export const { setCityId, clearCity } = citySlice.actions;
export default citySlice.reducer;
