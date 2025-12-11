// hooks/useCity.ts

import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "@/Redux/store";
import {
  setCity as setCityAction,
  clearCity,
  fetchLocations,
} from "@/Redux/slice/citySlice";
import { LocationItem } from "@/types";
import { useEffect } from "react";

export function useCity() {
  const dispatch = useAppDispatch();

  const city = useSelector((s: RootState) => s.city.selected);

  const locations = useSelector((state: RootState) => state.city.locations);

  function setCity(cityItem: LocationItem | null) {
    dispatch(setCityAction(cityItem));

    try {
      if (cityItem) {
        localStorage.setItem("selectedCity", JSON.stringify(cityItem));
      } else {
        localStorage.removeItem("selectedCity");
      }
    } catch (e) {
      // ignore localStorage errors in SSR-safe way
    }
  }

  function clearSelectedCity() {
    dispatch(clearCity());
  }


   useEffect(() => {
    dispatch(fetchLocations());
  }, [dispatch]);


  return {
    city,
    setCity,
    clearSelectedCity,
    locations
  };
}
