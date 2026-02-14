import { useEffect } from "react";
import { useExportAction } from "@/components/Table/ExportContext";

export default function ExportRegistrar({
  config,
  label,
  href,
  onClick,
  disabled,
}) {
  const { setExportConfig } = useExportAction();

  useEffect(() => {
    const next = config ?? { label, href, onClick, disabled };
    setExportConfig(next);
    return () => setExportConfig(null);
  }, [setExportConfig, config, label, href, onClick, disabled]);

  return null;
}
