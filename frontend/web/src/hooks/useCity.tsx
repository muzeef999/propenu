// hooks/useCity.ts
"use client";

import { useEffect, useRef } from "react";
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
  const hasAttemptedAutoDetect = useRef(false);

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
    hasAttemptedAutoDetect.current = false;
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
    if (!locations.length || hasAttemptedAutoDetect.current) {
      return;
    }

    hasAttemptedAutoDetect.current = true;

    const savedCityId = localStorage.getItem("selectedCityId");

    const setSavedCity = () => {
      if (!savedCityId) return false;

      dispatch(setCityId(savedCityId));
      return true;
    };

    const setMatchedCity = (cityName?: string | null) => {
      if (!cityName) return false;

      const normalizedCityName = cityName.trim().toLowerCase();
      const matchedCity = locations.find(
        (city) => city.city.trim().toLowerCase() === normalizedCityName
      );

      if (!matchedCity) return false;

      dispatch(setCityId(matchedCity._id));
      localStorage.setItem("selectedCityId", matchedCity._id);
      return true;
    };

    const setDefaultCity = () => {
      const defaultCity = locations.find(
        (city) =>
          city.city.trim().toLowerCase() === DEFAULT_CITY_NAME.toLowerCase()
      );

      if (!defaultCity) return;

      dispatch(setCityId(defaultCity._id));
      localStorage.setItem("selectedCityId", defaultCity._id);
    };

    const reverseGeocodeCurrentCity = async (
      latitude: number,
      longitude: number
    ) => {
      const params = new URLSearchParams({
        format: "jsonv2",
        lat: String(latitude),
        lon: String(longitude),
        addressdetails: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reverse geocode current location");
      }

      const data = await response.json();
      const address = data?.address ?? {};

      return (
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        null
      );
    };

    const setFallbackCity = () => {
      if (!setSavedCity()) {
        setDefaultCity();
      }
    };

    if (!navigator.geolocation) {
      setFallbackCity();
      return;
    }

    const requestCurrentLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            const detectedCity = await reverseGeocodeCurrentCity(
              coords.latitude,
              coords.longitude
            );

            if (!setMatchedCity(detectedCity)) {
              setFallbackCity();
            }
          } catch {
            setFallbackCity();
          }
        },
        () => {
          setFallbackCity();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    };

    if (!("permissions" in navigator)) {
      requestCurrentLocation();
      return;
    }

    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((permissionStatus) => {
        if (permissionStatus.state === "denied") {
          setFallbackCity();
          return;
        }

        requestCurrentLocation();
      })
      .catch(() => {
        requestCurrentLocation();
      });
  }, [locations, dispatch]);

  return {
    selectedCity,   // { city, state, localities }
    localities,     // derived localities
    locations,      // all cities
    selectCity,     // USE THIS
    clearSelectedCity,
  };
}
