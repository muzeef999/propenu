import { createAsyncThunk } from "@reduxjs/toolkit";

import { getFiles, clearFiles } from "@/lib/fileStore";
import { createDraftApi, finalizeApi, updateBasicApi, updateDetailsApi, updateLocationApi } from "../apis";

/* ---------- CREATE DRAFT ---------- */

export const createDraftThunk = createAsyncThunk(
  "postProperty/createDraft",
  async (category: string) => {
    return await createDraftApi(category);
  }
);

/* ---------- BASIC ---------- */

export const submitBasicThunk = createAsyncThunk(
  "postProperty/basic",
  async ({ category, id, data }: any) => {
    return await updateBasicApi(category, id, data);
  }
);

/* ---------- LOCATION ---------- */

export const submitLocationThunk = createAsyncThunk(
  "postProperty/location",
  async ({ category, id, data }: any) => {
    return await updateLocationApi(category, id, data);
  }
);

/* ---------- DETAILS (with images) ---------- */

export const submitDetailsThunk = createAsyncThunk(
  "postProperty/details",
  async ({ category, id, payload }: any) => {
    const files = getFiles("postProperty");

    const formData = new FormData();

    Object.entries(payload).forEach(([k, v]: any) => {
      if (typeof v === "object") {
        formData.append(k, JSON.stringify(v));
      } else {
        formData.append(k, String(v));
      }
    });

    if (Array.isArray(files)) {
      files.forEach((file) => {
        formData.append("galleryFiles", file);
      });
      clearFiles("postProperty");
    }

    return await updateDetailsApi(category, id, formData);
  }
);

/* ---------- FINAL ---------- */

export const submitVerificationThunk = createAsyncThunk(
  "postProperty/verification",
  async ({ category, id, data }: any) => {
    return await finalizeApi(category, id, data);
  }
);
