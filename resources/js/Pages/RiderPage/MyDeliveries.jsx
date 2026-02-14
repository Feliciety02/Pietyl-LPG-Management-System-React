import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePage, router } from "@inertiajs/react";
import Layout from "@/pages/Dashboard/Layout";
import Stepper from "@/components/Stepper/Stepper";
import {
  Search,
  MapPin,
  Phone,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Navigation,
  FileText,
  Camera,
  PenLine,
  RefreshCcw,
  Trash2,
} from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const OFFLINE_QUEUE_KEY = "rider_offline_queue_v1";

function loadQueue() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage errors (quota, private mode, etc.)
  }
}

function applyQueueToDeliveries(deliveries, queue) {
  if (!Array.isArray(deliveries) || !Array.isArray(queue) || queue.length === 0) return deliveries;

  const next = deliveries.map((d) => ({ ...d }));

  queue.forEach((item) => {
    const idx = next.findIndex((d) => d.id === item.deliveryId);
    if (idx === -1) return;

    if (item.type === "status") {
      next[idx].status = item.payload?.status || next[idx].status;
      if (item.payload?.proof_photo_data) {
        next[idx].proof_photo_url = item.payload.proof_photo_data;
      }
      if (item.payload?.proof_signature) {
        next[idx].proof_signature_url = item.payload.proof_signature;
      }
      if (item.payload?.proof_geo_lat !== undefined) {
        next[idx].proof_geo_lat = item.payload.proof_geo_lat;
      }
      if (item.payload?.proof_geo_lng !== undefined) {
        next[idx].proof_geo_lng = item.payload.proof_geo_lng;
      }
      if (item.payload?.proof_captured_at) {
        next[idx].proof_captured_at = item.payload.proof_captured_at;
      }
      if (item.payload?.proof_exceptions !== undefined) {
        next[idx].proof_exceptions = item.payload.proof_exceptions;
      }
      if (item.payload?.delivered_items) {
        next[idx].delivered_items = item.payload.delivered_items;
      }
    }

    if (item.type === "note") {
      next[idx].notes = item.payload?.note ?? next[idx].notes ?? "";
    }
  });

  return next;
}

function makeQueueId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function Card({ children, className = "" }) {
  return (
    <div className={cx("rounded-3xl bg-white ring-1 ring-slate-200 shadow-sm", className)}>
      {children}
    </div>
  );
}

