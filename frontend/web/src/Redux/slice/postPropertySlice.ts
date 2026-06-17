import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  createDraftThunk,
  getMyDraftThunk,
  submitDetailsThunk,
} from "../thunks/submitPropertyApi";

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
  agentSubmissionSuccess: boolean;
  base: Record<string, any>;
  residential: Record<string, any>;
  commercial: Record<string, any>;
  land: Record<string, any>;
  agricultural: Record<string, any>;
}

const DEFAULT_AGRICULTURAL_PROPERTY_TYPE = "farm-land";
const DEFAULT_LISTING_TYPE = "sale";
const MIN_STEP = 1;
const MAX_STEP = 4;

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

  if (
    [
      "apartment",
      "independent-house",
      "villa",
      "penthouse",
      "studio",
      "duplex",
      "triplex",
      "farmhouse",
      "independent-builder-floor",
    ].includes(draft.propertyType)
  )
    return "residential";

  if (
    [
      "office",
      "retail",
      "shop",
      "showroom",
      "warehouse",
      "industrial",
      "coworking",
      "restaurant",
      "clinic",
    ].includes(draft.propertyType)
  )
    return "commercial";

  if (
    [
      "plot",
      "residential-plot",
      "commercial-plot",
      "industrial-plot",
      "investment-plot",
      "corner-plot",
      "na-plot",
    ].includes(draft.propertyType)
  )
    return "land";

  if (
    [
      "agricultural-land",
      "farm-land",
      "orchard-land",
      "plantation",
      "wet-land",
      "dry-land",
      "ranch",
      "dairy-farm",
    ].includes(draft.propertyType)
  )
    return "agricultural";

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

const mapServerGallery = (gallery: any) =>
  Array.isArray(gallery)
    ? gallery.map((img: any) => ({
        url: img.url,
        key: img.key,
        filename: img.filename,
        order: img.order ?? 0,
        source: "server",
      }))
    : [];

const getResponseDraft = (payload: any) =>
  payload?.data?.property ??
  payload?.data?.draft ??
  payload?.data ??
  payload?.property ??
  payload?.draft ??
  payload;

const mapAmenities = (amenities: any) =>
  Array.isArray(amenities) ? amenities : [];

const normalizeListingType = (listingType: any) => {
  const normalized = String(listingType ?? "").trim().toLowerCase();
  if (normalized === "rent" || normalized === "lease") return "rent";
  if (normalized === "sale" || normalized === "buy") return "sale";
  return undefined;
};

