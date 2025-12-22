import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import {
  residentialApi,
  commercialApi,
  landApi,
  agriculturalApi,
} from "../apis";
import { me } from "@/data/ClientData";
import { getFiles as getFileStoreFiles, clearFiles as clearFileStoreFiles } from "@/lib/fileStore";

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

      // Fetch current user data
      const userData = await me();
      if (!userData || !userData.user) {
        throw new Error("User not authenticated");
      }

      const user = userData.user; // Extract nested user object
      
      const profile =
        propertyType === "residential"
          ? state.residential
          : propertyType === "commercial"
          ? state.commercial
          : propertyType === "land"
          ? state.land
          : state.agricultural;

      const apiPropertyType =
        propertyType === "residential"
          ? state.residential.propertyType || state.residential.propertySubType || propertyType
          : propertyType === "commercial"
          ? state.commercial.propertyType || state.commercial.propertySubType || propertyType
          : propertyType === "land"
          ? state.land.propertyType || state.land.propertySubType || propertyType
          : state.agricultural.propertyType || state.agricultural.propertySubType || propertyType;

      // Extract user ID - user.id is the correct field
      const userId = user.id;
      if (!userId) {
        throw new Error("User ID not found in userData");
      }

      let payload: Record<string, any> = {
        ...base,
        ...profile,
        propertyType: apiPropertyType,
        createdBy: userId,
        listingSource: user.roleName || 'user', // 'user', 'agent', 'builder', 'admin'
      };

      // galleryFiles in Redux contains only metadata (filename). Actual File objects
      // are stored in-memory in fileStore (to avoid putting File into Redux state).
      const galleryMeta = (payload.galleryFiles || []) as any[];
      const actualFiles = getFileStoreFiles("postProperty");

      // If there are actual File objects to upload, do NOT send filename-only
      // metadata (which lacks `url`) to the backend. The backend will create
      // gallery entries for uploaded files. Only merge gallery items that
      // already include a `url` (i.e., previously uploaded images).
      if (Array.isArray(galleryMeta) && galleryMeta.length > 0) {
        const existingGallery = Array.isArray(payload.gallery) ? payload.gallery : [];
        const urlEntries = galleryMeta.filter((g) => g && (g.url || g.filename && g.url));

        // If there are actual files to upload, prefer sending files and any
        // pre-existing gallery entries that already have a url. Skip filename-only metadata.
        if (Array.isArray(actualFiles) && actualFiles.length > 0) {
          if (urlEntries.length > 0) {
            payload.gallery = [...existingGallery, ...urlEntries];
          }
        } else {
          // No actual files: include whatever galleryMeta is (useful when
          // metadata already contains url fields)
          payload.gallery = [...existingGallery, ...galleryMeta];
        }

        delete payload.galleryFiles;
        delete payload.files;
      }


      const formData = new FormData();

      // Append non-file fields (objects are sent as JSON strings)
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      // Append actual File objects for galleryFiles so multer receives them
      if (Array.isArray(actualFiles) && actualFiles.length > 0) {
        actualFiles.forEach((file) => {
          formData.append("galleryFiles", file);
        });
        // optional: clear files after attaching
        clearFileStoreFiles("postProperty");
      }

      for (let pair of formData.entries()) {
      }

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
