import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type PropertyType =
  | "residential"
  | "commercial"
  | "land"
  | "agricultural"
  | null;


  

interface SetFieldPayload {
  key: string;
  value: any;
}

interface SetProfileFieldPayload extends SetFieldPayload {
  propertyType: Exclude<PropertyType, null>;
}

interface PostPropertyState {
  currentStep: number;
  propertyType: PropertyType;
  base: Record<string, any>;
  residential: Record<string, any>;
  commercial: Record<string, any>;
  land: Record<string, any>;
  agricultural: Record<string, any>;
}

const initialState: PostPropertyState = {
  currentStep: 1,
  propertyType: null,
  base: {
    nearbyPlaces: [],
  },
  residential: {},
  commercial: {},
  land: {},
  agricultural: {},
};

const postPropertySlice = createSlice({
  name: "postProperty",
  initialState,
  reducers: {
    /* -------- Step control -------- */
    nextStep(state) {
      state.currentStep += 1;
    },

    prevStep(state) {
      state.currentStep -= 1;
    },

    /* -------- Property type -------- */
    setPropertyType(state, action: PayloadAction<PropertyType>) {
      state.propertyType = action.payload;
    },

    /* -------- Base fields -------- */
    setBaseField(state, action: PayloadAction<SetFieldPayload>) {
      const { key, value } = action.payload;
      state.base[key] = value;
    },

    /* -------- Profile fields (dynamic) -------- */
    setProfileField(state, action: PayloadAction<SetProfileFieldPayload>) {
      const { propertyType, key, value } = action.payload;
      if (!propertyType) {
        console.warn("setProfileField: propertyType is required but got:", propertyType);
        return;
      }

      state[propertyType][key] = value;
    },
  },
});

export const {
  setPropertyType,
  setBaseField,
  setProfileField,
  nextStep,
  prevStep,
} = postPropertySlice.actions;

export default postPropertySlice.reducer;
