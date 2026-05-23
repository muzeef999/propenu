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
  },
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
    const {
      verificationDocuments: _verificationDocuments,
      verificationDocument: _verificationDocument,
      ...detailsPayload
    } = payload ?? {};

    const safePayload = {
      ...detailsPayload,
      totalArea: detailsPayload.totalArea
        ? {
            value: Number(detailsPayload.totalArea.value),
            unit: detailsPayload.totalArea.unit,
          }
        : undefined,
      roadWidth: detailsPayload.roadWidth
        ? {
            value: Number(detailsPayload.roadWidth.value),
            unit: detailsPayload.roadWidth.unit,
          }
        : undefined,
      amenities: Array.isArray(detailsPayload?.amenities)
        ? detailsPayload.amenities.map((a: any) => ({
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

    const hasFiles = Array.isArray(files) && files.length > 0;

    if (hasFiles) {
      files.forEach((file) => {
        formData.append("galleryFiles", file);
      });
    }

    for (let pair of formData.entries()) {
    }

    const response = await updateDetailsApi(category, id, formData);

    if (hasFiles) {
      clearFileStore("postProperty");
    }

    return response;
  },
);

export const submitVerificationThunk = createAsyncThunk(
  "postProperty/verification",
  async ({ category, id, payload }: any, { rejectWithValue }) => {
    try {
      return await finalizeApi(category, id, payload);
    } catch (err: any) {
     
      const errorPayload = {
      code: err?.code || err?.response?.data?.code,      
      message: err?.message || err?.response?.data?.message || "Verification failed",};


      return rejectWithValue(errorPayload);
    }
  },
);

