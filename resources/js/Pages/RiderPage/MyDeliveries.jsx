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
  RefreshCcw,
  PenLine,
  Trash2,
} from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const OFFLINE_QUEUE_KEY = "rider_offline_queue_v1";
const NOT_DELIVERED_REASONS = [
  "Customer not home",
  "Customer requested reschedule",
  "Unable to contact customer",
  "Wrong or incomplete address",
  "Payment issue",
  "Safety concern",
  "Other",
];

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
          <div className="text-sm font-extrabold text-teal-800">{title}</div>
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
    ? { label: "Pending", cls: "bg-teal-50 text-teal-800 ring-teal-200" }
    : s === "in_transit" || s === "on_the_way" || s === "on the way"
    ? { label: "On the way", cls: "bg-teal-50 text-teal-800 ring-teal-200" }
    : s === "delivered"
    ? { label: "Delivered", cls: "bg-teal-50 text-teal-800 ring-teal-200" }
    : s === "failed" || s === "rescheduled"
    ? { label: s === "failed" ? "Failed" : "Rescheduled", cls: "bg-rose-50 text-rose-800 ring-rose-200" }
    : { label: status || "Unknown", cls: "bg-teal-50 text-teal-800 ring-teal-200" };

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
          <div className="mt-0.5 text-sm font-semibold text-teal-800 break-words">
          {value || "-"}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-3">
      <div className="h-9 w-9 rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
        {Icon ? <Icon className="h-4 w-4 text-teal-600" /> : null}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600">
          {label}
        </div>
        <div className="mt-1 text-xs font-semibold text-slate-800 break-words">
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
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [maxStepIndex, setMaxStepIndex] = useState(0);
  const [customerHome, setCustomerHome] = useState("yes");
  const [notDeliveredReason, setNotDeliveredReason] = useState("");
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
  const photoInputRef = useRef(null);
  const autoGeoAttemptRef = useRef(new Set());
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const [cameraError, setCameraError] = useState("");
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
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
    stopCamera();
    setProofPhotoFile(null);
    setProofPhotoData("");
    setProofPhotoPreview("");
    setSignatureData("");
    setProofError("");
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
    setActiveStepIndex(0);
    setMaxStepIndex(0);
    setCustomerHome("yes");
    setNotDeliveredReason("");
    if (!selected) return;
    setNoteDraft(selected.notes || "");
    setNoteError("");
    hydrateProofState(selected);
  }, [selectedId]);

  useEffect(() => {
    setMaxStepIndex((prev) => Math.max(prev, activeStepIndex));
  }, [activeStepIndex]);

  useEffect(() => {
    if (!selected) return;
    if (activeStepIndex < 1) return;

    const hasGeo = proofGeo.lat !== "" && proofGeo.lng !== "";
    if (hasGeo || geoBusy) return;

    if (autoGeoAttemptRef.current.has(selected.id)) return;
    autoGeoAttemptRef.current.add(selected.id);

    if (!proofCapturedAt) {
      setTimeNow();
    }
    captureLocation();
  }, [
    activeStepIndex,
    selectedId,
    proofGeo.lat,
    proofGeo.lng,
    geoBusy,
    proofCapturedAt,
  ]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    const shouldShowCamera = Boolean(selected) && activeStepIndex === 1;
    if (!shouldShowCamera) {
      stopCamera();
      return;
    }

    if (proofPhotoPreview) {
      stopCamera();
      return;
    }

    startCamera();
  }, [selectedId, activeStepIndex, proofPhotoPreview]);

  async function startCamera() {
    if (cameraStreamRef.current) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not available on this device.");
      return;
    }

    setCameraStarting(true);
    setCameraError("");
    setCameraReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      setCameraError(err?.message || "Unable to access the camera.");
      stopCamera();
    } finally {
      setCameraStarting(false);
    }
  }

  function stopCamera() {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setProofPhotoFile(null);
    setProofPhotoData(dataUrl);
    setProofPhotoPreview(dataUrl);
    stopCamera();
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setProofPhotoFile(null);
      setProofPhotoData("");
      setProofPhotoPreview("");
      return;
    }

    stopCamera();
    setCameraError("");
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
    setCameraError("");
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  function clearSignature() {
    setSignatureData("");
  }

  function captureLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    setGeoBusy(true);

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
      () => {
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

  const totalOrderedQty = useMemo(
    () =>
      deliveredItems.reduce((sum, item) => {
        const ordered = Number(item?.ordered_qty ?? 0);
        return sum + (Number.isFinite(ordered) ? ordered : 0);
      }, 0),
    [deliveredItems]
  );

  const totalDeliveredQty = useMemo(
    () =>
      deliveredItems.reduce((sum, item) => {
        const delivered = Number(item?.delivered_qty ?? 0);
        return sum + (Number.isFinite(delivered) ? delivered : 0);
      }, 0),
    [deliveredItems]
  );

  const allDeliveredConfirmed = useMemo(
    () =>
      deliveredItems.length > 0 &&
      deliveredItems.every((item) => {
        if (item?.delivered_qty === "" || item?.delivered_qty === null || item?.delivered_qty === undefined) {
          return false;
        }
        const ordered = Number(item?.ordered_qty ?? 0);
        const delivered = Number(item?.delivered_qty);
        return Number.isFinite(ordered) && Number.isFinite(delivered) && ordered === delivered;
      }),
    [deliveredItems]
  );

  function confirmAllDelivered() {
    setDeliveredItems((prev) =>
      prev.map((item) => ({
        ...item,
        delivered_qty: Number.isFinite(Number(item?.ordered_qty))
          ? Number(item.ordered_qty)
          : item.delivered_qty,
      }))
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
          key: "customer",
          label: "Customer",
          content: (
            <div className="space-y-4">
              <Card>
                <div className="p-5 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-lg font-extrabold text-teal-800 truncate">
                      {selected.customer_name || "Customer"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {selected.code || `Delivery #${selected.id}`} - {selected.scheduled_at || "Scheduled"}
                    </div>
                  </div>
                  <StatusPill status={selected.status} />
                </div>
              </Card>

              <Section
                title="Customer and location"
                subtitle="Use this to contact the customer and navigate."
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoTile icon={Phone} label="Phone" value={selected.customer_phone || "No phone provided"} />
                    <InfoTile icon={MapPin} label="Address" value={selected.address || "No address provided"} />
                    <InfoTile icon={MapPin} label="Barangay" value={selected.barangay || "No barangay provided"} />
                    <InfoTile icon={Navigation} label="Landmark" value={selected.landmark || "No landmark provided"} />
                    <div className="sm:col-span-2">
                      <InfoTile icon={FileText} label="Instructions" value={selected.instructions || "No instructions"} />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4 flex flex-col">
                    <div className="text-xs font-extrabold text-slate-700">Map preview</div>
                    <div className="mt-3 flex-1 rounded-2xl bg-white ring-1 ring-slate-200 flex flex-col items-center justify-center p-3 text-center">
                      <MapPin className="h-6 w-6 text-slate-300" />
                      <div className="mt-2 text-xs text-slate-500">
                        {selectedAddress ? "Map placeholder" : "No address available"}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
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
                  </div>
                </div>
              </Section>
            </div>
          ),
        },
        {
          key: "items-proof",
          label: "Items & Proof",
          content: (
            <div className="space-y-4">
              <Section
                title="Order items"
                subtitle="Confirm quantities before delivery."
                right={
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                      <Package className="h-4 w-4 text-slate-500" />
                      <div className="text-xs font-extrabold text-slate-700">
                        {deliveredItems.length} item types
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={confirmAllDelivered}
                      disabled={!deliveredItems.length || allDeliveredConfirmed}
                      className={cx(
                        "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition",
                        !deliveredItems.length || allDeliveredConfirmed
                          ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                          : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {allDeliveredConfirmed ? "All delivered" : "Confirm all delivered"}
                    </button>
                  </div>
                }
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-slate-600">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                    <Package className="h-3.5 w-3.5 text-slate-500" />
                    Total ordered: {totalOrderedQty}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-1 ring-1 ring-slate-200">
                    <Package className="h-3.5 w-3.5 text-slate-500" />
                    Total delivered: {totalDeliveredQty}
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {deliveredItems.length ? (
                    deliveredItems.map((item, idx) => (
                      <div
                        key={item.key || idx}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-teal-800 truncate">{item.name}</div>
                          <div className="mt-1 text-xs text-slate-600">Ordered {item.ordered_qty}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-extrabold text-slate-500">Delivered</div>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.delivered_qty}
                            onChange={(e) => updateDeliveredQty(idx, e.target.value)}
                            className="w-24 rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-teal-800 text-right outline-none focus:ring-4 focus:ring-teal-500/15"
                          />
                        </div>
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

              <Section
                title="Proof of delivery"
                subtitle="Capture a photo. Geotag is captured automatically."
              >
                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-extrabold text-slate-700">Items to deliver</div>
                      <div className="text-xs font-extrabold text-slate-500">
                        {deliveredItems.length} products · {totalOrderedQty} total qty
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {deliveredItems.length ? (
                        deliveredItems.map((item, idx) => (
                          <div
                            key={item.key || idx}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-2"
                          >
                            <div className="text-xs font-semibold text-slate-700 truncate">
                              {item.name}
                            </div>
                            <div className="text-xs font-extrabold text-teal-700">
                              {item.ordered_qty}x
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500">No items listed.</div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                      <Camera className="h-4 w-4 text-slate-500" />
                      Camera
                    </div>

                    <div className="mt-3">
                      <div className="h-56 w-full overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 flex items-center justify-center">
                        {proofPhotoPreview ? (
                          <img
                            src={proofPhotoPreview}
                            alt="Proof of delivery"
                            className="h-full w-full object-cover"
                          />
                        ) : cameraError ? (
                          <div className="px-4 text-center text-xs text-rose-700">
                            {cameraError}
                          </div>
                        ) : (
                          <video
                            ref={videoRef}
                            className="h-full w-full object-cover"
                            playsInline
                            muted
                            autoPlay
                          />
                        )}
                      </div>
                      <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {!proofPhotoPreview ? (
                        <button
                          type="button"
                          onClick={capturePhoto}
                          disabled={!cameraReady || cameraStarting}
                          className={cx(
                            "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition",
                            !cameraReady || cameraStarting
                              ? "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                              : "bg-teal-600 text-white ring-teal-700/10 hover:bg-teal-700"
                          )}
                        >
                          <Camera className="h-4 w-4" />
                          {cameraStarting ? "Starting..." : "Take photo"}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={clearPhoto}
                        disabled={!proofPhotoPreview}
                        className={cx(
                          "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition",
                          proofPhotoPreview
                            ? "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                            : "bg-slate-100 text-slate-400 ring-slate-200 cursor-not-allowed"
                        )}
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Retake
                      </button>

                      {cameraError ? (
                        <button
                          type="button"
                          onClick={startCamera}
                          className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Retry camera
                        </button>
                      ) : null}
                    </div>

                    {cameraError ? (
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-slate-600">
                          If camera access is blocked, upload a photo instead.
                        </div>
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoChange}
                          className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-slate-700 file:ring-1 file:ring-slate-200 hover:file:bg-slate-50"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </Section>
            </div>
          ),
        },
        {
          key: "signature",
          label: "Signature",
          content: (
            <div className="space-y-4">
              {customerHome === "yes" ? (
                <Section
                  title="Customer signature"
                  subtitle="Ask the customer to sign if available."
                >
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
                </Section>
              ) : null}

              <Section
                title="Delivery check"
                subtitle="Confirm if the customer is home and capture exceptions."
              >
                <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
                  <div className="text-xs font-extrabold text-slate-700">Customer is home?</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCustomerHome(opt.value)}
                        className={cx(
                          "rounded-2xl px-3 py-1.5 text-xs font-extrabold ring-1 transition",
                          customerHome === opt.value
                            ? "bg-slate-900 text-white ring-slate-900"
                            : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {customerHome === "no" ? (
                    <div className="mt-3">
                      <div className="text-xs font-extrabold text-slate-700">Reason customer is not around</div>
                      <select
                        value={notDeliveredReason}
                        onChange={(e) => setNotDeliveredReason(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-teal-800 outline-none focus:ring-4 focus:ring-teal-500/15"
                      >
                        <option value="">Select a reason</option>
                        {NOT_DELIVERED_REASONS.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  {customerHome === "no" ? (
                    <div className="mt-4 rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-4">
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
                  ) : null}

                  <div className="mt-3">
                    <div className="text-xs font-extrabold text-slate-700">Delivery notes</div>
                    <textarea
                      value={proofExceptions}
                      onChange={(e) => setProofExceptions(e.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-teal-500/15"
                      placeholder="Optional notes or exceptions."
                    />
                  </div>
                </div>
              </Section>
            </div>
          ),
        },
        {
          key: "summary",
          label: "Summary",
          content: (
            <div className="space-y-4">
              <Section
                title="Summary"
                subtitle="Review the delivery details before updating status."
              >
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-teal-800 truncate">
                      {selected.customer_name || "Customer"}
                    </div>
                    <div className="text-xs text-slate-600">
                      {selected.code || `Delivery #${selected.id}`} - {selected.scheduled_at || "Scheduled"}
                    </div>
                  </div>
                  <StatusPill status={selected.status} />
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <InfoRow icon={MapPin} label="Address" value={selected.address || "No address provided"} />
                  <InfoRow icon={Phone} label="Phone" value={selected.customer_phone || "No phone provided"} />
                  <InfoRow icon={Package} label="Total ordered" value={totalOrderedQty} />
                  <InfoRow icon={Package} label="Total delivered" value={totalDeliveredQty} />
                  <InfoRow
                    icon={Clock}
                    label="Proof time"
                    value={proofCapturedAt ? formatDateTime(proofCapturedAt) : "No timestamp"}
                  />
                  <InfoRow
                    icon={MapPin}
                    label="Geo location"
                    value={
                      proofGeo.lat !== "" && proofGeo.lng !== ""
                        ? `${proofGeo.lat}, ${proofGeo.lng}`
                        : "Not captured"
                    }
                  />
                  <InfoRow icon={Camera} label="Photo" value={proofPhotoPreview ? "Captured" : "Not captured"} />
                  <InfoRow icon={PenLine} label="Signature" value={signatureData ? "Captured" : "Not captured"} />
                  <InfoRow
                    icon={FileText}
                    label="Customer home"
                    value={customerHome === "yes" ? "Yes" : "No"}
                  />
                </div>

                {customerHome === "no" ? (
                  <div className="mt-3 rounded-2xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">
                    Reason not delivered: {notDeliveredReason || "Not selected"}
                  </div>
                ) : null}

                {proofExceptions ? (
                  <div className="mt-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3 text-xs text-slate-600">
                    {proofExceptions}
                  </div>
                ) : null}
              </Section>

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

                {proofError ? (
                  <div className="mt-3 rounded-2xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">
                    {proofError}
                  </div>
                ) : null}

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
            </div>
          ),
        },
      ]
    : [
        {
          key: "empty",
          label: "Select",
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
              <div className="text-xl font-extrabold text-teal-800">My Deliveries</div>
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

          <div className="mt-6 grid h-[calc(100vh-210px)] gap-6 lg:grid-cols-[360px_minmax(0,1fr)] overflow-hidden">
            <div className="flex h-full min-h-0 flex-col gap-4">
              <Card className="p-4 space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search deliveries"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm font-semibold text-teal-800 outline-none focus:ring-4 focus:ring-teal-500/15"
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

              <Card className="min-h-0 flex-1 divide-y divide-slate-200 overflow-y-auto">
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
                          <div className="text-sm font-extrabold text-teal-800 truncate">
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

            <div className="h-full min-h-0 overflow-y-auto pr-1">
              <div className="mx-auto w-full max-w-3xl pb-6">
                <Stepper
                  steps={deliverySteps}
                  activeIndex={activeStepIndex}
                  onStepChange={setActiveStepIndex}
                  maxAccessibleIndex={maxStepIndex}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
