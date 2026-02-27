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

const detectCategoryFromDraft = (
  draft: any,
  fallback: PropertyCategory,
): PropertyCategory => {
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

  return fallback; // ✅ DO NOT FORCE residential
};

const mapVerificationTypeToKey = (type?: string) => {
  if (!type) return undefined;
  const normalized = String(type).toUpperCase();
  if (normalized === "SALE_DEED") return "sale-deed";
  if (normalized === "ENCUMBRANCE_CERTIFICATE") return "ec";
  if (normalized === "MUNICIPAL_TAX") return "municipal-tax";
  if (normalized === "UTILITY_BILL") return "utility-bill";
  return undefined;
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
      const next = action.payload;
      if (state.propertyType === next) return;

      state.propertyType = next;
      state.draftId = null;
      state.currentStep = 1;
      state.progressPercent = 0;
      state.base = {
        nearbyPlaces: [],
      };

      // ✅ clear other category data to avoid bleed & validation issues
      if (next !== "residential") state.residential = {};
      if (next !== "commercial") state.commercial = {};
      if (next !== "land") state.land = {};
      if (next !== "agricultural") state.agricultural = {};
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
      const category = detectCategoryFromDraft(draft, state.propertyType);
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
        status: draft.status,
        isPublished: draft.isPublished,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
      };

      const mappedVerificationDocuments = Array.isArray(
        draft.verificationDocuments,
      )
        ? draft.verificationDocuments.map((doc: any, index: number) => ({
            url: doc.url,
            key: doc.key,
            filename: doc.filename,
            title: doc.title,
            type: doc.type,
            mimetype: doc.mimetype,
            status: doc.status,
            order: index,
            source: "server",
          }))
        : [];

      // category-specific data
      if (category === "residential") {
        state.residential = {
          ...state.residential,
          listingType: draft.listingType,
          listingSource: draft.listingSource,
          builtUpArea: draft.builtUpArea,
          carpetArea: draft.carpetArea,
          facing:
            typeof draft.facing === "string"
              ? draft.facing.toLowerCase()
              : draft.facing,
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
          description: draft.description,
          verificationDocuments: mappedVerificationDocuments,
          verificationDocument:
            mapVerificationTypeToKey(mappedVerificationDocuments[0]?.type) ??
            state.residential.verificationDocument,

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
          listingType: draft.listingType,
          listingSource: draft.listingSource,
          furnishing: draft.furnishing,
          price: draft.price,
          amenities: draft.amenities ?? [],

          commercialSubType: draft.propertySubType,
          transactionType: draft.transactionType,
          constructionStatus: draft.constructionStatus,
          carpetArea: draft.carpetArea,
          builtUpArea: draft.builtUpArea,
          floorNumber: draft.floorNumber,
          totalFloors: draft.totalFloors,
          pantry: draft.pantry,
          cabins: draft.cabins,
          seats: draft.seats,
          powerCapacity: draft.powerCapacity,
          parkingDetails: {
            twoWheeler: draft.parkingDetails?.twoWheeler ?? 0,
            fourWheeler: draft.parkingDetails?.fourWheeler ?? 0,
          },
          fireSafety: draft.fireSafety,
          flooringType: draft.flooringType,
          wallFinishStatus: draft.wallFinishStatus,
          tenantAvailable: draft.tenantAvailable,
          banksApproved: draft.banksApproved,
          isPriceNegotiable: draft.isPriceNegotiable,
          verifiedProperties: draft.verifiedProperties,
          description: draft.description,
          verificationDocuments: mappedVerificationDocuments,
          verificationDocument:
            mapVerificationTypeToKey(mappedVerificationDocuments[0]?.type) ??
            state.commercial.verificationDocument,
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

      if (category === "land") {
        state.land = {
          listingType: draft.listingType,
          listingSource: draft.listingSource,
          amenities: draft.amenities ?? [],
          propertyType: draft.propertyType,
          landSubType: draft.propertySubType,
          price: draft.price,
          dimensions: draft.dimensions,
          plotArea: draft.plotArea,
          plotAreaUnit: draft.plotAreaUnit,
          roadWidthFt: draft.roadWidthFt,
          facing: draft.facing,
          cornerPlot: draft.cornerPlot,
          readyToConstruct: draft.readyToConstruct,
          waterConnection: draft.waterConnection,
          electricityConnection: draft.electricityConnection,
          approvedBy: draft.approvedBy,
          landUseZone: draft.landUseZone,
          banksApproved: draft.banksApproved,
          isPriceNegotiable: draft.isPriceNegotiable,
          description: draft.description,
          verifiedProperties: draft.verifiedProperties,
          verificationDocuments: mappedVerificationDocuments,
          verificationDocument:
            mapVerificationTypeToKey(mappedVerificationDocuments[0]?.type) ??
            state.land.verificationDocument,
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

      if (category === "agricultural") {
        state.agricultural = {
          listingType: draft.listingType,
          listingSource: draft.listingSource,
          propertyType: draft.propertyType,
          agriculturalSubType: draft.propertySubType,

          // ✅ actual agri fields
          boundaryWall: draft.boundaryWall,
          soilType: draft.soilType,
          irrigationType: draft.irrigationType,
          currentCrop: draft.currentCrop,
          landName: draft.landName,
          landShape: draft.landShape,
          numberOfBorewells: draft.numberOfBorewells,
          borewellDetails: draft.borewellDetails,
          amenities: draft.amenities ?? [],

          waterSource: draft.waterSource,
          accessRoadType: draft.accessRoadType,
          statePurchaseRestrictions: draft.statePurchaseRestrictions,

          electricityConnection: draft.electricityConnection,

          // area & road (OBJECTS, not numbers)
          totalArea: draft.totalArea,
          roadWidth: draft.roadWidth,

          price: draft.price,
          isPriceNegotiable: draft.isPriceNegotiable,
          description: draft.description,
          verificationDocuments: mappedVerificationDocuments,
          verificationDocument:
            mapVerificationTypeToKey(mappedVerificationDocuments[0]?.type) ??
            state.agricultural.verificationDocument,

          gallery: Array.isArray(draft.gallery)
            ? draft.gallery.map((img: any) => ({
                url: img.url,
                key: img.key,
                filename: img.filename,
                order: img.order ?? 0,
                source: "server",
              }))
            : [],
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
      state.propertyType = detectCategoryFromDraft(draft, state.propertyType);
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
