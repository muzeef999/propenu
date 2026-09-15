// store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import cityReducer from "@/Redux/slice/citySlice";
import filtersReducer from "@/Redux/slice/filterSlice";
import postPropertyReducer from "@/Redux/slice/postPropertySlice";
import { LocationItem } from "@/types";

/**
 * Synchronously read the persisted city from localStorage so the store's
 * initial state already has the correct city on the very first render.
 * This eliminates the banner flicker that occurred when useCity's useEffect
 * fired *after* the first render and changed the query key mid-flight.
 *
 * Safe to call at module level because Next.js only instantiates this store
 * on the client (inside "use client" components / the Redux Provider).
 */
function getPersistedCityPreloadedState() {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem("selectedCityData");
    if (!raw) return undefined;
    const city: LocationItem = JSON.parse(raw);
    if (!city?._id) return undefined;
    // Must include ALL CityState fields — Redux uses preloadedState as-is
    // for the slice and does NOT merge it with initialState.
    return {
      city: {
        locations: [],
        searchableLocations: [],
        selectedCityId: city._id,
        detectedCity: city,
        status: "idle" as const,
        searchableStatus: "idle" as const,
      },
    };
  } catch {
    return undefined;
  }
}

export const store = configureStore({
  reducer: {
    city: cityReducer,
    filters: filtersReducer,
    postProperty: postPropertyReducer,
  },
  preloadedState: getPersistedCityPreloadedState(),
  // devTools: true by default in development
});


// TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;