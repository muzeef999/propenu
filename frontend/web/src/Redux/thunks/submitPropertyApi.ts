import { createAsyncThunk } from "@reduxjs/toolkit";

import { getFileStoreFiles, clearFileStore } from "@/utilies/fileStore";

import {
  createDraftApi,
  finalizeApi,
  getMyDraftApi,
  updateBasicApi,
  updateDetailsApi,
  updateLocationApi,
} from "../apis";

/* =========================================================
   CREATE DRAFT
========================================================= */

export const createDraftThunk = createAsyncThunk(
  "postProperty/createDraft",
  async (category: string) => {
    return await createDraftApi(category);
  },
);


export const getMyDraftThunk = createAsyncThunk(
  "postProperty/getMyDraft",
  async (category: string, { rejectWithValue }) => {
    try {
      return await getMyDraftApi(category);
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);
/* =========================================================
   BASIC
========================================================= */

export const submitBasicThunk = createAsyncThunk(
  "postProperty/basic",
  async ({ category, id, data }: any) => {
    return await updateBasicApi(category, id, data);
  },
);

/* =========================================================
   LOCATION
========================================================= */

export const submitLocationThunk = createAsyncThunk(
  "postProperty/location",
  async ({ category, id, data }: any) => {
    return await updateLocationApi(category, id, data);
  },
);

/* =========================================================
   DETAILS (with images + amenities fix)
========================================================= */

export const submitDetailsThunk = createAsyncThunk(
  "postProperty/details",
  async ({ category, id, payload }: any) => {

    const files = getFileStoreFiles("postProperty");

    const safePayload = {
      ...payload,
       totalArea: payload.totalArea
        ? {
            value: Number(payload.totalArea.value),
            unit: payload.totalArea.unit,
          }
        : undefined,
         roadWidth: payload.roadWidth
        ? {
            value: Number(payload.roadWidth.value),
            unit: payload.roadWidth.unit,
          }
        : undefined,
      amenities: Array.isArray(payload?.amenities)
        ? payload.amenities.map((a: any) => ({
            title: typeof a === "string" ? a.trim() : String(a.title).trim(),
          }))
        : [],
    };
    

    const formData = new FormData();

    Object.entries(safePayload).forEach(([key, value]: any) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value) || typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    if (Array.isArray(files) && files.length > 0) {
      files.forEach((file) => {
        formData.append("galleryFiles", file);
      });
      clearFileStore("postProperty");
    }

    for (let pair of formData.entries()) {
      console.log(" →", pair[0], pair[1]);
    }

    return await updateDetailsApi(category, id, formData);
  }
);


export const submitVerificationThunk = createAsyncThunk(
  "postProperty/verification",
  async ({ category, id, payload }: any, { rejectWithValue }) => {
    try {

      return await finalizeApi(category, id, payload);
    } catch (err: any) {
      return rejectWithValue(err.message || "Verification failed");
    }
  },
);
