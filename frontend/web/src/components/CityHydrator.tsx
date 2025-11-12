// components/CityHydrator.tsx (put inside root layout children)
"use client";
import { useEffect } from "react";
import { useAppDispatch } from "@/Redux/store";
import { setCity } from "@/Redux/slice/citySlice";

export default function CityHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("selectedCity");
      if (raw) dispatch(setCity(JSON.parse(raw)));
    } catch (e) {}
  }, [dispatch]);

  return null;
}
