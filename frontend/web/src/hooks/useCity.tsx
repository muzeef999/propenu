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

const DEFAULT_CITY_NAME = "Hyderabad";


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

  useEffect(() => {
    const savedCityId = localStorage.getItem("selectedCityId");
    if (savedCityId && !selectedCity) {
      dispatch(setCityId(savedCityId));
    }
  }, [dispatch, selectedCity]);

   useEffect(() => {
    if (selectedCity) return;           // already selected
    if (!locations.length) return;      // locations not loaded yet

    const defaultCity = locations.find(
      (c) => c.city.toLowerCase() === DEFAULT_CITY_NAME.toLowerCase()
    );

    if (defaultCity) {
      dispatch(setCityId(defaultCity._id));
      localStorage.setItem("selectedCityId", defaultCity._id);
    }
  }, [locations, selectedCity, dispatch]);

  return {
    selectedCity,   // { city, state, localities }
    localities,     // derived localities
    locations,      // all cities
    selectCity,     // ✅ USE THIS
    clearSelectedCity,
  };
}
