import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import {
  residentialApi,
  commercialApi,
  landApi,
  agriculturalApi,
} from "../apis";

export const submitPropertyThunk = createAsyncThunk<
  any,                // return type (API response)
  void,               // argument type (no args)
  { state: RootState } // 👈 THIS FIXES getState()
>(
  "postProperty/submit",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState().postProperty;
      const { base, propertyType } = state;

      if (!propertyType) {
        throw new Error("Property type not selected");
      }

      const profile =
        propertyType === "residential"
          ? state.residential
          : propertyType === "commercial"
          ? state.commercial
          : propertyType === "land"
          ? state.land
          : state.agricultural;

      const payload = {
        ...base,
        ...profile,
        propertyType,
      };

      const formData = new FormData();

      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      switch (propertyType) {
        case "residential":
          return await residentialApi(formData);
        case "commercial":
          return await commercialApi(formData);
        case "land":
          return await landApi(formData);
        case "agricultural":
          return await agriculturalApi(formData);
        default:
          throw new Error("Invalid property type");
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
