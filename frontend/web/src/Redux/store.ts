// store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import cityReducer from "@/Redux/slice/citySlice";

export const store = configureStore({
  reducer: {
    city: cityReducer,
  },
  // devTools: true by default in development
});

// Typings for hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// convenience typed useAppDispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();
