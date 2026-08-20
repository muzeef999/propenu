import { createAsyncThunk, createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { LocationItem } from "@/types";

const url = process.env.NEXT_PUBLIC_API_URL;

export const fetchLocations = createAsyncThunk<LocationItem[]>(
  "city/fetchLocations",
  async () => {
    const res = await fetch(`${url}/api/users/location`);
    const data = await res.json();
    return data.locations || [];
  },
  {
    condition: (_arg, { getState }) => {
      const state = getState() as { city: CityState };
      return state.city.status !== "loading" && state.city.status !== "succeeded";
    },
  }
);

export const fetchSearchableLocations = createAsyncThunk<LocationItem[]>(
  "city/fetchSearchableLocations",
  async () => {
    const res = await fetch(`${url}/api/users/location/searchable`);
    const data = await res.json();
    return data.locations || [];
  },
  {
    condition: (_arg, { getState }) => {
      const state = getState() as { city: CityState };
      return (
        state.city.searchableStatus !== "loading" &&
        state.city.searchableStatus !== "succeeded"
      );
    },
  }
);

interface CityState {
  locations: LocationItem[];
  searchableLocations: LocationItem[];
  selectedCityId: string | null;
  detectedCity: LocationItem | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  searchableStatus: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: CityState = {
  locations: [],
  searchableLocations: [],
  selectedCityId: null,
  detectedCity: null,
  status: "idle",
  searchableStatus: "idle",
};

/* ---------------- SLICE ---------------- */
const citySlice = createSlice({
  name: "city",
  initialState,
  reducers: {
    setCityId(state, action: PayloadAction<string | null>) {
      state.selectedCityId = action.payload;
    },
    setDetectedCity(state, action: PayloadAction<LocationItem | null>) {
      state.detectedCity = action.payload;
      state.selectedCityId = action.payload?._id ?? state.selectedCityId;
    },
    clearCity(state) {
      state.selectedCityId = null;
      state.detectedCity = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocations.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.locations = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchLocations.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(fetchSearchableLocations.pending, (state) => {
        state.searchableStatus = "loading";
      })
      .addCase(fetchSearchableLocations.fulfilled, (state, action) => {
        state.searchableLocations = action.payload;
        state.searchableStatus = "succeeded";
      })
      .addCase(fetchSearchableLocations.rejected, (state) => {
        state.searchableStatus = "failed";
      });
  },
});

/* ---------------- SELECTORS ---------------- */

const EMPTY_ARRAY: LocationItem["localities"] = [];

const normalizeLocalities = (localities: LocationItem["localities"] = EMPTY_ARRAY) => {
  const seen = new Set<string>();

  return localities.filter((locality) => {
    const normalizedName = locality.name?.trim().toLowerCase();
    if (!normalizedName || seen.has(normalizedName)) return false;

    seen.add(normalizedName);
    return true;
  });
};

const selectCityState = (state: RootState) => state.city;

const normalizeCity = (city: LocationItem) => ({
  ...city,
  localities: normalizeLocalities(city.localities),
});

const selectResolvedCities = createSelector(
  selectCityState,
  ({ locations, searchableLocations }) => {
    const merged = new Map<string, LocationItem>();

    searchableLocations.forEach((city) => {
      merged.set(city._id, city);
    });

    locations.forEach((city) => {
      merged.set(city._id, city);
    });

    return Array.from(merged.values());
  },
);

// Selected city object
export const selectSelectedCity = createSelector(
  selectResolvedCities,
  selectCityState,
  (resolvedCities, { selectedCityId, detectedCity }) => {
    const city =
      resolvedCities.find((item) => item._id === selectedCityId) ?? detectedCity;
    if (!city) return null;

    return normalizeCity(city);
  },
);

export const selectLocalitiesByCity = createSelector(
  selectSelectedCity,
  (city) => city?.localities ?? EMPTY_ARRAY
);

export const selectHomeLocalitiesByCity = createSelector(
  selectLocalitiesByCity,
  (localities) => localities.filter((locality) => locality.isHome === true)
);

export const selectAllCitiesWithLocalities = createSelector(
  selectCityState,
  ({ searchableLocations }) =>
    searchableLocations.map(normalizeCity)
);

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

export const { setCityId, setDetectedCity, clearCity } = citySlice.actions;
export default citySlice.reducer;