function Section({ title, subtitle, right, children }) {
  return (
    <Card>
      <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-slate-900">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-slate-600">{subtitle}</div> : null}
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();

  const meta =
  s === "pending" || s === "assigned"
    ? { label: "Pending", cls: "bg-slate-100 text-slate-700 ring-slate-200" }
    : s === "in_transit" || s === "on_the_way" || s === "on the way"
    ? { label: "On the way", cls: "bg-teal-50 text-teal-800 ring-teal-200" }
    : s === "delivered"
    ? { label: "Delivered", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200" }
    : s === "failed" || s === "rescheduled"
    ? { label: s === "failed" ? "Failed" : "Rescheduled", cls: "bg-rose-50 text-rose-800 ring-rose-200" }
    : { label: status || "Unknown", cls: "bg-slate-100 text-slate-700 ring-slate-200" };

  return (
    <span className={cx("inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold ring-1", meta.cls)}>
      {meta.label}
    </span>
  );
}

function canTransition(from, to) {
  const f = String(from || "").toLowerCase();
  const t = String(to || "").toLowerCase();

  const normalize = (x) => (x === "on the way" ? "on_the_way" : x);
  const F = normalize(f);
  const T = normalize(t);

  // Allow transitions from pending OR assigned to in_transit or failed ONLY
  if ((F === "pending" || F === "assigned") && (T === "in_transit" || T === "failed")) return true;
  
  // Allow transitions from in_transit to delivered or failed ONLY
  if (F === "in_transit" && (T === "delivered" || T === "failed")) return true;
  
  return false;
}

function mapsEmbedUrl(address) {
  const q = encodeURIComponent(address || "");
  return `https://www.google.com/maps?q=${q}&output=embed`;
}

function mapsOpenUrl(address) {
  const q = encodeURIComponent(address || "");
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function EmptyState({ title, desc }) {
  return (
    <div className="rounded-3xl bg-slate-50 ring-1 ring-dashed ring-slate-200 p-6">
      <div className="text-sm font-extrabold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{desc}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
      <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
        <Icon className="h-5 w-5 text-slate-500" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-extrabold text-slate-500">{label}</div>
        <div className="mt-0.5 text-sm font-semibold text-slate-900 break-words">
          {value || "-"}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ tone = "neutral", disabled, onClick, icon: Icon, children }) {
  const toneCls =
    tone === "primary"
      ? "bg-teal-600 text-white ring-teal-700/10 hover:bg-teal-700"
      : tone === "danger"
      ? "bg-white text-rose-700 ring-rose-200 hover:bg-rose-50"
      : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold ring-1 transition",
        disabled ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed" : toneCls
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

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

export default function MyDeliveries() {
  const { auth, deliveries: serverDeliveries } = usePage().props;
  const user = auth?.user;

  const DEV_SAMPLE = [
    {
      id: 101,
      code: "DLV-000101",
      delivery_type: "delivery",
      scheduled_at: "Today 2:30 PM",
      created_at: "2026-01-20 10:12",
      status: "pending",

      customer_name: "Juan Dela Cruz",
      customer_phone: "09171234567",
      address: "Matina, Davao City",
      barangay: "Matina Crossing",
      landmark: "Near Jollibee",
      instructions: "Call when outside, gate is locked.",

      payment_method: "gcash",
      payment_status: "prepaid",
      amount_total: "â‚±980.00",
      delivery_fee: "â‚±50.00",

      distance_km: "6.2 km",
      eta_mins: "25 mins",

      items: [
        { name: "LPG Cylinder 11 kg", qty: 1 },
        { name: "Hose + Regulator", qty: 1 },
      ],

      notes: "",
    },
    {
      id: 102,
      code: "DLV-000102",
      delivery_type: "delivery",
      scheduled_at: "Tomorrow 9:00 AM",
      created_at: "2026-01-20 11:03",
      status: "on_the_way",

      customer_name: "Maria Santos",
      customer_phone: "",
      address: "Bajada, Davao City",
      barangay: "Bajada Proper",
      landmark: "",
      instructions: "Leave at guard if not home.",

      payment_method: "cash",
      payment_status: "unpaid",
      amount_total: "â‚±850.00",
      delivery_fee: "â‚±50.00",

      distance_km: "3.8 km",
      eta_mins: "15 mins",

      items: [{ name: "LPG Cylinder 11 kg", qty: 1 }],
      notes: "Customer requested morning schedule.",
    },
  ];

  const baseDeliveries = Array.isArray(serverDeliveries) ? serverDeliveries : DEV_SAMPLE;
  const initialQueue = useMemo(() => loadQueue(), []);
  const [queue, setQueue] = useState(initialQueue);
  const [deliveries, setDeliveries] = useState(() =>
    applyQueueToDeliveries(baseDeliveries, initialQueue)
  );

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [syncing, setSyncing] = useState(false);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(deliveries[0]?.id || null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteError, setNoteError] = useState("");
  const [proofPhotoFile, setProofPhotoFile] = useState(null);
  const [proofPhotoData, setProofPhotoData] = useState("");
  const [proofPhotoPreview, setProofPhotoPreview] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [proofError, setProofError] = useState("");
  const [proofGeo, setProofGeo] = useState({ lat: "", lng: "" });
  const [proofCapturedAt, setProofCapturedAt] = useState("");
  const [proofExceptions, setProofExceptions] = useState("");
  const [deliveredItems, setDeliveredItems] = useState([]);
  const [geoBusy, setGeoBusy] = useState(false);
  const [proofWarning, setProofWarning] = useState("");
  const photoInputRef = useRef(null);
  const pendingCount = queue.length;

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    saveQueue(queue);
  }, [queue]);

  useEffect(() => {
    const nextBase = Array.isArray(serverDeliveries) ? serverDeliveries : DEV_SAMPLE;
    setDeliveries(applyQueueToDeliveries(nextBase, queue));
  }, [serverDeliveries]);

  useEffect(() => {
    if (isOnline && queue.length > 0) {
      syncQueue();
    }
  }, [isOnline]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deliveries.filter((d) => {
      const hay = `${d.code || ""} ${d.customer_name || ""} ${d.address || ""}`.toLowerCase();
      const matchesQuery = !q || hay.includes(q);

      if (filter === "all") return matchesQuery;
      return matchesQuery && String(d.status || "").toLowerCase() === filter;
    });
  }, [deliveries, query, filter]);

  const selected = useMemo(() => deliveries.find((d) => d.id === selectedId) || null, [deliveries, selectedId]);

  const selectedAddress = selected?.address || "";
  const selectedStatus = selected?.status || "pending";

  function resetProofInputs() {
    setProofPhotoFile(null);
    setProofPhotoData("");
    setProofPhotoPreview("");
    setSignatureData("");
    setProofError("");
    setProofWarning("");
    setProofGeo({ lat: "", lng: "" });
    setProofCapturedAt("");
    setProofExceptions("");
    setDeliveredItems([]);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  function buildDeliveredItems(delivery) {
    const existing = Array.isArray(delivery?.delivered_items) ? delivery.delivered_items : null;
    const base = existing && existing.length ? existing : Array.isArray(delivery?.items) ? delivery.items : [];

    return base.map((item, idx) => {
      const ordered = Number(item?.ordered_qty ?? item?.qty ?? 0);
      const deliveredRaw = item?.delivered_qty ?? ordered;
      const delivered = deliveredRaw === "" ? "" : Number(deliveredRaw);

      return {
        key: item?.sale_item_id ?? item?.id ?? item?.product_variant_id ?? `${idx}`,
        sale_item_id: item?.sale_item_id ?? item?.id ?? null,
        product_variant_id: item?.product_variant_id ?? null,
        name: item?.name || "Item",
        ordered_qty: Number.isFinite(ordered) ? ordered : 0,
        delivered_qty: Number.isFinite(delivered) ? delivered : ordered,
      };
    });
  }

  function hydrateProofState(delivery) {
    resetProofInputs();
    if (!delivery) return;

    setDeliveredItems(buildDeliveredItems(delivery));
    setProofExceptions(delivery?.proof_exceptions || "");
    setProofGeo({
      lat: delivery?.proof_geo_lat ?? "",
      lng: delivery?.proof_geo_lng ?? "",
    });
    setProofCapturedAt(delivery?.proof_captured_at || "");

    if (delivery?.proof_photo_url) {
      setProofPhotoPreview(delivery.proof_photo_url);
    }
    if (delivery?.proof_signature_url) {
      setSignatureData(delivery.proof_signature_url);
    }
  }

  function selectDelivery(d) {
    setSelectedId(d.id);
    setNoteError("");
  }

  useEffect(() => {
    if (!selected) return;
    setNoteDraft(selected.notes || "");
    setNoteError("");
    hydrateProofState(selected);
  }, [selectedId]);

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setProofPhotoFile(null);
      setProofPhotoData("");
      setProofPhotoPreview("");
      return;
    }

    setProofPhotoFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      setProofPhotoData(dataUrl);
      setProofPhotoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    setProofPhotoFile(null);
    setProofPhotoData("");
    setProofPhotoPreview("");
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  function clearSignature() {
    setSignatureData("");
  }

  function captureLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setProofWarning("Geolocation is not available on this device.");
      return;
    }

    setGeoBusy(true);
    setProofWarning("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProofGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        if (!proofCapturedAt) {
          setProofCapturedAt(new Date(pos.timestamp).toISOString());
        }
        setGeoBusy(false);
      },
      (err) => {
        setProofWarning(err?.message || "Unable to capture location.");
        setGeoBusy(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  function setTimeNow() {
    setProofCapturedAt(new Date().toISOString());
  }

  function updateDeliveredQty(index, value) {
    setDeliveredItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (value === "") {
          return { ...item, delivered_qty: "" };
        }
        const nextValue = Number(value);
        return { ...item, delivered_qty: Number.isFinite(nextValue) ? Math.max(0, nextValue) : item.delivered_qty };
      })
    );
  }

  function updateLocalDelivery(deliveryId, changes) {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId ? { ...d, ...changes } : d))
    );
  }

  function enqueueAction(action) {
    setQueue((prev) => {
      const pruned = prev.filter(
        (item) => !(item.deliveryId === action.deliveryId && item.type === action.type)
      );
      return [...pruned, action];
    });
  }

  async function sendStatusUpdate(deliveryId, payload) {
    const formData = new FormData();
    formData.append("_method", "PATCH");
    formData.append("status", payload.status);

    if (payload.proof_photo) {
      formData.append("proof_photo", payload.proof_photo);
    }
    if (payload.proof_photo_data) {
      formData.append("proof_photo_data", payload.proof_photo_data);
    }
    if (payload.proof_signature) {
      formData.append("proof_signature", payload.proof_signature);
    }
    if (payload.proof_geo_lat !== undefined && payload.proof_geo_lat !== "") {
      formData.append("proof_geo_lat", payload.proof_geo_lat);
    }
    if (payload.proof_geo_lng !== undefined && payload.proof_geo_lng !== "") {
      formData.append("proof_geo_lng", payload.proof_geo_lng);
    }
    if (payload.proof_captured_at) {
      formData.append("proof_captured_at", payload.proof_captured_at);
    }
    if (payload.proof_exceptions !== undefined) {
      formData.append("proof_exceptions", payload.proof_exceptions);
    }
    if (payload.delivered_items) {
      formData.append("delivered_items", JSON.stringify(payload.delivered_items));
    }

    return window.axios.post(`/dashboard/rider/deliveries/${deliveryId}`, formData, {
      headers: { Accept: "application/json" },
    });
  }

  async function sendNoteUpdate(deliveryId, note) {
    return window.axios.patch(
      `/dashboard/rider/deliveries/${deliveryId}/note`,
      { note },
      { headers: { Accept: "application/json" } }
    );
  }

  async function syncQueue() {
    if (syncing || queue.length === 0) return;
    setSyncing(true);

    let remaining = [...queue];

    for (const item of queue) {
      try {
        if (item.type === "status") {
          await sendStatusUpdate(item.deliveryId, item.payload);
        }
        if (item.type === "note") {
          await sendNoteUpdate(item.deliveryId, item.payload.note);
        }
        remaining = remaining.filter((queued) => queued.id !== item.id);
        setQueue(remaining);
      } catch {
        break;
      }
    }

    setSyncing(false);

    if (remaining.length === 0) {
      router.reload({ only: ["deliveries"] });
    }
  }

  async function updateStatus(nextStatus) {
    if (!selected) return;

    if (!canTransition(selected.status, nextStatus)) {
      alert("Invalid status transition.");
      return;
    }

    const normalizedNext = String(nextStatus || "").toLowerCase();
    const requiresProof = normalizedNext === "delivered";
    const hasPhoto = Boolean(proofPhotoFile || proofPhotoData);
    const hasSignature = Boolean(signatureData);
    const needsPhotoData = !isOnline && proofPhotoFile && !proofPhotoData;

    const deliveredPayload = deliveredItems.map((item) => {
      const orderedQty = Number(item?.ordered_qty ?? item?.qty ?? 0);
      const rawDelivered = item?.delivered_qty;
      const deliveredQty =
        rawDelivered === "" || rawDelivered === null || rawDelivered === undefined
          ? orderedQty
          : Number(rawDelivered);

      return {
        sale_item_id: item?.sale_item_id ?? item?.id ?? null,
        product_variant_id: item?.product_variant_id ?? null,
        name: item?.name || "Item",
        ordered_qty: Number.isFinite(orderedQty) ? orderedQty : 0,
        delivered_qty: Number.isFinite(deliveredQty) ? Math.max(0, deliveredQty) : deliveredQty,
      };
    });

    const invalidDeliveredQty = deliveredPayload.some((item) => !Number.isFinite(item.delivered_qty));

    if (requiresProof && deliveredPayload.length === 0) {
      setProofError("Enter delivered quantities before marking delivered.");
      return;
    }

    if (requiresProof && invalidDeliveredQty) {
      setProofError("Enter valid delivered quantities.");
      return;
    }

    if (requiresProof && needsPhotoData) {
      setProofError("Photo is still loading. Please wait a moment.");
      return;
    }

    if (requiresProof && !hasPhoto && !hasSignature) {
      setProofError("Capture a photo or signature before marking delivered.");
      return;
    }

    let capturedAt = proofCapturedAt;
    if (requiresProof && !capturedAt) {
      capturedAt = new Date().toISOString();
      setProofCapturedAt(capturedAt);
    }

    setProofError("");

    const payload = { status: nextStatus };

    if (requiresProof) {
      if (proofPhotoFile) {
        payload.proof_photo = proofPhotoFile;
      } else if (proofPhotoData) {
        payload.proof_photo_data = proofPhotoData;
      }

      if (signatureData) {
        payload.proof_signature = signatureData;
      }

      if (proofGeo.lat !== "") {
        payload.proof_geo_lat = proofGeo.lat;
      }
      if (proofGeo.lng !== "") {
        payload.proof_geo_lng = proofGeo.lng;
      }
      if (capturedAt) {
        payload.proof_captured_at = capturedAt;
      }

      payload.proof_exceptions = proofExceptions;
      payload.delivered_items = deliveredPayload;
    }

    const localProofUpdate = {};
    if (requiresProof) {
      if (hasPhoto) {
        localProofUpdate.proof_photo_url = proofPhotoPreview || proofPhotoData;
      }
      if (hasSignature) {
        localProofUpdate.proof_signature_url = signatureData;
      }
      if (proofGeo.lat !== "") {
        localProofUpdate.proof_geo_lat = proofGeo.lat;
      }
      if (proofGeo.lng !== "") {
        localProofUpdate.proof_geo_lng = proofGeo.lng;
      }
      if (capturedAt) {
        localProofUpdate.proof_captured_at = capturedAt;
      }
      localProofUpdate.proof_exceptions = proofExceptions;
      localProofUpdate.delivered_items = deliveredPayload;
    }

    if (!isOnline) {
      enqueueAction({
        id: makeQueueId(),
        deliveryId: selected.id,
        type: "status",
        payload: {
          status: nextStatus,
          proof_photo_data: hasPhoto ? proofPhotoData : "",
          proof_signature: hasSignature ? signatureData : "",
          proof_geo_lat: proofGeo.lat,
          proof_geo_lng: proofGeo.lng,
          proof_captured_at: capturedAt,
          proof_exceptions: proofExceptions,
          delivered_items: deliveredPayload,
        },
        created_at: new Date().toISOString(),
      });
      updateLocalDelivery(selected.id, { status: nextStatus, ...localProofUpdate });
      return;
    }

    try {
      await sendStatusUpdate(selected.id, payload);
      updateLocalDelivery(selected.id, { status: nextStatus, ...localProofUpdate });
    } catch (error) {
      if (!navigator.onLine) {
        enqueueAction({
          id: makeQueueId(),
          deliveryId: selected.id,
          type: "status",
          payload: {
            status: nextStatus,
            proof_photo_data: hasPhoto ? proofPhotoData : "",
            proof_signature: hasSignature ? signatureData : "",
            proof_geo_lat: proofGeo.lat,
            proof_geo_lng: proofGeo.lng,
            proof_captured_at: capturedAt,
            proof_exceptions: proofExceptions,
            delivered_items: deliveredPayload,
          },
          created_at: new Date().toISOString(),
        });
        updateLocalDelivery(selected.id, { status: nextStatus, ...localProofUpdate });
        return;
      }

      const message = error?.response?.data?.message || "Unable to update status.";
      if (requiresProof) {
        setProofError(message);
      } else {
        alert(message);
      }
    }
  }

  async function saveNote() {
    if (!selected) return;

    setNoteError("");

    if (!isOnline) {
      enqueueAction({
        id: makeQueueId(),
        deliveryId: selected.id,
        type: "note",
        payload: { note: noteDraft },
        created_at: new Date().toISOString(),
      });
      updateLocalDelivery(selected.id, { notes: noteDraft });
      return;
    }

    try {
      await sendNoteUpdate(selected.id, noteDraft);
      updateLocalDelivery(selected.id, { notes: noteDraft });
    } catch (error) {
      if (!navigator.onLine) {
        enqueueAction({
          id: makeQueueId(),
          deliveryId: selected.id,
          type: "note",
          payload: { note: noteDraft },
          created_at: new Date().toISOString(),
        });
        updateLocalDelivery(selected.id, { notes: noteDraft });
        return;
      }
      setNoteError(error?.response?.data?.message || "Unable to save note.");
    }
  }

  const deliverySteps = selected
    ? [
        {
          key: "summary",
          content: (
            <Card>
              <div className="p-5 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-lg font-extrabold text-slate-900 truncate">
                    {selected.customer_name || "Customer"}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {selected.code || `Delivery #${selected.id}`} â€¢ {selected.scheduled_at || "Scheduled"}
                  </div>
                </div>
                <StatusPill status={selected.status} />
              </div>
            </Card>
          ),
        },
        {
          key: "customer",
          content: (
            <Section
              title="Customer and location"
              subtitle="Use this to contact the customer and navigate."
              right={
                <div className="flex flex-wrap gap-2">
                  {selectedAddress ? (
                    <a
                      href={mapsOpenUrl(selectedAddress)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition"
                    >
                      <Navigation className="h-4 w-4" />
                      Open Maps
                    </a>
                  ) : null}

                  {selected.customer_phone ? (
                    <a
                      href={`tel:${selected.customer_phone}`}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 transition"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </a>
                  ) : null}
                </div>
              }
            >
              <div className="grid gap-3 md:grid-cols-2">
                <InfoRow icon={Phone} label="Phone" value={selected.customer_phone || "No phone provided"} />
                <InfoRow icon={MapPin} label="Address" value={selected.address || "No address provided"} />
              </div>

              <div className="mt-4">
                {selectedAddress ? (
                  <div className="overflow-hidden rounded-3xl ring-1 ring-slate-200">
                    <iframe
                      title="Delivery map"
                      src={mapsEmbedUrl(selectedAddress)}
                      width="100%"
                      height="280"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="block"
                    />
                  </div>
                ) : (
                  <EmptyState title="No address available" desc="This delivery has no address to show on the map." />
                )}
              </div>
            </Section>
          ),
        },
        {
          key: "items",
          content: (
            <Section
              title="Items"
              subtitle="Make sure items match before delivery."
              right={
                <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                  <Package className="h-4 w-4 text-slate-500" />
                  <div className="text-xs font-extrabold text-slate-700">
                    {(selected.items || []).length} item types
                  </div>
                </div>
              }
            >
              <div className="space-y-2">
                {(selected.items || []).length ? (
                  selected.items.map((it, idx) => (
                    <div
                      key={`${it.name}-${idx}`}
                      className="flex items-center justify-between gap-3 rounded-3xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-slate-900 truncate">{it.name}</div>
                        <div className="mt-1 text-xs text-slate-600">Qty</div>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900">x{it.qty || 1}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-600">No items found</div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>Status updates affect inventory and accounting.</span>
              </div>
            </Section>
          ),
        },
        {
          key: "proof",
          content: (
            <Section
              title="Proof of delivery"
              subtitle="Capture signature or photo, location, time, quantities, and exceptions."
              right={
                <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <div className="text-xs font-extrabold text-slate-700">
                    {proofCapturedAt ? formatDateTime(proofCapturedAt) : "No timestamp"}
                  </div>
                </div>
              }
            >
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                      <Camera className="h-4 w-4 text-slate-500" />
                      Photo
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoChange}
                        className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-slate-700 file:ring-1 file:ring-slate-200 hover:file:bg-slate-50"
                      />

                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Clear
                      </button>
                    </div>

                    {proofPhotoPreview ? (
                      <img
                        src={proofPhotoPreview}
                        alt="Proof of delivery"
                        className="mt-3 w-full rounded-2xl ring-1 ring-slate-200 object-cover"
                      />
                    ) : (
                      <div className="mt-3 text-xs text-slate-500">No photo selected.</div>
                    )}
                  </div>

                  <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                      <PenLine className="h-4 w-4 text-slate-500" />
                      Signature
                    </div>

                    <div className="mt-3">
                      <SignaturePad value={signatureData} onChange={setSignatureData} />
                    </div>

                    <div className="mt-3 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Clear signature
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      Geotag and time
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={captureLocation}
                        disabled={geoBusy}
                        className={cx(
                          "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition",
                          geoBusy
                            ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                            : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <MapPin className="h-4 w-4" />
                        {geoBusy ? "Capturing..." : "Capture location"}
                      </button>

                      <button
                        type="button"
                        onClick={setTimeNow}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Set time now
                      </button>
                    </div>

                    <div className="mt-3 grid gap-1 text-xs text-slate-600">
                      <div>Lat: {proofGeo.lat || "-"}</div>
                      <div>Lng: {proofGeo.lng || "-"}</div>
                      <div>Time: {proofCapturedAt ? formatDateTime(proofCapturedAt) : "-"}</div>
                    </div>

                    {proofWarning ? (
                      <div className="mt-2 text-xs font-semibold text-amber-700">{proofWarning}</div>
                    ) : null}
                  </div>

                  <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                      <Package className="h-4 w-4 text-slate-500" />
                      Delivered quantities
                    </div>

                    <div className="mt-3 space-y-2">
                      {deliveredItems.length ? (
                        deliveredItems.map((item, idx) => (
                          <div
                            key={item.key || idx}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 truncate">
                                {item.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                Ordered {item.ordered_qty}
                              </div>
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.delivered_qty}
                              onChange={(e) => updateDeliveredQty(idx, e.target.value)}
                              className="w-24 rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-900 text-right outline-none focus:ring-4 focus:ring-teal-500/15"
                            />
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500">No items to confirm.</div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                      <FileText className="h-4 w-4 text-slate-500" />
                      Exceptions
                    </div>

                    <textarea
                      value={proofExceptions}
                      onChange={(e) => setProofExceptions(e.target.value)}
                      rows={3}
                      className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-teal-500/15"
                      placeholder="Example: customer requested partial delivery, damaged cylinder, missing item."
                    />
                  </div>
                </div>
              </div>

              {proofError ? (
                <div className="mt-4 rounded-2xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">
                  {proofError}
                </div>
              ) : null}
            </Section>
          ),
        },
        {
          key: "actions",
          content: (
            <Section
              title="Status actions"
              subtitle="Update the delivery status and leave notes."
            >
              <div className="flex flex-wrap gap-2">
                <ActionBtn
                  tone="primary"
                  disabled={!canTransition(selectedStatus, "in_transit")}
                  onClick={() => updateStatus("in_transit")}
                  icon={Navigation}
                >
                  Start delivery
                </ActionBtn>
                <ActionBtn
                  tone="primary"
                  disabled={!canTransition(selectedStatus, "delivered")}
                  onClick={() => updateStatus("delivered")}
                  icon={CheckCircle2}
                >
                  Mark delivered
                </ActionBtn>
                <ActionBtn
                  tone="danger"
                  disabled={!canTransition(selectedStatus, "failed")}
                  onClick={() => updateStatus("failed")}
                  icon={XCircle}
                >
                  Mark failed
                </ActionBtn>
              </div>

              <div className="mt-4 rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
                <div className="text-xs font-extrabold text-slate-700">Notes</div>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={4}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-teal-500/15"
                  placeholder="Add a note for this delivery."
                />
                {noteError ? (
                  <div className="mt-2 text-xs font-semibold text-rose-700">{noteError}</div>
                ) : null}
                <div className="mt-3 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={saveNote}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    Save note
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3 text-xs text-slate-600">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    {isOnline ? "Online" : "Offline"} mode. {pendingCount > 0 ? `${pendingCount} pending update(s)` : "No pending updates."}
                  </div>
                  {pendingCount > 0 ? (
                    <button
                      type="button"
                      onClick={syncQueue}
                      disabled={!isOnline || syncing}
                      className={cx(
                        "inline-flex items-center gap-2 rounded-xl px-3 py-1 text-[11px] font-extrabold ring-1 transition",
                        !isOnline || syncing
                          ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                          : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {syncing ? "Syncing..." : "Sync now"}
                    </button>
                  ) : null}
                </div>
              </div>
            </Section>
          ),
        },
      ]
    : [
        {
          key: "empty",
          content: (
            <EmptyState
              title="Select a delivery"
              desc="Choose a delivery on the left to view details and capture proof."
            />
          ),
        },
      ];

  return (
    <Layout user={user}>
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xl font-extrabold text-slate-900">My Deliveries</div>
              <div className="mt-1 text-sm text-slate-600">
                Track your stops and capture proof of delivery.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={cx(
                  "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1",
                  isOnline
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-amber-50 text-amber-700 ring-amber-200"
                )}
              >
                <span
                  className={cx(
                    "h-2 w-2 rounded-full",
                    isOnline ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
                {isOnline ? "Online" : "Offline"}
              </div>

              {pendingCount > 0 ? (
                <button
                  type="button"
                  onClick={syncQueue}
                  disabled={!isOnline || syncing}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-extrabold ring-1 transition",
                    !isOnline || syncing
                      ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                      : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  )}
                >
                  {syncing ? "Syncing..." : `Sync ${pendingCount}`}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card className="p-4 space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search deliveries"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-teal-500/15"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all", label: "All" },
                    { key: "pending", label: "Pending" },
                    { key: "assigned", label: "Assigned" },
                    { key: "in_transit", label: "On the way" },
                    { key: "delivered", label: "Delivered" },
                    { key: "failed", label: "Failed" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setFilter(opt.key)}
                      className={cx(
                        "rounded-2xl px-3 py-1.5 text-xs font-extrabold ring-1 transition",
                        filter === opt.key
                          ? "bg-slate-900 text-white ring-slate-900"
                          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="divide-y divide-slate-200">
                {filtered.length ? (
                  filtered.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => selectDelivery(d)}
                      className={cx(
                        "w-full text-left p-4 transition",
                        selectedId === d.id ? "bg-teal-50" : "bg-white hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-slate-900 truncate">
                            {d.customer_name || "Customer"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {d.code || `Delivery #${d.id}`} - {d.scheduled_at || "Scheduled"}
                          </div>
                        </div>
                        <StatusPill status={d.status} />
                      </div>

                      <div className="mt-2 text-xs text-slate-600 line-clamp-2">
                        {d.address || "No address provided"}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-sm text-slate-600">No deliveries found.</div>
                )}
              </Card>
            </div>

            <div>
              <Stepper steps={deliverySteps} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                