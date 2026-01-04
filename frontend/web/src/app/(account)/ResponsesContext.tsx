"use client";

import React, { createContext, useContext } from "react";

type ResponsesContextType = {
  openResponses: boolean;
  setOpenResponses: React.Dispatch<React.SetStateAction<boolean>>;
  activeProjectId: string | null;
  setActiveProjectId: React.Dispatch<React.SetStateAction<string | null>>;
};

const ResponsesContext = createContext<ResponsesContextType | null>(null);

export const ResponsesProvider = ResponsesContext.Provider;

export function useResponses() {
  const ctx = useContext(ResponsesContext);
  if (!ctx) {
    throw new Error("useResponses must be used within ResponsesProvider");
  }
  return ctx;
}

export default ResponsesContext;
