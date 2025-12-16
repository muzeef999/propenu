import { createSlice } from "@reduxjs/toolkit"


type PropertyType =
  | "residential"
  | "commercial"
  | "land"
  | "agricultural"
  | null;

interface PostPropertyState {
  currentStep: number;
  propertyType: PropertyType;
  base: Record<string, any>;
  location: Record<string, any>;
  profile: Record<string, any>;
}



const initialState: PostPropertyState = {
  currentStep: 1,
  propertyType: null,
  base: {},
  location: {},
  profile: {},
};



const postPropertySlice = createSlice({
  name: "postProperty",
  initialState,
  reducers: {
    setPropertyType(state, action) {
  state.propertyType = action.payload;
},

setBaseField(state, action) {
  state.base[action.payload.key] = action.payload.value;
},

setLocationField(state, action) {
  state.location[action.payload.key] = action.payload.value;
},

setProfileField(state, action) {
  state.profile[action.payload.key] = action.payload.value;
},

nextStep(state) {
  state.currentStep += 1;
},

prevStep(state) {
  state.currentStep -= 1;
},
  },
})

export const { setPropertyType, setBaseField, setLocationField,setProfileField, nextStep, prevStep } =
  postPropertySlice.actions

export default postPropertySlice.reducer
