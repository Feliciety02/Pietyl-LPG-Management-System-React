import React, { useEffect } from "react";
import { Camera, CheckCircle2, RefreshCcw } from "lucide-react";
import { Section, cx } from "./DeliveryShared";

export default function Step3ProofOfDelivery({
  photoPreview,
  photoConfirmed,
  onPhotoChange,
  onRetake,
  onConfirmPhoto,
  photoInputRef,
  autoOpenSignal,
}) {
  useEffect(() => {
    if (!autoOpenSignal) return;
    if (photoInputRef?.current) {
      photoInputRef.current.click();
    }
  }, [autoOpenSignal, photoInputRef]);

  return (
    <Section
      title="Proof of delivery"
      subtitle="Capture a clear photo before proceeding."
    >
      <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
          <Camera className="h-4 w-4 text-slate-500" />
          Camera
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPhotoChange}
            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-slate-700 file:ring-1 file:ring-slate-200 hover:file:bg-slate-50"
          />
        </div>

        <div className="mt-3">
          <div className="h-56 w-full overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Proof of delivery"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-xs text-slate-500">No photo captured yet.</div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRetake}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Retake
          </button>

          <button
            type="button"
            onClick={onConfirmPhoto}
            disabled={!photoPreview}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition",
              photoPreview
                ? "bg-emerald-600 text-white ring-emerald-600 hover:bg-emerald-700"
                : "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            {photoConfirmed ? "Confirmed" : "Confirm"}
          </button>
        </div>
      </div>
    </Section>
  );
}
