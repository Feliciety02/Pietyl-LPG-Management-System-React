import React, { useEffect, useRef } from "react";
import { PenLine, UserX2 } from "lucide-react";
import { Section, cx } from "./DeliveryShared";

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!value) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = value;
  }, [value]);

  function getPoint(e) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX || 0) - rect.left) * (canvas.width / rect.width),
      y: ((e.clientY || 0) - rect.top) * (canvas.height / rect.height),
    };
  }

  function startDrawing(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  }

  function draw(e) {
    const canvas = canvasRef.current;
    if (!canvas || !drawingRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nextPoint = getPoint(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(nextPoint.x, nextPoint.y);
    ctx.stroke();
    lastPointRef.current = nextPoint;
  }

  function stopDrawing() {
    const canvas = canvasRef.current;
    if (!canvas || !drawingRef.current) return;
    drawingRef.current = false;
    if (onChange) {
      onChange(canvas.toDataURL("image/png"));
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={200}
      onPointerDown={startDrawing}
      onPointerMove={draw}
      onPointerUp={stopDrawing}
      onPointerLeave={stopDrawing}
      onPointerCancel={stopDrawing}
      className="w-full h-40 rounded-2xl bg-white ring-1 ring-slate-200 touch-none"
    />
  );
}

export default function Step4SignatureOrReason({
  customerAvailable,
  onCustomerAvailableChange,
  signatureData,
  onSignatureChange,
  absenceReason,
  onAbsenceReasonChange,
  absenceOther,
  onAbsenceOtherChange,
}) {
  return (
    <Section
      title="Signature or absence"
      subtitle="Collect signature when available or record an absence reason."
    >
      <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
        <div className="text-xs font-extrabold text-slate-700">
          Is the customer available?
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onCustomerAvailableChange(opt.value)}
              className={cx(
                "rounded-2xl px-4 py-2 text-xs font-extrabold ring-1 transition",
                customerAvailable === opt.value
                  ? "bg-teal-600 text-white ring-teal-600"
                  : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {customerAvailable === "yes" ? (
        <div className="mt-4 rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
            <PenLine className="h-4 w-4 text-slate-500" />
            Signature
          </div>
          <div className="mt-3">
            <SignaturePad value={signatureData} onChange={onSignatureChange} />
          </div>
        </div>
      ) : null}

      {customerAvailable === "no" ? (
        <div className="mt-4 rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
            <UserX2 className="h-4 w-4 text-slate-500" />
            Absence reason
          </div>

          <select
            value={absenceReason}
            onChange={(e) => onAbsenceReasonChange(e.target.value)}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-teal-500/15"
          >
            <option value="">Select a reason</option>
            <option value="Customer not home">Customer not home</option>
            <option value="Refused delivery">Refused delivery</option>
            <option value="Wrong address">Wrong address</option>
            <option value="Unable to contact">Unable to contact</option>
            <option value="Others">Others</option>
          </select>

          {absenceReason === "Others" ? (
            <input
              value={absenceOther}
              onChange={(e) => onAbsenceOtherChange(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-teal-500/15"
              placeholder="Please specify"
            />
          ) : null}
        </div>
      ) : null}
    </Section>
  );
}
