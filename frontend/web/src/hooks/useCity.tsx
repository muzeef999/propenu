// hooks/useCity.ts
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "@/Redux/store";
import { setCity as setCityAction, clearCity } from "@/Redux/slice/citySlice";
import { LocationItem } from "@/types";

export function useCity() {
  const dispatch = useAppDispatch();
  const city = useSelector((s: RootState) => s.city.selected);
  const popular = useSelector((s: RootState) => s.city.popularCities);
  const normal = useSelector((s: RootState) => s.city.normalCities);

  function setCity(cityItem: LocationItem | null) {
    dispatch(setCityAction(cityItem));
    // persist to localStorage (optional; non-blocking)
    try {
      if (cityItem) {
        localStorage.setItem("selectedCity", JSON.stringify(cityItem));
      } else {
        localStorage.removeItem("selectedCity");
      }
    } catch (e) {
      // ignore localStorage errors in SSR-safe way (only on client)
    }
  }

  function clearSelectedCity() {
    dispatch(clearCity());
  }

  return {
    city,
    setCity,
    clearSelectedCity,
    popular,
    normal,
  };
}
