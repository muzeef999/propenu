import { createAsyncThunk } from "@reduxjs/toolkit";

import { getFiles, clearFiles } from "@/lib/fileStore";
import {
  createDraftApi,
  finalizeApi,
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
    console.log("📝 [CREATE DRAFT] category:", category);
    return await createDraftApi(category);
  }
);

/* =========================================================
   BASIC
========================================================= */

export const submitBasicThunk = createAsyncThunk(
  "postProperty/basic",
  async ({ category, id, data }: any) => {
    console.log("📦 [BASIC] category:", category, "id:", id);
    console.log("📦 [BASIC] payload:", data);
    return await updateBasicApi(category, id, data);
  }
);

/* =========================================================
   LOCATION
========================================================= */

export const submitLocationThunk = createAsyncThunk(
  "postProperty/location",
  async ({ category, id, data }: any) => {
    console.log("📍 [LOCATION] category:", category, "id:", id);
    console.log("📍 [LOCATION] payload:", data);
    return await updateLocationApi(category, id, data);
  }
);

/* =========================================================
   DETAILS (with images + amenities fix)
========================================================= */

export const submitDetailsThunk = createAsyncThunk(
  "postProperty/details",
  async ({ category, id, payload }: any) => {
    console.log("🧩 [DETAILS] RAW payload from Redux:", payload);

    const files = getFiles("postProperty");

    /* ======================================================
       ✅ NEVER MUTATE REDUX OBJECTS
       Create safe copy first
    ====================================================== */

    const safePayload = {
      ...payload,

      amenities: Array.isArray(payload?.amenities)
        ? payload.amenities
            .filter((a: any) => a && (a.title || typeof a === "string"))
            .map((a: any) => ({
              title: typeof a === "string" ? a.trim() : String(a.title).trim(),
            }))
        : [],
    };

    console.log("✅ [DETAILS] NORMALIZED payload:", safePayload);

    /* ======================================================
       ✅ BUILD FORMDATA
    ====================================================== */

    const formData = new FormData();

    Object.entries(safePayload).forEach(([key, value]: any) => {
      if (value === undefined || value === null) return;

      if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    /* ======================================================
       ✅ ATTACH FILES
    ====================================================== */

    if (Array.isArray(files) && files.length > 0) {
      files.forEach((file) => {
        formData.append("galleryFiles", file);
      });
      clearFiles("postProperty");
    }

    /* ======================================================
       ✅ DEBUG: log FormData content
    ====================================================== */

    console.log("📤 [DETAILS] FINAL FormData:");
    for (let pair of formData.entries()) {
      console.log(`   → ${pair[0]}:`, pair[1]);
    }

    return await updateDetailsApi(category, id, formData);
  }
);

/* =========================================================
   FINAL
========================================================= */

export const submitVerificationThunk = createAsyncThunk(
  "postProperty/verification",
  async ({ category, id, data }: any) => {
    console.log("🚀 [FINAL] category:", category, "id:", id);
    console.log("🚀 [FINAL] payload:", data);
    return await finalizeApi(category, id, data);
  }
);
