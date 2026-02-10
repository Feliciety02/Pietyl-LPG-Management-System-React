// resources/js/pages/Dashboard/Rider/MyDeliveries.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePage, router } from "@inertiajs/react";
import Layout from "@/pages/Dashboard/Layout";
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
  Wifi,
  WifiOff,
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

  // Allow transitions from pending OR assigned to in_transit
  if ((F === "pending" || F === "assigned") && (T === "in_transit" || T === "failed")) return true;
  
  // Allow transitions from in_transit to delivered or failed
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
      amount_total: "₱980.00",
      delivery_fee: "₱50.00",

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
      amount_total: "₱850.00",
      delivery_fee: "₱50.00",

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
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  function selectDelivery(d) {
    setSelectedId(d.id);
    setNoteDraft(d.notes || "");
    setNoteError("");
    resetProofInputs();
  }

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

    const requiresProof = nextStatus === "delivered";
    const hasPhoto = Boolean(proofPhotoFile || proofPhotoData);
    const hasSignature = Boolean(signatureData);

    if (requiresProof && !hasPhoto && !hasSignature) {
      setProofError("Capture a photo or signature before marking delivered.");
      return;
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
        },
        created_at: new Date().toISOString(),
      });
      updateLocalDelivery(selected.id, { status: nextStatus });
      if (requiresProof) {
        resetProofInputs();
      }
      return;
    }

    try {
      await sendStatusUpdate(selected.id, payload);
      updateLocalDelivery(selected.id, { status: nextStatus });
      if (requiresProof) {
        resetProofInputs();
      }
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
          },
          created_at: new Date().toISOString(),
        });
        updateLocalDelivery(selected.id, { status: nextStatus });
        if (requiresProof) {
          resetProofInputs();
        }
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

  return (
    <Layout title="My Deliveries">
      <div className="grid gap-6 xl:grid-cols-3">
        {/* LEFT: LIST */}
        <Card className="xl:col-span-1">
          <div className="p-5 border-b border-slate-200">
            <div className="text-sm font-extrabold text-slate-900">Assigned deliveries</div>
            <div className="mt-1 text-xs text-slate-600">
              Only deliveries assigned to {user?.name || "you"}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Search code, customer, address"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: "Pending" },
                { key: "on_the_way", label: "On the way" },
                { key: "delivered", label: "Delivered" },
                { key: "failed", label: "Failed" },
              ].map((x) => (
                <button
                  key={x.key}
                  type="button"
                  onClick={() => setFilter(x.key)}
                  className={cx(
                    "rounded-2xl px-3 py-2 text-xs font-extrabold ring-1 transition",
                    filter === x.key
                      ? "bg-teal-600/10 text-teal-900 ring-teal-200"
                      : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  )}
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3">
            {filtered.length === 0 ? (
              <EmptyState title="No deliveries found" desc="Try changing the filter or search query." />
            ) : (
              <div className="space-y-2">
                {filtered.map((d) => {
                  const active = d.id === selectedId;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => selectDelivery(d)}
                      className={cx(
                        "w-full text-left rounded-3xl p-4 ring-1 transition",
                        active
                          ? "bg-teal-600/10 ring-teal-200"
                          : "bg-white ring-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-slate-900 truncate">
                            {d.customer_name || "Customer"}
                          </div>
                          <div className="mt-1 text-xs text-slate-600 truncate">
                            {d.code || `Delivery #${d.id}`}
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span className="truncate">{d.address || "No address"}</span>
                          </div>
                        </div>

                        <StatusPill status={d.status} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* RIGHT: DETAILS */}
        <div className="xl:col-span-2 grid gap-6">
          {!selected ? (
            <EmptyState title="Select a delivery" desc="Choose a delivery on the left to see details." />
          ) : (
            <>
              {/* SUMMARY */}
              <Card>
                <div className="p-5 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-lg font-extrabold text-slate-900 truncate">
                      {selected.customer_name || "Customer"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {selected.code || `Delivery #${selected.id}`} • {selected.scheduled_at || "Scheduled"}
                    </div>
                  </div>
                  <StatusPill status={selected.status} />
                </div>
              </Card>

              {/* CUSTOMER + LOCATION */}
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

              {/* ITEMS */}
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

              {/* ACTIONS + NOTES */}
              <Section
                title="Actions and notes"
                subtitle="Update status in the correct order. Add notes for issues."
                right={<StatusPill status={selected.status} />}
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <div className="text-xs font-extrabold text-slate-700">Update status</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ActionBtn
                        icon={Navigation}
                        disabled={!canTransition(selectedStatus, "in_transit")}
                        onClick={() => updateStatus("in_transit")}
                      >
                        On the way
                      </ActionBtn>

                      <ActionBtn
                        tone="primary"
                        icon={CheckCircle2}
                        disabled={!canTransition(selectedStatus, "delivered")}
                        onClick={() => updateStatus("delivered")}
                      >
                        Delivered
                      </ActionBtn>

                      <ActionBtn
                        tone="danger"
                        icon={XCircle}
                        disabled={!canTransition(selectedStatus, "failed")}
                        onClick={() => updateStatus("failed")}
                      >
                        Failed
                      </ActionBtn>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-extrabold text-slate-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      Notes
                    </div>

                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      rows={4}
                      className="mt-3 w-full rounded-3xl border border-slate-200 bg-white p-4 text-sm outline-none focus:ring-4 focus:ring-teal-500/15"
                      placeholder="Example: customer not home, gate closed, requested reschedule"
                    />

                    <div className="mt-3 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={saveNote}
                        className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-black transition focus:outline-none focus:ring-4 focus:ring-slate-500/20"
                      >
                        Save note
                      </button>
                    </div>
                  </div>
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