const normalizeTransactionType = (transactionType: any) => {
  const normalized = String(transactionType ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  if (normalized === "new-sale" || normalized === "new") return "new-sale";
  if (normalized === "resale" || normalized === "re-sale") return "resale";
  return undefined;
};

const normalizeFacingForForm = (facing: any) =>
  typeof facing === "string"
    ? facing
        .trim()
        .toLowerCase()
        .replace(/^(north|south)(east|west)$/, "$1-$2")
    : facing;

/* ======================================================
   INITIAL STATE
====================================================== */

const initialState: PostPropertyState = {
  currentStep: 1,
  progressPercent: 0,
  propertyType: "residential", // ✅ default selection
  draftId: null,
  agentSubmissionSuccess: false,
  base: {
    listingType: DEFAULT_LISTING_TYPE,
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

    resetPostProperty(
      state,
      action: PayloadAction<{ propertyType?: PropertyCategory } | undefined>,
    ) {
      const nextType = action.payload?.propertyType ?? state.propertyType;
      state.currentStep = 1;
      state.progressPercent = 0;
      state.propertyType = nextType;
      state.draftId = null;
      state.base = {
        listingType: DEFAULT_LISTING_TYPE,
        nearbyPlaces: [],
      };
      state.residential = {};
      state.commercial = {};
      state.land = {};
      state.agricultural = {};

      if (nextType === "agricultural") {
        state.agricultural.propertyType = DEFAULT_AGRICULTURAL_PROPERTY_TYPE;
      }
    },

    showAgentSubmissionSuccess(state) {
      state.agentSubmissionSuccess = true;
    },

    hideAgentSubmissionSuccess(state) {
      state.agentSubmissionSuccess = false;
    },

    nextStep(state) {
      state.currentStep = Math.min((state.currentStep || MIN_STEP) + 1, MAX_STEP);
    },

    prevStep(state) {
      state.currentStep = Math.max((state.currentStep || MIN_STEP) - 1, MIN_STEP);
    },

    setStep(state, action: PayloadAction<number>) {
      state.currentStep = Math.min(Math.max(action.payload, MIN_STEP), MAX_STEP);
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
        listingType: DEFAULT_LISTING_TYPE,
        nearbyPlaces: [],
      };

      // ✅ clear other category data to avoid bleed & validation issues
      if (next !== "residential") state.residential = {};
      if (next !== "commercial") state.commercial = {};
      if (next !== "land") state.land = {};
      if (next !== "agricultural") state.agricultural = {};

      if (next === "agricultural" && !state.agricultural.propertyType) {
        state.agricultural.propertyType = DEFAULT_AGRICULTURAL_PROPERTY_TYPE;
      }
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
      const requestedStartStep =
        typeof action.meta.arg === "string" ? undefined : action.meta.arg.startStep;

      // draft id
      state.draftId = draft._id;

      // resume step
      state.currentStep = Math.min(
        Math.max(requestedStartStep ?? draft.completion?.step ?? MIN_STEP, MIN_STEP),
        MAX_STEP,
      );

      state.progressPercent = draft.completion?.percent ?? 0;

      // ✅ FIX: detect correct category
      const category = detectCategoryFromDraft(draft, state.propertyType);
      state.propertyType = category;

      // base (shared fields)
      const listingType =
        normalizeListingType(draft.listingType) ??
        state.base.listingType ??
        DEFAULT_LISTING_TYPE;

      state.base = {
        ...state.base,
        listingType,
        city: draft.city,
        buildingName: draft.buildingName,
        landName: draft.landName ?? draft.layoutName,
        locality: draft.locality,
        location: draft.location,
        address: draft.address,
        pincode: draft.pincode,
        state: draft.state,
        status: draft.status,
        isPublished: draft.isPublished,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
        mapEmbedUrl: draft.mapEmbedUrl,
        nearbyPlaces: draft.nearbyPlaces ?? state.base.nearbyPlaces ?? [],
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
          listingType,
          listingSource: draft.listingSource,
          bhk: draft.bhk,
          builtUpArea: draft.builtUpArea,
          carpetArea: draft.carpetArea,
          superBuiltUpArea: draft.superBuiltUpArea,
          facing:
            typeof draft.facing === "string"
              ? draft.facing.toLowerCase()
              : draft.facing,
          parkingDetails: {
            twoWheeler: draft.parkingDetails?.twoWheeler ?? 0,
            fourWheeler: draft.parkingDetails?.fourWheeler ?? 0,
            visitorParking: draft.parkingDetails?.visitorParking,
          },
          parkingType: draft.parkingType,
          amenities: mapAmenities(draft.amenities),
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
          propertyType: draft.propertyType,
          constructionStatus: draft.constructionStatus,
          propertyAge: draft.propertyAge,
          possessionDate: draft.possessionDate
            ? String(draft.possessionDate).split("T")[0]
            : draft.possessionDate,
          maintenanceCharges: draft.maintenanceCharges,
          security: draft.security,
          fireSafetyDetails: draft.fireSafetyDetails,
          greenCertification: draft.greenCertification,
          smartHomeFeatures: draft.smartHomeFeatures ?? [],
          possessionVerified: draft.possessionVerified,
          constructionYear: draft.constructionYear,
          transactionType: normalizeTransactionType(draft.transactionType),
          price: draft.price,
          pricePerSqft: draft.pricePerSqft,
          description: draft.description,
          verificationDocuments: mappedVerificationDocuments,
          verificationDocument:
            mapVerificationTypeToKey(mappedVerificationDocuments[0]?.type) ??
            state.residential.verificationDocument,

          gallery: mapServerGallery(draft.gallery),
        };
      }

      if (category === "commercial") {
        state.commercial = {
          propertyType: draft.propertyType,
          listingType,
          listingSource: draft.listingSource,
          furnishedStatus: draft.furnishedStatus ?? draft.furnishing,
          price: draft.price,
          pricePerSqft: draft.pricePerSqft,
          amenities: mapAmenities(draft.amenities),

          commercialSubType: draft.propertySubType,
          facing: normalizeFacingForForm(draft.facing),
          transactionType: normalizeTransactionType(draft.transactionType),
          constructionStatus: draft.constructionStatus,
          propertyAge: draft.propertyAge,
          possessionDate: draft.possessionDate
            ? String(draft.possessionDate).split("T")[0]
            : draft.possessionDate,
          carpetArea: draft.carpetArea,
          builtUpArea: draft.builtUpArea,
          superBuiltUpArea: draft.superBuiltUpArea,
          floorNumber: draft.floorNumber,
          totalFloors: draft.totalFloors,
          pantry: draft.pantry,
          cabins: draft.cabins,
          cabin: draft.cabin,
          seats: draft.seats,
          officeRooms: draft.officeRooms,
          meetingRooms: draft.meetingRooms,
          conferenceRooms: draft.conferenceRooms,
          powerCapacity: draft.powerCapacity ?? draft.powerCapacityKw,
          powerCapacityKw: draft.powerCapacityKw ?? draft.powerCapacity,
          powerBackup: draft.powerBackup,
          lift: draft.lift,
          washrooms: draft.washrooms,
          ceilingHeightFt: draft.ceilingHeightFt,
          builtYear: draft.builtYear,
          maintenanceCharges: draft.maintenanceCharges,
          loadingDock: draft.loadingDock,
          loadingDockDetails: draft.loadingDockDetails,
          parkingCapacity: draft.parkingCapacity,
          parkingDetails: {
            twoWheeler: draft.parkingDetails?.twoWheeler ?? 0,
            fourWheeler: draft.parkingDetails?.fourWheeler ?? 0,
            visitorParking: draft.parkingDetails?.visitorParking,
          },
          fireSafety: draft.fireSafety,
          flooringType: draft.flooringType,
          wallFinishStatus: draft.wallFinishStatus,
          zoning: draft.zoning,
          tenantInfo: Array.isArray(draft.tenantInfo)
            ? draft.tenantInfo.map((tenant: any) => ({
                ...tenant,
                leaseStart: tenant.leaseStart
                  ? String(tenant.leaseStart).split("T")[0]
                  : tenant.leaseStart,
                leaseEnd: tenant.leaseEnd
                  ? String(tenant.leaseEnd).split("T")[0]
                  : tenant.leaseEnd,
              }))
            : [],
          buildingManagement: draft.buildingManagement,
          tenantAvailable: draft.tenantAvailable,
          banksApproved: draft.banksApproved,
          isPriceNegotiable: draft.isPriceNegotiable,
          verifiedProperties: draft.verifiedProperties,
          description: draft.description,
          verificationDocuments: mappedVerificationDocuments,
          verificationDocument:
            mapVerificationTypeToKey(mappedVerificationDocuments[0]?.type) ??
            state.commercial.verificationDocument,
          gallery: mapServerGallery(draft.gallery),
        };
      }

      if (category === "land") {
        state.land = {
          listingType,
          listingSource: draft.listingSource,
          amenities: mapAmenities(draft.amenities),
          propertyType: draft.propertyType,
          landSubType: draft.propertySubType,
          price: draft.price,
          pricePerSqft: draft.pricePerSqft,
          dimensions: draft.dimensions,
          plotArea: draft.plotArea,
          plotAreaUnit: draft.plotAreaUnit,
          roadWidthFt: draft.roadWidthFt,
          facing: draft.facing,
          layoutType: draft.layoutType,
          transactionType: normalizeTransactionType(draft.transactionType),
          surveyNumber: draft.surveyNumber,
          cornerPlot: draft.cornerPlot,
          fencing: draft.fencing,
          readyToConstruct: draft.readyToConstruct,
          waterConnection: draft.waterConnection,
          electricityConnection: draft.electricityConnection,
          approvedBy: draft.approvedBy ?? draft.approvedByAuthority,
          approvedByAuthority: draft.approvedByAuthority ?? draft.approvedBy,
          landUseZone: draft.landUseZone,
          landName: draft.landName ?? draft.layoutName,
          conversionCertificateFile: draft.conversionCertificateFile,
          encumbranceCertificateFile: draft.encumbranceCertificateFile,
          soilTestReport: draft.soilTestReport,
          banksApproved: draft.banksApproved,
          isPriceNegotiable: draft.isPriceNegotiable,
          description: draft.description,
          verifiedProperties: draft.verifiedProperties,
          verificationDocuments: mappedVerificationDocuments,
          verificationDocument:
            mapVerificationTypeToKey(mappedVerificationDocuments[0]?.type) ??
            state.land.verificationDocument,
          gallery: mapServerGallery(draft.gallery),
        };
      }

      if (category === "agricultural") {
        state.agricultural = {
          listingType,
          listingSource: draft.listingSource,
          propertyType:
            draft.propertyType ??
            state.agricultural.propertyType ??
            DEFAULT_AGRICULTURAL_PROPERTY_TYPE,
          agriculturalSubType: draft.propertySubType,

          // ✅ actual agri fields
          plantationAge: draft.plantationAge,
          plantationYear: draft.plantationYear,
          boundaryWall: draft.boundaryWall,
          soilType: draft.soilType,
          irrigationType: draft.irrigationType,
          currentCrop: draft.currentCrop,
          suitableFor: draft.suitableFor,
          landName: draft.landName ?? draft.layoutName,
          landShape: draft.landShape,
          numberOfBorewells: draft.numberOfBorewells,
          borewellDetails: draft.borewellDetails,
          amenities: mapAmenities(draft.amenities),

          waterSource: draft.waterSource,
          accessRoadType: draft.accessRoadType,
          statePurchaseRestrictions: draft.statePurchaseRestrictions,

          electricityConnection: draft.electricityConnection,
          areaUnit: draft.areaUnit,

          // area & road (OBJECTS, not numbers)
          totalArea: draft.totalArea,
          roadWidth: draft.roadWidth,

          price: draft.price,
          pricePerSqft: draft.pricePerSqft,
          isPriceNegotiable: draft.isPriceNegotiable,
          description: draft.description,
          soilTestReport: draft.soilTestReport,
          agriculturalUseCertificate: draft.agriculturalUseCertificate,
          verificationDocuments: mappedVerificationDocuments,
          verificationDocument:
            mapVerificationTypeToKey(mappedVerificationDocuments[0]?.type) ??
            state.agricultural.verificationDocument,

          gallery: mapServerGallery(draft.gallery),
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
      state.base.listingType =
        normalizeListingType(draft.listingType) ??
        state.base.listingType ??
        DEFAULT_LISTING_TYPE;
      state.base.landName =
        draft.landName ?? draft.layoutName ?? state.base.landName;
      if (
        state.propertyType === "agricultural" &&
        !state.agricultural.propertyType
      ) {
        state.agricultural.propertyType =
          draft.propertyType ?? DEFAULT_AGRICULTURAL_PROPERTY_TYPE;
      }
      state.currentStep = 1;
    });

    builder.addCase(submitDetailsThunk.fulfilled, (state, action) => {
      const draft = getResponseDraft(action.payload);
      const category = action.meta.arg?.category as PropertyCategory | undefined;
      const gallery = mapServerGallery(draft?.gallery);

      if (!category || gallery.length === 0) return;

      state[category].gallery = gallery;
      state.base.galleryFiles = gallery.map((img: any) => ({
        name: img.filename ?? "",
        source: "server",
        preview: img.url,
      }));

      if (draft?.completion?.percent !== undefined) {
        state.progressPercent = draft.completion.percent;
      }
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
  resetPostProperty,
  showAgentSubmissionSuccess,
  hideAgentSubmissionSuccess,
} = postPropertySlice.actions;

export default postPropertySlice.reducer;
