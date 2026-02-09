import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createDraftThunk, getMyDraftThunk } from "../thunks/submitPropertyApi";

/* ======================================================
   TYPES
====================================================== */

export type PropertyCategory =
  | "residential"
  | "commercial"
  | "land"
  | "agricultural";

interface SetFieldPayload {
  key: string;
  value: any;
}

interface SetProfileFieldPayload extends SetFieldPayload {
  propertyType: PropertyCategory;
}

interface PostPropertyState {
  currentStep: number;
  progressPercent: number; 
  propertyType: PropertyCategory;
  draftId: string | null;
  base: Record<string, any>;
  residential: Record<string, any>;
  commercial: Record<string, any>;
  land: Record<string, any>;
  agricultural: Record<string, any>;
}

/* ======================================================
   DRAFT → CATEGORY DETECTOR (🔥 IMPORTANT)
====================================================== */

const detectCategoryFromDraft = (draft: any): PropertyCategory => {
  if (typeof draft.slug === "string") {
    if (draft.slug.startsWith("residential")) return "residential";
    if (draft.slug.startsWith("commercial")) return "commercial";
    if (draft.slug.startsWith("land")) return "land";
    if (draft.slug.startsWith("agricultural")) return "agricultural";
  }

  if (["apartment", "villa", "independent-house"].includes(draft.propertyType))
    return "residential";

  if (["office", "shop", "warehouse"].includes(draft.propertyType))
    return "commercial";

  if (["plot", "land"].includes(draft.propertyType)) return "land";

  return "residential"; // safe default
};

/* ======================================================
   INITIAL STATE
====================================================== */

const initialState: PostPropertyState = {
  currentStep: 1,
  progressPercent: 0, 
  propertyType: "residential", // ✅ default selection
  draftId: null,
  base: {
    nearbyPlaces: [],
  },
  residential: {},
  commercial: {},
  land: {},
  agricultural: {},
};

/* ======================================================
   SLICE
====================================================== */

const postPropertySlice = createSlice({
  name: "postProperty",
  initialState,

  reducers: {
    /* -------- Step control -------- */
    setDraftId(state, action: PayloadAction<string>) {
      state.draftId = action.payload;
    },

    nextStep(state) {
      state.currentStep += 1;

      

    },

    prevStep(state) {
      state.currentStep -= 1;
    },

    setStep(state, action: PayloadAction<number>) {
      state.currentStep = action.payload;
    },

    /* -------- Property category -------- */
    setPropertyType(state, action: PayloadAction<PropertyCategory>) {
      state.propertyType = action.payload;
    },

    /* -------- Base fields -------- */
    setBaseField(state, action: PayloadAction<SetFieldPayload>) {
      const { key, value } = action.payload;
      state.base[key] = value;
    },

    /* -------- Category-specific fields -------- */
    setProfileField(state, action: PayloadAction<SetProfileFieldPayload>) {
      const { propertyType, key, value } = action.payload;
      state[propertyType][key] = value;
    },
  },

  extraReducers: (builder) => {
    /* =========================
       GET MY DRAFT
    ========================= */

   builder.addCase(getMyDraftThunk.fulfilled, (state, action) => {
  const draft = action.payload?.data;
  if (!draft) return;

  // draft id
  state.draftId = draft._id;

  // resume step
  state.currentStep = draft.completion?.step ?? 1;

    state.progressPercent = draft.completion?.percent ?? 0;


  // ✅ FIX: detect correct category
  const category = detectCategoryFromDraft(draft);
  state.propertyType = category;

  // base (shared fields)
  state.base = {
    ...state.base,
    listingType: draft.listingType,
    city: draft.city,
    buildingName: draft.buildingName,
    locality: draft.locality,
    location: draft.location,
    address: draft.address,
    pincode: draft.pincode,
    state: draft.state,
  };

  // category-specific data
  if (category === "residential") {
    state.residential = {
          ...state.residential,
      builtUpArea: draft.builtUpArea,
      carpetArea: draft.carpetArea,
      facing: draft.facing,
       parkingDetails: {
      twoWheeler: draft.parkingDetails?.twoWheeler ?? 0,
      fourWheeler: draft.parkingDetails?.fourWheeler ?? 0,
    },
      parkingType: draft.parkingType, // ✅ ADD THIS
      amenities: draft.amenities ?? [],
      bedrooms: draft.bedrooms,
      floorNumber: draft.floorNumber,
      flooringType: draft.flooringType,
      totalFloors: draft.totalFloors,
      kitchenType: draft.kitchenType,
      isModularKitchen: draft.isModularKitchen,
      isPriceNegotiable: draft.isPriceNegotiable,
      bathrooms: draft.bathrooms,
      balconies: draft.balconies,
      furnishing: draft.furnishing,
      propertyType: draft.propertyType, // apartment
      constructionStatus: draft.constructionStatus,
      propertyAge: draft.propertyAge,
      transactionType: draft.transactionType,
      price: draft.price,
      pricePerSqft: draft.pricePerSqft,
      description:draft.pricePerSqft,

       gallery: Array.isArray(draft.gallery)
      ? draft.gallery.map((img: any) => ({
          url: img.url,
          key: img.key,
          filename: img.filename,
          order: img.order ?? 0,
          source: "server", // 🔑 mark as backend image
        }))
      : [],
    };
  }

  if (category === "commercial") {
    state.commercial = {
      propertyType: draft.propertyType,
      furnishing: draft.furnishing,
      price: draft.price,
    };
  }

  if (category === "land") {
    state.land = {
      landSubType: draft.propertyType,
      price: draft.price,
    };
  }

  if (category === "agricultural") {
    state.agricultural = {
      agriculturalSubType: draft.propertyType,
      price: draft.price,
    };
  }
});


    /* =========================
       CREATE DRAFT
    ========================= */

    builder.addCase(createDraftThunk.fulfilled, (state, action) => {
      const draft = action.payload?.data;
      if (!draft) return;

      state.draftId = draft._id;
      state.propertyType =
        detectCategoryFromDraft(draft) ?? state.propertyType;
      state.currentStep = 1;
    });
  },
});

/* ======================================================
   EXPORTS
====================================================== */

export const {
  setPropertyType,
  setBaseField,
  setProfileField,
  nextStep,
  prevStep,
  setStep,
  setDraftId,
} = postPropertySlice.actions;

export default postPropertySlice.reducer;
