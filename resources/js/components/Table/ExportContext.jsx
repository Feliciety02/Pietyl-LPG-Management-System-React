import React, { createContext, useContext } from "react";

const ExportContext = createContext({
  exportConfig: null,
  setExportConfig: () => {},
  exportOpen: false,
  setExportOpen: () => {},
});

export function ExportProvider({ value, children }) {
  return <ExportContext.Provider value={value}>{children}</ExportContext.Provider>;
}

export function useExportAction() {
  return useContext(ExportContext);
}
