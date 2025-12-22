// store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import cityReducer from "@/Redux/slice/citySlice";
import  filtersReducer from "@/Redux/slice/filterSlice";
import postPropertyReducer from  "@/Redux/slice/postPropertySlice";

export const store = configureStore({
  reducer: {
    city: cityReducer,
    filters: filtersReducer,
    postProperty: postPropertyReducer,
  },
  // devTools: true by default in development
});


// TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;