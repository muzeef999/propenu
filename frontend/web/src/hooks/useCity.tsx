// hooks/useCity.ts
"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "@/Redux/store";
import {
  fetchLocations,
  setCityId,
  clearCity,
  selectSelectedCity,
  selectLocalitiesByCity,
} from "@/Redux/slice/citySlice";
import { LocationItem } from "@/types";

export function useCity() {
  const dispatch = useAppDispatch();

  const selectedCity = useSelector(selectSelectedCity);
  const localities = useSelector(selectLocalitiesByCity);
  const locations = useSelector((s: RootState) => s.city.locations);

  function selectCity(city: LocationItem) {
    dispatch(setCityId(city._id));
    localStorage.setItem("selectedCityId", city._id);
  }

  function clearSelectedCity() {
    dispatch(clearCity());
    localStorage.removeItem("selectedCityId");
  }

  useEffect(() => {
    dispatch(fetchLocations());
  }, [dispatch]);

  return {
    selectedCity,   // { city, state, localities }
    localities,     // derived localities
    locations,      // all cities
    selectCity,     // ✅ USE THIS
    clearSelectedCity,
  };
}
