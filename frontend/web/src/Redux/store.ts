// store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import cityReducer from "@/Redux/slice/citySlice";
import  filtersReducer from "@/Redux/slice/filterSlice"

export const store = configureStore({
  reducer: {
    city: cityReducer,
    filters: filtersReducer,

  },
  // devTools: true by default in development
});


// TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch  = () => useDispatch<AppDispatch>
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
